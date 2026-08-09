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

const KRAFT_100 = '#E9DCC4';
const KRAFT_200 = '#DCCFB2';
const TINTA_900 = '#1F1B16';
const PIZARRA_900 = '#232B23';

// [descripción, primer plano, descripción del fondo, fondo, ¿texto pequeño?]
const PARES = [
  // --- superficie papel: el fondo dominante del sitio ---
  ['fuerte  tinta-900 #1F1B16', TINTA_900, 'kraft-100 #E9DCC4', KRAFT_100, true],
  ['texto   tinta-700 #3A332A', '#3A332A', 'kraft-100 #E9DCC4', KRAFT_100, true],
  ['suave   tinta-500 #5A5243', '#5A5243', 'kraft-100 #E9DCC4', KRAFT_100, true],
  ['acento  brasa-600 #96371F', '#96371F', 'kraft-100 #E9DCC4', KRAFT_100, true],
  ['badge SG          #4A5238', '#4A5238', 'kraft-100 #E9DCC4', KRAFT_100, true],

  // --- superficie papel-hondo ---
  ['fuerte  tinta-900 #1F1B16', TINTA_900, 'kraft-200 #DCCFB2', KRAFT_200, true],
  ['texto   tinta-700 #3A332A', '#3A332A', 'kraft-200 #DCCFB2', KRAFT_200, true],
  ['suave   tinta-500 #5A5243', '#5A5243', 'kraft-200 #DCCFB2', KRAFT_200, true],
  ['acento  brasa-600 #96371F', '#96371F', 'kraft-200 #DCCFB2', KRAFT_200, true],

  // --- superficie pizarra: la carta ---
  ['fuerte  tiza-50   #EDE7D8', '#EDE7D8', 'pizarra-900 #232B23', PIZARRA_900, true],
  ['texto   tiza-300  #C3BBA6', '#C3BBA6', 'pizarra-900 #232B23', PIZARRA_900, true],
  ['suave   tiza-500  #9A917D', '#9A917D', 'pizarra-900 #232B23', PIZARRA_900, true],
  ['acento  dorado    #D9A441', '#D9A441', 'pizarra-900 #232B23', PIZARRA_900, true],
  ['badge SG          #B9C49B', '#B9C49B', 'pizarra-900 #232B23', PIZARRA_900, true],

  // --- superficie tinta: hero, reseñas, pie ---
  ['fuerte  tiza-50   #EDE7D8', '#EDE7D8', 'tinta-900 #1F1B16', TINTA_900, true],
  ['texto   tiza-300  #C3BBA6', '#C3BBA6', 'tinta-900 #1F1B16', TINTA_900, true],
  ['suave   tiza-500  #9A917D', '#9A917D', 'tinta-900 #1F1B16', TINTA_900, true],
  ['acento  dorado    #D9A441', '#D9A441', 'tinta-900 #1F1B16', TINTA_900, true],
  ['error             #E8845F', '#E8845F', 'tinta-900 #1F1B16', TINTA_900, true],

  // --- rellenos ---
  ['kraft-50 en botón brasa', '#F6EFE0', 'brasa-500 #B4472A', '#B4472A', true],
  ['tinta en botón dorado', '#14110D', 'dorado-400 #D9A441', '#D9A441', true],
  ['kraft-50 en chapa del hero', '#F6EFE0', 'brasa-500 #B4472A', '#B4472A', false],
  ['brasa-500 como filete', '#B4472A', 'kraft-100 #E9DCC4', KRAFT_100, false],
];

let fallos = 0;
for (const [na, a, nb, b, textoPequeno] of PARES) {
  const r = ratio(a, b);
  const minimo = textoPequeno ? 4.5 : 3;
  const ok = r >= minimo;
  if (!ok) fallos++;
  const nota = textoPequeno ? 'AA texto normal (>=4,5)' : 'AA texto grande / UI (>=3)';
  console.log(
    (ok ? '  OK ' : '  KO ') + r.toFixed(2).padStart(6) + ':1  ' +
    nota.padEnd(26) + na + '  sobre  ' + nb
  );
}

console.log(fallos ? '\n' + fallos + ' par(es) por debajo del mínimo AA.' : '\nToda la paleta cumple AA.');
process.exitCode = fallos ? 1 : 0;
