// Service worker minimal — CAFOP Daloa, plateforme de composition
//
// Rôle unique : rendre l'application installable (Android / PC) et lui
// donner un repli hors-ligne pour la page elle-même. Il ne met JAMAIS en
// cache les appels à Supabase (authentification, questions, réponses,
// résultats) : ceux-ci passent toujours directement par le réseau, pour
// qu'aucune donnée affichée ne soit jamais périmée.
//
// Stratégie pour le document principal : réseau en priorité, cache en
// secours uniquement si l'appareil est hors-ligne. Ainsi, tant qu'il y a
// une connexion, la dernière version déployée est toujours celle utilisée.

const CACHE_NAME = "cafop-composition-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(noms.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // On ne touche qu'à la navigation vers le document HTML lui-même.
  // Tout le reste (Supabase, polices, bibliothèques CDN) suit son chemin
  // normal, sans interception.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request)
      .then((reponse) => {
        const copie = reponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie));
        return reponse;
      })
      .catch(() => caches.match(event.request))
  );
});
