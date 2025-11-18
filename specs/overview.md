# Aperçu du Projet

## Vision Produit
La Boîte à Outils de Communication est une application web locale destinée aux Product Owners confrontés à des conflits interpersonnels. L’objectif est de transformer des réactions instinctives en réponses structurées en combinant auto-analyse, tableaux de bord et assistance IA, tout en restant 100% hors serveur.

## Architecture Générale
- **Client-only SPA** servie depuis `index.html`, alimentée par Tailwind via CDN et des modules JavaScript vanilla.
- **Gestion d’état** minimale avec stockage local (`localStorage`) et modules indépendants (`createXModule`) injectés depuis `assets/js/app.js`.
- **Styles** centralisés dans `assets/css/styles.css`, qui étend la palette Tailwind pour les composants personnalisés (wizard, toasts, panneaux IA).

## Modules Clés
- **Navigation & Thème** : persistance de l’onglet actif et du mode sombre grâce aux clés `boite-outils-last-page` et `boite-outils-theme`.
- **Analyse Manuelle** : wizard en quatre étapes (Constat, Ego, MVP, Action) pour documenter chaque crise et générer un résumé exploitable.
- **Journal & Dashboard** : liste filtrable par type d’ego, export/import JSON, actions copier/supprimer, et métriques (ego dominant, streak sans défensive).
- **Analyse IA** : heuristiques locales prêtes à évoluer vers Gemini ; prépare scripts, insights et support multimodal.
- **Guide** : rappel rapide du prompt système, glossaire Ego Radar et framework MVP de réponse.

## Flux de Travail Type
1. Déclencher une analyse (Manuelle ou IA) juste après la situation.
2. Enregistrer l’entrée pour alimenter le journal et les indicateurs.
3. Réviser les apprentissages sur l’accueil pour préparer la prochaine interaction.
4. Utiliser les ressources (glossaire, scripts) comme kit de crise lors d’échanges sensibles.
