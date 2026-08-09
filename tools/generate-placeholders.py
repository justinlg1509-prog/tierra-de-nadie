# -*- coding: utf-8 -*-
"""
Genera los placeholders locales de /img para Tierra de Nadie.

No son fotos definitivas: reservan la proporcion exacta, el peso aproximado y
el nombre de archivo que tendra la foto real, para que sustituirlas sea copiar
y pegar sin tocar el HTML.

Uso:  python tools/generate-placeholders.py     (o  npm run img)
Requiere: Pillow  ->  pip install Pillow
"""

import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "img")

CARBON = (20, 18, 16)
CARBON_UP = (38, 34, 32)
BRASA = (180, 71, 42)
DORADO = (217, 164, 65)
CREMA = (244, 237, 227)

FONT_CANDIDATES_SANS = [
    r"C:\Windows\Fonts\segoeui.ttf",
    r"C:\Windows\Fonts\arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
FONT_CANDIDATES_SERIF = [
    r"C:\Windows\Fonts\georgia.ttf",
    r"C:\Windows\Fonts\times.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
]


def load_font(candidates, size):
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def ember_gradient(w, h, seed):
    """Fondo carbon con dos focos de brasa desenfocados. Barato y con caracter."""
    rnd = random.Random(seed)
    small_w, small_h = max(24, w // 26), max(24, h // 26)
    base = Image.new("RGB", (small_w, small_h), CARBON)
    px = base.load()

    # Dos focos calidos en posiciones estables por semilla
    focos = [
        (rnd.uniform(0.15, 0.45), rnd.uniform(0.55, 0.9), rnd.uniform(0.5, 0.8), BRASA),
        (rnd.uniform(0.55, 0.9), rnd.uniform(0.1, 0.5), rnd.uniform(0.3, 0.55), DORADO),
    ]

    for y in range(small_h):
        for x in range(small_w):
            nx, ny = x / small_w, y / small_h
            r, g, b = CARBON
            # Leve subida general hacia el centro
            centro = 1.0 - min(1.0, math.hypot(nx - 0.5, ny - 0.55) * 1.5)
            mix = 0.35 * max(0.0, centro)
            r += (CARBON_UP[0] - r) * mix
            g += (CARBON_UP[1] - g) * mix
            b += (CARBON_UP[2] - b) * mix
            for fx, fy, fuerza, color in focos:
                d = math.hypot((nx - fx) * 1.15, ny - fy)
                intensidad = max(0.0, 1.0 - d * 2.1) ** 2.2 * fuerza
                r += (color[0] - r) * intensidad
                g += (color[1] - g) * intensidad
                b += (color[2] - b) * intensidad
            px[x, y] = (int(r), int(g), int(b))

    img = base.resize((w, h), Image.BICUBIC).filter(
        ImageFilter.GaussianBlur(radius=max(2, w / 90))
    )
    return img


def add_grain(img, seed, amount=13):
    """Ruido monocromo sutil, coherente con el grano de la web."""
    w, h = img.size
    rnd = random.Random(seed + 999)
    noise = Image.new("L", (w // 2 or 1, h // 2 or 1))
    noise.putdata([rnd.gauss(128, 34) for _ in range(noise.width * noise.height)])
    noise = noise.resize((w, h), Image.BILINEAR)
    grain = Image.merge("RGB", (noise, noise, noise))
    return Image.blend(img, grain, amount / 100)


def draw_frame_and_label(img, label, ratio_txt, pos=(0.5, 0.5), compacto=False):
    """La marca de agua identifica el hueco sin competir con el texto de la web.

    compacto=True deja solo una nota pequena en la esquina inferior derecha:
    es lo que usan las imagenes que llevan titulares encima (hero y eventos),
    donde una marca centrada se comeria el mensaje."""
    w, h = img.size
    d = ImageDraw.Draw(img, "RGBA")

    inset = max(10, int(min(w, h) * 0.035))
    d.rectangle(
        [inset, inset, w - inset - 1, h - inset - 1],
        outline=(244, 237, 227, 34),
        width=max(1, w // 900),
    )

    escala = min(w, h)

    if compacto:
        f_nota = load_font(FONT_CANDIDATES_SANS, max(9, int(escala * 0.026)))
        d.text(
            (w - inset - escala * 0.035, h - inset - escala * 0.035),
            "%s  ·  %s  ·  %d×%d  ·  IMAGEN PROVISIONAL" % ("TIERRA DE NADIE", label.upper(), w, h),
            font=f_nota, fill=(244, 237, 227, 78), anchor="rs",
        )
        return img

    f_titulo = load_font(FONT_CANDIDATES_SERIF, max(13, int(escala * 0.062)))
    f_meta = load_font(FONT_CANDIDATES_SANS, max(9, int(escala * 0.028)))

    cx, cy = w * pos[0], h * pos[1]

    # Marca de agua tipografica
    d.text((cx, cy - escala * 0.048), "TIERRA DE NADIE", font=f_titulo,
           fill=(244, 237, 227, 92), anchor="mm")
    d.text((cx, cy + escala * 0.030), label.upper(), font=f_meta,
           fill=(217, 164, 65, 120), anchor="mm")
    d.text((cx, cy + escala * 0.074), "%s  ·  %d×%d  ·  IMAGEN PROVISIONAL" % (ratio_txt, w, h),
           font=f_meta, fill=(200, 191, 178, 85), anchor="mm")

    # Pequena marca de brasa
    d.line([(cx - escala * 0.08, cy - escala * 0.100), (cx + escala * 0.08, cy - escala * 0.100)],
           fill=(180, 71, 42, 150), width=max(2, int(escala * 0.007)))
    return img


def ratio_label(w, h):
    from fractions import Fraction

    fr = Fraction(w, h).limit_denominator(24)
    return "%d:%d" % (fr.numerator, fr.denominator)


def build(nombre, base_w, ratio, anchos, label, seed, fmt="webp", quality=72,
          pos=(0.5, 0.5), compacto=False):
    """ratio = (rw, rh)."""
    rw, rh = ratio
    salidas = []
    full_h = round(base_w * rh / rw)
    master = ember_gradient(base_w, full_h, seed)
    master = add_grain(master, seed)
    master = draw_frame_and_label(master, label, ratio_label(rw, rh), pos, compacto)

    for ancho in anchos:
        alto = round(ancho * rh / rw)
        im = master.resize((ancho, alto), Image.LANCZOS)
        if len(anchos) == 1:
            fichero = "%s.%s" % (nombre, fmt)
        else:
            fichero = "%s-%d.%s" % (nombre, ancho, fmt)
        ruta = os.path.join(IMG_DIR, fichero)
        if fmt == "webp":
            im.save(ruta, "WEBP", quality=quality, method=6)
        else:
            im.save(ruta, "JPEG", quality=82, optimize=True, progressive=True)
        salidas.append((fichero, os.path.getsize(ruta)))
    return salidas


# ---------------------------------------------------------------------------
# Inventario de imagenes del sitio
# (nombre, ratio, anchos a generar, etiqueta, semilla)
# En POSICION_MARCA se apartan las marcas de agua de las imagenes que llevan
# texto de la web encima (hero y eventos), para que no se solapen.
# ---------------------------------------------------------------------------
MARCA_COMPACTA = {"hero-parrilla", "eventos-mesa-larga"}

INVENTARIO = [
    ("hero-parrilla",            (16, 9),  [640, 1000, 1600, 2400], "Hero · parrilla en marcha", 11),
    ("casa-brasas",              (4, 5),   [560, 900],              "La casa · brasas",           21),
    ("casa-equipo",              (3, 2),   [560, 900],              "La casa · equipo de sala",   22),

    ("carta-entrantes",          (3, 2),   [520, 900],  "Carta · para empezar",       31),
    ("carta-empanadas",          (3, 2),   [520, 900],  "Carta · empanadas",          32),
    ("carta-parrilla",           (3, 2),   [520, 900],  "Carta · de la parrilla",     33),
    ("carta-mar",                (3, 2),   [520, 900],  "Carta · del mar",            34),
    ("carta-postres",            (3, 2),   [520, 900],  "Carta · postres",            35),

    ("galeria-01-churrasco",     (4, 5),   [560, 1200], "Galería · churrasco",        41),
    ("galeria-02-parrillada",    (3, 2),   [560, 1200], "Galería · parrillada",       42),
    ("galeria-03-empanadas",     (1, 1),   [560, 1200], "Galería · empanadas",        43),
    ("galeria-04-sala",          (3, 2),   [560, 1200], "Galería · sala",             44),
    ("galeria-05-tartar",        (4, 5),   [560, 1200], "Galería · tartar de atún",   45),
    ("galeria-06-brasas",        (1, 1),   [560, 1200], "Galería · brasas",           46),
    ("galeria-07-terraza-playa", (3, 2),   [560, 1200], "Galería · terraza Aguadulce", 47),
    ("galeria-08-tarta-queso",   (4, 5),   [560, 1200], "Galería · tarta de queso",   48),
    ("galeria-09-croquetas",     (1, 1),   [560, 1200], "Galería · croquetas",        49),

    ("local-almeria-centro",     (16, 10), [560, 1100], "Local · Almería, C. Líbano", 51),
    ("local-aguadulce-playa",    (16, 10), [560, 1100], "Local · Aguadulce, playa",   52),

    ("eventos-mesa-larga",       (21, 9),  [900, 1800], "Eventos · mesa larga",       61),
]


def main():
    os.makedirs(IMG_DIR, exist_ok=True)
    total = 0
    n = 0
    for nombre, ratio, anchos, label, seed in INVENTARIO:
        compacto = nombre in MARCA_COMPACTA
        for fichero, peso in build(nombre, max(anchos), ratio, anchos, label, seed, compacto=compacto):
            total += peso
            n += 1
            print("  %-34s %6.1f KB" % (fichero, peso / 1024))

    # Open Graph en JPG (mejor compatibilidad en redes que WebP)
    for fichero, peso in build("og-tierra-de-nadie", 1200, (1200, 630), [1200],
                               "Open Graph · 1200×630", 71, fmt="jpg"):
        total += peso
        n += 1
        print("  %-34s %6.1f KB" % (fichero, peso / 1024))

    print("\n%d archivos · %.1f KB en total" % (n, total / 1024))


if __name__ == "__main__":
    main()
