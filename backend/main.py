import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv

from lbp_utils import detectar_e_recortar_rosto, calcular_histograma_lbp, distancia_qui_quadrado

load_dotenv()

AMBIENTE = os.getenv("AMBIENTE", "nuvem")  # "local" ou "nuvem"

if AMBIENTE == "local":
    MONGO_URI = os.getenv("MONGO_URI_LOCAL")
else:
    MONGO_URI = os.getenv("MONGODB_URI")

print(f"Ambiente do MongoDB: {AMBIENTE}")

app = FastAPI(title="Backend da IHM")

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client["reconhecimento_db"]
collection = db["vetores_faciais"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USUARIOS = {
    "gipar": {"senha": "usergipar", "tipo": "admin"},
}

LIMIAR_DISTANCIA = 0.22
K_VIZINHOS = 5


@app.get("/")
def root():
    return {"mensagem": "Backend da IHM está rodando!"}


@app.post("/api/login-form")
async def login_form(
    username: str = Form(...),
    password: str = Form(...),
    file: UploadFile = File(None)
):
    print(f"Login recebido do usuário: {username}")

    usuario = USUARIOS.get(username)
    if not usuario or usuario["senha"] != password:
        return {"sucesso": False, "mensagem": "Credenciais inválidas"}

    return {
        "sucesso": True,
        "tipo_usuario": usuario["tipo"],
        "username": username
    }


@app.post("/api/login-face")
async def login_face(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"sucesso": False, "mensagem": "Imagem inválida"}

    cinza = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    rosto = detectar_e_recortar_rosto(cinza)

    if rosto is None:
        return {"sucesso": False, "mensagem": "Nenhum rosto detectado"}

    vetor_capturado = calcular_histograma_lbp(rosto)

    candidatos = []
    try:
        for documento in collection.find():
            tipo = documento["tipo_usuario"]
            for vetor_salvo in documento.get("vetores", []):
                distancia = distancia_qui_quadrado(vetor_capturado, vetor_salvo)
                candidatos.append((distancia, tipo))
    except Exception as e:
        print(f"Erro ao consultar o MongoDB: {e}")
        return {"sucesso": False, "mensagem": "Erro de conexão com o banco de dados"}

    if not candidatos:
        return {"sucesso": False, "mensagem": "Nenhum vetor cadastrado no banco"}

    candidatos.sort(key=lambda c: c[0])
    vizinhos = candidatos[:K_VIZINHOS]

    vizinhos_validos = [(d, t) for d, t in vizinhos if d <= LIMIAR_DISTANCIA]

    print(f"Vizinhos mais próximos: {[(round(d, 4), t) for d, t in vizinhos]}")

    if not vizinhos_validos:
        return {"sucesso": False, "mensagem": "Rosto não reconhecido"}

    votos = {}
    for _, tipo in vizinhos_validos:
        votos[tipo] = votos.get(tipo, 0) + 1
    melhor_tipo = max(votos, key=votos.get)

    print(f"Resultado da votação: {votos} -> {melhor_tipo}")

    return {
        "sucesso": True,
        "tipo_usuario": melhor_tipo
    }