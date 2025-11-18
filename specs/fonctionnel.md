# Spécifications Fonctionnelles

## Portée V1 (livrée)
- **Analyse Manuelle**
  - Wizard 4 étapes : Constat, Ego Radar, Réponse MVP, Plan d’action.
  - Validation des champs obligatoires et génération d’un résumé consolidé.
  - Sauvegarde locale avec identifiant unique et horodatage ISO.
- **Journal**
  - Liste des entrées triées par date décroissante.
  - Filtres par type d’ego, actions Voir/Copier/Supprimer.
  - Export JSON (`journal-communication-<date>.json`) et import avec fusion par ID.
- **Tableau de bord Accueil**
  - Total d’entrées, ego dominant (%), compteur de jours sans ego « Défensive ».
  - Derniers insights contextualisés avec raccourcis navigables.
- **Analyse IA (mode heuristique)**
  - Détection de tension, besoins de validation/limite.
  - Génération de 3 scripts catégorisés (désescalade, limite, alignement).
  - Préparation au support Gemini (API key dans `CONFIG.apiKey`).
- **Guide**
  - Extrait de Persona IA, glossaire Ego Radar, framework de réponse MVP.
- **Infrastructure UX**
  - Système de toasts empilables, modales accessibles, auto-resize des textarea, mode sombre persistant.

## Données & Stockage
- Source principale : `localStorage` (`communicationJournal`, `boite-outils-theme`, `boite-outils-last-page`).
- Import préserve les entrées existantes ; en cas d’absence de `localStorage`, un fallback mémoire avec alerte toast est utilisé.

## Sécurité & Config
- Aucune donnée transmise côté serveur.
- L’API Gemini doit être renseignée manuellement dans `assets/js/app.js` avant activation.
- Export JSON recommandé avant changement d’appareil ou vidage de cache.

## Évolutions Prioritaires (Roadmap V2)
1. **Sécurité API** : collecte de la clé au premier lancement + stockage sécurisé.
2. **Synchronisation Cloud** : migration Firestore pour multi-appareils.
3. **Animations de transition** : navigation avec effet slide pour renforcer le feedback.
4. **Graphiques temporels** : fréquence d’analyse par semaine + heatmap d’ego.
