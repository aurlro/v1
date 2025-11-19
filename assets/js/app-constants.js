/**
 * App Constants - Configuration centralisée
 * Toutes les constantes de l'application
 */

const STORAGE_KEYS = {
    theme: 'boite-outils-theme',
    lastPage: 'boite-outils-last-page',
    aiProvider: 'boite-outils-ai-provider', // 'gemini', 'ollama', or 'heuristic'
};

const GEMINI_STORAGE_KEYS = {
    encryptedKey: 'gemini.key.v1',
    secret: 'gemini.secret.v1',
    cooldown: 'gemini.cooldown.v1',
};

const OLLAMA_STORAGE_KEYS = {
    endpoint: 'ollama.endpoint.v1',
    model: 'ollama.model.v1',
};

const GEMINI_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const OLLAMA_DEFAULTS = {
    endpoint: 'http://localhost:11434',
    model: 'llama3.2',
};

const COOLDOWN_DEFAULTS = {
    defaultMs: 60000, // 1 minute
    timestampThreshold: 1000000000000, // Unix timestamp in milliseconds threshold
};

const GEMINI_SYSTEM_PROMPT = `Tu es un Coach & Analyste en communication de crise interpersonnelle.
Ton utilisateur est un Product Owner / Business Analyst en crise personnelle.
Ton rôle :
1. Valider l émotion exprimée.
2. Diagnostiquer l ego dominant (Défensive, Sauveur, Martyr, Dernier Mot, Refus d influence).
3. Identifier le besoin sous-jacent (user story).
4. Proposer plusieurs scripts, chacun avec un objectif stratégique clair (désescalade, poser une limite, alignement produit).
Format de réponse STRICT : JSON avec les clés suivantes :
{
  "meta": "phrase courte résumant le niveau de tension",
  "takeaways": ["liste d insights actionnables"],
  "options": [
    { "objective": "Objectif stratégique", "script": "Script complet, ton validant" }
  ]
}`;
