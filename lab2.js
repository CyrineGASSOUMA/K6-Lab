// ─────────────────────────────────────────────────────────────
// LAB 2 — Cycle de vie et décomposition
// ─────────────────────────────────────────────────────────────

import http from 'k6/http';

const BASE = 'https://test-api.k6.io';

// ── ZONE 1 — contexte d'initialisation ───────────────────────
//    Exécuté UNE FOIS PAR VU, plus une fois pour lire options.
//    Seul endroit où open() est autorisé.
//    Les requêtes HTTP y sont interdites.
console.log('INIT — VU ' + __VU);

export const options = {
  vus: 3,
  iterations: 6,
};

// ── ZONE 2 — setup ───────────────────────────────────────────
//    Exécuté UNE SEULE FOIS, avant tout VU.
//    La valeur de retour doit être sérialisable en JSON.
export function setup() {
  console.log('SETUP');
  return { demarre: Date.now() };
}

// ── ZONE 3 — default ─────────────────────────────────────────
//    Le parcours, rejoué en boucle par chaque VU.
export default function (data) {
  console.log('DEFAULT — VU ' + __VU + ' itération ' + __ITER);
  http.get(`${BASE}/public/crocodiles/`);
}

// ── ZONE 4 — teardown ────────────────────────────────────────
//    Exécuté une fois à la fin. Non garanti si interruption brutale.
export function teardown(data) {
  console.log('TEARDOWN — durée ' + (Date.now() - data.demarre) + ' ms');
}

// Occurrences attendues avec 3 VUs et 6 itérations :
//   INIT      4 fois  (1 pour lire options + 1 par VU)
//   SETUP     1 fois
//   DEFAULT   6 fois
//   TEARDOWN  1 fois
