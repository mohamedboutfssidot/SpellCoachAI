# SpellCoach AI

Dictée vocale d'orthographe anglaise avec coach IA. React + Vite, déployé sur Cloudflare Pages.

## Fonctionnement
1. Choisis un niveau (A1–A2, B1–B2, C1).
2. Le navigateur prononce un mot (Web Speech API, gratuit).
3. Tu l'écris au clavier. Les tuiles se colorent lettre par lettre (distance de Levenshtein).
4. Le coach IA explique l'erreur, donne une astuce et un exemple.
5. Mode « Enhance it » : correction et reformulation d'une phrase entière.
6. Les mots ratés reviennent plus souvent (répétition espacée simple, stockée en localStorage).

## Architecture
```
Navigateur (React) ── /api/coach ──> Pages Function ──> API NVIDIA NIM
 voix + scoring local                 (clé secrète)      (modèle gratuit)
```
Si l'IA est indisponible, l'app bascule sur un retour local basé sur des règles.

## Lancer en local
```bash
npm install
cp .dev.vars.example .dev.vars   # y mettre ta clé
npm run dev                      # interface + IA, sans wrangler
```
`npm run cf:dev` (wrangler) reste optionnel, pour simuler Cloudflare à l'identique.
Clé gratuite : https://build.nvidia.com (génère une API key). Vérifie le nom du modèle dans le catalogue.

## Déployer sur Cloudflare Pages
1. Pousse le dossier sur GitHub.
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git.
3. Build command : `npm run build` — Output directory : `dist`.
4. Settings → Variables and Secrets : ajoute `NVIDIA_API_KEY` (secret) et, si besoin, `NVIDIA_MODEL`.
5. Redéploie. Le dossier `functions/` est détecté automatiquement.

## Structure
- `src/lib/diff.js` : alignement et classification des erreurs (inversion, lettre doublée, manquante…)
- `src/lib/coach.js` : appel au coach + plan B local
- `src/lib/speech.js` : synthèse vocale
- `functions/api/coach.js` : proxy NVIDIA, validation des entrées, sortie JSON nettoyée

## Fournisseur IA
- Clé NVIDIA (`nvapi-...`) : endpoint NVIDIA NIM, modèle type `meta/llama-3.1-8b-instruct`.
- Clé OpenRouter (`sk-or-...`) : détectée automatiquement, modèle type `nvidia/nemotron-3.5-super-vl:free`.
- `AI_BASE_URL` (optionnel) force un autre endpoint compatible OpenAI.

`NVIDIA_MODEL` accepte plusieurs modèles séparés par des virgules : ils sont essayés dans l'ordre. Avec OpenRouter, `openrouter/free` est ajouté en dernier recours.
