# Boîte à Outils de Communication — Spec Constitution

## 1. Mission & Purpose
- **But** : transformer des conflits interpersonnels en opportunités d’alignement produit en fournissant un processus local, rapide et guidé (analyse manuelle, dashboard, IA).
- **Problème** : l’utilisateur (Product Owner / Business Analyst) est confronté à des reproches autour de « l’ego » sans comprendre les schémas sous-jacents, ce qui alimente des réactions défensives et aggrave la crise.
- **Ambition** : outiller la désescalade émotionnelle, la capitalisation des apprentissages et l’entrainement hors ligne, sans dépendre d’un backend ni exposer de données sensibles.

## 2. Product Vision Statement
> Un copilote local, pensé comme une boîte à outils, qui transforme un incident de communication en backlog actionnable : pause immédiate, analyse guidée, perspectives IA (Gemini) et suivi des progrès.

## 3. Guiding Principles
1. **Valider avant d’agir** — la première sortie doit reconnaître l’émotion de l’autre (référence CNV, Gottman, Karpman).
2. **Langage Produit** — parler backlog, MVP, user story pour que l’utilisateur reste dans son référentiel professionnel.
3. **Autonomie Locale** — fonctionner offline, sans serveur, avec sauvegardes exportables.
4. **Clarté Analytique** — chaque écran doit livrer des options ou insights concrets (pas de bavardage thérapeutique).
5. **Modularité** — architecture vanilla JS modulaire (`createXModule`) pour itérer sans frameworks lourds.

## 4. Stakeholders & Personas
- **Utilisateur primaire** : Product Owner / Business Analyst (créateur de l’outil).
  - Objectif : désamorcer les crises, comprendre les patterns ego, livrer des scripts prêts à l’emploi.
  - Contrainte : agit souvent sous stress, besoin de consignes claires et d’une validation émotionnelle explicite.
- **Coach IA** : persona System Prompt (Coach & Analyste hybride psychologue / PO). Doit livrer plusieurs options de réponses structurées.
- **Futurs contributeurs** : designers et coachs qui enrichiront le dojo, la base de scénarios, et l’IA.

## 5. Vocabulary Alignment
- Problèmes relationnels = `bugs de communication`.
- Besoins partenaires = `user stories`.
- Plan de réponse = `roadmap` ou `backlog`.
- Première réponse = `MVP`.
- Ego (Défensive, Sauveur, Martyr, Dernier Mot, Refus d’influence) = `Ego Radar`.

## 6. User Needs & Jobs To Be Done
1. **Survivre à la crise** : bouton pause, rappels immédiats, scripts de validation.
2. **Analyser à froid** : rejouer l’échange en quatre étapes, identifier l’ego, relier au besoin caché.
3. **Capitaliser** : journal filtrable, export JSON, métriques de progression.
4. **S’entraîner** : dojo scénarisé pour répéter des réponses validantes.
5. **Être assisté** : IA (Gemini) pour générer scripts multi-objectifs et analyser médias.

## 7. Experience Pillars
- **Clarté** : stepper et cards structurés, badges colorés pour l’ego.
- **Feedback immédiat** : toasts, modales, auto-resize des champs.
- **Contextualisation** : dashboard accueil, insights récents, raccourcis actions.
- **Confidentialité** : travail 100% local, export manuel.

## 8. Scope (V1 livrée)
- Navigation SPA + mode sombre persistant.
- Analyseur manuel (wizard 4 étapes).
- Journal avec filtres, actions (voir/copier/supprimer), export/import JSON.
- Dashboard : métriques, derniers insights, raccourcis.
- Analyse IA heuristique (scripts, insights, dropzone images ready).
- Guide : persona IA, glossaire, framework MVP.
- Toasts, modales réutilisables, auto-resize, badges par ego.

## 9. Out-of-Scope (V1)
- Authentification / multi-utilisateurs.
- Stockage cloud & synchronisation.
- Analyse IA temps réel avec clé gérée côté serveur.
- Notifications push, mobile native.
- Analytics externes.

## 10. Future Roadmap (V2+)
1. **Sécurité API** — onboarding clé Gemini, stockage local sécurisé. *(Plan & spec disponibles : `specs/gemini-integration/`)*  
2. **Analyse IA Gemini** — brancher les appels réels, fallback heuristique, gestion quotas.  
3. **Migration Firestore** — synchronisation multi-appareils, onSnapshot / addDoc.  
4. **Animations de transition** — slide navigation, highlight state changes.  
5. **Graphiques temporels** — fréquence des analyses, heatmap d’ego.  
6. **IA avancée** — sauvegarde des scripts générés, méta-analyses du journal.  
7. **PWA** — manifest + service worker après la migration BDD.

## 11. User Flows
### 11.1 Crise (Temps réel)
Accueil → raccourci « Nouvelle analyse » → Étape 1 du wizard.
### 11.2 Post-crise
Analyse Manuelle → étapes 1-4 → sauvegarde → toast + mise à jour dashboard.
### 11.3 Consultation
Journal → filtres par ego → actions (voir = modal, copier = toast succès).
### 11.4 Assistance IA
Analyse IA → textarea + dropzone → bouton analyser → heuristiques → scripts copiables.
### 11.5 Ressources
Guide → persona, glossaire → copie persona, rappel framework.

## 12. Data Model & Storage
- **communicationJournal** (`localStorage`)
  - `id`, `createdAt`, `context`, `partnerSignal`, `egoFocus`, `triggerNeed`, `alternativeResponse`, `validation`, `actionPlan`, `insight`, `summary`.
- **boite-outils-theme** : `light` / `dark`.
- **boite-outils-last-page** : identifiant d’onglet.
- Import JSON fusionne par `id` (preserve existing).
- Fallback mémoire si `localStorage` indisponible (toast warning).

## 13. Technical Architecture
- **Frontend only** : `index.html` + `assets/js/app.js`.
- **Tailwind CDN** + `assets/css/styles.css` (composants custom).
- JS structuré en modules factoriels :
  - `createManualAnalyzer`, `createJournalModule`, `createHomeModule`, `createAIModule`, `createGuideModule`.
- Gestion globale via `toastManager`, `modalManager`, `journalStore`.
- API Gemini : placeholder `CONFIG.apiKey` (clé vide par défaut).

## 14. AI Persona & Prompt
```
Vous êtes un "Coach & Analyste" en communication de crise interpersonnelle.
Utilisateur : Product Owner / Business Analyst en crise.
Méthode :
1. Valider l'émotion.
2. Diagnostiquer l'ego (Défensive, Sauveur, Martyr, Dernier Mot, Refus d'influence).
3. Identifier la user story (besoin sous-jacent).
4. Proposer 2-3 scripts, chacun avec objectif stratégique (désescalade, poser une limite, alignement).
Contexte : outil local "Boîte à Outils" + documents projet.
```

## 15. Security & Privacy
- Les données restent locales ; aucune requête réseau obligatoire.
- Export manuel recommandé avant changement d’appareil.
- API Gemini : clé jamais commitée, à saisir côté client (cf. backlog V2 pour onboarding).
- Sensibiliser l’utilisateur sur la nature non thérapeutique de l’outil (rapport projet).

## 16. Success Metrics
- Temps moyen de complétion d’une analyse < 5 min.
- Taux d’usage du journal (≥ 3 entrées / semaine en période de crise).
- Réduction du nombre d’analyses marquées « Défensive » sur 30 jours.
- Adoption IA : scripts IA utilisés dans ≥ 50% des cas où un message externe est importé.

## 17. Risks & Mitigations
- **Perte de données** : dépendance LocalStorage → Export JSON + roadmap Firestore.
- **Biais de confirmation** : auto-analyse subjective → module IA comme contrepoint, Dojo pour varier les scénarios.
- **Dépendance CDN Tailwind** : première connexion requise → prévoir PWA + bundling minimal en V2.
- **Confidentialité IA** : clé exposée → onboarding dédié, chiffrement local, passerelle backend à envisager.

## 18. Dependencies & References
- Tailwind CDN, Google Fonts (Inter).
- Fichiers de référence : 
  - `specs/` (vision, besoins, UX, fonctionnel, décisions, changelog).
  - `resources/exemples.txt`, `resources/anciens_scenarios.md`, `resources/regles_metier.pdf`.
  - Legacy sources (docs originels : README, base de connaissances, rapport projet).

## 19. Operational Guidelines
- Lancer via `python3 -m http.server 8000` ou `npx serve .`.
- Tester manuellement chaque tab avant PR.
- Mettre à jour `specs/fonctionnel.md` et `specs/décisions.md` à chaque évolution majeure.
- Préparer intégration Gemini : isoler appels, gérer quotas, fallback heuristique.

## 20. Glossary
- **BT** : Bouton Pause d’Urgence.
- **Ego Radar** : typologie des réactions (Défensive, Sauveur, Martyr, Dernier Mot, Refus d’influence).
- **MVP** : première réponse minimale validée.
- **Dojo** : entraînement scénarisé pour s’exercer aux scripts.
- **Dashboard** : visualisation des métriques (ego dominant, streak, insights).
