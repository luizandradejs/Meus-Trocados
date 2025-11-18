document.addEventListener('DOMContentLoaded', () => {

    // ================== SELETORES DE ELEMENTOS ==================
    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    // --- Elementos de Layout/Mobile ---
    const sidebar = document.getElementById('sidebar'); 
    const menuToggle = document.getElementById('menu-toggle'); 
    const mainContent = document.querySelector('.main-content'); // NOVO para fechar o menu ao clicar no conteúdo

    // --- Elementos do Painel ---
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const currentBalanceEl = document.getElementById('current-balance');
    const recentList = document.getElementById('recent-transactions-list');
    const emptyRecentState = document.getElementById('empty-recent-state');

    // --- Elementos do Extrato ---
    const allList = document.getElementById('all-transactions-list');
    const emptyAllState = document.getElementById('empty-all-state');
    const categoryFilter = document.getElementById('category-filter'); 
    
    // --- Elementos de Gráficos (Canvas) --- (NOVO)
    const categoryChartCanvas = document.getElementById('categoryChart');
    const flowChartCanvas = document.getElementById('flowChart');
    const emptyChartCategory = document.getElementById('empty-chart-category');
    const emptyChartFlow = document.getElementById('empty-chart-flow');
    
    // Variáveis globais para instâncias do Chart.js
    let categoryChartInstance = null;
    let flowChartInstance = null;
    
    // --- Elementos de Transação (Modal) ---
    const transactionModal = document.getElementById('transaction-modal');
    const openModalBtn = document.getElementById('open-transaction-modal');
    const closeModalBtn = document.getElementById('close-transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const transactionTypeRadios = document.querySelectorAll('input[name="type"]');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category');

    // --- Elementos de Tema ---
    const themeToggle = document.getElementById('theme-toggle');

    // --- Elementos de Metas (Economias) ---
    const goalsList = document.getElementById('goals-list');
    const emptyGoalsState = document.getElementById('empty-goals-state');
    const openGoalModalBtn = document.getElementById('open-goal-modal');
    const closeGoalModalBtn = document.getElementById('close-goal-modal');
    const goalModal = document.getElementById('goal-modal');
    const goalForm = document.getElementById('goal-form');
    const goalNameInput = document.getElementById('goal-name');
    const goalTargetInput = document.getElementById('goal-target');
    const goalCurrentAmountInput = document.getElementById('goal-current-amount');

    // --- Modal de Gerenciamento de Metas ---
    const manageGoalModal = document.getElementById('manage-goal-modal');
    const closeManageGoalModalBtn = document.getElementById('close-manage-goal-modal');
    const manageGoalForm = document.getElementById('manage-goal-form');
    const manageGoalTitle = document.getElementById('manage-goal-title');
    const manageGoalIdInput = document.getElementById('manage-goal-id');
    const manageGoalAmountInput = document.getElementById('manage-goal-amount');

    // --- Modal de Histórico de Meta ---
    const historyModal = document.getElementById('history-modal');
    const closeHistoryModalBtn = document.getElementById('close-history-modal');
    const historyListContent = document.getElementById('history-list-content');
    const historyModalTitle = document.getElementById('history-modal-title');


    // ================== ARMAZENAMENTO DE DADOS (LOCAL STORAGE) ==================

    let transactions = JSON.parse(localStorage.getItem('meus-trocados-transactions')) || [];
    let goals = JSON.parse(localStorage.getItem('meus-trocados-goals')) || [];
    let userName = localStorage.getItem('meus-trocados-username') || 'Colega';

    const saveTransactions = () => {
        localStorage.setItem('meus-trocados-transactions', JSON.stringify(transactions));
    };

    const saveGoals = () => {
        localStorage.setItem('meus-trocados-goals', JSON.stringify(goals));
    };

    // ================== FUNÇÕES DE FORMATAÇÃO ==================

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };
    
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('pt-BR', options);
    };
    
    // Função utilitária para obter a cor de fundo do tema
    const getBgContent = () => {
        return getComputedStyle(document.body).getPropertyValue('--bg-content').trim();
    };

    // ================== FUNÇÕES DE NOME E SAUDAÇÃO ==================

    const askForName = () => {
        if (userName === 'Colega') {
            const name = prompt("Olá! Qual é o seu nome?");
            if (name && name.trim() !== "") {
                userName = name.trim();
                localStorage.setItem('meus-trocados-username', userName);
            }
        }
    };

    const updateGreeting = () => {
        const activePageId = document.querySelector('.page.active').id;

        if (activePageId === 'painel') {
            pageTitle.textContent = `Oi, ${userName}!`;
            pageSubtitle.textContent = `Bem-vindo(a) de volta ao seu painel financeiro.`;
        } else if (activePageId === 'economias') {
            pageTitle.textContent = `Orçamentos`;
            pageSubtitle.textContent = `Gerencie suas metas de gastos mensais.`;
        } else if (activePageId === 'extrato') {
            pageTitle.textContent = `Extrato de Transações`;
            pageSubtitle.textContent = `Veja o histórico completo de suas movimentações.`;
        } else if (activePageId === 'graficos') {
            pageTitle.textContent = `Dashboard`;
            pageSubtitle.textContent = `Análise visual de suas receitas e despesas.`;
        }
    };
    
    // Função para alterar o nome através do clique no título
    const handleNameClick = () => {
        const newName = prompt(`Olá, ${userName}! Qual é o novo nome que você gostaria de usar?`);
        if (newName && newName.trim() !== "") {
            userName = newName.trim();
            localStorage.setItem('meus-trocados-username', userName);
            updateGreeting();
        }
    };


    // ================== FUNÇÕES DE TRANSAÇÕES ==================

    const calculateSummary = () => {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const currentBalance = totalIncome - totalExpense;

        return { totalIncome, totalExpense, currentBalance };
    };

    const renderTransactionList = (listElement, data, max = Infinity, showDelete = true) => {
        listElement.innerHTML = '';

        if (data.length === 0) {
            listElement.innerHTML = '';
            // Usa o seletor mais genérico para suportar todos os .content-block
            const emptyState = listElement.parentNode.querySelector('.empty-state');
            if (emptyState) emptyState.classList.add('show');
            return;
        }

        const emptyState = listElement.parentNode.querySelector('.empty-state');
        if (emptyState) emptyState.classList.remove('show');
        
        data.slice(0, max).forEach(t => {
            const li = document.createElement('li');
            li.dataset.id = t.id;
            
            const iconClass = t.type === 'income' ? 'ph-arrow-circle-up' : 'ph-arrow-circle-down';
            const typeClass = t.type === 'income' ? 'income' : 'expense';
            const dateAndCategory = `${t.category} - ${formatDate(t.date)}`; // Texto para mobile

            li.innerHTML = `
                <div class="list-icon ${typeClass}">
                    <i class="ph ${iconClass}"></i>
                </div>
                <div class="list-description">
                    <span>${t.description}</span>
                    <small>${dateAndCategory}</small> 
                </div>
                <div class="list-amount ${typeClass}">
                    ${formatCurrency(t.amount)}
                </div>
                ${showDelete ? `<button class="delete-transaction-btn" data-id="${t.id}">
                    <i class="ph ph-trash-simple"></i>
                </button>` : ''}
            `;
            listElement.appendChild(li);
        });
    };

    const addTransaction = (description, amount, type, category) => {
        const newTransaction = {
            id: Date.now(),
            description: description,
            amount: parseFloat(amount),
            type: type,
            category: category,
            date: new Date().toISOString(),
        };
        transactions.unshift(newTransaction);
        saveTransactions();
    };

    const deleteTransaction = (id) => {
        const transactionId = parseInt(id);
        const index = transactions.findIndex(t => t.id === transactionId);
        
        if (index !== -1) {
            transactions.splice(index, 1);
            saveTransactions();
            updateUI();
        }
    };

    const handleTransactionSubmit = (e) => {
        e.preventDefault();

        const type = document.querySelector('input[name="type"]:checked').value;
        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const category = categoryInput.value.trim();
        
        if (description && amount > 0 && category) {
            addTransaction(description, amount, type, category);

            transactionForm.reset();
            transactionModal.classList.remove('show');

            updateUI();
        } else {
            alert("Por favor, preencha todos os campos corretamente.");
        }
    };

    // ================== FUNÇÕES DE METAS (GOALS) ==================

    const renderGoalsList = () => {
        goalsList.innerHTML = '';

        if (goals.length === 0) {
            emptyGoalsState.classList.add('show');
            return;
        }

        emptyGoalsState.classList.remove('show');

        goals.forEach(goal => {
            const currentAmount = goal.history.reduce((sum, item) => sum + item.amount, 0);
            const percentage = Math.min(100, (currentAmount / goal.target) * 100);
            const isCompleted = currentAmount >= goal.target;

            const card = document.createElement('div');
            card.className = 'goal-card';
            card.dataset.id = goal.id;

            card.innerHTML = `
                <div class="goal-card-header">
                    <div>
                        <h4>${goal.name}</h4>
                        <small>Orçamento: ${formatCurrency(goal.target)}</small>
                    </div>
                    <button class="delete-goal-btn" data-id="${goal.id}" title="Excluir Meta">
                        <i class="ph ph-x-circle"></i>
                    </button>
                </div>
                <div class="goal-progress">
                    <div class="progress-info">
                        <span class="current">${formatCurrency(currentAmount)}</span>
                        <span class="target">Usado: ${percentage.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%; background-color: ${isCompleted ? 'var(--red)' : 'var(--primary)'};"></div>
                    </div>
                </div>
                <div class="goal-card-actions">
                    <button class="btn btn-secondary manage-goal-btn" data-id="${goal.id}" data-action="manage">
                        <i class="ph ph-pencil"></i> Gerenciar
                    </button>
                    <button class="btn btn-secondary history-goal-btn" data-id="${goal.id}" data-action="history">
                        <i class="ph ph-list-numbers"></i> Histórico
                    </button>
                </div>
            `;
            goalsList.appendChild(card);
        });
    };

    const addGoal = (name, target, currentAmount) => {
        const newGoal = {
            id: Date.now(),
            name: name,
            target: parseFloat(target),
            history: [{ 
                type: 'add', 
                amount: parseFloat(currentAmount), 
                date: new Date().toISOString() 
            }]
        };
        goals.push(newGoal);
        saveGoals();
    };

    const deleteGoal = (id) => {
        const goalId = parseInt(id);
        const index = goals.findIndex(g => g.id === goalId);
        
        if (index !== -1) {
            goals.splice(index, 1);
            saveGoals();
            updateGoalsList();
        }
    };

    const handleGoalSubmit = (e) => {
        e.preventDefault();

        const name = goalNameInput.value.trim();
        const target = parseFloat(goalTargetInput.value);
        const currentAmount = parseFloat(goalCurrentAmountInput.value);
        
        if (name && target > 0 && currentAmount >= 0) {
            addGoal(name, target, currentAmount);

            goalForm.reset();
            goalModal.classList.remove('show');
            updateGoalsList();
        } else {
            alert("Por favor, preencha todos os campos corretamente.");
        }
    };

    const manageGoalAmount = (goalId, type, amount) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return false;

        goal.history.push({
            type: type,
            amount: parseFloat(amount),
            date: new Date().toISOString(),
        });

        saveGoals();
        return true;
    };

    const handleManageGoalSubmit = (e) => {
        e.preventDefault();

        const goalId = parseInt(manageGoalIdInput.value);
        const type = document.querySelector('input[name="manage-type"]:checked').value;
        const amount = parseFloat(manageGoalAmountInput.value);

        if (amount > 0) {
            if (manageGoalAmount(goalId, type, amount)) {
                manageGoalForm.reset();
                manageGoalModal.classList.remove('show');
                updateGoalsList();
            } else {
                alert("Erro ao gerenciar a meta.");
            }
        } else {
            alert("O valor deve ser maior que zero.");
        }
    };

    const handleGoalsListClick = (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const goalId = parseInt(target.dataset.id);
        const action = target.dataset.action;
        const goal = goals.find(g => g.id === goalId);

        if (!goal) return;

        if (target.classList.contains('delete-goal-btn')) {
            if (confirm(`Tem certeza que deseja excluir o orçamento "${goal.name}"?`)) {
                deleteGoal(goalId);
            }
        } else if (action === 'manage') {
            manageGoalTitle.textContent = `Gerenciar Orçamento: ${goal.name}`;
            manageGoalIdInput.value = goalId;
            manageGoalAmountInput.value = '';
            manageGoalModal.classList.add('show');
        } else if (action === 'history') {
            historyModalTitle.textContent = `Histórico de ${goal.name}`;
            renderGoalHistory(goal);
            historyModal.classList.add('show');
        }
    };

    const renderGoalHistory = (goal) => {
        historyListContent.innerHTML = '';
        
        if (goal.history.length === 0) {
            historyListContent.innerHTML = '<li style="justify-content: center; color: var(--text-secondary);">Nenhuma movimentação registrada.</li>';
            return;
        }

        goal.history
            .sort((a, b) => new Date(b.date) - new Date(a.date)) 
            .forEach(item => {
                const li = document.createElement('li');
                const typeClass = item.type === 'add' ? 'addition' : 'withdrawal';
                const typeText = item.type === 'add' ? 'Adição' : 'Retirada';

                li.className = typeClass;
                li.innerHTML = `
                    <span>${formatDate(item.date)} (${typeText})</span>
                    <strong class="${typeClass}">${formatCurrency(item.amount)}</strong>
                `;
                historyListContent.appendChild(li);
            });
    };
    
    // ================== FUNÇÕES DE FILTRO E UI ==================

    const getUniqueCategories = () => {
        const categories = transactions.map(t => t.category.toLowerCase());
        return ['Todas as Categorias', ...new Set(categories)].map(cat => ({
            value: cat === 'todas as categorias' ? 'all' : cat,
            label: cat.charAt(0).toUpperCase() + cat.slice(1)
        }));
    };

    const populateCategoryFilter = () => {
        const categories = getUniqueCategories();
        categoryFilter.innerHTML = '';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = cat.label;
            categoryFilter.appendChild(option);
        });
    };

    const filterTransactions = () => {
        const selectedCategory = categoryFilter.value;
        const filteredData = selectedCategory === 'all'
            ? transactions
            : transactions.filter(t => t.category.toLowerCase() === selectedCategory);

        renderTransactionList(allList, filteredData, Infinity, true);
    };
    
    // ================== FUNÇÃO DE GRÁFICOS (IMPLEMENTAÇÃO CHART.JS) ==================

    const renderCharts = () => {
        // --- Gráfico 1: Despesas por Categoria (Rosca/Doughnut) ---
        const expenseData = transactions.filter(t => t.type === 'expense' && t.amount > 0);
        
        if (expenseData.length === 0) {
            categoryChartCanvas.style.display = 'none';
            emptyChartCategory.classList.add('show');
        } else {
            categoryChartCanvas.style.display = 'block';
            emptyChartCategory.classList.remove('show');

            const categories = expenseData.reduce((acc, t) => {
                const category = t.category.charAt(0).toUpperCase() + t.category.slice(1);
                acc[category] = (acc[category] || 0) + t.amount;
                return acc;
            }, {});
            
            const labels = Object.keys(categories);
            const data = Object.values(categories);
            
            // Gerar cores dinâmicas e baseadas no tema
            const colors = ['#A45EFF', '#EF4444', '#22C55E', '#FFC107', '#00BCD4', '#F44336', '#9C27B0', '#03A9F4', '#FF9800', '#795548', '#607D8B'];
            const backgroundColors = labels.map((_, i) => colors[i % colors.length]);
            const textColor = getComputedStyle(document.body).getPropertyValue('--text-primary').trim();
            const bgColor = getBgContent();

            if (categoryChartInstance) {
                categoryChartInstance.destroy(); 
            }
            
            categoryChartInstance = new Chart(categoryChartCanvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        hoverOffset: 10,
                        borderColor: bgColor, 
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: textColor,
                            },
                            position: 'bottom',
                        },
                        title: {
                            display: false,
                        }
                    }
                }
            });
        }


        // --- Gráfico 2: Fluxo de Caixa Mensal (Barras) ---
        
        if (transactions.length === 0) {
            flowChartCanvas.style.display = 'none';
            emptyChartFlow.classList.add('show');
            if (flowChartInstance) flowChartInstance.destroy();
            return;
        } else {
            flowChartCanvas.style.display = 'block';
            emptyChartFlow.classList.remove('show');
        }

        const monthlyData = transactions.reduce((acc, t) => {
            const date = new Date(t.date);
            // Formato 'YYYY-MM' para ordenar corretamente
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!acc[monthYear]) {
                acc[monthYear] = { income: 0, expense: 0 };
            }

            if (t.type === 'income') {
                acc[monthYear].income += t.amount;
            } else {
                acc[monthYear].expense += t.amount;
            }
            return acc;
        }, {});

        // Ordenar as chaves (meses) cronologicamente
        const sortedMonths = Object.keys(monthlyData).sort();
        
        const flowLabels = sortedMonths.map(my => {
            const [year, month] = my.split('-');
            const monthName = new Date(year, parseInt(month) - 1, 1).toLocaleString('pt-BR', { month: 'short' });
            return `${monthName}/${year.slice(2)}`;
        });
        
        const flowIncomeData = sortedMonths.map(my => monthlyData[my].income);
        const flowExpenseData = sortedMonths.map(my => monthlyData[my].expense);
        
        const textColor = getComputedStyle(document.body).getPropertyValue('--text-primary').trim();
        const gridColor = getComputedStyle(document.body).getPropertyValue('--border').trim();


        if (flowChartInstance) {
            flowChartInstance.destroy(); 
        }

        flowChartInstance = new Chart(flowChartCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: flowLabels,
                datasets: [
                    {
                        label: 'Receitas',
                        data: flowIncomeData,
                        backgroundColor: getComputedStyle(document.body).getPropertyValue('--green').trim(),
                    },
                    {
                        label: 'Despesas',
                        data: flowExpenseData,
                        backgroundColor: getComputedStyle(document.body).getPropertyValue('--red').trim(),
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: false,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        stacked: false,
                        grid: { color: gridColor },
                        ticks: { 
                            color: textColor,
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                             color: textColor,
                        }
                    }
                }
            }
        });
    };


    // ================== FUNÇÃO DE ATUALIZAÇÃO GERAL ==================

    const updateUI = () => {
        const { totalIncome, totalExpense, currentBalance } = calculateSummary();

        totalIncomeEl.textContent = formatCurrency(totalIncome);
        totalExpenseEl.textContent = formatCurrency(totalExpense);
        currentBalanceEl.textContent = formatCurrency(currentBalance);

        // Renderiza listas
        renderTransactionList(recentList, transactions, 5, true); 
        filterTransactions(); 
        
        // Atualiza os gráficos se a página estiver ativa
        if (document.querySelector('.page.active')?.id === 'graficos') {
             renderCharts();
        }
        
        // Popula filtro
        populateCategoryFilter();
    };

    const updateGoalsList = () => {
        renderGoalsList();
    };
    
    // ================== GERENCIADORES DE EVENTOS (EVENT LISTENERS) ==================

    // --- Navegação entre páginas ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;

            navButtons.forEach(btn => btn.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(targetId).classList.add('active');

            updateGreeting();
            
            // Renderiza gráficos ao ativar a página
            if (targetId === 'graficos') {
                renderCharts(); 
            }
            
            // Fecha o menu no mobile após clicar
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    // --- Nome Clicável ---
    pageTitle.addEventListener('click', handleNameClick);

    // --- Modal Transação ---
    openModalBtn.addEventListener('click', () => { transactionModal.classList.add('show'); });
    closeModalBtn.addEventListener('click', () => { transactionModal.classList.remove('show'); });
    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) transactionModal.classList.remove('show');
    });
    transactionForm.addEventListener('submit', handleTransactionSubmit);

    // --- Deletar Transação ---
    document.addEventListener('click', (e) => {
        if (e.target.closest('.delete-transaction-btn')) {
            const id = e.target.closest('.delete-transaction-btn').dataset.id;
            if (confirm("Tem certeza que deseja excluir esta transação?")) {
                deleteTransaction(id);
            }
        }
    });
    
    // --- Filtro de Categoria ---
    categoryFilter.addEventListener('change', filterTransactions);

    // --- Modais de Metas ---
    openGoalModalBtn.addEventListener('click', () => goalModal.classList.add('show'));
    closeGoalModalBtn.addEventListener('click', () => goalModal.classList.remove('show'));
    goalModal.addEventListener('click', (e) => {
        if (e.target === goalModal) goalModal.classList.remove('show');
    });
    goalForm.addEventListener('submit', handleGoalSubmit);

    closeManageGoalModalBtn.addEventListener('click', () => manageGoalModal.classList.remove('show'));
    manageGoalModal.addEventListener('click', (e) => {
        if (e.target === manageGoalModal) manageGoalModal.classList.remove('show');
    });
    manageGoalForm.addEventListener('submit', handleManageGoalSubmit);

    closeHistoryModalBtn.addEventListener('click', () => historyModal.classList.remove('show'));
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) historyModal.classList.remove('show');
    });

    goalsList.addEventListener('click', handleGoalsListClick);

    // --- Alternador de Tema ---
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        localStorage.setItem('meus-trocados-theme', theme);
        
        // Recarrega gráficos ao trocar de tema para aplicar novas cores
        if (document.querySelector('.page.active')?.id === 'graficos') {
             renderCharts();
        }
    });
    
    // --- Controle de Menu Mobile (Hambúrguer) ---
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
    
    // --- Fechar Menu Mobile ao clicar no conteúdo principal ---
    mainContent.addEventListener('click', () => {
        if (sidebar.classList.contains('open') && window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });

    // ================== INICIALIZAÇÃO ==================
    const loadTheme = () => {
        if (localStorage.getItem('meus-trocados-theme') === 'light') {
            document.body.classList.add('light-mode');
        }
    };
    
    loadTheme();
    askForName();
    updateGreeting();
    updateUI(); 
    updateGoalsList(); 
});