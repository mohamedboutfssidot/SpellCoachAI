# SpellCoach AI

Application web pour apprendre l'orthographe anglaise : dictée vocale, correction lettre par lettre et coach IA.
Stack : React + Vite, Cloudflare (Workers ou Pages), modèle IA gratuit via une API compatible OpenAI.

## Fonctionnalités

| Onglet | Rôle | Fichiers principaux |
|---|---|---|
| **Mots** | Le navigateur prononce un mot, l'utilisateur l'écrit au clavier. Les tuiles se colorent lettre par lettre, puis le coach IA explique l'erreur. | `src/components/Dictation.jsx`, `src/lib/diff.js`, `src/lib/speech.js` |
| **Phrases** | L'IA génère une phrase adaptée au niveau, lue à voix haute. Le score est calculé mot par mot (1 − WER). | `src/features/sentences/` |
| **Progrès** | Statistiques d'erreurs, mots les plus ratés, tendance, et plan d'étude personnalisé par l'IA. | `src/features/insights/` |
| **Enhance it** | Correction et reformulation d'une phrase écrite par l'utilisateur. | `src/components/Enhance.jsx` |

Niveaux : A1–A2, B1–B2, C1. Les mots ratés reviennent plus souvent (répétition espacée simple).
Toutes les données restent dans le navigateur (`localStorage`).

## Architecture

```
Navigateur (React)
 ├─ Web Speech API : voix gratuite, sans serveur
 ├─ Levenshtein : tuiles lettre par lettre (mots) et score mot par mot (phrases)
 ├─ Journal des réponses : statistiques locales (onglet Progrès)
 └─ POST /api/coach
        ↓
Cloudflare : fonction serveur (clé secrète)
        ↓
API IA compatible OpenAI (NVIDIA NIM ou OpenRouter, modèles gratuits)
```

Si l'IA est indisponible, chaque fonctionnalité bascule sur un plan B local (règles, phrases de secours, conseils fixes) et un badge indique « local ». Seul « Enhance it » dépend entièrement de l'IA.

### Modes de l'API `/api/coach`
- `spell` : explication d'une erreur ou d'une réussite (JSON : explanation, tip, example, example_fr)
- `sentence` : génération d'une phrase de dictée (JSON : sentence, fr)
- `plan` : plan d'étude à partir de statistiques agrégées (JSON : summary, tips)
- `enhance` : correction et reformulation (JSON : corrected, improved, changes)

La fonction valide chaque entrée (formats, longueurs, valeurs bornées) et nettoie la sortie du modèle avant de la renvoyer. Seules des statistiques agrégées sont envoyées pour le plan d'étude, jamais le journal complet.

## Lancer en local

```bash
npm install
cp .dev.vars.example .dev.vars   # y mettre ta clé
npm run dev                      # interface + IA, sans wrangler
```

`.dev.vars` contient :
```
NVIDIA_API_KEY=ta-cle
NVIDIA_MODEL=nvidia/nemotron-nano-9b-v2:free,openrouter/free
```
Ce fichier est dans `.gitignore` : ne le publie jamais.
`npm run cf:dev` (wrangler) reste optionnel, pour simuler Cloudflare à l'identique.

## Fournisseur IA

- Clé NVIDIA (`nvapi-...`) : endpoint NVIDIA NIM, détecté automatiquement.
- Clé OpenRouter (`sk-or-...`) : détectée automatiquement.
- `AI_BASE_URL` (optionnel) : force un autre endpoint compatible OpenAI.
- `NVIDIA_MODEL` accepte plusieurs modèles séparés par des virgules, essayés dans l'ordre. Avec OpenRouter, `openrouter/free` est ajouté en dernier recours.

## Déploiement sur Cloudflare

### Option A : Workers (méthode utilisée dans ce projet)
Le dépôt contient `wrangler.jsonc` et `worker/index.js` : ils publient le dossier `dist` et routent `/api/*` vers la fonction.

1. Pousse le projet sur GitHub (ce dépôt suffit, pas besoin d'en créer un nouveau).
2. Cloudflare : Workers & Pages → Create → importer le dépôt.
3. Réglages : Build command `npm run build`, Deploy command `npx wrangler deploy`. Le nom du Worker dans `wrangler.jsonc` doit correspondre au nom du projet.
4. Settings → Variables and Secrets : ajouter `NVIDIA_API_KEY` (Secret) et `NVIDIA_MODEL`.
5. Chaque `git push` redéploie le site.

### Option B : Pages
Build command `npm run build`, dossier de sortie `dist`. Le dossier `functions/` à la racine est détecté automatiquement. Ajouter les mêmes variables pour l'environnement Production, puis redéployer.

### Problèmes fréquents
- **Réponse « local » en ligne** : variables absentes ou ajoutées sans redéploiement.
- **Erreur de build** : ajouter `NODE_VERSION=20` dans les variables de build.
- **Erreur 404 sur `/api/coach`** : `functions/` (Pages) ou `worker/` (Workers) n'est pas à la racine du dépôt.
- **Détail d'une erreur IA** : onglet Network du navigateur → requête `/api/coach` → champ `detail`.
- **Quotas** : les modèles gratuits sont limités, fais un essai la veille de la présentation.

## Structure du projet

```
functions/api/coach.js        Fonction serveur : validation, appel IA, modèles de secours
worker/index.js               Point d'entrée Workers (réutilise coach.js)
wrangler.jsonc                Configuration Cloudflare Workers
vite.config.js                Plugin de dev : exécute /api/coach en local sans wrangler
src/App.jsx                   Onglets, niveaux, statistiques, journal
src/components/               Dictation (mots), Enhance, Tiles
src/features/sentences/       Dictée de phrases (logic.js : score WER, phrases de secours)
src/features/insights/        Progrès (analyze.js : agrégation, plan local)
src/lib/                      diff.js, speech.js, coach.js, storage.js
src/data/words.js             Mots par niveau
```

## Répartition pour la présentation
1. **Mots et Enhance it** : synthèse vocale, distance de Levenshtein, prompt du coach, architecture serveur.
2. **Phrases** : génération par prompt, validation de la sortie, score WER mot par mot.
3. **Progrès** : collecte, agrégation, minimisation des données envoyées, plan d'étude IA.

## Limites et pistes
- Liste de mots courte (14 par niveau).
- Qualité des voix dépendante du navigateur et du système.
- Perspectives : reconnaissance vocale au micro, comptes utilisateurs, plus de langues.