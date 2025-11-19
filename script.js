document.addEventListener('DOMContentLoaded', () => {

    // ================== SELETORES DE ELEMENTOS ==================
    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    // --- Elementos de Layout/Mobile/PWA ---
    const sidebar = document.getElementById('sidebar'); 
    const menuToggle = document.getElementById('menu-toggle'); 
    const mainContent = document.querySelector('.main-content'); 
    const installAppBtn = document.getElementById('install-app-btn'); 

    // --- Elementos do Painel ---
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const currentBalanceEl = document.getElementById('current-balance');
    const recentList = document.getElementById('recent-transactions-list');
    const emptyRecentState = document.getElementById('empty-recent-state');
    const incomeCard = document.getElementById('income-card');
    const expenseCard = document.getElementById('expense-card');

    // --- Elementos do Extrato & Backup ---
    const allList = document.getElementById('all-transactions-list');
    const emptyAllState = document.getElementById('empty-all-state');
    const categoryFilter = document.getElementById('category-filter'); 
    const downloadTransactionsBtn = document.getElementById('download-transactions-btn');
    const importTransactionsBtn = document.getElementById('import-transactions-btn');
    const importCsvInput = document.getElementById('import-csv-input');
    
    // NOVOS SELETORES PARA BACKUP JSON (ITEM 3)
    const backupExportBtn = document.getElementById('backup-export-btn');
    const backupImportBtn = document.getElementById('backup-import-btn');
    const backupImportInput = document.getElementById('backup-import-input');
    
    // --- Elementos de Gráficos (Canvas) ---
    const categoryChartCanvas = document.getElementById('categoryChart');
    const flowChartCanvas = document.getElementById('flowChart');
    const emptyChartCategory = document.getElementById('empty-chart-category');
    const emptyChartFlow = document.getElementById('empty-chart-flow');
    
    let categoryChartInstance = null;
    let flowChartInstance = null;
    
    // --- Elementos de Transação (Modal) ---
    const transactionModal = document.getElementById('transaction-modal');
    const openModalBtn = document.getElementById('open-transaction-modal');
    const closeModalBtn = document.getElementById('close-transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const radioIncome = document.getElementById('radio-income'); 
    const radioExpense = document.getElementById('radio-expense'); 
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categoryInput = document.getElementById('category'); 
    const categoryDataList = document.getElementById('category-options'); 

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
    const goalLocationInput = document.getElementById('goal-location');

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


    // ================== ARMAZENAMENTO DE DADOS ==================

    let transactions = JSON.parse(localStorage.getItem('meus-trocados-transactions')) || [];
    let goals = JSON.parse(localStorage.getItem('meus-trocados-goals')) || [];
    let userName = localStorage.getItem('meus-trocados-username') || 'Colega';
    
    // CONFIGURAÇÃO: Categorias separadas
    const INCOME_CATEGORIES = [
        'Salário', 'Investimentos', 'Freelance', 'Presente', 
        'Vendas', 'Reembolso', 'Outras Receitas'
    ];

    const EXPENSE_CATEGORIES = [
        'Alimentação', 'Transporte', 'Moradia', 'Saúde', 
        'Educação', 'Lazer', 'Contas', 'Compras', 
        'Assinaturas', 'Pets', 'Outras Despesas'
    ];

    const saveTransactions = () => {
        localStorage.setItem('meus-trocados-transactions', JSON.stringify(transactions));
    };

    const saveGoals = () => {
        localStorage.setItem('meus-trocados-goals', JSON.stringify(goals));
    };

    // ================== PWA INSTALL PROMPT (ITEM 2) ==================
    
    let deferredPrompt;

    // Escuta o evento que dispara quando o Chrome detecta que pode instalar o app
    window.addEventListener('beforeinstallprompt', (e) => {
        // Previne a barra automática do Chrome
        e.preventDefault();
        deferredPrompt = e;
        // Mostra o botão de instalar
        installAppBtn.style.display = 'inline-flex';
        console.log("Evento beforeinstallprompt disparado. Botão exibido.");
    });

    installAppBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Mostra o prompt nativo
            deferredPrompt.prompt();
            // Espera a escolha do usuário
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // Limpa a variável
            deferredPrompt = null;
            // Esconde o botão
            installAppBtn.style.display = 'none';
        }
    });

    // ================== FUNÇÕES AUXILIARES ==================

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };
    
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('pt-BR', options);
    };

    const formatDateTimeCSV = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
    }
    
    const getBgContent = () => {
        return getComputedStyle(document.body).getPropertyValue('--bg-content').trim();
    };

    // ================== INTERFACE E NAVEGAÇÃO ==================

    const askForName = () => {
        if (userName === 'Colega') {
            // Pequeno delay para não bloquear renderização
            setTimeout(() => {
                const name = prompt("Olá! Qual é o seu nome?");
                if (name && name.trim() !== "") {
                    userName = name.trim();
                    localStorage.setItem('meus-trocados-username', userName);
                    updateGreeting();
                }
            }, 500);
        }
    };

    const updateGreeting = () => {
        const activePageId = document.querySelector('.page.active').id;

        if (activePageId === 'painel') {
            pageTitle.textContent = `Oi, ${userName}!`;
            // ITEM 4: MUDANÇA DE TEXTO SOLICITADA
            pageSubtitle.textContent = `Bora Economizar.`; 
        } else if (activePageId === 'economias') {
            pageTitle.textContent = `Metas Financeiras`; 
            pageSubtitle.textContent = `Gerencie seus objetivos de poupança.`;
        } else if (activePageId === 'extrato') {
            pageTitle.textContent = `Extrato de Transações`;
            pageSubtitle.textContent = `Veja e gerencie seu histórico.`;
        } else if (activePageId === 'graficos') {
            pageTitle.textContent = `Dashboard`;
            pageSubtitle.textContent = `Análise visual de suas receitas e despesas.`;
        }
    };
    
    const handleNameClick = () => {
        const newName = prompt(`Olá, ${userName}! Qual é o novo nome que você gostaria de usar?`);
        if (newName && newName.trim() !== "") {
            userName = newName.trim();
            localStorage.setItem('meus-trocados-username', userName);
            updateGreeting();
        }
    };


    // ================== LÓGICA DE TRANSAÇÕES ==================

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
            const dateAndCategory = `${t.category} - ${formatDate(t.date)}`; 

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

    const addTransaction = (description, amount, type, category, date = null) => {
        const newTransaction = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            description: description,
            amount: parseFloat(amount),
            type: type,
            category: category.trim(),
            date: date ? date : new Date().toISOString(),
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

    // ATUALIZA AS OPÇÕES DE CATEGORIA BASEADO NO TIPO
    const updateCategoryOptions = (type) => {
        categoryDataList.innerHTML = '';
        
        const options = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        
        options.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            categoryDataList.appendChild(option);
        });
    };

    const openTransactionModal = (type = 'income') => {
        if (type === 'expense') {
            radioExpense.checked = true;
            updateCategoryOptions('expense');
        } else {
            radioIncome.checked = true;
            updateCategoryOptions('income');
        }
        categoryInput.value = ''; 
        transactionModal.classList.add('show');
    };

    const handleTypeChange = (e) => {
        if (e.target.name === 'type') {
            updateCategoryOptions(e.target.value);
            categoryInput.value = ''; 
        }
    };

    // ================== BACKUP JSON AVANÇADO (ITEM 3) ==================

    const exportBackupJSON = () => {
        if (transactions.length === 0 && goals.length === 0) {
            alert("Você não tem dados para salvar ainda.");
            return;
        }

        const backupData = {
            app: "Meus Trocados",
            version: "1.0",
            exportedAt: new Date().toISOString(),
            username: userName,
            transactions: transactions,
            goals: goals
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `backup_meus_trocados_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchorNode); // Required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const importBackupJSON = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validação básica para ver se é um backup válido
                if (data.app === "Meus Trocados" && Array.isArray(data.transactions) && Array.isArray(data.goals)) {
                    
                    if (confirm(`Restaurar backup de ${data.username || 'usuário'} criado em ${formatDate(data.exportedAt)}? \nISSO SUBSTITUIRÁ SEUS DADOS ATUAIS.`)) {
                        transactions = data.transactions;
                        goals = data.goals;
                        if (data.username) userName = data.username;

                        saveTransactions();
                        saveGoals();
                        localStorage.setItem('meus-trocados-username', userName);

                        alert("Dados restaurados com sucesso! A página será recarregada.");
                        location.reload();
                    }
                } else {
                    alert("Arquivo de backup inválido.");
                }
            } catch (err) {
                console.error(err);
                alert("Erro ao ler o arquivo JSON.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Limpa input
    };

    // Listeners do Backup
    backupExportBtn.addEventListener('click', exportBackupJSON);
    backupImportBtn.addEventListener('click', () => backupImportInput.click());
    backupImportInput.addEventListener('change', importBackupJSON);


    // ================== IMPORTAR E EXPORTAR CSV (LEGADO) ==================

    const downloadTransactionsAsCSV = () => {
        if (transactions.length === 0) {
            alert("Não há transações para exportar.");
            return;
        }

        const headers = ["Data", "Tipo", "Descricao", "Categoria", "Valor"];
        const csvRows = [];
        csvRows.push(headers.join(';')); 

        transactions.forEach(t => {
            const amountFormatted = t.amount.toFixed(2).replace('.', ','); 
            const typeText = t.type === 'income' ? 'RECEITA' : 'DESPESA';
            const row = [
                `"${formatDateTimeCSV(t.date)}"`,
                `"${typeText}"`,
                `"${t.description.replace(/"/g, '""')}"`, 
                `"${t.category.replace(/"/g, '""')}"`,
                `"${amountFormatted}"` 
            ];
            csvRows.push(row.join(';'));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' }); 
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `extrato_meus_trocados_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    importTransactionsBtn.addEventListener('click', () => {
        importCsvInput.click();
    });

    importCsvInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const text = e.target.result;
            processCSVData(text);
            importCsvInput.value = ''; 
        };
        reader.readAsText(file);
    });

    const processCSVData = (csvText) => {
        try {
            const lines = csvText.split('\n');
            let count = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const cleanLine = line.replace(/"/g, ''); 
                const parts = cleanLine.split(';');

                if (parts.length >= 5) {
                    const dateRaw = parts[0];
                    const typeRaw = parts[1];
                    const description = parts[2];
                    const category = parts[3];
                    const amountRaw = parts[4];

                    const type = (typeRaw === 'RECEITA' || typeRaw === 'income') ? 'income' : 'expense';
                    const amount = parseFloat(amountRaw.replace(',', '.'));

                    let dateIso = new Date().toISOString();
                    if (dateRaw.includes('/')) {
                        const [dPart, tPart] = dateRaw.split(' ');
                        const [day, month, year] = dPart.split('/');
                        const dateObj = new Date(`${month}/${day}/${year} ${tPart || ''}`);
                        if (!isNaN(dateObj)) dateIso = dateObj.toISOString();
                    }

                    if (description && !isNaN(amount)) {
                        addTransaction(description, amount, type, category, dateIso);
                        count++;
                    }
                }
            }

            if (count > 0) {
                alert(`${count} transações importadas com sucesso via CSV!`);
                updateUI();
            } else {
                alert("Nenhuma transação válida encontrada ou formato incorreto.");
            }

        } catch (error) {
            console.error(error);
            alert("Erro ao processar o arquivo CSV.");
        }
    };

    // ================== LÓGICA DE METAS (ECONOMIAS) ==================

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
                        <small><i class="ph ph-bank"></i> ${goal.location || 'Geral'}</small>
                    </div>
                    <button class="delete-goal-btn" data-id="${goal.id}" title="Excluir Meta">
                        <i class="ph ph-x-circle"></i>
                    </button>
                </div>
                <div class="goal-progress">
                    <div class="progress-info">
                        <span class="current">${formatCurrency(currentAmount)}</span>
                        <span class="target">Meta: ${formatCurrency(goal.target)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%; background-color: ${isCompleted ? 'var(--green)' : 'var(--primary)'};"></div>
                    </div>
                    <small style="color: var(--text-secondary); font-size: 0.8rem; text-align: right;">${percentage.toFixed(1)}%</small>
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

    const addGoal = (name, target, currentAmount, location) => {
        const newGoal = {
            id: Date.now(),
            name: name,
            target: parseFloat(target),
            location: location,
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
        const location = goalLocationInput.value.trim();
        const target = parseFloat(goalTargetInput.value);
        const currentAmount = parseFloat(goalCurrentAmountInput.value);
        
        if (name && target > 0 && currentAmount >= 0) {
            addGoal(name, target, currentAmount, location);
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
        
        const finalAmount = type === 'withdraw' ? -parseFloat(amount) : parseFloat(amount);

        goal.history.push({
            type: type, 
            amount: finalAmount,
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
            if (confirm(`Tem certeza que deseja excluir a meta "${goal.name}"?`)) {
                deleteGoal(goalId);
            }
        } else if (action === 'manage') {
            manageGoalTitle.textContent = `Gerenciar Meta: ${goal.name}`;
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
                
                const isAddition = item.amount >= 0; 
                const typeClass = isAddition ? 'addition' : 'withdrawal';
                const typeText = isAddition ? 'Adição' : 'Retirada';
                const displayAmount = Math.abs(item.amount); 

                li.className = typeClass;
                li.innerHTML = `
                    <span>${formatDate(item.date)} (${typeText})</span>
                    <strong class="${typeClass}">${formatCurrency(displayAmount)}</strong>
                `;
                historyListContent.appendChild(li);
            });
    };
    
    // ================== FILTRO E UI ==================

    const getAvailableCategories = () => {
        const transactionCats = transactions.map(t => t.category);
        const allCats = [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES, ...transactionCats])];
        return allCats.sort();
    };

    const populateCategoryFilter = () => {
        const categories = getAvailableCategories();
        const currentSelection = categoryFilter.value;

        categoryFilter.innerHTML = '<option value="all">Todas as Categorias</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.toLowerCase(); 
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });

        categoryFilter.value = currentSelection && categories.map(c => c.toLowerCase()).includes(currentSelection) ? currentSelection : 'all';
    };

    const filterTransactions = () => {
        const selectedCategory = categoryFilter.value;
        const filteredData = selectedCategory === 'all'
            ? transactions
            : transactions.filter(t => t.category.toLowerCase() === selectedCategory);

        renderTransactionList(allList, filteredData, Infinity, true);
    };
    
    // ================== GRÁFICOS (CHART.JS) ==================

    const renderCharts = () => {
        const expenseData = transactions.filter(t => t.type === 'expense');
        
        if (expenseData.length === 0) {
            categoryChartCanvas.style.display = 'none';
            emptyChartCategory.classList.add('show');
            if (categoryChartInstance) categoryChartInstance.destroy(); 
        } else {
            categoryChartCanvas.style.display = 'block';
            emptyChartCategory.classList.remove('show');

            const categoriesMap = expenseData.reduce((acc, t) => {
                const catName = t.category.charAt(0).toUpperCase() + t.category.slice(1).toLowerCase();
                acc[catName] = (acc[catName] || 0) + t.amount;
                return acc;
            }, {});
            
            const labels = Object.keys(categoriesMap);
            const data = Object.values(categoriesMap);
            
            const colors = [
                '#EF4444', '#F87171', '#B91C1C', 
                '#F59E0B', '#FBBF24', 
                '#6366F1', '#818CF8', 
                '#EC4899', '#F472B6', 
                '#8B5CF6', '#A78BFA' 
            ];
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
                            labels: { color: textColor },
                            position: 'bottom',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        label += formatCurrency(context.parsed);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }


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

        const sortedMonths = Object.keys(monthlyData).sort();
        
        const flowLabels = sortedMonths.map(my => {
            const [year, month] = my.split('-');
            const date = new Date(year, parseInt(month) - 1, 1);
            const monthName = date.toLocaleString('pt-BR', { month: 'short' });
            return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${year.slice(2)}`;
        });
        
        const flowIncomeData = sortedMonths.map(my => monthlyData[my].income);
        const flowExpenseData = sortedMonths.map(my => monthlyData[my].expense);
        
        const textColor = getComputedStyle(document.body).getPropertyValue('--text-primary').trim();
        const gridColor = getComputedStyle(document.body).getPropertyValue('--border').trim();
        const greenColor = getComputedStyle(document.body).getPropertyValue('--green').trim();
        const redColor = getComputedStyle(document.body).getPropertyValue('--red').trim();

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
                        backgroundColor: greenColor,
                        borderRadius: 4
                    },
                    {
                        label: 'Despesas',
                        data: flowExpenseData,
                        backgroundColor: redColor,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        grid: { color: 'transparent' }, 
                        ticks: { color: textColor }
                    },
                    y: {
                        grid: { color: gridColor, borderDash: [5, 5] },
                        ticks: { 
                            color: textColor,
                            callback: function(value) { return formatCurrency(value); }
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: textColor }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += formatCurrency(context.parsed.y);
                                return label;
                            }
                        }
                    }
                }
            }
        });
    };


    // ================== ATUALIZAÇÃO GERAL ==================

    const updateUI = () => {
        const { totalIncome, totalExpense, currentBalance } = calculateSummary();

        totalIncomeEl.textContent = formatCurrency(totalIncome);
        totalExpenseEl.textContent = formatCurrency(totalExpense);
        currentBalanceEl.textContent = formatCurrency(currentBalance);

        renderTransactionList(recentList, transactions, 5, true); 
        
        populateCategoryFilter();
        filterTransactions(); 
        
        renderCharts();
    };

    const updateGoalsList = () => {
        renderGoalsList();
    };
    
    // ================== LISTENERS GERAIS ==================

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            navButtons.forEach(btn => btn.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(targetId).classList.add('active');
            updateGreeting();
            
            if (targetId === 'graficos') {
                renderCharts(); 
            }
            
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    pageTitle.addEventListener('click', handleNameClick);

    openModalBtn.addEventListener('click', () => openTransactionModal('income')); 
    closeModalBtn.addEventListener('click', () => transactionModal.classList.remove('show'));
    transactionModal.addEventListener('click', (e) => {
        if (e.target === transactionModal) transactionModal.classList.remove('show');
    });
    transactionForm.addEventListener('submit', handleTransactionSubmit);
    
    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', handleTypeChange);
    });

    incomeCard.addEventListener('click', () => openTransactionModal('income'));
    expenseCard.addEventListener('click', () => openTransactionModal('expense'));
    
    downloadTransactionsBtn.addEventListener('click', downloadTransactionsAsCSV);

    document.addEventListener('click', (e) => {
        if (e.target.closest('.delete-transaction-btn')) {
            const id = e.target.closest('.delete-transaction-btn').dataset.id;
            if (confirm("Tem certeza que deseja excluir esta transação?")) {
                deleteTransaction(id);
            }
        }
    });
    
    categoryFilter.addEventListener('change', filterTransactions);

    openGoalModalBtn.addEventListener('click', () => goalModal.classList.add('show'));
    closeGoalModalBtn.addEventListener('click', () => goalModal.classList.remove('show'));
    goalModal.addEventListener('click', (e) => { if (e.target === goalModal) goalModal.classList.remove('show'); });
    goalForm.addEventListener('submit', handleGoalSubmit);

    closeManageGoalModalBtn.addEventListener('click', () => manageGoalModal.classList.remove('show'));
    manageGoalModal.addEventListener('click', (e) => { if (e.target === manageGoalModal) manageGoalModal.classList.remove('show'); });
    manageGoalForm.addEventListener('submit', handleManageGoalSubmit);

    closeHistoryModalBtn.addEventListener('click', () => historyModal.classList.remove('show'));
    historyModal.addEventListener('click', (e) => { if (e.target === historyModal) historyModal.classList.remove('show'); });

    goalsList.addEventListener('click', handleGoalsListClick);

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        localStorage.setItem('meus-trocados-theme', theme);
        renderCharts();
    });
    
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    mainContent.addEventListener('click', () => {
        if (sidebar.classList.contains('open') && window.innerWidth <= 768) sidebar.classList.remove('open');
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