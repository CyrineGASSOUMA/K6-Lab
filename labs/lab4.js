// ─────────────────────────────────────────────────────────────
// LAB 4 — Assertions et seuils
// ─────────────────────────────────────────────────────────────

import http from 'k6/http';
import { check } from 'k6';

const BASE = 'https://quickpizza.grafana.com';

export const options = {
  vus: 5,
  duration: '20s',

  // ── Les seuils : LE SEUL mécanisme de pass/fail ────────────
  //    Un seuil franchi → code de sortie 99 → job CI en échec.
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed:   ['rate<0.01'],
    checks:            ['rate>0.99'],

    // Filtrés par tag : un critère par nature de requête.
    // Un seuil global sur un parcours hétérogène est ingérable.
    'http_req_duration{endpoint:quotes}': ['p(95)<600'],
    'http_req_duration{endpoint:accueil}': ['p(95)<900'],
  },
};

export default function () {

  // ── Endpoint JSON ──────────────────────────────────────────
  const quotes = http.get(`${BASE}/api/quotes`, {
    tags: { endpoint: 'quotes' },
  });

  check(quotes, {
    // Sur le statut
    'quotes : statut 200': (r) => r.status === 200,

    // Sur la durée
    'quotes : sous 800 ms': (r) => r.timings.duration < 800,

    // Sur un EN-TÊTE — attention à la casse :
    //   'Content-Type' fonctionne, 'content-type' retourne undefined
    'quotes : content-type JSON': (r) =>
      r.headers['Content-Type'] !== undefined &&
      r.headers['Content-Type'].includes('application/json'),

    // Sur le CORPS
    'quotes : liste non vide': (r) => r.json('quotes').length > 0,
  });

  // ── Endpoint HTML ──────────────────────────────────────────
  const accueil = http.get(`${BASE}/`, {
    tags: { endpoint: 'accueil' },
  });

  check(accueil, {
    'accueil : statut 200':   (r) => r.status === 200,
    'accueil : contenu HTML': (r) => r.body.includes('<html'),
    'accueil : pas d\'erreur': (r) => !r.body.includes('Internal Server Error'),
  });

  // ── Code de réponse attendu ────────────────────────────────
  //    Sans responseCallback, ce 404 gonflerait http_req_failed.
  const absent = http.get(`${BASE}/api/nexiste-pas`, {
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
// À DÉMONTRER pendant le lab :
//   Remplacer 'quotes : sous 800 ms' par 'sous 1 ms' → checks à ~50 %
//   Retirer le bloc thresholds → echo $? affiche 0
//   Remettre les thresholds    → echo $? affiche 99
//
// Erreur réseau vs erreur HTTP :
//   res.status === 0    → aucune réponse HTTP reçue
//                         (timeout, DNS, connexion refusée, échec TLS)
//                         détail dans res.error et res.error_code
//   res.status === 404  → le serveur a répondu, ressource absente
