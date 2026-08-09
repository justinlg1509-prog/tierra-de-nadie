"""Descarga las fotos provisionales de Unsplash y genera /img.

Sustituye a generate-placeholders.py: mismos nombres, mismas proporciones y
mismos anchos, pero con fotografia real en vez de degradados sinteticos.
Las fotos son de Unsplash (Unsplash License: uso comercial permitido, sin
atribucion obligatoria); aun asi se dejan los creditos en CREDITOS-FOTOS.md.

  python tools/fetch-unsplash.py

Sigue siendo material PROVISIONAL: hay que cambiarlo por las fotos reales del
restaurante antes de publicar. Ver README seccion 5.
"""

import io
import os
import sys
import time
import urllib.error
import urllib.request

from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, "img")
CDN = "https://images.unsplash.com/photo-%s?w=%d&h=%d&fit=crop&crop=entropy&q=85&fm=jpg"

# (nombre, id de Unsplash, ratio, anchos, que se ve)
INVENTARIO = [
    ("hero-parrilla",            "1558030006-450675393462", (16, 9),   [640, 1000, 1600, 2400], "tira de asado cortada sobre tabla"),
    ("casa-brasas",              "1529193591184-b1d58069ecdd", (4, 5),  [560, 900],  "costillar hecho a la brasa"),
    ("casa-equipo",              "1428515613728-6b4607e44363", (3, 2),  [560, 900],  "cocina en marcha, pase"),

    ("carta-entrantes",          "1504674900247-0877df9cc836", (3, 2),  [520, 900],  "platos para compartir"),
    ("carta-empanadas",          "1466978913421-dad2ebd01d17", (3, 2),  [520, 900],  "mesa compartida, manos"),
    ("carta-parrilla",           "1594041680534-e8c8cdebd659", (3, 2),  [520, 900],  "carne y papas en hierro"),
    ("carta-mar",                "1519708227418-c8fd9a32b7a2", (3, 2),  [520, 900],  "pescado en plato oscuro"),
    ("carta-postres",            "1551024506-0bccd828d307", (3, 2),    [520, 900],  "postre con dulce de leche"),

    ("galeria-01-churrasco",     "1529692236671-f1f6cf9683ba", (4, 5),  [560, 1200], "churrasco cortado"),
    ("galeria-02-parrillada",    "1555939594-58d7cb561ad1", (3, 2),     [560, 1200], "parrillada con salsas"),
    ("galeria-03-empanadas",     "1601050690597-df0568f70950", (1, 1),  [560, 1200], "masas fritas (provisional)"),
    ("galeria-04-sala",          "1544148103-0773bf10d330", (3, 2),     [560, 1200], "sala con luz de tarde"),
    ("galeria-05-tartar",        "1544510808-91bcbee1df55", (4, 5),     [560, 1200], "plato de autor emplatado"),
    ("galeria-06-brasas",        "1544025162-d76694265947", (1, 1),     [560, 1200], "costillar en tabla"),
    ("galeria-07-terraza-playa", "1559339352-11d035aa65de", (3, 2),     [560, 1200], "terraza sobre el mar"),
    ("galeria-08-tarta-queso",   "1571877227200-a0d98ea607e9", (4, 5),  [560, 1200], "porcion de tarta"),
    ("galeria-09-croquetas",     "1619221882220-947b3d3c8861", (1, 1),  [560, 1200], "fritura con salsa (provisional)"),

    ("local-almeria-centro",     "1514933651103-005eec06c04b", (16, 10), [560, 1100], "barra con pizarra"),
    ("local-aguadulce-playa",    "1552566626-52f8b828add9", (16, 10),    [560, 1100], "sala luminosa"),

    ("eventos-mesa-larga",       "1528605248644-14dd04022da1", (21, 9),  [900, 1800], "mesa larga llena de gente"),
]

OG = ("og-tierra-de-nadie", "1558030006-450675393462", (1200, 630), "jpg")


def descargar(pid, w, h, intentos=3):
    url = CDN % (pid, w, h)
    for n in range(intentos):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return Image.open(io.BytesIO(r.read())).convert("RGB")
        except (urllib.error.URLError, OSError) as exc:
            if n == intentos - 1:
                raise SystemExit("  FALLO %s: %s" % (pid, exc))
            time.sleep(2 * (n + 1))
    raise SystemExit("inalcanzable")


def main():
    os.makedirs(DESTINO, exist_ok=True)
    total = 0
    n_ficheros = 0
    creditos = []

    for nombre, pid, (rw, rh), anchos, que_es in INVENTARIO:
        ancho_max = max(anchos)
        master = descargar(pid, ancho_max, round(ancho_max * rh / rw))
        creditos.append((nombre, pid, que_es))
        for ancho in anchos:
            alto = round(ancho * rh / rw)
            im = master.resize((ancho, alto), Image.LANCZOS)
            ruta = os.path.join(DESTINO, "%s-%d.webp" % (nombre, ancho))
            im.save(ruta, "WEBP", quality=72, method=6)
            peso = os.path.getsize(ruta)
            total += peso
            n_ficheros += 1
            print("  %-36s %6.1f KB" % (os.path.basename(ruta), peso / 1024))

    nombre, pid, (w, h), _ = OG
    master = descargar(pid, w, h)
    ruta = os.path.join(DESTINO, "%s.jpg" % nombre)
    master.save(ruta, "JPEG", quality=82, optimize=True, progressive=True)
    peso = os.path.getsize(ruta)
    total += peso
    n_ficheros += 1
    creditos.append((nombre, pid, "tarjeta social"))
    print("  %-36s %6.1f KB" % (os.path.basename(ruta), peso / 1024))

    with open(os.path.join(RAIZ, "CREDITOS-FOTOS.md"), "w", encoding="utf-8") as f:
        f.write("# Creditos de las fotos provisionales\n\n")
        f.write("Todas de [Unsplash](https://unsplash.com), bajo la Unsplash License:\n")
        f.write("uso comercial permitido y sin atribucion obligatoria. Se listan igualmente\n")
        f.write("por cortesia y para poder rastrear el origen.\n\n")
        f.write("**Son provisionales.** Hay que sustituirlas por fotografia real del\n")
        f.write("restaurante antes de publicar (README seccion 5).\n\n")
        f.write("| Archivo | Que se ve | Foto |\n|---|---|---|\n")
        for nombre, pid, que_es in creditos:
            f.write("| `%s` | %s | https://unsplash.com/photos/%s |\n" % (nombre, que_es, pid))

    print("\n%d archivos - %.1f KB en total" % (n_ficheros, total / 1024))
    print("Creditos escritos en CREDITOS-FOTOS.md")


if __name__ == "__main__":
    sys.exit(main())
