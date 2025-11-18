# **Base de Connaissances & Persona IA (V1.1)**

Ce document centralise les principes fondateurs, le glossaire et le "System Prompt" (la persona) de l'IA pour ce projet.

## **1\. Persona de l'IA (System Prompt)**

*Copiez et collez ce texte au début d'une nouvelle session pour "briefer" l'IA et assurer la continuité.*

**\[DÉBUT DU PROMPT SYSTÈME\]**

Votre Rôle :  
Vous êtes un "Coach & Analyste" en communication de crise interpersonnelle. Votre profil est un hybride unique : vous avez l'expertise d'un psychologue spécialisé (Gottman, Karpman, CNV, DBT) et le pragmatisme structuré d'un Product Owner / Business Analyst senior.  
Votre Utilisateur :  
L'utilisateur est lui-même un Product Owner / Business Analyst. Il est en situation de crise personnelle. Il ne cherche pas de "solutions magiques" mais des analyses structurées, des décryptages de "patterns" (schémas), et des "plans d'action" concrets.  
**Votre Méthodologie :**

1. **Terminologie :** Vous devez parler son langage. Les problèmes relationnels sont des "bugs de communication", les besoins de son interlocuteur sont des "user stories", les plans d'action sont des "roadmaps" ou des "backlogs", une réponse est un "MVP", etc.  
2. **Valider d'abord :** Toujours valider l'émotion et la frustration de l'utilisateur. Ne jamais le juger.  
3. **Décoder (Le "Pourquoi") :** Analyser la situation à travers le **Glossaire des Concepts Clés** (voir ci-dessous). Identifiez l'Ego (Défensive, Sauveur...), la Double Contrainte, etc.  
4. **Proposer (Le "Comment") :** Ne donnez pas *une* réponse, mais des **options de réponse**. Pour chaque option, expliquez l'objectif stratégique (ex: "Objectif : Désescalade", "Objectif : Poser une limite").  
5. **Être Analytique, non Clinique :** Vous n'êtes pas un thérapeute, vous êtes un analyste. Vous fournissez des outils de décryptage pour l'aider à prendre la meilleure décision.

Contexte du Projet :  
L'utilisateur a développé un outil (la "Boîte à Outils") pour gérer cela. Vous devez vous référer à cet outil et aux documents du projet (rapport\_projet.md, TODO.md) lorsqu'ils sont fournis. Votre but est de l'aider à utiliser et à améliorer cet outil.  
**\[FIN DU PROMPT SYSTÈME\]**

## **2\. Concepts Clés (Le Glossaire Interne)**

### **L'EGO (Le Problème Central)**

**Définition "User-Centric" :** L'Ego n'est pas (toujours) l'arrogance ("Je suis le meilleur"). C'est un **mécanisme de défense**, un besoin viscéral d'avoir raison ou une incapacité à accepter la critique. Il se cache souvent derrière le masque du "Bon Élève" ou du "Sauveur".

*Le bug principal :* Si votre identité est construite sur le fait d'être "celui qui fait tout", la moindre remarque est perçue comme une attaque personnelle (Bug critique) et non comme une demande d'amélioration (Feature request).

#### **Les 5 Formes de l'Ego :**

1. **La Défensive (Gottman) \- "L'Ego Défensif"**  
   * **Le Mécanisme :** Se justifier, contre-attaquer ou se victimiser face à une critique. Mettre sa propre douleur d'être critiqué au-dessus du besoin de l'autre.  
   * **Cas Concret (User Story) :**  
     * *Situation :* Vous venez de faire 2h de ménage. Elle rentre et dit : "Tu n'as pas rangé les chaussures."  
     * *Réaction Ego :* "C'est incroyable, je viens de tout nettoyer et toi tu vois le seul truc oublié \! Tu n'es jamais contente."  
   * **Antidote :** L'acceptation. ("Tu as raison, j'ai oublié les chaussures.")  
2. **Le Sauveur (Karpman) \- "L'Ego du Sauveur"**  
   * **Le Mécanisme :** Vouloir "réparer" le problème pour se sentir utile ou compétent, au lieu d'écouter. Le besoin d'agir prend le pas sur le besoin d'empathie de l'autre.  
   * **Cas Concret (User Story) :**  
     * *Situation :* Elle raconte une difficulté stressante au travail.  
     * *Réaction Ego :* Vous l'interrompez : "Tu devrais juste dire à ton patron que..." ou "C'est simple, fais comme ça..."  
   * **Antidote :** La Règle d'Or : **Valider avant de Solutionner**. ("Ça a l'air vraiment dur, je comprends que tu sois stressée.")  
3. **Le Martyr \- "La Comptabilité des Efforts"**  
   * **Le Mécanisme :** Utiliser ses bonnes actions comme une "monnaie d'échange" pour s'immuniser contre les reproches.  
   * **Cas Concret (User Story) :**  
     * *Situation :* Une dispute éclate sur un sujet anodin.  
     * *Réaction Ego :* "Après tout ce que je fais pour toi ? J'amène les enfants, je fais les courses... et tu me reproches ça ?"  
   * **Antidote :** Dissocier les sujets. Vos efforts passés n'annulent pas le problème présent.  
4. **Le Dernier Mot**  
   * **Le Mécanisme :** La peur de perdre la face. Prouver qu'on a *logiquement* raison, même si la relation en souffre.  
   * **Antidote :** Le silence stratégique.  
5. **Le Refus d'Influence (Gottman)**  
   * **Le Mécanisme :** Rejeter la méthode de l'autre ("N'en faire qu'à sa tête") car on la juge illogique.  
   * **Antidote :** Accepter l'influence. ("Ok, je vais le plier comme tu préfères.")

### **AUTRES CONCEPTS SYSTÉMIQUES**

* **LA DOUBLE CONTRAINTE (Bateson) :** Injonction paradoxale ("Pars \!" / "Tu m'abandonnes \!").  
  * *Solution :* Ignorer la logique contradictoire, répondre à l'émotion cachée (peur/colère).  
* **LA DETTE ÉMOTIONNELLE :** L'accumulation de "Bids for connection" manqués. La crise actuelle est la somme des 200 micro-rejets précédents.  
* **LE "PURSUER-DISTANCER" :** Plus vous poursuivez (pour régler), plus elle fuit (pour se protéger).

## **3\. Plan d'Action Analytique (Processus de Changement)**

Pour passer du mode "Exécution des tâches" au mode "Connexion émotionnelle".

### **A. Changer la Question (Reframing)**

* **Ancienne question (Task-oriented) :** "Qu'est-ce que je dois **faire** de plus ?"  
* **Nouvelle question (User-centric) :** "Comment te sens-tu écoutée quand nous ne sommes pas d'accord ?"

### **B. La Technique des "5 Pourquoi" (Root Cause Analysis)**

Quand l'ego s'active, ne pas se braquer. Se demander "Pourquoi je réagis si fort ?"

1. Est-ce parce qu'elle a raison ?  
2. Est-ce parce que je me sens "pas à la hauteur" ?  
3. Est-ce parce que je voulais être remercié ?  
   Objectif : Identifier si c'est le "Sauveur", le "Martyr" ou le "Défensif" qui parle.

### **C. Supprimer le "Oui, mais" (Bug Fix)**

C'est l'antidote absolu à l'ego.

* *Interdit :* "Oui j'ai oublié, **mais** j'ai fait la vaisselle."  
* *Requis :* "J'entends que ça t'a blessée. Désolé." (Point final).

## **4\. Ressources Externes (Bibliothèque)**

* **John Gottman :**  
  * [Les 4 Cavaliers de l'Apocalypse (dont la Défensive)](https://www.gottman.com/blog/the-four-horsemen-recognizing-criticism-contempt-defensiveness-and-stonewalling/)  
  * [4 Signs of a Huge Ego in a Relationship (Psychology Today)](https://www.google.com/search?q=https://www.psychologytoday.com/us/blog/resolution-not-conflict/201603/4-signs-huge-ego-in-relationship) \- *Article clé sur l'ego défensif.*  
* **Marshall Rosenberg (CNV) :**  
  * *Livre :* "Les mots sont des fenêtres (ou bien ce sont des murs)".  
  * *Concept :* Derrière chaque critique maladroite ("Tu as trop d'ego"), il y a un besoin non satisfait.  
* **Stephen Karpman :**  
  * [Le Triangle Dramatique](https://www.penser-et-agir.fr/triangle-de-karpman/) \- *Comprendre le piège du Sauveur.*  
* **Marsha Linehan (DBT) :**  
  * [La Validation Radicale](https://www.google.com/search?q=https://www.psychologue.net/articles/lacceptation-radicale-quest-ce-que-cest) \- *Accepter la réalité sans la juger.*