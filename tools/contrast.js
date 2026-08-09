/* Comprueba los contrastes WCAG 2.1 de la paleta.
   Si se toca cualquier color de src/input.css, volver a pasar esto.
   Uso:  node tools/contrast.js */

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// [descripción, color de primer plano, descripción del fondo, fondo, ¿se usa en texto pequeño?]
const PARES = [
  ['crema-50   #F4EDE3', '#F4EDE3', 'carbón-950 #141210', '#141210', true],
  ['crema-200  #C8BFB2', '#C8BFB2', 'carbón-950 #141210', '#141210', true],
  ['crema-400  #A69B8C', '#A69B8C', 'carbón-950 #141210', '#141210', true],
  ['crema-400  #A69B8C', '#A69B8C', 'carbón-900 #1C1917', '#1C1917', true],
  ['dorado-400 #D9A441', '#D9A441', 'carbón-950 #141210', '#141210', true],
  ['dorado-400 #D9A441', '#D9A441', 'carbón-900 #1C1917', '#1C1917', true],
  ['brasa-500  #B4472A', '#B4472A', 'carbón-950 #141210', '#141210', false], // solo texto grande y bordes
  ['crema-50 en botón brasa', '#F4EDE3', 'brasa-500  #B4472A', '#B4472A', true],
  ['carbón en botón dorado', '#141210', 'dorado-400 #D9A441', '#D9A441', true],
  ['error      #E8845F', '#E8845F', 'carbón-900 #1C1917', '#1C1917', true],
  ['badge SG   #B9C49B', '#B9C49B', 'carbón-950 #141210', '#141210', true],
];

let fallos = 0;
for (const [na, a, nb, b, textoPequeno] of PARES) {
  const r = ratio(a, b);
  const minimo = textoPequeno ? 4.5 : 3;
  const ok = r >= minimo;
  if (!ok) fallos++;
  const nota = textoPequeno ? 'AA texto normal (≥4,5)' : 'AA texto grande / UI (≥3)';
  console.log(
    (ok ? '  OK ' : '  KO ') + r.toFixed(2).padStart(6) + ':1  ' +
    nota.padEnd(26) + na + '  sobre  ' + nb
  );
}

console.log(fallos ? '\n' + fallos + ' par(es) por debajo del mínimo AA.' : '\nToda la paleta cumple AA.');
process.exitCode = fallos ? 1 : 0;
