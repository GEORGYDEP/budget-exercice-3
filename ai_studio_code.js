document.addEventListener('DOMContentLoaded', () => {
    
    // --- DONNÉES (CONSTANTS) ---
    
    const REVENUE_DATA = [
        { id: "rev_salaire", label: "Revenus du travail (Salaire)", forecast: 1258, real: 1258 },
        { id: "rev_famille", label: "Allocations familiales", forecast: 224, real: 224 },
        { id: "rev_chomage", label: "Allocations chômage", forecast: 328, real: 228 },
        { id: "rev_maladie", label: "Indemnité de maladie", forecast: 0, real: 80 },
        { id: "rev_mutuelle", label: "Remboursement de mutuelle", forecast: 0, real: 150 },
        { id: "rev_total", label: "TOTAL REVENUS", forecast: 1810, real: 1940, isTotal: true },
    ];

    const EXPENSE_DATA = [
        { id: "exp_loyer", label: "Fixes — Loyer", forecast: 275, real: 275 },
        { id: "exp_energie", label: "Énergie domestique", forecast: 80, real: 78 },
        { id: "exp_comms", label: "Communications", forecast: 30, real: 49 },
        { id: "exp_assurance", label: "Assurances", forecast: 80, real: 89 },
        { id: "exp_impots", label: "Impôts", forecast: 55, real: 55 },
        { id: "exp_alim", label: "Denrées alimentaires", forecast: 800, real: 740 },
        { id: "exp_loisirs", label: "Loisirs", forecast: 50, real: 30 },
        { id: "exp_vetements", label: "Vêtements", forecast: 100, real: 127 },
        { id: "exp_sante", label: "Soins de santé", forecast: 0, real: 356 },
        { id: "exp_menage", label: "Articles ménagers durables", forecast: 100, real: 58 },
        { id: "exp_voiture", label: "Frais voiture", forecast: 140, real: 184 },
        { id: "exp_epargne", label: "Imprévus ou épargne", forecast: 100, real: 0 },
        { id: "exp_enfants", label: "Frais d'encadrement des enfants", forecast: 0, real: 110 },
        { id: "exp_total", label: "TOTAL DÉPENSES", forecast: 1810, real: 2151, isTotal: true },
    ];

    const QUIZ_QUESTIONS = [
        {
            id: 1,
            question: "D'où proviennent principalement les différences au niveau des REVENUS ?",
            options: [
                "Monsieur a eu une augmentation de salaire.",
                "Il y a moins de chômage, compensé par des indemnités maladie et un remboursement mutuelle.",
                "Les allocations familiales ont augmenté.",
                "Ils ont gagné au loto."
            ],
            correctIndex: 1,
            explanation: "Suite à l'accident, le chômage a baissé, mais les indemnités de maladie et le remboursement de la mutuelle ont compensé."
        },
        {
            id: 2,
            question: "D'où proviennent les augmentations imprévues des DÉPENSES ?",
            options: [
                "Ils ont acheté une nouvelle voiture.",
                "Le loyer a augmenté.",
                "Principalement des soins de santé et des frais de garde d'enfants non prévus.",
                "Ils sont partis en vacances aux Bahamas."
            ],
            correctIndex: 2,
            explanation: "L'accident (jambe cassée) a engendré des frais médicaux importants (356€) et des frais de garde (110€)."
        },
        {
            id: 3,
            question: "Quelle conclusion principale peut-on tirer pour le mois de novembre ?",
            options: [
                "Le budget a été parfaitement respecté.",
                "Ils ont réussi à épargner beaucoup d'argent.",
                "L'accident a modifié la nature des revenus et explosé les dépenses, créant un déficit.",
                "L'énergie a coûté beaucoup plus cher que prévu."
            ],
            correctIndex: 2,
            explanation: "Le budget réel montre un déficit (dépenses > revenus) à cause de l'accident, malgré les remboursements."
        },
        {
            id: 4,
            question: "Qu'est-ce qu'un budget prévisionnel ?",
            options: [
                "Un tableau qui reprend l'ensemble des prévisions des dépenses et recettes sur une période.",
                "Une liste de courses pour le supermarché.",
                "Le montant qu'il reste sur le compte bancaire à la fin du mois.",
                "Un document envoyé par les impôts."
            ],
            correctIndex: 0,
            explanation: "C'est un outil de planification (TABLEAU) qui estime les rentrées et sorties d'argent futures."
        }
    ];

    // --- ÉTAT DE L'APPLICATION (STATE) ---

    let currentStep = 'view_forecast'; // 'view_forecast', 'view_real', 'exercise', 'quiz', 'completed'
    
    // État Exercice
    let exerciseState = {}; // { id: { attempts: 0, correct: false, value: '' } }
    
    // État Quiz
    let currentQuestionIdx = 0;
    let quizScore = 0;
    let quizAnswered = false;
    let quizSelectedOption = null;

    // --- FONCTIONS UTILITAIRES ---

    const formatCurrency = (num) => {
        return num.toLocaleString('fr-BE', { minimumFractionDigits: 2 }) + ' €';
    };

    const normalizeInput = (val) => {
        return parseFloat(val.replace(',', '.'));
    };

    // --- RENDU PRINCIPAL ---

    const render = () => {
        renderHeader();
        const app = document.getElementById('app');
        app.innerHTML = ''; // Nettoyer le contenu

        switch(currentStep) {
            case 'view_forecast':
                renderReadOnlyBudget(app, 'forecast');
                break;
            case 'view_real':
                renderReadOnlyBudget(app, 'real');
                break;
            case 'exercise':
                renderExercise(app);
                break;
            case 'quiz':
                renderQuiz(app);
                break;
            case 'completed':
                renderCompleted(app);
                break;
        }
        
        // Réinitialiser les icônes Lucide après chaque rendu
        lucide.createIcons();
    };

    const renderHeader = () => {
        const indicator = document.getElementById('step-indicator');
        const steps = [
            { id: 'view_forecast', label: '1. Prévisionnel' },
            { id: 'view_real', label: '2. Réel' },
            { id: 'exercise', label: '3. Analyse' },
            { id: 'quiz', label: '4. Quiz' }
        ];

        let html = '';
        let foundCurrent = false;

        steps.forEach((step, index) => {
            let className = 'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ';
            
            if (currentStep === step.id) {
                className += 'step-active';
                foundCurrent = true;
            } else if (!foundCurrent && currentStep !== 'completed') {
                className += 'step-past';
            } else if (currentStep === 'completed') {
                className += 'step-past';
            } else {
                className += 'step-future';
            }

            html += `<div class="${className}">${step.label}</div>`;
            
            if (index < steps.length - 1) {
                html += `<div class="w-4 h-px bg-slate-700 self-center"></div>`;
            }
        });
        indicator.innerHTML = html;
    };

    // --- COMPOSANT : BUDGET LECTURE SEULE ---

    const renderReadOnlyBudget = (container, mode) => {
        const isForecast = mode === 'forecast';
        const title = isForecast ? "1. Le Budget Prévisionnel" : "2. Le Budget Réel (Novembre)";
        
        let introHtml = '';
        if (isForecast) {
            introHtml = `
                <div class="space-y-2 text-slate-600">
                    <p>Voici le budget prévisionnel de Monsieur et Madame Durieu pour le mois de novembre.</p>
                    <p class="font-medium bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <span class="font-bold text-indigo-700">Définition :</span> C'est un tableau qui reprend l'ensemble des <strong>PRÉVISIONS</strong> des dépenses et des recettes sur une période déterminée. Il permet de planifier à l'avance comment l'argent sera utilisé.
                    </p>
                </div>`;
        } else {
            introHtml = `
                <div class="space-y-4 text-slate-600">
                    <div class="bg-orange-50 border border-orange-200 p-4 rounded-lg text-orange-800">
                        <p class="font-bold mb-1">⚠️ L'Imprévu :</p>
                        <p>Le 03/11, Madame Durieu est victime d'un accident et se casse la jambe. Cet événement a bouleversé la situation financière de la famille.</p>
                    </div>
                    <p>Voici ce qui s'est <strong>réellement</strong> passé à la fin du mois. Certains montants ont changé par rapport aux prévisions.</p>
                </div>`;
        }

        const renderTableSection = (data, colorClass) => {
            const rows = data.map(item => {
                const value = isForecast ? item.forecast : item.real;
                return `
                    <tr class="border-b border-slate-100 ${item.isTotal ? 'bg-slate-50 font-bold border-t-2 border-slate-200' : 'hover:bg-slate-50'}">
                        <td class="px-4 py-2 text-slate-700">${item.label}</td>
                        <td class="px-4 py-2 text-right font-medium text-slate-900">${formatCurrency(value)}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div class="px-4 py-3 flex justify-between items-center ${colorClass}">
                        <h3 class="font-bold text-white uppercase tracking-wider text-sm">REVENUS</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                                <tr>
                                    <th class="px-4 py-3">Type</th>
                                    <th class="px-4 py-3 text-right">Montant ${isForecast ? 'Prévu' : 'Réel'}</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        };

        container.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <div class="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500">
                    <div class="flex items-start gap-4">
                        <div class="p-3 bg-indigo-100 rounded-full text-indigo-600 shrink-0">
                            <i data-lucide="${isForecast ? 'info' : 'alert-triangle'}" class="${!isForecast ? 'text-orange-600' : ''}"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-slate-800 mb-2">${title}</h2>
                            ${introHtml}
                        </div>
                    </div>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                    ${renderTableSection(REVENUE_DATA, 'bg-emerald-600').replace('REVENUS', 'REVENUS')}
                    ${renderTableSection(EXPENSE_DATA, 'bg-rose-600').replace('REVENUS', 'DÉPENSES')}
                </div>

                <div class="flex justify-center pt-6">
                    <button id="next-btn" class="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-3">
                        ${isForecast ? "Voir ce qui s'est passé ensuite" : "Comparer les deux budgets"}
                        <i data-lucide="arrow-right"></i>
                    </button>
                </div>
            </div>
        `;

        document.getElementById('next-btn').addEventListener('click', () => {
            currentStep = isForecast ? 'view_real' : 'exercise';
            render();
        });
    };

    // --- COMPOSANT : EXERCICE ---

    const renderExercise = (container) => {
        // Initialiser l'état de l'exercice si vide
        const totalItems = REVENUE_DATA.length + EXPENSE_DATA.length;
        if (Object.keys(exerciseState).length === 0) {
            [...REVENUE_DATA, ...EXPENSE_DATA].forEach(item => {
                exerciseState[item.id] = { attempts: 0, correct: false, value: '' };
            });
        }

        const validCount = Object.values(exerciseState).filter(s => s.correct).length;
        const isComplete = validCount === totalItems;

        const renderRow = (item, type) => {
            const state = exerciseState[item.id];
            const correctDiff = type === 'revenue' 
                ? item.real - item.forecast 
                : item.forecast - item.real;
            
            let inputClass = "w-full text-right p-1.5 text-sm border rounded outline-none transition-all ";
            if (state.correct) inputClass += "input-correct";
            else if (state.attempts > 0 && !state.correct) inputClass += "input-incorrect";
            else inputClass += "bg-white border-slate-300 focus:border-blue-400";

            const rowClass = item.isTotal ? "bg-slate-100 font-bold border-t-2 border-slate-300" : "border-b border-slate-100 hover:bg-slate-50";

            return `
                <div class="grid grid-cols-12 gap-2 p-3 items-center ${rowClass}">
                    <div class="col-span-5 text-sm text-slate-700">${item.label}</div>
                    <div class="col-span-2 text-right text-sm text-slate-500 font-medium">${formatCurrency(item.forecast)}</div>
                    <div class="col-span-2 text-right text-sm text-slate-800 font-medium">${formatCurrency(item.real)}</div>
                    <div class="col-span-3 flex items-center justify-end space-x-2 relative">
                        <input 
                            type="number" 
                            step="0.01" 
                            class="${inputClass}" 
                            placeholder="?"
                            data-id="${item.id}"
                            data-correct="${correctDiff}"
                            value="${state.value}"
                            ${state.correct ? 'disabled' : ''}
                        >
                        <div class="w-6 flex-shrink-0 flex justify-center" id="icon-${item.id}">
                            ${state.correct ? '<i data-lucide="check" class="w-5 h-5 text-green-500"></i>' : ''}
                            ${!state.correct && state.attempts >= 3 ? `<button class="help-btn text-orange-500 hover:text-orange-600" data-id="${item.id}"><i data-lucide="help-circle" class="w-5 h-5"></i></button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        };

        container.innerHTML = `
            <div class="space-y-8 animate-fade-in">
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r shadow-sm">
                    <div class="flex gap-4 items-start">
                        <div class="bg-white p-2 rounded-full shadow-sm">
                            <i data-lucide="calculator" class="w-6 h-6 text-blue-500"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-blue-900 text-lg">Consigne</h3>
                            <p className="text-blue-800">Calculez la différence pour chaque ligne.</p>
                            <ul class="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                                <li><strong>Revenus</strong> : Réel - Prévisionnel</li>
                                <li><strong>Dépenses</strong> : Prévisionnel - Réel (Positif = Économie, Négatif = Dépassement)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div class="bg-emerald-600 px-6 py-4 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-white tracking-wide">REVENUS</h2>
                    </div>
                    <div class="grid grid-cols-12 gap-2 p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div class="col-span-5 pl-2">Type</div>
                        <div class="col-span-2 text-right">Prévisionnel</div>
                        <div class="col-span-2 text-right">Réel</div>
                        <div class="col-span-3 text-right pr-12">Différence</div>
                    </div>
                    <div>${REVENUE_DATA.map(item => renderRow(item, 'revenue')).join('')}</div>
                </div>

                <div class="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div class="bg-rose-600 px-6 py-4 flex justify-between items-center">
                        <h2 class="text-xl font-bold text-white tracking-wide">DÉPENSES</h2>
                    </div>
                    <div class="grid grid-cols-12 gap-2 p-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div class="col-span-5 pl-2">Type</div>
                        <div class="col-span-2 text-right">Prévisionnel</div>
                        <div class="col-span-2 text-right">Réel</div>
                        <div class="col-span-3 text-right pr-12">Différence</div>
                    </div>
                    <div>${EXPENSE_DATA.map(item => renderRow(item, 'expense')).join('')}</div>
                </div>

                <div class="sticky bottom-6 flex justify-center z-10">
                    <div class="flex items-center gap-4 px-6 py-3 rounded-full shadow-2xl transition-all duration-300 ${isComplete ? 'bg-green-600 text-white scale-110' : 'bg-white text-gray-500 border border-gray-200'}">
                        <div class="flex flex-col items-center">
                            <span class="text-xs uppercase font-bold tracking-wider opacity-80">Progression</span>
                            <span class="font-mono font-bold text-lg">${validCount} / ${totalItems}</span>
                        </div>
                        <button id="finish-exercise-btn" ${!isComplete ? 'disabled' : ''} class="flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${isComplete ? 'bg-white text-green-700 hover:bg-green-50 shadow-md cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}">
                            Passer au Quiz <i data-lucide="arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Event Listeners pour les inputs
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.dataset.id;
                const correctVal = parseFloat(e.target.dataset.correct);
                const userVal = normalizeInput(e.target.value);

                exerciseState[id].value = e.target.value;

                if (!isNaN(userVal) && Math.abs(userVal - correctVal) < 0.1) {
                    exerciseState[id].correct = true;
                } else {
                    exerciseState[id].correct = false;
                    exerciseState[id].attempts += 1;
                }
                render(); // Re-render pour mettre à jour UI
            });
        });

        // Event Listeners pour les boutons d'aide
        container.querySelectorAll('.help-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const item = [...REVENUE_DATA, ...EXPENSE_DATA].find(i => i.id === id);
                const type = REVENUE_DATA.find(i => i.id === id) ? 'revenue' : 'expense';
                const correctDiff = type === 'revenue' ? item.real - item.forecast : item.forecast - item.real;

                exerciseState[id].value = correctDiff.toFixed(2).replace('.', ',');
                exerciseState[id].correct = true;
                render();
            });
        });

        const finishBtn = document.getElementById('finish-exercise-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => {
                currentStep = 'quiz';
                render();
            });
        }
    };

    // --- COMPOSANT : QUIZ ---

    const renderQuiz = (container) => {
        const currentQ = QUIZ_QUESTIONS[currentQuestionIdx];
        const isLastQuestion = currentQuestionIdx === QUIZ_QUESTIONS.length - 1;

        const renderOptions = () => {
            return currentQ.options.map((option, idx) => {
                let itemClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group mb-3 ";
                
                if (quizAnswered) {
                    if (idx === currentQ.correctIndex) {
                        itemClass += "border-green-500 bg-green-50 text-green-800";
                    } else if (idx === quizSelectedOption) {
                        itemClass += "border-red-500 bg-red-50 text-red-800";
                    } else {
                        itemClass += "border-gray-100 text-gray-400 opacity-50";
                    }
                } else {
                    itemClass += "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700";
                }

                return `
                    <button class="quiz-option-btn ${itemClass}" data-idx="${idx}" ${quizAnswered ? 'disabled' : ''}>
                        <span class="font-medium">${option}</span>
                        ${quizAnswered && idx === currentQ.correctIndex ? '<i data-lucide="check-circle-2" class="text-green-500"></i>' : ''}
                        ${quizAnswered && idx === quizSelectedOption && idx !== currentQ.correctIndex ? '<i data-lucide="x-circle" class="text-red-500"></i>' : ''}
                    </button>
                `;
            }).join('');
        };

        container.innerHTML = `
            <div class="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in">
                <div class="bg-indigo-600 p-6 text-white flex justify-between items-center">
                    <h2 class="text-2xl font-bold flex items-center gap-2"><i data-lucide="award"></i> Quiz Final</h2>
                    <span class="text-sm font-medium bg-indigo-500 px-3 py-1 rounded-full">Question ${currentQuestionIdx + 1} / ${QUIZ_QUESTIONS.length}</span>
                </div>

                <div class="p-8">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">${currentQ.question}</h3>
                    <div class="space-y-4">
                        ${renderOptions()}
                    </div>

                    ${quizAnswered ? `
                        <div class="mt-8 animate-fade-in">
                            <div class="p-4 rounded-lg mb-6 ${quizSelectedOption === currentQ.correctIndex ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}">
                                <p class="font-semibold mb-1">${quizSelectedOption === currentQ.correctIndex ? "Excellent !" : "Pas tout à fait..."}</p>
                                <p class="text-sm opacity-90">${currentQ.explanation}</p>
                            </div>
                            <button id="quiz-next-btn" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                                ${isLastQuestion ? "Terminer l'exercice" : "Question Suivante"} <i data-lucide="chevron-right"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Logic click options
        container.querySelectorAll('.quiz-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (quizAnswered) return;
                const idx = parseInt(e.currentTarget.dataset.idx);
                quizSelectedOption = idx;
                quizAnswered = true;
                if (idx === currentQ.correctIndex) quizScore++;
                render();
            });
        });

        // Logic next button
        const nextBtn = document.getElementById('quiz-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (isLastQuestion) {
                    currentStep = 'completed';
                } else {
                    currentQuestionIdx++;
                    quizSelectedOption = null;
                    quizAnswered = false;
                }
                render();
            });
        }
    };

    // --- COMPOSANT : FIN ---

    const renderCompleted = (container) => {
        container.innerHTML = `
            <div class="text-center space-y-8 animate-fade-in pt-12">
                <div class="inline-flex items-center justify-center p-8 bg-green-100 rounded-full mb-4 ring-8 ring-green-50 shadow-xl">
                    <i data-lucide="party-popper" class="w-24 h-24 text-green-600"></i>
                </div>
                
                <h2 class="text-4xl font-extrabold text-slate-900">Exercice Terminé !</h2>
                <p class="text-xl text-slate-600 max-w-lg mx-auto">
                    Bravo, vous avez analysé avec succès l'impact d'un imprévu sur un budget familial et compris l'importance de l'épargne de précaution.
                </p>

                <button id="restart-btn" class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
                    <i data-lucide="rotate-ccw"></i> Recommencer l'exercice
                </button>
            </div>
        `;

        document.getElementById('restart-btn').addEventListener('click', () => {
            currentStep = 'view_forecast';
            exerciseState = {};
            currentQuestionIdx = 0;
            quizScore = 0;
            quizAnswered = false;
            quizSelectedOption = null;
            render();
        });
    };

    // --- INITIALISATION ---
    render();
});