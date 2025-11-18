# Boîte à Outils — Standards Qualité & Procédures de Test

Ce document définit les standards de qualité et les procédures de test à exécuter avant toute modification majeure de l’application.

---

## 1. Les 3 Niveaux de Qualité

### Niveau 1 : Code Quality (Audit Technique)
*Objectif : garantir un code propre, maintenable et performant.*

- **Audit Lighthouse (Chrome DevTools > Lighthouse)**  
  - [ ] Performance ≥ 90  
  - [ ] Accessibility ≥ 95 (contraste, labels ARIA)  
  - [ ] Best Practices : zéro erreur console au chargement
- **Validation HTML/CSS**  
  - [ ] Pas de balises non fermées  
  - [ ] Utilisation cohérente des classes Tailwind (pas de `style="..."` sauf cas dynamiques)
- **Structure JS**  
  - [ ] Aucune variable globale non maîtrisée (logique encapsulée via `app` et modules)  
  - [ ] Tous les appels API / `localStorage` enveloppés dans des `try/catch`

### Niveau 2 : Tests Fonctionnels (User Acceptance)
*Objectif : vérifier que les User Stories clés restent opérationnelles.*

- **Scénario “Crise”**  
  1. Ouvrir l’app  
  2. Cliquer sur « Pause d’urgence »  
  3. Vérifier l’ouverture instantanée du modal  
  4. Fermer le modal
- **Scénario “Journal”**  
  1. Compléter une analyse manuelle  
  2. Cliquer sur « Sauvegarder »  
  3. Aller dans l’onglet « Journal »  
  4. Vérifier que la nouvelle entrée apparaît en haut  
  5. Recharger (F5) : l’entrée doit persister
- **Scénario “IA” (Mode Simulation)**  
  1. Supprimer / laisser vide la clé API  
  2. Lancer une analyse IA  
  3. Vérifier l’affichage d’un badge « Mode Simulation » et d’une réponse heuristique

### Niveau 3 : Tests Unitaires (Automatisés)
*Objectif : valider la logique interne critique.*

- **Outil** : `MiniTestRunner` intégré à `index.html`  
- **Procédure** :  
  1. Ouvrir la console navigateur (F12)  
  2. Exécuter `runTests()`  
  3. Vérifier que tous les tests retournent ✅

---

## 2. Check-list de Non-Régression (avant chaque sauvegarde)

- [ ] Sauvegarde des données : `localStorage` intact (tests persistance)  
- [ ] Mode sombre : UI vérifiée en light/dark  
- [ ] Responsive : validation mobile (largeur réduite) ; boutons/CTA accessibles  
- [ ] Console : aucune erreur rouge persistante

---

## 3. Gestion des Bugs

1. Documenter le bug dans `docs/TODO.md` (section « Bugs connus »).  
2. Décrire un scénario de reproduction clair.  
3. Corriger le problème.  
4. Ajouter un test unitaire (`runTests`) pour prévenir la régression.

---

**Rappel** : Ces vérifications sont obligatoires avant commit ou fusion majeure. Toute dérogation doit être explicitement consignée.
