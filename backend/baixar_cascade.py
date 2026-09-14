"""
Baixa automaticamente o arquivo haarcascade_frontalface_default.xml
e salva na mesma pasta deste script. Rode uma única vez:

    python baixar_cascade.py
"""

import os
import urllib.request

URL = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
PASTA_ATUAL = os.path.dirname(os.path.abspath(__file__))
DESTINO = os.path.join(PASTA_ATUAL, "haarcascade_frontalface_default.xml")

print(f"Baixando de {URL} ...")
urllib.request.urlretrieve(URL, DESTINO)
print(f"Salvo em: {DESTINO}")

tamanho = os.path.getsize(DESTINO)
print(f"Tamanho do arquivo: {tamanho} bytes")
if tamanho < 10000:
    print("AVISO: o arquivo parece pequeno demais, pode ter baixado uma página de erro em vez do XML.")
else:
    print("Tudo certo!")