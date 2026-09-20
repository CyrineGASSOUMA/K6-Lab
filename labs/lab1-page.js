// ─────────────────────────────────────────────────────────────
// LAB 1 — Étape 6 : les ressources statiques
// Démontre que k6 ne télécharge pas les ressources embarquées
// ─────────────────────────────────────────────────────────────

import http from 'k6/http';

export default function () {
  const res = http.get('https://quickpizza.grafana.com/');
  console.log('Taille du document : ' + res.body.length + ' octets');
}

// Lancement :  k6 run --iterations 1 lab1-page.js
//
// Attendu : http_reqs = 1
//
// Un navigateur émet une dizaine de requêtes sur la même page :
// feuilles de style, scripts, images, polices.
// En JMeter, l'option « Retrieve all embedded resources » les télécharge.
// En k6, cette option n'existe pas.
