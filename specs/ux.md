# Expérience Utilisateur

## Navigation Principale
- Barre d’onglets persistante (`Accueil`, `Analyse Manuelle`, `Analyse IA`, `Journal`, `Guide`) avec indicateurs actifs/inactifs.
- Mode sombre bascule depuis l’en-tête ; l’état est mémorisé pour les sessions suivantes.

## Parcours Clés
1. **Crise en direct**  
   - Accueil → raccourci « Nouvelle analyse » → wizard étape 1.  
   - Objectif : capturer le contexte sans jugement en moins de 60 secondes.
2. **Analyse post-incident**  
   - Wizard 4 étapes avec stepper visuel.  
   - Actions disponibles : navigation précédente/suivante, sauvegarde finale, auto-agrandissement des champs.
3. **Consultation & capitalisation**  
   - Journal : cartes modulaires, filtres par ego, badges couleur par persona, actions rapides (voir, copier, supprimer).  
   - État vide guidant vers l’analyse initiale.
4. **Dashboard d’accueil**  
   - Métriques clés (total entrées, ego dominant, streak sans défensive) + listes « derniers insights » et raccourcis contextualisés.
5. **Assistance IA**  
   - Zone de saisie + dropzone (images) + CTA « Analyser ».  
   - Résultats sous forme d’insights et scripts copiables avec toasts de feedback.

## Composants UX
- **Toasts** non intrusifs (coin bas droit) pour toutes les confirmations, erreurs et actions critiques.
- **Modales** (`journal-modal`) pour consulter les analyses détaillées sans quitter la page.
- **Badges** et **cards** homogènes pour renforcer la lecture rapide (ego, objectifs, métriques).
- **Accessibilité** : transitions douces, contrastes Tailwind, attributs `aria-live` sur les toasts, touches d’échappement pour fermer les modales.
