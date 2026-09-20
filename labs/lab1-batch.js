// ─────────────────────────────────────────────────────────────
// LAB 1 — Étape 7 : le contournement par http.batch()
// ─────────────────────────────────────────────────────────────

import http from 'k6/http';

export default function () {
  // Le document
  http.get('https://test.k6.io/');

  // Les ressources, explicitement listées
  http.batch([
    ['GET', 'https://test.k6.io/static/css/site.css'],
    ['GET', 'https://test.k6.io/static/js/site.js'],
  ]);
}

// Lancement :  k6 run --iterations 1 lab1-batch.js
//
// Attendu : http_reqs = 3
//
// Les trois limites :
//   1. La liste est écrite à la main, elle se périme à chaque livraison du front
//   2. L'ordre réel de découverte par le navigateur n'est pas reproduit,
//      ni les imports CSS en cascade, ni les ressources chargées par JavaScript
//   3. Aucun cache : tout est retéléchargé à chaque itération
//
// http.batch() déplace le problème, il ne le résout pas.
