/**
 * Onboarding Module - Bienvenue et tutoriel pour nouveaux utilisateurs
 */

function createOnboardingModule({ modal, toast }) {
    const ONBOARDING_STORAGE_KEY = 'boite-outils-onboarding-done';
    const ONBOARDING_VERSION = '1.0';

    /**
     * Vérifie si le onboarding a déjà été affiché
     */
    function hasCompletedOnboarding() {
        try {
            const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
            return stored === ONBOARDING_VERSION;
        } catch {
            return false;
        }
    }

    /**
     * Marque le onboarding comme complété
     */
    function markOnboardingComplete() {
        try {
            localStorage.setItem(ONBOARDING_STORAGE_KEY, ONBOARDING_VERSION);
        } catch (e) {
            console.debug('Impossible de sauvegarder le statut onboarding');
        }
    }

    /**
     * Affiche le onboarding
     */
    function show() {
        const steps = [
            {
                emoji: '👋',
                title: 'Bienvenue à la Boîte à Outils!',
                description: 'Cet outil t\'aide à analyser et améliorer ta communication interpersonnelle.',
                tips: [
                    '💡 Tu vas apprendre à reconnaître tes patterns relationnels',
                    '🧗 Entraîne-toi dans le Dojo avec des scénarios réalistes',
                    '📊 Suivi ton évolution avec le Journal'
                ]
            },
            {
                emoji: '🚀',
                title: 'Trois façons d\'analyser',
                description: 'Choisis l\'approche qui te convient:',
                tips: [
                    '⚡ Analyse Rapide: Une réponse immédiate',
                    '📝 Analyse Guidée: Un processus structuré en 4 étapes',
                    '🤖 Analyse IA: Utilise Gemini ou Ollama pour des conseils avancés'
                ]
            },
            {
                emoji: '🎯',
                title: 'Le Dojo: Entraîne-toi sans risque',
                description: 'Maîtrise tes réactions dans des situations réalistes.',
                tips: [
                    '👀 Observe: Comprends tes patterns d\'ego',
                    '🛡️ Identifie: Les 5 types d\'ego reconnaissables',
                    '💪 Maîtrise: Développe des réponses conscientes'
                ]
            },
            {
                emoji: '📔',
                title: 'Ton Journal Personnel',
                description: 'Sauvegarde tes analyses et suivi ton progrès.',
                tips: [
                    '✍️ Chaque analyse est sauvegardée automatiquement',
                    '📈 Suivi tes patterns sur le temps',
                    '💾 Exporte tes données en JSON'
                ]
            }
        ];

        const stepsHtml = steps.map((step, idx) => `
            <div class="space-y-3 mb-6 pb-6 border-b border-slate-300 dark:border-slate-600 last:border-b-0">
                <div class="flex items-start gap-3">
                    <span class="text-3xl">${step.emoji}</span>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100">${step.title}</h3>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">${step.description}</p>
                        <ul class="mt-3 space-y-2">
                            ${step.tips.map(tip => `
                                <li class="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <span class="text-cyan-500">→</span>
                                    ${tip}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `).join('');

        const html = `
            <div class="space-y-6">
                <div class="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-6 border-l-4 border-cyan-500">
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">🌟 Bienvenue!</h2>
                    <p class="text-slate-700 dark:text-slate-300">
                        Prends quelques minutes pour découvrir comment cet outil peut transformer ta communication.
                    </p>
                </div>

                <div class="max-h-96 overflow-y-auto pr-3">
                    ${stepsHtml}
                </div>

                <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                    <h4 class="font-semibold text-slate-900 dark:text-slate-100 mb-2">🎓 Conseil pour bien commencer:</h4>
                    <p class="text-sm text-slate-700 dark:text-slate-300">
                        Commence par l'<strong>Analyse Rapide</strong> avec une situation actuelle.
                        Ensuite, explore le <strong>Dojo</strong> pour mieux comprendre tes patterns.
                    </p>
                </div>
            </div>
        `;

        modal.show({
            targetId: 'onboarding-modal',
            title: '🚀 Bienvenue à la Boîte à Outils!',
            html,
            actions: [
                {
                    label: 'Commencer',
                    variant: 'primary',
                    onClick: () => {
                        markOnboardingComplete();
                        modal.hide('onboarding-modal');
                        toast.success('Prêt à commencer ? Bonne chance! 🚀');
                    }
                }
            ]
        });
    }

    /**
     * Affiche le onboarding au premier lancement si nécessaire
     */
    function showIfNeeded() {
        if (!hasCompletedOnboarding()) {
            // Délai court pour laisser l'UI se charger
            setTimeout(show, 500);
        }
    }

    /**
     * Force l'affichage du onboarding (utile pour les tests ou liens de help)
     */
    function reset() {
        try {
            localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        } catch {
            console.debug('Impossible de réinitialiser le onboarding');
        }
    }

    return { show, showIfNeeded, reset, hasCompletedOnboarding, markOnboardingComplete };
}
