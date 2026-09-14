"""
Funções compartilhadas de reconhecimento facial leve (sem bibliotecas pesadas).

Como funciona:
1. Detecta o rosto na imagem com Haar Cascade (já embutido no OpenCV).
2. Calcula um histograma LBP (Local Binary Pattern) do rosto recortado — isso
   vira o "vetor facial": uma lista de números que representa a textura do rosto.
3. Dois vetores são comparados por distância qui-quadrado: quanto MENOR, mais parecidos.
"""

import cv2
import numpy as np
import os

TAMANHO_PADRAO = (100, 100)  # todo rosto é redimensionado pra esse tamanho antes de calcular o histograma

# Caminho local do arquivo (versões recentes do opencv-contrib-python não incluem mais
# os arquivos Haar Cascade dentro do pacote, então baixamos e guardamos no próprio projeto)
_PASTA_ATUAL = os.path.dirname(os.path.abspath(__file__))
_CAMINHO_CASCADE = os.path.join(_PASTA_ATUAL, "haarcascade_frontalface_default.xml")

detector_rosto = cv2.CascadeClassifier(_CAMINHO_CASCADE)

if detector_rosto.empty():
    raise FileNotFoundError(
        f"Não foi possível carregar '{_CAMINHO_CASCADE}'. "
        "Baixe o arquivo em https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml "
        "e salve na raiz do projeto com esse nome."
    )


def detectar_e_recortar_rosto(imagem_cinza: np.ndarray) -> np.ndarray | None:
    """Recebe uma imagem em escala de cinza e devolve o maior rosto detectado, recortado e redimensionado."""
    rostos = detector_rosto.detectMultiScale(imagem_cinza, scaleFactor=1.1, minNeighbors=5)
    if len(rostos) == 0:
        return None

    x, y, w, h = max(rostos, key=lambda r: r[2] * r[3])
    rosto = imagem_cinza[y:y + h, x:x + w]
    return cv2.resize(rosto, TAMANHO_PADRAO)


def calcular_histograma_lbp(rosto_cinza: np.ndarray, raio: int = 1, vizinhos: int = 8) -> list[float]:
    """Calcula o histograma LBP de um rosto já recortado/redimensionado. Isso é o 'vetor facial'."""
    altura, largura = rosto_cinza.shape
    lbp = np.zeros((altura, largura), dtype=np.uint8)

    for i in range(raio, altura - raio):
        for j in range(raio, largura - raio):
            centro = rosto_cinza[i, j]
            codigo = 0
            vizinhanca = [
                rosto_cinza[i - raio, j - raio], rosto_cinza[i - raio, j], rosto_cinza[i - raio, j + raio],
                rosto_cinza[i, j + raio], rosto_cinza[i + raio, j + raio], rosto_cinza[i + raio, j],
                rosto_cinza[i + raio, j - raio], rosto_cinza[i, j - raio],
            ]
            for bit, valor_vizinho in enumerate(vizinhanca):
                if valor_vizinho >= centro:
                    codigo |= (1 << bit)
            lbp[i, j] = codigo

    histograma, _ = np.histogram(lbp.ravel(), bins=256, range=(0, 256))
    histograma = histograma.astype(float)
    histograma /= (histograma.sum() + 1e-7)
    return histograma.tolist()


def distancia_qui_quadrado(vetor_a: list[float], vetor_b: list[float]) -> float:
    """Mede o quão diferentes dois vetores são. Quanto MENOR, mais parecidos os rostos."""
    a = np.array(vetor_a)
    b = np.array(vetor_b)
    return float(np.sum(((a - b) ** 2) / (a + b + 1e-7)))