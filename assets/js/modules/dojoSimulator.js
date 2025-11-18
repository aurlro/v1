/**
 * Dojo Simulator - Interactive Training for Ego-Aware Communication
 * Simulates real scenarios and provides immediate feedback
 */

function createDojoSimulator({ modal, toast }) {
    let currentScenario = null;
    let scenarioProgress = {
        completed: [],
        scores: {},
    };

    const SCENARIOS = [
        {
            id: 'defensive-1',
            ego: 'La Défensive',
            egoEmoji: '🛡️',
            title: 'Ton boss critique ton travail',
            situation:
                'Lors du standup, ton lead dit : "Ce code n\'est pas clean. Il y a trop de répétitions."',
            context:
                "Tu as passé 6h sur cette feature et tu le savais - c'est ton premier refactoring major.",
            instinctiveResponse:
                'Tu dis : "C\'est normal que ce soit un peu brouillon au premier pass. Et de toute façon, c\'est juste des refactoring, ça marche quand même."',
            feedback: {
                color: 'danger',
                title: '❌ La Défensive a pris les rênes',
                analysis: [
                    'Tu justifies au lieu d\'écouter (premier signe)',
                    '"C\'est normal" = minimisation du feedback',
                    '"de toute façon" = contre-attaque passive',
                    'Résultat : Lead pense que tu refuses le feedback',
                ],
                antidote:
                    'Pause. Respire. Puis : "Je vois. Tu me dis que le code a des répétitions à refactorer. Tu peux me montrer ce que tu veux dire ?"',
                score: 20,
            },
            betterResponses: [
                {
                    response:
                        'Tu dis : "Entendu. Merci pour le feedback. Tu veux que je refactorise avant de merger ou après ?"',
                    score: 85,
                    reason: 'Accepte le feedback, demande clarification, agis.',
                },
                {
                    response:
                        'Tu dis : "D\'accord. Combien de temps tu penses que c\'est ?"',
                    score: 75,
                    reason: 'Écoutes et cherches à comprendre sans te défendre.',
                },
            ],
        },
        {
            id: 'savior-1',
            ego: 'Le Sauveur',
            egoEmoji: '🦸',
            title: 'Ton pote a un problème relationnel',
            situation:
                'Ton pote texte : "J\'ai un problème avec mon appart. Mon coloc me stresse, y a des trucs pas clairs..."',
            context:
                "Vous vous connaissez depuis longtemps. D'habitude, tu lui donnes toujours des conseils et ça le soulage.",
            instinctiveResponse:
                'Tu dis : "Écoute, voici ce que tu dois faire : (1) parle-lui demain soir, (2) dis-lui que ça doit changer, (3) si ça marche pas, tu cherches un autre appart. Crois-moi, c\'est comme ça qu\'on gère."',
            feedback: {
                color: 'danger',
                title: '❌ Le Sauveur a volé la vedette',
                analysis: [
                    'Tu proposes une solution avant d\'écouter',
                    'Pas de question, pas de curiosité',
                    'Il n\'a pas besoin de tes solutions - il a besoin d\'être écouté',
                    'Résultat : Il se sent pas vraiment entendu',
                ],
                antidote:
                    'Pause. Puis : "Dis-moi plus. Que sont ces trucs pas clairs ? Comment ça te met le stress ?"',
                score: 25,
            },
            betterResponses: [
                {
                    response:
                        'Tu dis : "Je t\'écoute. C\'est quoi exactement le problème avec ton coloc ?"',
                    score: 90,
                    reason: 'Validation + curiosité. Laissse-le parler en premier.',
                },
                {
                    response:
                        'Tu dis : "Okay, ça a l\'air compliqué. Qu\'est-ce que tu aimerais faire ?"',
                    score: 80,
                    reason: 'Montres que tu comprends, puis demandes son point de vue.',
                },
            ],
        },
        {
            id: 'martyr-1',
            ego: 'Le Martyr',
            egoEmoji: '😔',
            title: 'Ta team dit "non" à ta suggestion',
            situation:
                'En réunion, tu proposes une optimisation. Un collègue dit : "C\'est trop complexe pour le gain. On passe."',
            context:
                "Tu as passé le week-end à l'analyser. Personne n'apprécie jamais tes efforts.",
            instinctiveResponse:
                'Tu dis : "D\'accord. De toute façon, j\'ai déjà donné mon max. C\'est bon, je vais m\'en aller. Mais regardez, dans 3 mois, on aura des problèmes de performance et là vous allez comprendre."',
            feedback: {
                color: 'danger',
                title: '❌ Le Martyr fait du théâtre',
                analysis: [
                    'Tu dramatises : "j\'ai déjà donné mon max"',
                    'Menace voilée : "dans 3 mois..."',
                    'Pas d\'écoute du rejet - seulement de la victimisation',
                    'Résultat : Les gens se sentent culpabilisés, pas convaincus',
                ],
                antidote:
                    'Respire. Puis : "D\'accord. Mais aide-moi à comprendre : pourquoi tu penses que c\'est trop complexe ? Quel gain te semblerait suffisant ?"',
                score: 20,
            },
            betterResponses: [
                {
                    response:
                        'Tu dis : "Entendu. Tu penses que le gain ne vaut pas la complexité. On verra dans 3 mois si les problèmes arrivent."',
                    score: 85,
                    reason: 'Acceptes la décision sans jouer la victime.',
                },
                {
                    response:
                        'Tu dis : "D\'accord. Qu\'est-ce que ça prendrait pour que vous soyez d\'accord ?"',
                    score: 75,
                    reason: 'Cherches les vraies conditions, pas le pity.',
                },
            ],
        },
        {
            id: 'lastword-1',
            ego: 'Le Dernier Mot',
            egoEmoji: '🎤',
            title: 'Débat sur la techno à choisir',
            situation:
                'En standup, le tech lead dit : "On va utiliser React pour le nouveau projet." Tu réponds tout de suite :',
            context:
                "Tu penses que Vue serait mieux. C'est une conviction que tu as depuis longtemps.",
            instinctiveResponse:
                'Tu dis : "Non, React c\'est dead. Vue c\'est clairement mieux. Les chiffres le montrent. Je suis sûr que tu vas le regretter."',
            feedback: {
                color: 'danger',
                title: '❌ Le Dernier Mot veut gagner',
                analysis: [
                    'Tu contredis directement, pas de dialogue',
                    '"c\'est dead" = jugement, pas argument',
                    '"Je suis sûr" = ton autoritaire, pas collaboratif',
                    'Résultat : Le lead se sent dévalué publiquement',
                ],
                antidote:
                    'Pause. Puis : "J\'ai une inquiétude : comment tu vois la courbe d\'apprentissage ? Est-ce qu\'on a du temps ?"',
                score: 15,
            },
            betterResponses: [
                {
                    response:
                        'Tu dis : "Pourquoi tu as choisi React plutôt que Vue ? Je suis curieux de ta logique."',
                    score: 90,
                    reason: 'Curiosité avant conviction. Comprendre avant convaincre.',
                },
                {
                    response:
                        'Tu dis : "D\'accord. Après le standup, j\'aimerais te montrer quelques benchmarks si ça te dit."',
                    score: 80,
                    reason: 'Respectes la décision, proposes une conversation privée.',
                },
            ],
        },
        {
            id: 'resistance-1',
            ego: "Le Refus d'influence",
            egoEmoji: '🚫',
            title: 'Un ami te fait une suggestion',
            situation:
                'Tu dis à ton ami que tu veux changer de job. Il te dit : "Tu devrais essayer la mentalité de startup plutôt que de sauter ship."',
            context:
                "Tu en as déjà parlé 10 fois. C'est TON choix, pas le sien.",
            instinctiveResponse:
                'Tu dis : "Ça ne te regarde pas. J\'ai pas besoin de ton avis. Je sais ce que je fais."',
            feedback: {
                color: 'danger',
                title: '❌ Le Refus bloque tout',
                analysis: [
                    'Tu fermes la porte au dialogue',
                    '"Ça ne te regarde pas" = tu le rejettes',
                    'Tu assumes qu\'il veut te contrôler (peut-être pas vrai)',
                    'Résultat : Relation devient adversaire',
                ],
                antidote:
                    'Prends une pause. Puis : "J\'apprécie que tu penses à moi. Mais là, j\'ai besoin de tester ma façon. On reverra ensemble dans 6 mois ?"',
                score: 25,
            },
            betterResponses: [
                {
                    response:
                        'Tu dis : "Je comprends ton avis. Mais je veux vraiment tester cette approche. Donne-moi 6 mois, après on peut en reparler."',
                    score: 85,
                    reason: 'Respectes son intention, firmes sur ta décision.',
                },
                {
                    response:
                        'Tu dis : "Cool perspective. Pour moi, là c\'est important d\'essayer la startup. On verra comment ça va."',
                    score: 80,
                    reason: 'Acceptes l\'avis sans le rejeter, ni te soumettre.',
                },
            ],
        },
    ];

    /**
     * Démarre un scénario
     */
    function startScenario(scenarioId) {
        currentScenario = SCENARIOS.find((s) => s.id === scenarioId);
        if (!currentScenario) return;

        renderScenarioModal();
    }

    /**
     * Rend la modal du scénario
     */
    function renderScenarioModal() {
        if (!currentScenario) return;

        const { ego, egoEmoji, title, situation, context, instinctiveResponse, feedback, betterResponses } =
            currentScenario;

        const html = `
            <div class="dojo-scenario space-y-6">
                <!-- Ego Badge -->
                <div class="dojo-ego-badge" style="border-left: 4px solid var(--accent-warning);">
                    <span class="dojo-ego-emoji">${egoEmoji}</span>
                    <div>
                        <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">L'ego actif :</p>
                        <p class="text-lg font-bold text-slate-900 dark:text-slate-100">${ego}</p>
                    </div>
                </div>

                <!-- Scenario Setup -->
                <div class="dojo-scenario-setup space-y-3">
                    <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100">${title}</h3>
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p class="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📍 La situation :</p>
                        <p class="text-blue-800 dark:text-blue-200">${situation}</p>
                    </div>
                    <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <p class="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">🎭 Contexte émotionnel :</p>
                        <p class="text-purple-800 dark:text-purple-200">${context}</p>
                    </div>
                </div>

                <!-- Instinctive Response -->
                <div class="dojo-instinctive space-y-3">
                    <h4 class="text-lg font-bold text-slate-900 dark:text-slate-100">
                        🤖 Ta réponse instinctive (sous ego) :
                    </h4>
                    <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
                        <p class="italic text-red-800 dark:text-red-200">
                            "${instinctiveResponse}"
                        </p>
                    </div>
                </div>

                <!-- Feedback Section -->
                <div class="dojo-feedback space-y-3">
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p class="font-bold text-red-900 dark:text-red-100 mb-2">${feedback.title}</p>
                        <ul class="space-y-1 text-sm text-red-800 dark:text-red-200">
                            ${feedback.analysis.map((item) => `<li>• ${item}</li>`).join('')}
                        </ul>
                    </div>

                    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p class="font-bold text-yellow-900 dark:text-yellow-100 mb-2">💊 L'antidote :</p>
                        <p class="text-yellow-800 dark:text-yellow-200">"${feedback.antidote}"</p>
                    </div>
                </div>

                <!-- Better Responses -->
                <div class="dojo-better-responses space-y-3">
                    <h4 class="text-lg font-bold text-slate-900 dark:text-slate-100">
                        ✨ Réponses plus alignées (sans ego) :
                    </h4>
                    ${betterResponses
                        .map(
                            (resp, idx) => `
                        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div class="flex justify-between items-start gap-2 mb-2">
                                <p class="text-sm font-bold text-green-900 dark:text-green-100">
                                    Option ${idx + 1} (Score: ${resp.score}/100)
                                </p>
                                <span class="text-lg">${Array(Math.floor(resp.score / 20))
                                    .fill('⭐')
                                    .join('')}</span>
                            </div>
                            <p class="italic text-green-800 dark:text-green-200 mb-2">
                                "${resp.response}"
                            </p>
                            <p class="text-xs text-green-700 dark:text-green-300">
                                💡 Pourquoi : ${resp.reason}
                            </p>
                        </div>
                    `,
                        )
                        .join('')}
                </div>

                <!-- Key Learning -->
                <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 border-l-4 border-accent-primary">
                    <p class="font-bold text-slate-900 dark:text-slate-100 mb-2">🎯 Clé d'apprentissage :</p>
                    <p class="text-sm text-slate-700 dark:text-slate-300">
                        ${getKeyLearning(currentScenario.ego)}
                    </p>
                </div>
            </div>
        `;

        modal.show({
            targetId: 'dojo-modal',
            title: `🧗 Dojo : Entraînement ${currentScenario.egoEmoji}`,
            html,
            actions: [
                {
                    label: 'Scénario suivant',
                    variant: 'primary',
                    onClick: () => {
                        const currentIndex = SCENARIOS.findIndex((s) => s.id === currentScenario.id);
                        if (currentIndex < SCENARIOS.length - 1) {
                            startScenario(SCENARIOS[currentIndex + 1].id);
                        } else {
                            showProgressSummary();
                        }
                    },
                },
                {
                    label: 'Menu Dojo',
                    onClick: () => showDojoMenu(),
                },
            ],
        });
    }

    /**
     * Affiche le menu principal du dojo
     */
    function showDojoMenu() {
        const scenariosList = SCENARIOS.map(
            (scenario) => `
                <button type="button" class="dojo-scenario-button" data-scenario-id="${scenario.id}">
                    <span class="dojo-scenario-emoji">${scenario.egoEmoji}</span>
                    <div class="dojo-scenario-info">
                        <p class="font-semibold">${scenario.ego}</p>
                        <p class="text-sm text-slate-600 dark:text-slate-400">${scenario.title}</p>
                    </div>
                </button>
            `,
        ).join('');

        const html = `
            <div class="space-y-4">
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p class="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Bienvenue au Dojo ! 🧗</strong><br>
                        Ici, tu peux t'entraîner dans des situations réelles sans risque.
                        Chaque scénario te montre ta réponse instinctive (sous ego),
                        puis te propose des alternatives plus alignées.
                    </p>
                </div>

                <div class="dojo-menu space-y-3">
                    ${scenariosList}
                </div>

                <p class="text-xs text-slate-500 dark:text-slate-400 italic">
                    Tip: Complète tous les scénarios pour renforcer tes nouveaux automatismes 🚀
                </p>
            </div>
        `;

        modal.show({
            targetId: 'dojo-modal',
            title: '🧗 Dojo : Choisir un scénario d\'entraînement',
            html,
            actions: [
                {
                    label: 'Fermer',
                    onClick: () => modal.hide('dojo-modal'),
                },
            ],
        });

        // Attach event listeners
        setTimeout(() => {
            document.querySelectorAll('[data-scenario-id]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    startScenario(btn.getAttribute('data-scenario-id'));
                });
            });
        }, 0);
    }

    /**
     * Affiche un résumé de progression
     */
    function showProgressSummary() {
        const completed = SCENARIOS.length;
        const html = `
            <div class="space-y-4">
                <div class="text-center space-y-2">
                    <p class="text-4xl">🎉</p>
                    <h3 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Dojo complété !
                    </h3>
                    <p class="text-slate-600 dark:text-slate-400">
                        Tu as traversé les 5 egos principaux. C'est un excellent entraînement !
                    </p>
                </div>

                <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                    <p class="font-bold text-green-900 dark:text-green-100">✅ Scénarios complétés: ${completed}/5</p>
                    <p class="text-sm text-green-800 dark:text-green-200">
                        Chaque ego a été rencontré. Ton cerveau a maintenant de nouveaux patterns à utiliser.
                    </p>
                </div>

                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p class="font-bold text-blue-900 dark:text-blue-100 mb-2">💡 Prochaines étapes :</p>
                    <ul class="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                        <li>✓ Réfléchis aux scénarios de ta vie réelle</li>
                        <li>✓ Prépare tes réponses AVANT les situations stressantes</li>
                        <li>✓ Reviens au Dojo si tu as besoin d'un refresh</li>
                        <li>✓ Enregistre tes analyses dans le journal</li>
                    </ul>
                </div>
            </div>
        `;

        modal.show({
            targetId: 'dojo-modal',
            title: '🏁 Bravo !',
            html,
            actions: [
                {
                    label: 'Recommencer le Dojo',
                    variant: 'primary',
                    onClick: () => showDojoMenu(),
                },
                {
                    label: 'Fermer',
                    onClick: () => modal.hide('dojo-modal'),
                },
            ],
        });
    }

    /**
     * Retourne un apprentissage clé par ego
     */
    function getKeyLearning(ego) {
        const learnings = {
            'La Défensive':
                'Quand tu te défends, tu bloques l\'écoute. Plutôt : accepte le feedback d\'abord, puis demande clarification.',
            'Le Sauveur':
                'Donner des solutions avant d\'écouter, c\'est ignorer le vrai besoin. D\'abord valider, ensuite co-construire.',
            'Le Martyr':
                'Se sacrifier n\'est pas vertu - c\'est controlant. Traite chaque sujet indépendamment, sans comptabilité.',
            'Le Dernier Mot':
                'Gagner le débat perd la relation. Curiosité avant conviction. Comprendre avant convaincre.',
            "Refus d'influence":
                'Rejeter tout conseil crée l\'isolement. Respecte ta décision ET la sagesse des autres. C\'est possible.',
        };
        return learnings[ego] || 'Continue à pratiquer !';
    }

    // Public API
    return {
        open: showDojoMenu,
        startScenario,
    };
}
