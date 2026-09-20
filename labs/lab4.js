// ─────────────────────────────────────────────────────────────
// LAB 4 — Assertions et seuils
// ─────────────────────────────────────────────────────────────

import http from 'k6/http';
import { check } from 'k6';

const BASE = 'https://test-api.k6.io';

export const options = {
  vus: 5,
  duration: '20s',

  // ── Les seuils : LE SEUL mécanisme de pass/fail ────────────
  //    Un seuil franchi → code de sortie 99 → job CI en échec.
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],
    checks:            ['rate>0.99'],

    // Filtrés par tag : un critère par nature de requête.
    // Un seuil global sur un parcours hétérogène est ingérable.
    'http_req_duration{endpoint:liste}':  ['p(95)<400'],
    'http_req_duration{endpoint:detail}': ['p(95)<250'],
  },
};

export default function () {

  // ── Liste ──────────────────────────────────────────────────
  const liste = http.get(`${BASE}/public/crocodiles/`, {
    tags: { endpoint: 'liste' },
  });

  check(liste, {
    // Sur le statut
    'liste : statut 200': (r) => r.status === 200,

    // Sur la durée
    'liste : sous 500 ms': (r) => r.timings.duration < 500,

    // Sur un EN-TÊTE — attention à la casse :
    //   'Content-Type' fonctionne, 'content-type' retourne undefined
    'liste : content-type JSON': (r) =>
      r.headers['Content-Type'].includes('application/json'),

    // Sur le CORPS
    'liste : non vide': (r) => r.json().length > 0,
  });

  // ── Détail ─────────────────────────────────────────────────
  const detail = http.get(`${BASE}/public/crocodiles/1/`, {
    tags: { endpoint: 'detail' },
  });

  check(detail, {
    'détail : statut 200':       (r) => r.status === 200,
    'détail : nom présent':      (r) => r.json('name') !== undefined,
    'détail : identifiant 1':    (r) => r.json('id') === 1,
    'détail : sexe valide':      (r) => ['M', 'F'].includes(r.json('sex')),
    'détail : pas de trace erreur': (r) => !r.body.includes('error'),
  });

  // ── Code de réponse attendu ────────────────────────────────
  //    Sans responseCallback, ce 404 gonflerait http_req_failed.
  const absent = http.get(`${BASE}/public/crocodiles/999999/`, {
    tags: { endpoint: 'absent' },
    responseCallback: http.expectedStatuses(200, 404),
  });

  check(absent, {
    'absent : 404 attendu': (r) => r.status === 404,
  });
}

// Lancement local  :  k6 run lab4.js
// Code de sortie   :  echo $?          (Bash, Git Bash)
//                     $LASTEXITCODE    (PowerShell)
//
// Lancement cloud  :  k6 cloud run --local-execution --vus 5  --duration 1m lab4.js
//                     k6 cloud run --local-execution --vus 20 --duration 1m lab4.js
//                     puis bouton Compare dans l'interface
//
// ─────────────────────────────────────────────────────────────
// LE POINT CLÉ DU LAB
//
//   Un check qui échoue ne fait PAS échouer le test.
//   k6 sort en code 0 même avec 50 % de checks au rouge.
//   Le check est un compteur, pas une condition d'arrêt.
//
//   Seul un threshold franchi fait sortir k6 en code 99.
//
//   Conséquence : un test k6 en CI sans aucun threshold passe
//   systématiquement au vert et ne détecte rien.
// ─────────────────────────────────────────────────────────────
//
// Erreur réseau vs erreur HTTP :
//   res.status === 0    → aucune réponse HTTP reçue
//                         (timeout, DNS, connexion refusée, échec TLS)
//                         détail dans res.error et res.error_code
//   res.status === 500  → le serveur a répondu, erreur applicative
