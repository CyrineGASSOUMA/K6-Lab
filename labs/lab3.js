// ─────────────────────────────────────────────────────────────
// LAB 3 — Migration d'un parcours JMeter
// Équivalent du plan jmeter/lab3-parcours.jmx
//
// Cible : QuickPizza, le bac à sable officiel de Grafana.
// ─────────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, group, sleep } from 'k6';

// ── HTTP Request Defaults ────────────────────────────────────
const BASE = 'https://quickpizza.grafana.com';

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

  // POST /api/users — création du compte
  const inscription = http.post(
    `${BASE}/api/users`,
    JSON.stringify(identifiants),
    { headers: JSON_HEADERS }
  );
  console.log('inscription : ' + inscription.status);

  // POST /api/users/token/login — authentification
  const connexion = http.post(
    `${BASE}/api/users/token/login`,
    JSON.stringify(identifiants),
    { headers: JSON_HEADERS }
  );
  console.log('connexion : ' + connexion.status);

  if (connexion.status !== 200) {
    throw new Error('Authentification échouée : ' + connexion.body);
  }

  // JSON Extractor — variable: token, chemin: $.token
  return {
    token: connexion.json('token'),
    userId: inscription.json('id'),
  };
}

export default function (data) {
  const auth = {
    headers: {
      ...JSON_HEADERS,
      Authorization: `Token ${data.token}`,
      'X-User-ID': String(data.userId),
    },
  };

  let nouvelId;

  // ── Transaction Controller « Consultation » ────────────────
  group('Consultation', function () {
    const quotes = http.get(`${BASE}/api/quotes`, auth);

    check(quotes, {
      'consultation : statut 200': (r) => r.status === 200,
      'consultation : liste non vide': (r) => r.json('quotes').length > 0,
    });

    sleep(1);
  });

  // ── Transaction Controller « Création » ────────────────────
  group('Création', function () {
    const creation = http.post(
      `${BASE}/api/pizza`,
      JSON.stringify({
        maxCaloriesPerSlice: 1000,
        mustBeVegetarian: false,
        excludedIngredients: [],
        excludedTools: [],
        maxNumberOfToppings: 5,
        minNumberOfToppings: 2,
      }),
      auth
    );

    check(creation, {
      'création : statut 200':   (r) => r.status === 200,
      'création : nom retourné': (r) => r.json('pizza.name') !== undefined,
    });

    // JSON Extractor — variable: newId, chemin: $.pizza.id
    nouvelId = creation.json('pizza.id');

    sleep(1);
  });

  // ── Transaction Controller « Vérification » ────────────────
  group('Vérification', function () {
    const detail = http.get(`${BASE}/api/quotes`, {
      ...auth,
      // Sans ce tag : une ligne de métrique par identifiant.
      tags: { name: '/api/quotes/{id}' },
    });

    check(detail, {
      'vérification : statut 200': (r) => r.status === 200,
      'vérification : identifiant créé': () => nouvelId !== undefined,
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
