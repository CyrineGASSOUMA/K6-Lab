// ─────────────────────────────────────────────────────────────
// LAB 3 — Migration d'un parcours JMeter
// Équivalent du plan jmeter/lab3-parcours.jmx
// ─────────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, group, sleep } from 'k6';

// ── HTTP Request Defaults ────────────────────────────────────
const BASE = 'https://test-api.k6.io';

// ── HTTP Header Manager ──────────────────────────────────────
const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ── HTTP Cookie Manager : RIEN À ÉCRIRE ──────────────────────
//    Chaque VU dispose de son propre conteneur, automatiquement.

// ── Thread Group ─────────────────────────────────────────────
export const options = {
  vus: 10,
  duration: '1m',
};

// ── setUp Thread Group ───────────────────────────────────────
export function setup() {
  const suffixe = Date.now();
  const identifiants = {
    username: `user${suffixe}`,
    password: 'Secret123!',
  };

  // POST /user/register/
  const inscription = http.post(
    `${BASE}/user/register/`,
    JSON.stringify({
      ...identifiants,
      first_name: 'Test',
      last_name: 'Charge',
      email: `user${suffixe}@example.com`,
    }),
    { headers: JSON_HEADERS }
  );
  console.log('inscription : ' + inscription.status);

  // POST /auth/token/login/
  const connexion = http.post(
    `${BASE}/auth/token/login/`,
    JSON.stringify(identifiants),
    { headers: JSON_HEADERS }
  );
  console.log('connexion : ' + connexion.status);

  if (connexion.status !== 200) {
    throw new Error('Authentification échouée : ' + connexion.body);
  }

  // JSON Extractor — variable: token, chemin: $.access
  return { token: connexion.json('access') };
}

export default function (data) {
  const auth = { headers: { Authorization: `Bearer ${data.token}` } };
  let nouvelId;

  // ── Transaction Controller « Consultation » ────────────────
  group('Consultation', function () {
    const liste = http.get(`${BASE}/my/crocodiles/`, auth);

    check(liste, {
      'liste : statut 200': (r) => r.status === 200,
    });

    sleep(1);
  });

  // ── Transaction Controller « Création » ────────────────────
  group('Création', function () {
    // Corps passé sous forme d'OBJET → encodé en form-urlencoded.
    // C'est ce que cet endpoint attend.
    // Pour du JSON, il faudrait JSON.stringify() ET l'en-tête explicite.
    const creation = http.post(
      `${BASE}/my/crocodiles/`,
      {
        name: `Croco-${__VU}-${__ITER}`,   // unique par VU et par itération
        sex: 'M',
        date_of_birth: '2019-01-01',
      },
      auth
    );

    check(creation, {
      'création : statut 201':   (r) => r.status === 201,
      'création : nom retourné': (r) => r.json('name') !== undefined,
    });

    // JSON Extractor — variable: newId, chemin: $.id
    nouvelId = creation.json('id');

    sleep(1);
  });

  // ── Transaction Controller « Suppression » ─────────────────
  group('Suppression', function () {
    const suppression = http.del(
      `${BASE}/my/crocodiles/${nouvelId}/`,
      null,
      {
        ...auth,
        // Sans ce tag : une ligne de métrique par identifiant supprimé.
        tags: { name: '/my/crocodiles/{id}' },
      }
    );

    check(suppression, {
      'suppression : statut 204': (r) => r.status === 204,
    });
  });
}

// Lancement local  :  k6 run --vus 5 --duration 30s lab3.js
// Lancement cloud  :  k6 cloud run --local-execution --vus 10 --duration 2m lab3.js
//
// Correspondance JMeter → k6 :
//   HTTP Request Defaults    → const BASE
//   HTTP Header Manager      → const JSON_HEADERS
//   HTTP Cookie Manager      → RIEN, automatique
//   Thread Group             → options
//   setUp Thread Group       → setup()
//   JSON Extractor           → res.json('chemin')
//   Transaction Controller   → group()
//   Response Assertion       → check()
//   Constant Timer           → sleep()
