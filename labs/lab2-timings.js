// ─────────────────────────────────────────────────────────────
// LAB 2 — Décomposition des temps de réponse
// ─────────────────────────────────────────────────────────────

import http from 'k6/http';

const BASE = 'https://test-api.k6.io';

export default function () {
  const res = http.get(`${BASE}/public/crocodiles/`);
  const t = res.timings;

  console.log(
    'blocked='     + t.blocked.toFixed(1) +
    ' connecting=' + t.connecting.toFixed(1) +
    ' tls='        + t.tls_handshaking.toFixed(1) +
    ' sending='    + t.sending.toFixed(1) +
    ' waiting='    + t.waiting.toFixed(1) +
    ' receiving='  + t.receiving.toFixed(1) +
    ' | duration=' + t.duration.toFixed(1)
  );
}

// Lancement :  k6 run --vus 1 --iterations 5 lab2-timings.js
// Puis      :  k6 run --vus 1 --iterations 5 --no-connection-reuse lab2-timings.js
//
// À observer :
//   1ʳᵉ itération   → connecting et tls non nuls (établissement TCP + TLS)
//   Suivantes       → connecting et tls à zéro (connexion réutilisée)
//
// LA RELATION EXACTE :
//   http_req_duration = sending + waiting + receiving
//
//   blocked, connecting et tls_handshaking sont mesurés SÉPARÉMENT
//   et NE SONT PAS inclus dans duration.
//
// Conséquence : un p(95) de duration acceptable peut coexister avec un
// blocked catastrophique. Le système répond vite, mais les utilisateurs
// attendent — parce que l'injecteur ou le réseau ne suivent pas.
//
// Table de diagnostic :
//   blocked élevé    → pool de connexions saturé, DNS lent  (client / réseau)
//   connecting élevé → latence TCP                          (réseau)
//   tls élevé        → reprise de session TLS absente       (configuration TLS)
//   waiting élevé    → traitement applicatif, base, verrous (SERVEUR)
//   receiving élevé  → réponse volumineuse, bande passante  (réseau)
