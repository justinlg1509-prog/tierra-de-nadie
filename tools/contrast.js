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

const SAL_50 = '#F5F7F7';
const SAL_100 = '#E9EFEF';
const NOCHE_900 = '#0E1620';
const PETROLEO_700 = '#1E3D43';

// [descripción, primer plano, descripción del fondo, fondo, ¿texto pequeño?]
const PARES = [
  // --- superficie papel: el fondo dominante ---
  ['fuerte  noche-900  #0E1620', NOCHE_900, 'sal-50  #F5F7F7', SAL_50, true],
  ['texto   noche-700  #26333F', '#26333F', 'sal-50  #F5F7F7', SAL_50, true],
  ['suave   noche-500  #4A5A66', '#4A5A66', 'sal-50  #F5F7F7', SAL_50, true],
  ['acento  petroleo-600 #2A5158', '#2A5158', 'sal-50  #F5F7F7', SAL_50, true],
  ['madera-700         #855727', '#855727', 'sal-50  #F5F7F7', SAL_50, true],
  ['badge SG           #47543C', '#47543C', 'sal-50  #F5F7F7', SAL_50, true],
  ['error              #A3341F', '#A3341F', 'sal-50  #F5F7F7', SAL_50, true],

  // --- superficie papel-hondo ---
  ['fuerte  noche-900  #0E1620', NOCHE_900, 'sal-100 #E9EFEF', SAL_100, true],
  ['texto   noche-700  #26333F', '#26333F', 'sal-100 #E9EFEF', SAL_100, true],
  ['suave   noche-500  #4A5A66', '#4A5A66', 'sal-100 #E9EFEF', SAL_100, true],
  ['acento  petroleo-600 #2A5158', '#2A5158', 'sal-100 #E9EFEF', SAL_100, true],

  // --- superficie tinta: hero, resenas, pie ---
  ['fuerte  sal-50     #F5F7F7', SAL_50, 'noche-900 #0E1620', NOCHE_900, true],
  ['texto              #C2CDD3', '#C2CDD3', 'noche-900 #0E1620', NOCHE_900, true],
  ['suave              #8D9AA5', '#8D9AA5', 'noche-900 #0E1620', NOCHE_900, true],
  ['acento  espuma-300 #89AFB2', '#89AFB2', 'noche-900 #0E1620', NOCHE_900, true],
  ['madera-500         #AE8457', '#AE8457', 'noche-900 #0E1620', NOCHE_900, true],
  ['badge SG           #BCCFA4', '#BCCFA4', 'noche-900 #0E1620', NOCHE_900, true],

  // --- superficie pizarra: la carta, en el petroleo del rotulo ---
  ['fuerte  sal-50     #F5F7F7', SAL_50, 'petroleo-700 #1E3D43', PETROLEO_700, true],
  ['texto   espuma-200 #B3CBCC', '#B3CBCC', 'petroleo-700 #1E3D43', PETROLEO_700, true],
  ['suave              #96A9AC', '#96A9AC', 'petroleo-700 #1E3D43', PETROLEO_700, true],
  ['acento  espuma-300 #89AFB2', '#89AFB2', 'petroleo-700 #1E3D43', PETROLEO_700, true],

  // --- rellenos ---
  ['sal-50 en boton petroleo', SAL_50, 'petroleo-500 #346269', '#346269', true],
  ['sal-50 en boton madera', SAL_50, 'madera-700 #855727', '#855727', true],
  ['noche en enlace de salto', '#070B11', 'espuma-300 #89AFB2', '#89AFB2', true],
  ['sal-50 en la chapa del hero', SAL_50, 'petroleo-500 #346269', '#346269', false],
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
