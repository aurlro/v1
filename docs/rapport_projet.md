# **Document de Référence : Boîte à Outils de Communication V1.0**

Date : 18 novembre 2025  
Statut : Rétrospective V1, Préparation V2

## **1\. La Problématique (Le "Quoi")**

Le projet est né d'une situation de crise communicationnelle aiguë. L'utilisateur principal (vous) était confronté à un blocage sémantique : le terme "ego" était utilisé par sa partenaire comme un reproche principal, mais l'utilisateur ne parvenait pas à en décoder le sens fonctionnel.

**Problèmes identifiés :**

* **Définition floue :** L'"ego" n'était pas l'arrogance, mais un ensemble de comportements (Défensive, Sauveur, Refus d'Influence).  
* **Injonction Paradoxale ("Double Contrainte") :** L'utilisateur était confronté à des demandes contradictoires (ex: "Pars \!" vs "Tu m'abandonnes \!"), rendant toute action logique inefficace.  
* **Réactivité Émotionnelle :** L'utilisateur (ainsi que sa partenaire) était en mode de réaction émotionnelle élevée ("ego défensif"), empêchant toute écoute.  
* **Besoin de Survie :** Un besoin immédiat de sécuriser son propre état mental et physique (logement, sommeil) avant de pouvoir "réparer" la relation.

## **2\. La Genèse & Objectifs (Le "Pourquoi")**

L'objectif principal n'était pas de "gagner" les disputes, mais de **reprendre le contrôle de ses propres réactions** pour désamorcer l'escalade.

**Objectifs Clés de la V1 :**

1. **SURVIVRE :** Fournir une aide immédiate en cas de crise (le "Bouton Pause").  
2. **ANALYSER :** Offrir un espace privé et structuré pour déconstruire les conflits *après coup* (Analyseur Manuelle).  
3. **APPRENDRE :** Définir et mémoriser les concepts clés (Le Guide).  
4. **VOIR :** Visualiser les schémas de comportement récurrents (Le Journal & Dashboard).  
5. **S'ENTRAÎNER :** Renforcer les nouvelles réponses non-réactives (Le Dojo).  
6. **ASSISTER :** Obtenir une aide externe (Analyseur IA) pour les situations complexes.

## **3\. Le Parcours Utilisateur (User Flow)**

L'application est conçue autour de 5 cas d'utilisation principaux, accessibles depuis la navigation principale.

\[Image d'un diagramme de flux utilisateur montrant les 5 cas d'usage de l'application\]

1. **Cas d'Usage 1 : Crise (Temps Réel)**  
   * Accueil → Bouton Pause d'Urgence → Modal (Rappels)  
   * *Besoin :* J'ai besoin d'un rappel immédiat pour ne pas mal réagir *maintenant*.  
2. **Cas d'Usage 2 : Réflexion (Post-Crise)**  
   * Accueil → Analyse Manuelle → Wizard (Étapes 1-4) → Sauvegarder  
   * *Besoin :* Je veux comprendre ce qui vient de se passer, pourquoi j'ai réagi comme ça, et ce que j'aurais pu faire.  
3. **Cas d'Usage 3 : Tendance (Hebdomadaire)**  
   * Accueil → Dashboard  
   * Mon Journal → Relecture des entrées  
   * *Besoin :* Je veux savoir si je progresse. Est-ce que je tombe moins dans le piège de la "Défensive" ?  
4. **Cas d'Usage 4 : Formation (Temps Calme)**  
   * Guide → Accordéon (Concepts) → Bouton "S'entraîner"  
   * *Besoin :* Je veux m'entraîner à répondre différemment dans un environnement sans risque.  
5. **Cas d'Usage 5 : Assistance (Déblocage)**  
   * Accueil → Analyse IA → Upload Texte/Image → Générer des réponses  
   * *Besoin :* Je suis bloqué sur un message, je ne sais pas comment répondre. J'ai besoin de propositions.

## **4\. Fonctionnalités & Mise en Pratique (Le "Comment" Fonctionnel)**

L'outil V1 a été construit en 4 phases itératives :

### **Phase 1 : Confort & Urgence**

* **Mode Nuit :** Un interrupteur (Soleil/Lune) pour le confort visuel. Mémorise le choix.  
* **Bouton Pause d'Urgence :** Ouvre un modal avec des instructions claires pour gérer une crise en temps réel ("STOP. Respire. Valide.").

### **Phase 2 : La Mémoire**

* **Analyseur Manuelle (Wizard) :** Un formulaire guidé en 4 étapes (Constat, Analyse, Réponse, Synthèse) avec une barre de progression.  
* **Champs de Saisie Auto-Agrandissants :** Les textarea s'agrandissent avec le contenu pour une meilleure UX mobile.  
* **Aide Contextuelle :** Des "Mode Coach" aident l'utilisateur à remplir les sections difficiles (Besoin Caché, Réponse Partenaire).  
* **Journal de Bord :**  
  * **Sauvegarde :** L'étape 4 permet de sauvegarder l'analyse complète dans le localStorage.  
  * **Consultation :** Un nouvel onglet "Mon Journal" affiche toutes les entrées passées, triées par date.  
  * **Actions :** Chaque entrée peut être **vue** (dans un modal), **copiée**, ou **supprimée**.

### **Phase 3 : Les Aperçus (Insights)**

* **Tableau de Bord :** S'affiche sur "Accueil" si le journal n'est pas vide.  
* **Compteur de Jours :** Calcule le nombre de jours depuis la dernière analyse contenant l'ego "La Défensive".  
* **Graphique d'Ego :** Un graphique à barres simple montre la répartition en % et en nombre des 4 types d'ego, basé sur *toutes* les analyses sauvegardées.  
* **Mise à jour dynamique :** Le tableau de bord se recalcule à chaque sauvegarde ou suppression.

### **Phase 4 : L'Entraînement**

* **"Dojo" Interactif :** Intégré à l'onglet "Guide".  
* **Scénarios :** Une base de données de scénarios (ex: "Elle dit : 'La poubelle déborde'") est liée à chaque concept (Défensive, Sauveur, etc.).  
* **Quiz à Choix Multiples :** Pour chaque scénario, l'outil propose 3 réponses (1 Partenaire, 2 Ego) dans un ordre aléatoire.  
* **Feedback Immédiat :** L'outil colore le choix (vert/rouge) et fournit une explication textuelle sur *pourquoi* la réponse était correcte ou non.

### **Fonctionnalité Annexe : Analyseur IA**

* **Interface Multimodale :** Permet la saisie de texte et/ou l'upload d'images.  
* **Analyse Stratégique :** Appelle l'API Gemini avec un *System Prompt* très spécifique pour analyser la "dangerosité" d'un message et proposer des réponses basées sur des principes de désescalade (CNV, DBT).

## **5\. Architecture & Aspects Techniques**

L'outil a été conçu avec une contrainte majeure : **la simplicité et l'autonomie** (pas de build, pas de serveur).

* **Framework :** Aucun. Le projet est en **Vanilla JavaScript (ES6+)**, **HTML5**, et **Tailwind CSS**.  
  * *Choix pris :* Vanilla JS.  
  * *Choix évité :* React/Angular/Vue.  
  * *Justification :* Rapidité de développement, pas de dépendances, et facilité d'exécution dans n'importe quel navigateur à partir d'un seul fichier index.html.  
* **Styling :** **Tailwind CSS** (via CDN).  
  * *Choix pris :* Tailwind.  
  * *Choix évité :* CSS Pur.  
  * *Justification :* Permet une UI/UX soignée, cohérente (design system) et mobile-first sans avoir à écrire de fichiers CSS séparés. Le Mode Nuit (dark:) est géré nativement.  
* **Persistance des Données (Mémoire) :** **localStorage du navigateur.**  
  * *Choix pris :* localStorage.  
  * *Choix évité :* Firebase/Supabase (Base de données externe).  
  * *Justification :* L'outil se doit d'être 100% privé et local. L'authentification et une base de données externe étaient superflues pour un journal personnel et ajoutaient de la complexité.  
* **Logique Applicative (JavaScript) :**  
  * **Navigation :** Un simple système de MapsTo(tabName) qui gère l'affichage des div (pages) et l'état actif/inactif des onglets.  
  * **État :** L'état global est géré par des variables JS et par la lecture/écriture dans le localStorage.  
  * **Journal :** Les données sont stockées sous la clé JOURNAL\_KEY sous forme de tableau d'objets JSON. L'utilisation de unshift() garantit que les nouvelles entrées sont toujours en haut.  
  * **Dashboard :** Les statistiques sont calculées "à la volée" (on-the-fly) en parcourant le tableau JSON du localStorage à chaque chargement de la page d'accueil.  
* **Logique IA (Analyseur IA) :**  
  * **API :** gemini-2.5-flash-preview-09-2025.  
  * **Appel :** fetchWithRetry (fonction maison avec backoff exponentiel pour gérer les erreurs 429/500).  
  * **Images :** Conversion en base64 via fileToBase64 (utilisant FileReader).  
  * **Réponse Structurée :** L'API est contrainte de répondre en JSON grâce à responseSchema et responseMimeType: "application/json".

## **6\. Ressources & Contenu (Le "Savoir")**

Le "cœur" de l'application est sa base de connaissances, qui formalise la problématique.

* **Concepts Clés (Glossaire) :**  
  * L'Ego (Défensive, Sauveur, Dernier Mot, Refus d'Influence)  
  * La Double Contrainte  
  * La Dette Émotionnelle  
* **Base de Données (Dojo) :**  
  * Une collection de \~10 scénarios de la vie réelle, chacun avec 3 réponses scriptées et 3 feedbacks pédagogiques, classés par concept.  
* **Ressources Externes (Théoriciens) :**  
  * John Gottman (4 Cavaliers, Influence)  
  * Stephen Karpman (Triangle Dramatique)  
  * Gregory Bateson (Double Contrainte)  
  * Marsha Linehan (Validation Radicale)

## **7\. Vision V2 & Évolutions Futures**

L'outil V1 est fonctionnel, mais centré sur l'utilisateur unique. La V2 pourrait se concentrer sur la robustesse et l'ouverture.

* **Priorité 1 : Robustesse des Données (Migration BDD)**  
  * **Action :** Remplacer localStorage par une base de données cloud (ex: **Firebase Firestore**).  
  * **Pourquoi :** Résout les deux problèmes majeurs :  
    1. **Perte de Données :** Les données sont sécurisées dans le cloud.  
    2. **Synchronisation :** L'application fonctionnera sur plusieurs appareils (téléphone, ordinateur) avec des données synchronisées en temps réel.  
  * **Implémentation :** Nécessite d'ajouter l'authentification Firebase (Google, email...) et de remplacer les fonctions getJournal() et saveJournalEntry() par des appels onSnapshot() et addDoc() de Firestore.  
* **Priorité 2 : Import/Export (Plan B si pas de BDD)**  
  * **Action :** Ajouter des boutons pour exporter le journal localStorage en JSON (sauvegarde) et l'importer.  
  * **Pourquoi :** Une solution "low-tech" pour la robustesse des données si la migration BDD est reportée.  
* **Priorité 3 : Amélioration des "Aperçus"**  
  * **Filtres de Journal :** Permettre de filtrer le journal par type d'ego (ex: "Montre-moi toutes mes analyses 'Défensive'").  
  * **Graphique Temporel :** Un graphique montrant la fréquence de vos analyses (analyses par semaine) pour visualiser la régularité de votre pratique.  
* **Priorité 4 : Intégration de l'IA**  
  * **Sauvegarde des Analyses IA :** Permettre de sauvegarder les analyses de l'outil IA dans le Journal (ou la BDD), au même titre que les analyses manuelles.  
  * **Coaching IA sur le Journal :** Un bouton "Analyser mon Journal" qui enverrait vos 10 dernières analyses à l'IA pour qu'elle identifie des "méta-schémas" que le simple graphique ne voit pas.  
* **Priorité 5 : Déploiement**  
  * **PWA (Progressive Web App) :** Ajouter un manifest.json et un Service Worker pour rendre l'application "installable" sur un téléphone mobile et la faire fonctionner 100% hors ligne (après migration BDD qui gère la synchro).

## **8\. Risques & Limitations de la V1**

Il est crucial d'être conscient des faiblesses de la version actuelle.

* **Perte de Données :** La V1 repose à 100% sur le localStorage. Si vous videz le cache de votre navigateur ou changez d'appareil, **toutes vos analyses de journal seront perdues**. C'est le risque le plus élevé. (Voir V2 \- Priorité 1).  
* **Absence de Synchronisation :** L'outil est mono-appareil. Vous ne pouvez pas commencer une analyse sur votre téléphone et la retrouver sur votre ordinateur.  
* **Biais de Confirmation :** L'outil d'analyse manuelle repose sur votre propre perception. Il est possible de mal diagnostiquer une situation par biais d'auto-justification (bien que l'outil "Analyse IA" aide à contrer cela).  
* **Dépendance CDN :** L'application nécessite une connexion Internet au premier chargement pour récupérer Tailwind CSS. Elle ne fonctionne pas (encore) hors ligne.  
* **Non-professionnel :** Les outils (Dojo, Analyse IA) sont des aides à la réflexion et ne remplacent en aucun cas un conseil thérapeutique ou psychologique professionnel.

## **9\. Conclusion & Prochaines Étapes**

La **Boîte à Outils V1** a rempli son objectif premier : transformer une crise réactive en un processus de réflexion structuré. Elle a fourni à l'utilisateur un ensemble d'outils pour survivre à l'urgence (Pause), analyser le passé (Journal), comprendre les schémas (Dashboard) et préparer l'avenir (Dojo, IA).

La fondation technique (Vanilla JS, Tailwind, localStorage) s'est avérée être le bon choix pour une itération rapide et un déploiement instantané (un simple fichier HTML).

La prochaine étape logique (**V2**) doit se concentrer sur la **robustesse** et la **pérennité** des données utilisateur via une migration vers une base de données cloud comme **Firebase**.