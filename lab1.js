// ─────────────────────────────────────────────────────────────
// LAB 1 — Du plan JMeter au script k6
// Équivalent du plan jmeter/lab1-parcours.jmx
// ─────────────────────────────────────────────────────────────

import http from 'k6/http';
import { check, sleep } from 'k6';

// ── HTTP Request Defaults ────────────────────────────────────
const BASE = 'https://test-api.k6.io';

// ── Thread Group : 10 threads, durée 30 s ────────────────────
export const options = {
  vus: 10,
  duration: '30s',
  summaryTrendStats: ['min', 'med', 'avg', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  // ── HTTP Request : GET /public/crocodiles/ ─────────────────
  const res = http.get(`${BASE}/public/crocodiles/`);

  // ── Response Assertion : code 200 ──────────────────────────
  check(res, {
    'statut 200': (r) => r.status === 200,
  });

  // ── Constant Timer : 1000 ms ───────────────────────────────
  sleep(1);
}

// ── Aggregate Report ─────────────────────────────────────────
//    Aucun équivalent à écrire : la sortie console est native.
//
// À observer :
//   http_reqs = 2 par itération  → la redirection est suivie
//   iteration_duration ≈ 1,1 s   → le sleep(1) est inclus
//   http_req_waiting             → sans équivalent exact en JMeter
