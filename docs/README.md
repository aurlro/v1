# Boîte à Outils de Communication (Locale)

Ce projet est une application web locale ("Single Page Application") conçue pour l'analyse et la gestion de conflits interpersonnels. Elle fonctionne sans serveur, directement dans le navigateur.

## 🚀 Comment lancer le projet

### Option 1 : La méthode simple
1. Ouvrez le dossier du projet.
2. Double-cliquez sur le fichier `index.html`.
3. C'est tout !

### Option 2 : La méthode "Vibe Coding" (Recommandée)
Pour une expérience de développement fluide :
1. Ouvrez ce dossier avec **VS Code** (ou Cursor).
2. Installez l'extension **"Live Server"**.
3. Faites un clic droit sur `index.html` -> "Open with Live Server".
4. Chaque modification dans le code rechargera automatiquement la page.

## 📂 Structure
* `index.html` : Le squelette de l'application.
* `assets/css/styles.css` : Les styles spécifiques (en plus de Tailwind).
* `assets/js/app.js` : Toute la logique (Journal, IA, Navigation).

## 🔑 Clé API (Important)
Pour que l'Analyseur IA fonctionne, vous devez insérer votre clé API Gemini dans le fichier `assets/js/app.js` à la ligne `const API_KEY = "..."`.

## 🛠 Stack Technique
* HTML5
* Tailwind CSS (via CDN)
* Vanilla JavaScript (ES6)
* LocalStorage (pour la sauvegarde des données)