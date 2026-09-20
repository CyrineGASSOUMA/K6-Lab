// ─────────────────────────────────────────────────────────────
// LAB 1 — Étape 7 : le contournement par http.batch()
// ─────────────────────────────────────────────────────────────

import http from 'k6/http';

// Note : test.k6.io redirige désormais vers quickpizza.grafana.com.
// On cible directement la destination pour éviter les redirections.
const SITE = 'https://quickpizza.grafana.com';

export default function () {
  // Le document
  http.get(`${SITE}/`);

  // Les ressources, explicitement listées
  http.batch([
    ['GET', `${SITE}/images/pizza.png`],
    ['GET', `${SITE}/_app/immutable/entry/start.zveLuu7j.js`],
  ]);
}

// Lancement :  k6 run --iterations 1 lab1-batch.js
//
// Attendu : http_reqs = 3
//
// ─────────────────────────────────────────────────────────────
// LES TROIS LIMITES — et la première se vérifie ici même
//
//   1. La liste est écrite à la main, elle se périme.
//      Regardez le nom du fichier JavaScript : start.zveLuu7j.js
//      Ce suffixe est un hash de build. Il change à CHAQUE
//      déploiement du site. Votre batch sera cassé au prochain.
//      C'est exactement ce qui arrive sur une application active.
//
//   2. L'ordre réel de découverte par le navigateur n'est pas
//      reproduit, ni les imports CSS en cascade, ni les ressources
//      chargées dynamiquement par JavaScript.
//
//   3. Aucun cache : tout est retéléchargé à chaque itération,
//      alors qu'un utilisateur réel ne télécharge qu'une fois.
//
// http.batch() déplace le problème, il ne le résout pas.
// ─────────────────────────────────────────────────────────────
