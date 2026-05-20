import { auth, db } from './firebase-config.js';
import { ref, set, get, update, push, remove, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // ===================================
  // MOBILE DEVICE DETECTION & HAPTIC
  // ===================================
  const isMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);

  if (isMobileDevice) {
    document.body.classList.add('mobile-device');
  }

  window.triggerHaptic = function(ms = 15) {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  };
  const triggerHaptic = window.triggerHaptic;

  // ===================================
  // TOAST NOTIFICATION SYSTEM
  // ===================================
  const toastIcons = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info'
  };

  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }

  window.showToast = function (message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${toastIcons[type] || 'info'}"></i></div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Fechar notificação">
        <i data-lucide="x" style="width:14px;height:14px;"></i>
      </button>
      <div class="toast-progress"></div>
    `;

    toastContainer.appendChild(toast);
    lucide.createIcons({ node: toast });

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 350);
    };

    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  };

  // ===================================
  // XSS SANITIZER
  // ===================================
  function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  window.escapeHTML = escapeHTML;

  // ===================================
  // ANIMATED COUNTER (values)
  // ===================================
  window.animateValue = function (element, start, end, duration = 800) {
    if (!element) return;
    const startTime = performance.now();
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

    const formatter = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      const current = start + (end - start) * easedProgress;
      element.textContent = formatter.format(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  };

  // ===================================
  // BUTTON RIPPLE EFFECT
  // ===================================
  document.addEventListener('click', (e) => {
    const button = e.target.closest('.btn-primary, .btn-submit, .auth-btn-primary');
    if (!button) return;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  // ===================================
  // THEME TOGGLE LOGIC
  // ===================================
  const themeSelector = document.getElementById("theme-selector");

  // Load saved theme
  const savedTheme = localStorage.getItem("fluxo_theme");
  if (savedTheme && savedTheme !== "default") {
    document.body.classList.add(savedTheme);
  }

  if (themeSelector) {
    if (savedTheme) {
      themeSelector.value = savedTheme;
    }

    themeSelector.addEventListener("change", (e) => {
      // Remove existing theme classes
      document.body.className = Array.from(document.body.classList)
        .filter(c => !c.startsWith("theme-"))
        .join(" ");

      const selected = e.target.value;
      if (selected !== "default") {
        document.body.classList.add(selected);
      }

      localStorage.setItem("fluxo_theme", selected);

      // Update charts themes if they exist
      if (typeof updateDashboard === "function" && Auth.isLoggedIn()) {
        updateDashboard();
      }
    });
  }

  // ===================================
  // AUTH UI LOGIC
  // ===================================
  const authScreen = document.getElementById("auth-screen");
  const appContainer = document.getElementById("app-container");
  const loginCard = document.getElementById("login-card");
  const registerCard = document.getElementById("register-card");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginError = document.getElementById("login-error");
  const registerError = document.getElementById("register-error");
  const goToRegister = document.getElementById("go-to-register");
  const goToLogin = document.getElementById("go-to-login");

  // Toggle password visibility
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      const icon = btn.querySelector("i, svg");
      if (input.type === "password") {
        input.type = "text";
        icon.setAttribute("data-lucide", "eye-off");
      } else {
        input.type = "password";
        icon.setAttribute("data-lucide", "eye");
      }
      lucide.createIcons();
    });
  });

  // Switch Login <-> Register
  goToRegister.addEventListener("click", () => {
    loginCard.style.display = "none";
    registerCard.style.display = "block";
    registerCard.classList.add("auth-slide-in");
    loginError.style.display = "none";
    setTimeout(() => registerCard.classList.remove("auth-slide-in"), 500);
  });

  goToLogin.addEventListener("click", () => {
    registerCard.style.display = "none";
    loginCard.style.display = "block";
    loginCard.classList.add("auth-slide-in");
    registerError.style.display = "none";
    setTimeout(() => loginCard.classList.remove("auth-slide-in"), 500);
  });

  function showAuthError(element, message) {
    element.textContent = message;
    element.style.display = "block";
    element.classList.add("auth-error-shake");
    setTimeout(() => element.classList.remove("auth-error-shake"), 600);
  }

  // LOGIN
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const result = await Auth.login(email, password);
    if (result.success) {
      // Auth.migrateOldData(result.user.id);
      enterApp();
    } else {
      showAuthError(loginError, result.message);
    }
  });

  // REGISTER
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirm = document.getElementById("register-confirm").value;

    if (password !== confirm) {
      showAuthError(registerError, "As senhas não coincidem.");
      return;
    }

    const result = await Auth.register(name, email, password);
    if (result.success) {
      enterApp();
    } else {
      showAuthError(registerError, result.message);
    }
  });

  // Google Sign-In (Firebase Standard)
  function initGoogleSignIn() {
    const googleBtns = document.querySelectorAll("#custom-google-btn, #custom-google-btn-register");
    googleBtns.forEach(btn => {
      btn.addEventListener("click", async () => {
        // Show loading state on the button
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width: 20px; height: 20px; margin-right: 10px;"></i> Conectando...';
        lucide.createIcons();
        btn.disabled = true;

        try {
          const result = await Auth.googleSignIn();
          if (result.success) {
            showToast(`Bem-vindo, ${result.user.name}!`, "success");
            enterApp();
          } else {
            if (result.message !== "Login cancelado.") {
              showToast(result.message, "error");
              // Alerta de emergência para garantir que o usuário veja o erro
              alert("Erro no Login Google: " + result.message);
              console.error("Firebase Auth Error Detail:", result.message);
            }
            // Restore button
            btn.innerHTML = originalContent;
            btn.disabled = false;
            lucide.createIcons();
          }
        } catch (err) {
          console.error("Erro fatal no login Google:", err);
          alert("Erro crítico: " + err.message);
          showToast("Erro crítico ao abrir janela de login.", "error");
          btn.innerHTML = originalContent;
          btn.disabled = false;
          lucide.createIcons();
        }
      });
    });
  }

  initGoogleSignIn();

  // --- Enter App ---
  async function enterApp() {
    authScreen.style.display = "none";
    appContainer.style.display = "flex";
    
    // Show a global loading spinner or let empty state handle it
    await loadAppDataAPI();
    
    updateDashboard();
    updateProfileUI();
    lucide.createIcons();
  }

  // ===================================
  // APP LOGIC (API Synchronized)
  // ===================================

  let state = {
    salary: 5000,
    history: [],
    transactions: [],
    goals: [],
    categoryLimits: {},
    wallets: [],
    geminiKey: null,
    aiPersona: "pessoal",
    currentView: "dashboard",
  };

  async function loadAppDataAPI() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = ref(db, `users/${user.uid}`);
      
      // Get all data once, but we could use onValue for real-time
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        const profile = data.profile || {};
        state.salary = parseFloat(profile.salary) || 5000;
        state.geminiKey = profile.geminiKey;
        state.aiPersona = profile.aiPersona || "pessoal";
        state.categoryLimits = data.categoryLimits || {};

        // Sync extra profile fields to session so getCurrentUser() has them
        const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
        Auth.setSession({
          id: user.uid,
          name: user.displayName || profile.name || 'Usuário',
          email: user.email,
          provider: isGoogle ? 'google' : 'local',
          phone: profile.phone || null,
          birthdate: profile.birthdate || null,
          avatar: profile.avatar || null,
          createdAt: profile.createdAt || user.metadata.creationTime
        });
        
        // Convert objects to arrays for compatibility with existing logic
        state.transactions = data.transactions ? Object.entries(data.transactions).map(([id, t]) => ({ id, ...t })) : [];
        state.goals = data.goals ? Object.entries(data.goals).map(([id, g]) => ({ id, ...g })) : [];
        state.wallets = data.wallets ? Object.entries(data.wallets).map(([id, w]) => ({ id, ...w })) : [];
        state.history = data.history ? Object.entries(data.history).map(([id, h]) => ({ id, ...h })) : [];
        
        if (profile.chat_conversations) {
          chatConversations = profile.chat_conversations || [];
          renderConversationsList();
        }
      } else {
        // Initialize if first time
        await set(ref(db, `users/${user.uid}/profile`), {
          name: user.displayName,
          email: user.email,
          salary: 5000,
          aiPersona: "pessoal"
        });
      }
    } catch (err) {
      console.error("Failed to load data from Firebase", err);
      showToast("Erro ao sincronizar dados com o Firebase.", "error");
    }
  }

  function saveState() {
    // Legacy function. All saving is now done strictly via API calls (Goals, Wallets, Profile, etc).
    // Kept empty to prevent breaking existing synchronous calls while transitioning.
    console.log("saveState() is now deprecated. State is managed via API.");
  }
  const navItems = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".content-view");
  const modal = document.getElementById("expense-modal");

  // Goals Elements
  const goalModal = document.getElementById("goal-modal");
  const newGoalBtn = document.getElementById("new-goal-btn");
  const closeGoalModalBtn = document.getElementById("close-goal-modal");
  const goalForm = document.getElementById("goal-form");
  const goalsContainer = document.getElementById("goals-container");
  let editingGoalId = null;

  // Wallets Elements
  const walletModal = document.getElementById("wallet-modal");
  const addWalletBtn = document.getElementById("add-wallet-btn");
  const closeWalletModalBtn = document.getElementById("close-wallet-modal");
  const walletForm = document.getElementById("wallet-form");
  const walletsList = document.getElementById("wallets-list");
  let editingWalletId = null;

  const newExpenseBtn = document.getElementById("new-expense-btn");
  const closeModalBtn = document.getElementById("close-expense-modal");
  const expenseForm = document.getElementById("expense-form");
  const recentTableBody = document.querySelector("#recent-table tbody");
  const allExpensesTableBody = document.querySelector(
    "#all-expenses-table tbody",
  );
  const salaryModal = document.getElementById("salary-modal");
  const setSalaryBtn = document.getElementById("set-salary-btn");
  const salaryForm = document.getElementById("salary-form");
  const closeSalaryModal = document.getElementById("close-salary-modal");
  const closeMonthBtn = document.getElementById("close-month-btn");
  const historyList = document.getElementById("history-list");
  const runAiBtn = document.getElementById("run-ai-analysis");
  const aiInsightsContainer = document.getElementById("ai-insights-container");
  const aiStatusTitle = document.getElementById("ai-status-title");
  const aiStatusDesc = document.getElementById("ai-status-desc");
  const geminiKeyInput = document.getElementById("gemini-key");
  const saveKeyBtn = document.getElementById("save-key-btn");
  const aiPersonaSelect = document.getElementById("ai-persona-select");

  const sidebar = document.querySelector(".sidebar");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileOverlay = document.getElementById("mobile-overlay");

  const modalTitle = document.querySelector("#expense-modal h2");
  const btnSubmitExpense = document.querySelector("#expense-form .btn-submit");
  let editingTransactionId = null;

  const expenseTypeSelect = document.getElementById("expense-type");
  const installmentsGroup = document.getElementById("installments-group");

  // Advanced Financial Fields
  const advancedToggle = document.getElementById("advanced-toggle");
  const advancedFieldsContainer = document.getElementById("advanced-fields-container");
  const advancedTypeSelect = document.getElementById("advanced-type");
  
  const advancedGroups = {
    fixed_income: document.getElementById("advanced-fixed-income-group"),
    variable_income: document.getElementById("advanced-variable-income-group"),
    financing: document.getElementById("advanced-financing-group"),
    consortium: document.getElementById("advanced-consortium-group"),
    credit_loan: document.getElementById("advanced-loan-group")
  };

  function updateAdvancedFieldsUI() {
    if (advancedToggle && advancedToggle.checked) {
      if (advancedFieldsContainer) advancedFieldsContainer.style.display = "block";
      const selectedType = advancedTypeSelect ? advancedTypeSelect.value : "fixed_income";
      for (const [type, group] of Object.entries(advancedGroups)) {
        if (group) {
          group.style.display = (type === selectedType) ? "block" : "none";
        }
      }
    } else {
      if (advancedFieldsContainer) advancedFieldsContainer.style.display = "none";
      for (const group of Object.values(advancedGroups)) {
        if (group) group.style.display = "none";
      }
    }
  }

  if (advancedToggle) {
    advancedToggle.addEventListener("change", updateAdvancedFieldsUI);
  }
  if (advancedTypeSelect) {
    advancedTypeSelect.addEventListener("change", updateAdvancedFieldsUI);
  }

  function resetAdvancedInputs() {
    if (!advancedFieldsContainer) return;
    const inputs = advancedFieldsContainer.querySelectorAll("input, select");
    inputs.forEach(input => {
      if (input.tagName === "SELECT") {
        input.selectedIndex = 0;
      } else {
        input.value = "";
      }
    });
  }

  // Charts Instances
  let mainChart, pieChart, simChart;

  // --- Navigation Logic ---
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const viewId = item.getAttribute("data-view");
      triggerHaptic(15);
      switchView(viewId);

      // Close sidebar on mobile after click
      sidebar.classList.remove("mobile-active");
      mobileOverlay.classList.remove("active");
    });
  });

  // --- Bottom Navigation Listeners ---
  const bottomNavItems = document.querySelectorAll(".bottom-nav-item[data-view]");
  bottomNavItems.forEach((item) => {
    item.addEventListener("click", () => {
      const viewId = item.getAttribute("data-view");
      triggerHaptic(15);
      switchView(viewId);
    });
  });

  const bottomNavMore = document.getElementById("bottom-nav-more");
  if (bottomNavMore) {
    bottomNavMore.addEventListener("click", () => {
      triggerHaptic(20);
      sidebar.classList.add("mobile-active");
      mobileOverlay.classList.add("active");
    });
  }

  // --- Mobile Menu Logic ---
  menuToggle.addEventListener("click", () => {
    triggerHaptic(20);
    sidebar.classList.add("mobile-active");
    mobileOverlay.classList.add("active");
  });

  mobileOverlay.addEventListener("click", () => {
    sidebar.classList.remove("mobile-active");
    mobileOverlay.classList.remove("active");
  });

  // Sidebar Profile Click -> go to profile
  document.getElementById("sidebar-user-profile").addEventListener("click", () => {
    triggerHaptic(15);
    switchView("profile");
    sidebar.classList.remove("mobile-active");
    mobileOverlay.classList.remove("active");
  });

  // --- Toggle Table Filters on Mobile ---
  const btnToggleFilters = document.getElementById("btn-toggle-filters");
  if (btnToggleFilters) {
    btnToggleFilters.addEventListener("click", () => {
      triggerHaptic(15);
      const filterRow = document.querySelector(".filter-row");
      if (filterRow) {
        filterRow.classList.toggle("active");
        btnToggleFilters.classList.toggle("active");
        if (filterRow.classList.contains("active")) {
          btnToggleFilters.style.backgroundColor = "rgba(99, 102, 241, 0.15)";
          btnToggleFilters.style.borderColor = "var(--primary)";
        } else {
          btnToggleFilters.style.backgroundColor = "transparent";
          btnToggleFilters.style.borderColor = "rgba(99, 102, 241, 0.3)";
        }
      }
    });
  }

  // --- Swipe Gestures for Mobile View Swapping ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const mobileViews = ['dashboard', 'expenses', 'simulations', 'ai-advisor'];

  document.addEventListener('touchstart', (e) => {
    const ignoreSwipe = e.target.closest('canvas, input, select, textarea, button, .slider, [type="range"], .table-container, .ai-chat-messages');
    if (ignoreSwipe) return;

    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    // Only swipe if logged in
    const appVisible = appContainer && appContainer.style.display !== "none";
    if (!appVisible) return;

    const ignoreSwipe = e.target.closest('canvas, input, select, textarea, button, .slider, [type="range"], .table-container, .ai-chat-messages');
    if (ignoreSwipe) return;

    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;

    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > 110 && Math.abs(diffY) < 80) {
      const currentIdx = mobileViews.indexOf(state.currentView);
      if (currentIdx === -1) return;

      let newView = null;
      if (diffX < 0) {
        if (currentIdx < mobileViews.length - 1) {
          newView = mobileViews[currentIdx + 1];
        }
      } else {
        if (currentIdx > 0) {
          newView = mobileViews[currentIdx - 1];
        }
      }

      if (newView) {
        triggerHaptic(15);
        switchView(newView);
      }
    }
  }

  function switchView(viewId) {
    // Sync all sidebar items and bottom nav items
    document.querySelectorAll(`.nav-item, .bottom-nav-item`).forEach((nav) => {
      nav.classList.remove("active");
      if (nav.getAttribute("data-view") === viewId) {
        nav.classList.add("active");
      }
    });

    views.forEach((view) => {
      view.classList.remove("active");
      if (view.id === viewId) view.classList.add("active");
    });

    state.currentView = viewId;
    if (viewId === "dashboard") updateDashboard();
    if (viewId === "goals") renderGoals();
    if (viewId === "expenses") renderExpensesTable();
    if (viewId === "simulations") initSimulation();
    if (viewId === "history") renderHistory();
    if (viewId === "profile") updateProfileUI();
    if (viewId === "ai-advisor") {
      aiInsightsContainer.style.display = "none";
      aiStatusTitle.textContent = "Pronto para Analisar";
      aiStatusDesc.textContent = "Clique no botão abaixo para que eu analise suas finanças e forneça dicas personalizadas.";
    }
  }

  // --- Modal Logic ---
  newGoalBtn.addEventListener("click", () => {
    editingGoalId = null;
    document.querySelector("#goal-modal h2").textContent = "Criar Nova Meta";
    document.querySelector("#goal-form .btn-submit").textContent = "Salvar Meta";
    goalForm.reset();
    document.getElementById("goal-current").value = "0.00";
    goalModal.classList.add("active");
  });

  closeGoalModalBtn.addEventListener("click", () =>
    goalModal.classList.remove("active"),
  );

  newExpenseBtn.addEventListener("click", () => {
    editingTransactionId = null;
    modalTitle.textContent = "Registrar Novo Lançamento";
    btnSubmitExpense.textContent = "Salvar Registro";
    expenseForm.reset();
    installmentsGroup.style.display = "none";
    
    if (advancedToggle) {
      advancedToggle.checked = false;
      updateAdvancedFieldsUI();
      resetAdvancedInputs();
    }

    // Refresh the wallets select in the modal
    renderWalletsSelect();

    modal.classList.add("active");
  });

  closeModalBtn.addEventListener("click", () =>
    modal.classList.remove("active"),
  );

  addWalletBtn.addEventListener("click", () => {
    editingWalletId = null;
    document.querySelector("#wallet-modal h2").textContent = "Nova Carteira/Conta";
    document.querySelector("#wallet-form .btn-submit").textContent = "Salvar Carteira";
    walletForm.reset();
    document.getElementById("wallet-color").value = "#6366f1";
    document.getElementById("wallet-initial").value = "0.00";
    
    const overdraftInput = document.getElementById("wallet-overdraft");
    if (overdraftInput) overdraftInput.value = "0.00";

    walletModal.classList.add("active");
  });

  closeWalletModalBtn.addEventListener("click", () =>
    walletModal.classList.remove("active"),
  );

  setSalaryBtn.addEventListener("click", () => {
    document.getElementById("salary-input").value = state.salary;
    salaryModal.classList.add("active");
  });
  closeSalaryModal.addEventListener("click", () =>
    salaryModal.classList.remove("active"),
  );

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
    if (e.target === goalModal) goalModal.classList.remove("active");
    if (e.target === walletModal) walletModal.classList.remove("active");
    if (e.target === salaryModal) salaryModal.classList.remove("active");
    if (e.target === avatarModal) avatarModal.classList.remove("active");
    const closeMonthModalObj = document.getElementById("close-month-modal");
    if (closeMonthModalObj && e.target === closeMonthModalObj) closeMonthModalObj.classList.remove("active");
  });

  salaryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newSalary = parseFloat(document.getElementById("salary-input").value);
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      showToast("Atualizando salário...", "info");
      await update(ref(db, `users/${user.uid}/profile`), { salary: newSalary });
      
      state.salary = newSalary;
      updateDashboard();
      salaryModal.classList.remove("active");
      showToast("Salário atualizado!", "success");
    } catch (err) {
      console.error(err);
      showToast("Falha ao salvar salário no Firebase.", "error");
    }
  });

   const closeMonthModal = document.getElementById("close-month-modal");
  const closeMonthForm = document.getElementById("close-month-form");
  const closeMonthInput = document.getElementById("close-month-input");

  if (closeMonthModal) {
    const closeBtn = closeMonthModal.querySelector(".close-modal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => closeMonthModal.classList.remove("active"));
    }
  }

  closeMonthBtn.addEventListener("click", () => {
    // Set default value to current year and month (YYYY-MM)
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    if (closeMonthInput) closeMonthInput.value = `${now.getFullYear()}-${currentMonth}`;
    if (closeMonthModal) closeMonthModal.classList.add("active");
  });

  if (closeMonthForm) {
    closeMonthForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const selectedValue = closeMonthInput.value; // Format: "YYYY-MM"
      if (!selectedValue) return;

      const [year, month] = selectedValue.split("-");
      // Create a date using the local time so the month matches correctly
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
      const monthYearStr = dateObj.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();

      if (confirm(`Você está prestes a fechar o mês de ${monthYearStr}. Esta ação irá armazenar seu saldo no histórico e limpar todos os gastos variáveis.\nDeseja continuar?`)) {
        await closeMonth(monthYearStr);
        if (closeMonthModal) closeMonthModal.classList.remove("active");
      }
    });
  }

  runAiBtn.addEventListener("click", () => {
    if (!state.geminiKey) {
      showToast("Por favor, configure sua chave do Gemini primeiro!", "warning");
      return;
    }
    runAiAnalysis();
  });

  saveKeyBtn.addEventListener("click", async () => {
    const key = geminiKeyInput.value.trim();
    const user = auth.currentUser;
    if (key && user) {
      try {
        await update(ref(db, `users/${user.uid}/profile`), { geminiKey: key });

        state.geminiKey = key;
        showToast("Chave salva com sucesso!", "success");
        geminiKeyInput.value = "";
        geminiKeyInput.placeholder = "Chave configurada ••••••••";
      } catch (e) {
         showToast("Erro ao salvar chave.", "error");
      }
    }
  });

  if (state.geminiKey) {
    geminiKeyInput.placeholder = "Chave configurada ••••••••";
  }

  if (aiPersonaSelect) {
    aiPersonaSelect.value = state.aiPersona;
    aiPersonaSelect.addEventListener("change", async (e) => {
      const newPersona = e.target.value;
      const user = auth.currentUser;
      if (!user) return;
      try {
        await update(ref(db, `users/${user.uid}/profile`), { aiPersona: newPersona });
        state.aiPersona = newPersona;
        showToast("Personalidade IA atualizada!", "success");
      } catch (err) {
        showToast("Erro ao salvar personalidade.", "error");
      }
    });
  }

  expenseTypeSelect.addEventListener("change", () => {
    if (expenseTypeSelect.value === "debt") {
      installmentsGroup.style.display = "grid";
    } else {
      installmentsGroup.style.display = "none";
    }
  });

  // --- Type Toggle Logic (Expense vs Income) ---
  const btnTypeExpense = document.getElementById("btn-type-expense");
  const btnTypeIncome = document.getElementById("btn-type-income");
  const typeInput = document.getElementById("type");
  const expenseTypeContainer = document.getElementById("expense-type").parentElement;

  if (btnTypeExpense && btnTypeIncome) {
    btnTypeExpense.addEventListener("click", () => {
      btnTypeExpense.classList.add("active");
      btnTypeIncome.classList.remove("active");
      typeInput.value = "expense";
      expenseTypeContainer.style.display = "block";
      
      // Restore installments if it was debt
      if (expenseTypeSelect.value === "debt") {
        installmentsGroup.style.display = "grid";
      }
    });

    btnTypeIncome.addEventListener("click", () => {
      btnTypeIncome.classList.add("active");
      btnTypeExpense.classList.remove("active");
      typeInput.value = "income";
      expenseTypeContainer.style.display = "none";
      installmentsGroup.style.display = "none";
    });
  }

  // --- OCR Scanner (Gemini Vision) ---
  const ocrUploadBtn = document.getElementById("ocr-upload-btn");
  const ocrFileInput = document.getElementById("ocr-file-input");

  ocrUploadBtn.addEventListener("click", () => {
    if (!state.geminiKey) {
      showToast("Configure sua chave de API do Gemini na aba Conselheiro IA para usar o escâner de notas fiscais.", "warning");
      return;
    }
    ocrFileInput.click();
  });

  ocrFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show loading state
    const originalIcon = ocrUploadBtn.innerHTML;
    ocrUploadBtn.innerHTML = '<i data-lucide="loader-2" class="spin" style="width: 20px; height: 20px;"></i>';
    lucide.createIcons();
    ocrUploadBtn.disabled = true;

    try {
      // Convert to Base64
      const reader = new FileReader();
      const base64Data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });

      const prompt = `Analise esta imagem de nota fiscal/recibo. 
      Retorne APENAS um JSON válido sem nenhuma formatação markdown extra, contendo:
      {
        "desc": "Nome do estabelecimento ou resumo rápido da compra",
        "amount": "Valor total como um número float (ex: 25.50)",
        "category": "Uma destas exatas categorias: Alimentação, Moradia, Transporte, Lazer, Saúde, Investimentos, Outros"
      }`;

      // Call Gemini 2.5 Flash which has vision capabilities natively via contents payload
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: file.type, data: base64Data } }
            ]
          }]
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error.message);

      const aiText = result.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(aiText.replace(/```json\n?|```/g, "").trim());

      // Populate form
      if (parsedData.desc) document.getElementById("desc").value = parsedData.desc;
      if (parsedData.amount) document.getElementById("amount").value = parsedData.amount;
      if (parsedData.category) {
        const catSelect = document.getElementById("category");
        catSelect.value = parsedData.category;
        // If the API returns something invalid, fallback to Outros
        if (catSelect.selectedIndex === -1) catSelect.value = "Outros";
      }

      document.getElementById("type").value = "expense";
      document.getElementById("expense-type").value = "variable";

    } catch (error) {
      console.error("OCR Error:", error);
      showToast("Falha ao ler a nota fiscal. Tente novamente ou insira os dados manualmente.", "error");
    } finally {
      // Reset input and button
      ocrFileInput.value = "";
      ocrUploadBtn.innerHTML = originalIcon;
      lucide.createIcons();
      ocrUploadBtn.disabled = false;
    }
  });

  expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const type = document.getElementById("type").value;
    const expenseType = document.getElementById("expense-type").value;

    let advancedData = null;
    if (advancedToggle && advancedToggle.checked) {
      const advType = advancedTypeSelect ? advancedTypeSelect.value : "fixed_income";
      advancedData = { type: advType };
      
      if (advType === "fixed_income") {
        advancedData.subtype = document.getElementById("rf-subtype").value;
        advancedData.index = document.getElementById("rf-index").value;
        advancedData.rate = parseFloat(document.getElementById("rf-rate").value) || 0;
        advancedData.maturity = document.getElementById("rf-maturity").value;
      } else if (advType === "variable_income") {
        advancedData.ticker = document.getElementById("rv-ticker").value.toUpperCase();
        advancedData.operation = document.getElementById("rv-operation").value;
        advancedData.qty = parseFloat(document.getElementById("rv-qty").value) || 0;
        advancedData.price = parseFloat(document.getElementById("rv-price").value) || 0;
      } else if (advType === "financing") {
        advancedData.operation = document.getElementById("fin-operation").value;
        advancedData.amort = document.getElementById("fin-amort").value;
        advancedData.rate = parseFloat(document.getElementById("fin-rate").value) || 0;
        advancedData.term = parseInt(document.getElementById("fin-term").value) || 0;
      } else if (advType === "consortium") {
        advancedData.value = parseFloat(document.getElementById("cons-value").value) || 0;
        advancedData.admin = parseFloat(document.getElementById("cons-admin").value) || 0;
        advancedData.reserve = parseFloat(document.getElementById("cons-reserve").value) || 0;
        advancedData.status = document.getElementById("cons-status").value;
      } else if (advType === "credit_loan") {
        advancedData.operation = document.getElementById("loan-op").value;
        advancedData.rate = parseFloat(document.getElementById("loan-rate").value) || 0;
      }
    }

    const transactionData = {
      desc: document.getElementById("desc").value,
      amount: parseFloat(document.getElementById("amount").value),
      type: type,
      walletId: document.getElementById("wallet").value,
      expenseType: type === 'expense' ? expenseType : null,
      category: document.getElementById("category").value,
      date: document.getElementById("date").value,
      confirmed: type === 'expense' && expenseType === 'variable' ? false : true,
      installments: (type === 'expense' && expenseType === 'debt') ? {
        current: parseInt(document.getElementById("current-installment").value),
        total: parseInt(document.getElementById("total-installments").value)
      } : null,
      advanced: advancedData
    };

    try {
      if (editingTransactionId) {
        await update(ref(db, `users/${user.uid}/transactions/${editingTransactionId}`), transactionData);
        
        const index = state.transactions.findIndex(t => t.id === editingTransactionId);
        state.transactions[index] = { id: editingTransactionId, ...transactionData };
      } else {
        const newRef = push(ref(db, `users/${user.uid}/transactions`));
        await set(newRef, transactionData);
        state.transactions.unshift({ id: newRef.key, ...transactionData });
      }

      updateDashboard();
      renderExpensesTable();
      modal.classList.remove("active");
      expenseForm.reset();
      installmentsGroup.style.display = "none";
      editingTransactionId = null;
      showToast("Lançamento salvo!", "success");

    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar no Firebase.", "error");
    }
  });

  // --- Logout ---
  document.getElementById("logout-btn").addEventListener("click", () => {
    if (confirm("Deseja sair da sua conta?")) {
      performLogout();
    }
  });

  document.getElementById("profile-logout-btn").addEventListener("click", () => {
    if (confirm("Deseja sair da sua conta?")) {
      performLogout();
    }
  });

  function performLogout() {
    auth.signOut();
    appContainer.style.display = "none";
    authScreen.style.display = "flex";
    // Reset state
    state = { salary: 5000, history: [], transactions: [], goals: [], categoryLimits: {}, wallets: [], geminiKey: null, currentView: "dashboard" };
    // Reset forms
    loginForm.reset();
    registerForm.reset();
    loginError.style.display = "none";
    registerError.style.display = "none";
    loginCard.style.display = "block";
    registerCard.style.display = "none";
    lucide.createIcons();
  }

  // --- Data Management (per-user / API Sync) ---
  async function saveState() {
    // This is now handled automatically by Firebase Realtime Database
    console.log("saveState called: state is persisted in Firebase.");
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  function updateDashboard() {
    // Rendas ordinárias (incluindo salário e transações de tipo income que não sejam proventos/dividendos de investimentos)
    const totalExtraIncome = state.transactions
      .filter((t) => t.type === "income" && (!t.advanced || t.advanced.type !== "variable_income" || t.advanced.operation !== "dividend"))
      .reduce((acc, t) => acc + t.amount, 0);

    const totalIncome = state.salary + totalExtraIncome; // Fixed salary base + extra ordinário

    // Despesas ordinárias (não avançadas, ou amortizações ordinárias)
    const confirmedExpenses = state.transactions
      .filter((t) => t.type === "expense" && t.confirmed !== false)
      .reduce((acc, t) => acc + t.amount, 0);

    const pendingExpenses = state.transactions
      .filter((t) => t.type === "expense" && t.confirmed === false)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = confirmedExpenses + pendingExpenses;

    // --- Cálculo Patrimonial Avançado ---
    let totalInvested = 0;
    let totalLiabilities = 0;
    let totalPassiveIncome = 0;

    state.transactions.forEach(t => {
      if (!t.advanced) return;
      const adv = t.advanced;
      const amount = Number(t.amount) || 0;

      if (adv.type === "fixed_income") {
        if (t.type === "expense") {
          totalInvested += amount;
        } else if (t.type === "income") {
          totalInvested = Math.max(0, totalInvested - amount);
        }
      } else if (adv.type === "variable_income") {
        if (adv.operation === "buy") {
          totalInvested += amount;
        } else if (adv.operation === "sell") {
          totalInvested = Math.max(0, totalInvested - amount);
        } else if (adv.operation === "dividend") {
          totalPassiveIncome += amount;
        }
      } else if (adv.type === "financing") {
        if (adv.operation === "financing") {
          totalLiabilities += amount;
        } else if (t.type === "expense") {
          // 70% amortiza o principal, 30% são juros
          totalLiabilities = Math.max(0, totalLiabilities - amount * 0.7);
        }
      } else if (adv.type === "consortium") {
        if (t.type === "expense") {
          // 80% vai para fundo acumulado (patrimônio), 20% taxas ordinárias
          totalInvested += amount * 0.8;
        }
        if (adv.status === "contemplated") {
          // Carta de crédito entra como ativo liberado e saldo devedor passivo
          totalLiabilities += adv.value;
        }
      } else if (adv.type === "credit_loan") {
        if (adv.operation === "take") {
          totalLiabilities += amount;
        } else if (adv.operation === "pay" || adv.operation === "extra_term" || adv.operation === "extra_value") {
          totalLiabilities = Math.max(0, totalLiabilities - amount);
        }
      }
    });

    // --- Saldo das Carteiras e Cheque Especial ---
    // Carteira Principal: salary + default income - default expense
    const defaultTxs = state.transactions.filter(t => !t.walletId || t.walletId === "default");
    const dInc = state.salary + defaultTxs.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const dExp = defaultTxs.filter(t => t.type === "expense" && t.confirmed !== false).reduce((a, t) => a + t.amount, 0);
    let defaultBalance = dInc - dExp;

    let balance = defaultBalance;
    let isAnyWalletInOverdraft = defaultBalance < 0;

    state.wallets.forEach(w => {
      const wTxs = state.transactions.filter(t => t.walletId == w.id);
      const wInc = wTxs.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
      const wExp = wTxs.filter(t => t.type === "expense" && t.confirmed !== false).reduce((a, t) => a + t.amount, 0);
      const wBal = w.initial + wInc - wExp;
      balance += wBal;
      
      if (wBal < 0) {
        isAnyWalletInOverdraft = true;
      }
    });

    if (balance < 0) {
      isAnyWalletInOverdraft = true;
    }

    // Glow Vermelho no Card de Saldo
    const balanceCard = document.querySelector(".stat-card.balance");
    if (balanceCard) {
      if (isAnyWalletInOverdraft) {
        balanceCard.classList.add("overdraft-active");
      } else {
        balanceCard.classList.remove("overdraft-active");
      }
    }

    console.log("Dashboard update:", {
      salary: state.salary,
      extraIncome: totalExtraIncome,
      totalIncome,
      confirmedExpenses,
      pendingExpenses,
      totalExpenses,
      balance,
      totalInvested,
      totalLiabilities,
      totalPassiveIncome,
      transactionsCount: state.transactions.length
    });

    const elIncome = document.getElementById("total-income");
    const elExpenses = document.getElementById("total-expenses");
    const elBalance = document.getElementById("current-balance");
    const elInvested = document.getElementById("invested-assets");
    const elLiabilities = document.getElementById("liabilities-debts");
    const elPassive = document.getElementById("passive-income");

    // Parse current displayed values for smooth transition
    const parseCurrency = (el) => {
      if (!el) return 0;
      const text = el.textContent.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
      return parseFloat(text) || 0;
    };

    if (elIncome) animateValue(elIncome, parseCurrency(elIncome), totalIncome);
    if (elExpenses) animateValue(elExpenses, parseCurrency(elExpenses), totalExpenses);
    if (elBalance) {
      animateValue(elBalance, parseCurrency(elBalance), balance);
      elBalance.style.color = balance >= 0 ? "var(--success)" : "var(--danger)";
    }
    if (elInvested) animateValue(elInvested, parseCurrency(elInvested), totalInvested);
    if (elLiabilities) animateValue(elLiabilities, parseCurrency(elLiabilities), totalLiabilities);
    if (elPassive) animateValue(elPassive, parseCurrency(elPassive), totalPassiveIncome);

    renderRecentTransactions();
    initMainChart();
    initPieChart();
    if (state.currentView === "simulations") {
      initSimulation();
    }
    renderBudgets();
    renderDashboardWallets();
  }

  function renderRecentTransactions() {
    recentTableBody.innerHTML = "";
    state.transactions.slice(0, 5).forEach((t) => {
      const row = document.createElement("tr");
      let installmentInfo = "";
      if (t.expenseType === 'debt' && t.installments) {
        installmentInfo = `<br><small style="color: var(--text-muted)">Parcela ${t.installments.current}/${t.installments.total}</small>`;
      }

      const typeLabel = t.expenseType === 'fixed' ? 'Fixo' : (t.expenseType === 'debt' ? 'Dívida' : (t.type === 'income' ? 'Receita' : 'Variável'));
      const statusClass = t.confirmed === false ? 'status-pending' : `status-${t.type}`;
      const statusLabel = t.confirmed === false ? 'Pendente' : typeLabel;

      let walletBadge = "";
      if (t.walletId && t.walletId !== "default") {
        const w = state.wallets.find(wa => wa.id == t.walletId);
        if (w) {
          walletBadge = `<br><span class="badge" style="background:${w.color}20;color:${w.color};padding:2px 6px;border-radius:4px;font-size:0.7rem;">${w.name}</span>`;
        }
      }

      row.innerHTML = `
                <td data-label="Descrição">${escapeHTML(t.desc)}${installmentInfo}${walletBadge}</td>
                <td data-label="Categoria">${escapeHTML(t.category)}</td>
                <td data-label="Data">${new Date(t.date + 'T12:00:00').toLocaleDateString("pt-BR")}</td>
                <td data-label="Valor" style="font-weight: 600; color: ${t.type === "income" ? "var(--success)" : "var(--danger)"}">
                    ${t.type === "income" ? "+" : "-"} ${formatCurrency(t.amount)}
                </td>
                <td data-label="Status"><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            `;
      recentTableBody.appendChild(row);
    });
  }

  function renderExpensesTable() {
    // Delegated to renderFilteredExpensesTable (defined later) when filters are initialized
    if (typeof renderFilteredExpensesTable === 'function') {
      renderFilteredExpensesTable();
      return;
    }
    allExpensesTableBody.innerHTML = "";

    const sortedTransactions = [...state.transactions].sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return 0;
    });

    let currentCategory = "";

    sortedTransactions.forEach((t) => {
      if (t.category !== currentCategory) {
        currentCategory = t.category;
        const headerRow = document.createElement("tr");
        headerRow.className = "category-row";
        headerRow.innerHTML = `<td colspan="5">${escapeHTML(currentCategory)}</td>`;
        allExpensesTableBody.appendChild(headerRow);
      }

      const row = document.createElement("tr");
      if (t.confirmed === false) row.className = "unconfirmed-row";

      let installmentInfo = "";
      if (t.expenseType === 'debt' && t.installments) {
        installmentInfo = `<br><small style="color: var(--text-muted)">Parcela ${t.installments.current}/${t.installments.total}</small>`;
      }

      const typeLabel = t.expenseType === 'fixed' ? 'Fixo' : (t.expenseType === 'debt' ? 'Dívida' : (t.type === 'income' ? 'Receita' : 'Variável'));
      const statusClass = t.confirmed === false ? 'status-pending' : `status-${t.type}`;
      const statusLabel = t.confirmed === false ? 'Pendente' : typeLabel;

      let confirmBtn = "";
      if (t.confirmed === false) {
        confirmBtn = `
                <button class="btn-confirm" onclick="confirmTransaction('${t.id}')">
                    <i data-lucide="check" style="width: 14px"></i> Confirmar
                </button>
          `;
      }

      row.innerHTML = `
                <td data-label="Descrição">${escapeHTML(t.desc)}${installmentInfo}</td>
                <td data-label="Categoria">${escapeHTML(t.category)}</td>
                <td data-label="Data">${new Date(t.date + 'T12:00:00').toLocaleDateString("pt-BR")}</td>
                <td data-label="Valor" style="font-weight: 600; color: ${t.type === "income" ? "var(--success)" : "var(--danger)"}">
                    ${t.type === "income" ? "+" : "-"} ${formatCurrency(t.amount)}
                </td>
                <td data-label="Ações">
                    <div style="display: flex; align-items: center; gap: 8px">
                        <span class="status-badge ${statusClass}">${statusLabel}</span>
                        ${confirmBtn}
                        <button class="btn-text" onclick="editTransaction('${t.id}')">
                            <i data-lucide="edit-3" style="width: 18px; color: var(--primary)"></i>
                        </button>
                        <button class="btn-text" onclick="deleteTransaction('${t.id}')">
                            <i data-lucide="trash-2" style="width: 18px; color: var(--danger)"></i>
                        </button>
                    </div>
                </td>
            `;
      allExpensesTableBody.appendChild(row);
    });
    lucide.createIcons();
  }

  window.confirmTransaction = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    const t = state.transactions.find(t => t.id === id);
    if (t) {
      try {
        await update(ref(db, `users/${user.uid}/transactions/${id}`), { confirmed: true });
        
        t.confirmed = true;
        updateDashboard();
        renderExpensesTable();
        showToast("Transação confirmada!", "success");
      } catch (err) {
        console.error(err);
        showToast("Erro ao confirmar transação no Firebase", "error");
      }
    }
  };

  function renderHistory() {
    historyList.innerHTML = "";
    if (state.history.length === 0) {
      historyList.innerHTML = '<p style="color: var(--text-muted)">Nenhum mês fechado ainda.</p>';
      return;
    }

    state.history.forEach((h) => {
      const card = document.createElement("div");
      card.className = "history-card";
      card.innerHTML = `
                <div class="history-card-header">
                    <h4>${h.monthYear}</h4>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i data-lucide="check-circle" style="color: var(--success)"></i>
                        <button class="btn-icon" onclick="deleteHistory('${h.id}')" title="Excluir fechamento" style="background:none; border:none; cursor:pointer; padding:5px; display:flex; align-items:center; justify-content:center; transition: transform 0.2s;">
                            <i data-lucide="trash-2" style="width:18px;height:18px;color:var(--danger);"></i>
                        </button>
                    </div>
                </div>
                <div class="history-stats">
                    <div class="history-stat-row">
                        <span class="history-stat-label">Renda:</span>
                        <span class="history-stat-value" style="color: var(--success)">${formatCurrency(h.income)}</span>
                    </div>
                    <div class="history-stat-row">
                        <span class="history-stat-label">Gastos:</span>
                        <span class="history-stat-value" style="color: var(--danger)">${formatCurrency(h.expenses)}</span>
                    </div>
                    <div class="history-stat-row" style="margin-top: 10px; border-top: 1px solid var(--border); padding-top: 10px;">
                        <span class="history-stat-label">Saldo Final:</span>
                        <span class="history-stat-value">${formatCurrency(h.balance)}</span>
                    </div>
                </div>
            `;
      historyList.appendChild(card);
    });
    lucide.createIcons();
  }

  window.deleteHistory = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    if (confirm("Deseja realmente excluir este fechamento permanentemente?")) {
      try {
        showToast("Excluindo fechamento...", "info");
        await remove(ref(db, `users/${user.uid}/history/${id}`));
        state.history = state.history.filter(h => h.id !== id);
        renderHistory();
        showToast("Fechamento removido com sucesso!", "success");
      } catch (err) {
        console.error(err);
        showToast("Erro ao excluir fechamento do Firebase", "error");
      }
    }
  };

  async function closeMonth(monthYearStr) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      showToast("Fechando o mês e processando dados...", "info");

      const totalExtraIncome = state.transactions
        .filter((t) => t.type === "income")
        .reduce((acc, t) => acc + t.amount, 0);
      const totalExpenses = state.transactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0);
      const income = state.salary + totalExtraIncome;
      const balance = income - totalExpenses;

      const monthYear = monthYearStr || new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).toUpperCase();

      const historyData = {
        monthYear: monthYear,
        income,
        expenses: totalExpenses,
        balance
      };

      // 1. Salvar no histórico no Firebase
      const historyRef = push(ref(db, `users/${user.uid}/history`));
      await set(historyRef, historyData);

      // 2. Limpar transações (exceto fixos e dívidas que devem continuar no próximo mês se necessário)
      // Nota: A lógica original da API PHP fazia um processamento complexo.
      // Aqui vamos apenas limpar as transações variáveis e manter as outras conforme o app esperaria.
      // Mas para simplificar conforme o pedido "readaptar tudo", vamos limpar o nó transactions 
      // ou filtrar os que devem ficar.
      
      const newTransactions = state.transactions.filter(t => t.expenseType === 'fixed' || t.expenseType === 'debt');
      
      // No Firebase, vamos substituir o nó transactions pelo novo conjunto (ou remover um por um)
      // Para ser eficiente, vamos construir o novo objeto
      const transactionsObj = {};
      newTransactions.forEach(t => {
        const {id, ...data} = t;
        // Se for dívida, atualizar parcela
        if (data.expenseType === 'debt' && data.installments) {
            data.installments.current += 1;
            // Se já pagou tudo, não adicionar (ou marcar como concluída)
            if (data.installments.current > data.installments.total) return;
        }
        transactionsObj[id] = data;
      });

      await set(ref(db, `users/${user.uid}/transactions`), transactionsObj);

      // 3. Recarregar dados
      await loadAppDataAPI();
      
      updateDashboard();
      renderHistory();
      renderExpensesTable();
      showToast("Mês fechado com sucesso! Gastos fixos e parcelas foram transferidos.", "success", 5000);
      
    } catch (err) {
      console.error(err);
      showToast("Falha ao fechar o mês no Firebase.", "error");
    }
  }

  async function runAiAnalysis() {
    aiStatusTitle.textContent = "IA está pensando...";
    aiStatusDesc.textContent = "Enviando seus dados para o Gemini realizar uma análise financeira estratégica...";

    const totalExtraIncome = state.transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = state.transactions
      .filter((t) => t.type === "expense" && t.confirmed !== false)
      .reduce((acc, t) => acc + t.amount, 0);
    const totalIncome = state.salary + totalExtraIncome;
    const balance = totalIncome - totalExpenses;

    const dataSummary = {
      rendaTotal: totalIncome,
      gastosTotais: totalExpenses,
      saldoAtual: balance,
      transacoes: state.transactions.slice(0, 5).map(t => `${t.desc}: R$${t.amount} (${t.category})`),
      historico: state.history.slice(0, 3).map(h => `${h.monthYear}: Saldo R$${h.balance}`)
    };

    let personaContext = "consultor financeiro pessoal focado em economias familiares";
    if (state.aiPersona === "mercado") personaContext = "analista de mercado financeiro focado em investimentos, rendimentos e tendências econômicas";
    if (state.aiPersona === "loja") personaContext = "consultor de negócios e gestão de loja focado em lucro, fluxo de caixa e estratégias de vendas";
    if (state.aiPersona === "agressivo") personaContext = "especialista financeiro agressivo focado em metas rígidas e cortes severos de gastos";

    const prompt = `Atue como um ${personaContext}. Analise estes dados brasileiros: ${JSON.stringify(dataSummary)}. 
    Gere 3 conselhos curtos e práticos em formato JSON puro (sem markdown) no seguinte formato:
    [
        {"title": "Título", "badge": "Crítico|Foco|Elogio", "badgeClass": "badge-danger|badge-warning|badge-positive", "icon": "lucide-icon-name", "desc": "Sua dica aqui"}
    ]
    Use ícones como: trending-up, alert-triangle, shield, credit-card. Responda APENAS o JSON.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const result = await response.json();
      const aiText = result.candidates[0].content.parts[0].text;
      const insights = JSON.parse(aiText.replace(/```json|```/g, ""));
      renderAiInsights(insights);
    } catch (error) {
      console.error("Erro na IA:", error);
      aiStatusTitle.textContent = "Erro na Conexão";
      aiStatusDesc.textContent = "Não foi possível conectar com o Gemini. Verifique sua chave e internet.";
    }
  }

  function renderAiInsights(insights) {
    aiStatusTitle.textContent = "Análise Concluída";
    aiStatusDesc.textContent = "Geramos insights personalizados com base no seu comportamento financeiro atual.";
    aiInsightsContainer.style.display = "grid";
    aiInsightsContainer.innerHTML = "";

    insights.forEach(insight => {
      const card = document.createElement("div");
      card.className = "insight-card";
      card.innerHTML = `
            <span class="insight-badge ${insight.badgeClass}">${insight.badge}</span>
            <div class="insight-header">
                <div class="insight-icon"><i data-lucide="${insight.icon}"></i></div>
                <h4>${insight.title}</h4>
            </div>
            <div class="insight-body">
                <p>${insight.desc}</p>
            </div>
        `;
      aiInsightsContainer.appendChild(card);
    });
    lucide.createIcons();
  }

  window.editTransaction = (id) => {
    const t = state.transactions.find(t => t.id === id);
    if (!t) return;

    editingTransactionId = id;
    modalTitle.textContent = "Editar Lançamento";
    btnSubmitExpense.textContent = "Atualizar Registro";

    document.getElementById("desc").value = t.desc;
    document.getElementById("amount").value = t.amount;
    // Update Hidden Type and Toggle UI
    const typeInput = document.getElementById("type");
    if (typeInput) typeInput.value = t.type;
    
    const btnTypeExpense = document.getElementById("btn-type-expense");
    const btnTypeIncome = document.getElementById("btn-type-income");
    const expenseTypeContainer = document.getElementById("expense-type").parentElement;
    
    if (t.type === 'expense') {
      if (btnTypeExpense) btnTypeExpense.classList.add("active");
      if (btnTypeIncome) btnTypeIncome.classList.remove("active");
      if (expenseTypeContainer) expenseTypeContainer.style.display = "block";
    } else {
      if (btnTypeIncome) btnTypeIncome.classList.add("active");
      if (btnTypeExpense) btnTypeExpense.classList.remove("active");
      if (expenseTypeContainer) expenseTypeContainer.style.display = "none";
    }

    document.getElementById("expense-type").value = t.expenseType || 'variable';
    document.getElementById("category").value = t.category;
    document.getElementById("date").value = t.date;
    
    const walletSelect = document.getElementById("wallet");
    if (walletSelect) walletSelect.value = t.walletId || "default";

    const installmentsGroup = document.getElementById("installments-group");
    if (t.expenseType === 'debt' && t.installments) {
      if (installmentsGroup) installmentsGroup.style.display = "grid";
      document.getElementById("current-installment").value = t.installments.current;
      document.getElementById("total-installments").value = t.installments.total;
    } else {
      if (installmentsGroup) installmentsGroup.style.display = "none";
    }

    // Repopulate Advanced Fields
    if (t.advanced) {
      if (advancedToggle) advancedToggle.checked = true;
      if (advancedTypeSelect) advancedTypeSelect.value = t.advanced.type;
      updateAdvancedFieldsUI();
      
      const advType = t.advanced.type;
      if (advType === "fixed_income") {
        document.getElementById("rf-subtype").value = t.advanced.subtype || "CDB";
        document.getElementById("rf-index").value = t.advanced.index || "CDI";
        document.getElementById("rf-rate").value = t.advanced.rate || "";
        document.getElementById("rf-maturity").value = t.advanced.maturity || "";
      } else if (advType === "variable_income") {
        document.getElementById("rv-ticker").value = t.advanced.ticker || "";
        document.getElementById("rv-operation").value = t.advanced.operation || "buy";
        document.getElementById("rv-qty").value = t.advanced.qty || "";
        document.getElementById("rv-price").value = t.advanced.price || "";
      } else if (advType === "financing") {
        document.getElementById("fin-operation").value = t.advanced.operation || "financing";
        document.getElementById("fin-amort").value = t.advanced.amort || "SAC";
        document.getElementById("fin-rate").value = t.advanced.rate || "";
        document.getElementById("fin-term").value = t.advanced.term || "";
      } else if (advType === "consortium") {
        document.getElementById("cons-value").value = t.advanced.value || "";
        document.getElementById("cons-admin").value = t.advanced.admin || "";
        document.getElementById("cons-reserve").value = t.advanced.reserve || "";
        document.getElementById("cons-status").value = t.advanced.status || "waiting";
      } else if (advType === "credit_loan") {
        document.getElementById("loan-op").value = t.advanced.operation || "take";
        document.getElementById("loan-rate").value = t.advanced.rate || "";
      }
    } else {
      if (advancedToggle) advancedToggle.checked = false;
      updateAdvancedFieldsUI();
      resetAdvancedInputs();
    }

    modal.classList.add("active");
  };

  window.deleteTransaction = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    if (confirm("Tem certeza que deseja excluir este lançamento?")) {
      try {
        await remove(ref(db, `users/${user.uid}/transactions/${id}`));
        
        state.transactions = state.transactions.filter((t) => t.id !== id);
        renderExpensesTable();
        updateDashboard();
        showToast("Lançamento excluído com sucesso", "success");
      } catch (err) {
        console.error(err);
        showToast("Erro ao excluir do Firebase", "error");
      }
    }
  };

  // --- Charts Logic ---
  function initMainChart() {
    const ctx = document.getElementById("mainChart").getContext("2d");
    if (mainChart) mainChart.destroy();

    const incomeGradient = ctx.createLinearGradient(0, 0, 0, 400);
    incomeGradient.addColorStop(0, "rgba(99, 102, 241, 0.3)");
    incomeGradient.addColorStop(1, "rgba(99, 102, 241, 0)");

    const expenseGradient = ctx.createLinearGradient(0, 0, 0, 400);
    expenseGradient.addColorStop(0, "rgba(239, 68, 68, 0.2)");
    expenseGradient.addColorStop(1, "rgba(239, 68, 68, 0)");

    const lastHistory = [...state.history].reverse().slice(-5);
    const currentExtraIncome = state.transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
    const currentExpenses = state.transactions
      .filter((t) => t.type === "expense" && t.confirmed !== false)
      .reduce((acc, t) => acc + t.amount, 0);
    const currentIncome = state.salary + currentExtraIncome;
    const currentMonthLabel = new Date().toLocaleDateString("pt-BR", { month: "short" }).toUpperCase();

    const labels = lastHistory.map(h => h.monthYear.split(' ')[0].substring(0, 3).toUpperCase());
    labels.push(currentMonthLabel);

    const incomeData = lastHistory.map(h => h.income);
    incomeData.push(currentIncome);

    const expenseData = lastHistory.map(h => h.expenses);
    expenseData.push(currentExpenses);

    mainChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Entradas",
            data: incomeData,
            borderColor: "#6366f1",
            backgroundColor: incomeGradient,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: "#6366f1",
            pointBorderColor: "rgba(255,255,255,0.2)",
            pointBorderWidth: 2,
            borderWidth: 3
          },
          {
            label: "Saídas",
            data: expenseData,
            borderColor: "#ef4444",
            backgroundColor: expenseGradient,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: "#ef4444",
            pointBorderColor: "rgba(255,255,255,0.2)",
            pointBorderWidth: 2,
            borderWidth: 3
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 10, bottom: 30, left: 10, right: 10 }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: "#94a3b8",
              usePointStyle: true,
              padding: 25,
              font: { family: 'Outfit', size: 12, weight: '500' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: 'Outfit', size: 14, weight: '700' },
            bodyFont: { family: 'Outfit', size: 13 },
            padding: 15,
            cornerRadius: 12,
            displayColors: true,
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function (context) {
                return ' ' + context.dataset.label + ': ' + formatCurrency(context.parsed.y);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255,255,255,0.03)", drawBorder: false },
            ticks: {
              color: "#64748b",
              font: { family: 'Outfit', size: 11 },
              callback: (v) => 'R$ ' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v)
            },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#64748b", font: { family: 'Outfit', size: 11 } }
          },
        },
      },
    });
  }

  function initPieChart() {
    const ctx = document.getElementById("pieChart").getContext("2d");
    if (pieChart) pieChart.destroy();

    const categories = {};
    state.transactions
      .filter((t) => t.type === "expense" && t.confirmed !== false)
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    pieChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(categories),
        datasets: [
          {
            data: Object.values(categories),
            backgroundColor: [
              "#6366f1",
              "#a855f7",
              "#ec4899",
              "#f97316",
              "#22c55e",
              "#06b6d4",
            ],
            hoverBackgroundColor: [
              "#4f46e5",
              "#9333ea",
              "#db2777",
              "#ea580c",
              "#16a34a",
              "#0891b2",
            ],
            borderWidth: 0,
            hoverOffset: 20
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        layout: {
          padding: 10
        },
        plugins: {
          legend: {
            position: window.innerWidth < 1200 ? "bottom" : "right",
            align: 'center',
            labels: {
              color: "#94a3b8",
              usePointStyle: true,
              padding: 15,
              font: { family: 'Outfit', size: 11 }
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: 'Outfit', size: 14, weight: '700' },
            bodyFont: { family: 'Outfit', size: 13 },
            padding: 12,
            cornerRadius: 12,
            displayColors: true,
            callbacks: {
              label: function (context) {
                return ' ' + context.label + ': ' + formatCurrency(context.parsed);
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      },
    });
  }

  window.addEventListener('resize', () => {
    if (pieChart) {
      const newPos = window.innerWidth < 1200 ? "bottom" : "right";
      if (pieChart.options.plugins.legend.position !== newPos) {
        pieChart.options.plugins.legend.position = newPos;
        pieChart.update();
      }
    }
  });

// ===================================
// SIMULATION LOGIC (CORRIGIDO)
// ===================================
const simRange = document.getElementById("sim-expense-range");
const simLabel = document.getElementById("expense-label");

simRange.addEventListener("input", () => {
  simLabel.textContent = `${simRange.value}%`;
  initSimulation();
});
  
function initSimulation() {
  try {
    console.log("🚀 initSimulation chamada com suporte a operações financeiras avançadas");

    const canvas = document.getElementById("simulationChart");
    if (!canvas) {
      console.error("❌ Canvas não encontrado!");
      return;
    }

    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
    if (simChart) { simChart.destroy(); simChart = null; }

    const ctx = canvas.getContext("2d");
    const sliderValue = parseInt(simRange.value) || 0;
    const multiplier = 1 + sliderValue / 100;

    // --- 1. Calcular Saldos e KPIs Reais do Presente ---
    let currentBalance = 0;
    let currentInvested = 0;
    let currentLiabilities = 0;
    let currentPassive = 0;

    // Carteira Principal
    const defaultTxs = state.transactions.filter(t => !t.walletId || t.walletId === "default");
    const dInc = state.salary + defaultTxs.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const dExp = defaultTxs.filter(t => t.type === "expense" && t.confirmed !== false).reduce((a, t) => a + t.amount, 0);
    currentBalance = dInc - dExp;

    // Outras carteiras
    state.wallets.forEach(w => {
      const wTxs = state.transactions.filter(t => t.walletId == w.id);
      const wInc = wTxs.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
      const wExp = wTxs.filter(t => t.type === "expense" && t.confirmed !== false).reduce((a, t) => a + t.amount, 0);
      currentBalance += (w.initial + wInc - wExp);
    });

    // KPIs Patrimoniais
    state.transactions.forEach(t => {
      if (!t.advanced) return;
      const adv = t.advanced;
      const amount = Number(t.amount) || 0;

      if (adv.type === "fixed_income") {
        if (t.type === "expense") currentInvested += amount;
        else if (t.type === "income") currentInvested = Math.max(0, currentInvested - amount);
      } else if (adv.type === "variable_income") {
        if (adv.operation === "buy") currentInvested += amount;
        else if (adv.operation === "sell") currentInvested = Math.max(0, currentInvested - amount);
        else if (adv.operation === "dividend") currentPassive += amount;
      } else if (adv.type === "financing") {
        if (adv.operation === "financing") currentLiabilities += amount;
        else if (t.type === "expense") currentLiabilities = Math.max(0, currentLiabilities - amount * 0.7);
      } else if (adv.type === "consortium") {
        if (t.type === "expense") currentInvested += amount * 0.8;
        if (adv.status === "contemplated") currentLiabilities += adv.value;
      } else if (adv.type === "credit_loan") {
        if (adv.operation === "take") currentLiabilities += amount;
        else if (adv.operation === "pay" || adv.operation === "extra_term" || adv.operation === "extra_value") {
          currentLiabilities = Math.max(0, currentLiabilities - amount);
        }
      }
    });

    // --- 2. Projeção de 12 Meses ---
    // Renda ordinária mensal
    const currentExtraIncome = state.transactions
      .filter((t) => t.type === "income" && (!t.advanced || t.advanced.type !== "variable_income" || t.advanced.operation !== "dividend"))
      .reduce((acc, t) => acc + t.amount, 0);
    const monthlyIncome = state.salary + currentExtraIncome;

    // Despesas ordinárias mensais
    const confirmedExpenses = state.transactions
      .filter((t) => t.type === "expense" && t.confirmed !== false && !t.advanced)
      .reduce((acc, t) => acc + t.amount, 0);
    const pendingExpenses = state.transactions
      .filter((t) => t.type === "expense" && t.confirmed === false && !t.advanced)
      .reduce((acc, t) => acc + t.amount, 0);
    const monthlyExpenses = confirmedExpenses + pendingExpenses;

    // Despesas de parcelas avançadas (financiamentos, empréstimos)
    const monthlyDebtPayments = state.transactions
      .filter(t => t.type === "expense" && t.advanced && (t.advanced.type === "financing" || t.advanced.type === "credit_loan"))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    let simBalance = currentBalance;
    let simInvested = currentInvested;
    let simLiabilities = currentLiabilities;
    let simPassive = currentPassive;

    const simulatedBalance = [];

    for (let m = 1; m <= 12; m++) {
      // Rentabilidade mensal dos ativos (0.85% ao mês pro rata CDB/Bolsa médio)
      const investmentReturn = simInvested * 0.0085;
      simInvested += investmentReturn;

      // Renda passiva somada aos proventos diretos
      const currentPassiveReturn = simPassive + investmentReturn;

      // Juros incidentes sob passivos imobiliários / empréstimos (0.6% a.m. SAC/Price médio)
      const debtInterest = simLiabilities * 0.006;
      simLiabilities += debtInterest;
      simLiabilities = Math.max(0, simLiabilities - monthlyDebtPayments);

      // Despesa total no mês com base no slider (ordinário + parcelas financeiras)
      const totalAdjustedExpense = (monthlyExpenses + monthlyDebtPayments) * multiplier;

      // Fluxo de caixa líquido mensal
      let netCashFlow = monthlyIncome + currentPassiveReturn - totalAdjustedExpense;

      // Se adentrou o cheque especial simulado, incidir juros compostos de 8% a.m. (rotativo diário acumulado)
      if (simBalance < 0) {
        const overdraftInterest = Math.abs(simBalance) * 0.08;
        netCashFlow -= overdraftInterest;
      }

      simBalance += netCashFlow;
      simulatedBalance.push(Number(simBalance.toFixed(2)));
    }

    // --- 3. Atualizar o Sumário Dinâmico ---
    const totalAdjustedExpenseFirstMonth = (monthlyExpenses + monthlyDebtPayments) * multiplier;
    const monthlyDiffFirstMonth = (monthlyIncome + simPassive) - totalAdjustedExpenseFirstMonth;

    const summary = document.getElementById("simulation-summary");
    if (summary) {
      summary.style.display = "block";
      document.getElementById("sim-avg-income").textContent = formatCurrency(monthlyIncome + simPassive);
      document.getElementById("sim-adj-expense").textContent = formatCurrency(totalAdjustedExpenseFirstMonth);
      document.getElementById("sim-monthly-diff").textContent = formatCurrency(monthlyDiffFirstMonth);
      document.getElementById("sim-monthly-diff").style.color =
        monthlyDiffFirstMonth >= 0 ? "var(--success)" : "var(--danger)";
    }

    const labels = ["Mês 1","Mês 2","Mês 3","Mês 4","Mês 5","Mês 6",
                    "Mês 7","Mês 8","Mês 9","Mês 10","Mês 11","Mês 12"];

    simChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Saldo Acumulado Projetado (R$)",
          data: simulatedBalance,
          backgroundColor: simulatedBalance.map(v =>
            v >= 0 ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"
          ),
          borderColor: simulatedBalance.map(v =>
            v >= 0 ? "#22c55e" : "#ef4444"
          ),
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: context => ` Acumulado: ${formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: {
              color: "#94a3b8",
              callback: value => formatCurrency(value)
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: "#94a3b8" }
          }
        }
      }
    });

    console.log("✅ Gráfico de simulação atualizado e criado com sucesso:", simChart);

  } catch (err) {
    console.error("❌ Erro na simulação:", err);
    showToast("Não foi possível gerar a simulação.", "error");
  }
}
 

  // ===================================
  // PROFILE MANAGEMENT
  // ===================================

  function updateProfileUI() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Sidebar
    document.getElementById("sidebar-user-name").textContent = user.name.split(" ")[0];
    const sidebarAvatar = document.getElementById("sidebar-avatar");
    if (user.avatar) {
      sidebarAvatar.innerHTML = `<img src="${user.avatar}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
    } else {
      sidebarAvatar.textContent = user.name.charAt(0).toUpperCase();
    }

    // Profile Page
    document.getElementById("profile-display-name").textContent = user.name;
    document.getElementById("profile-display-email").textContent = user.email;

    // Avatar
    const avatarLetter = document.getElementById("profile-avatar-letter");
    const avatarImg = document.getElementById("profile-avatar-img");
    if (user.avatar) {
      avatarLetter.style.display = "none";
      avatarImg.src = user.avatar;
      avatarImg.style.display = "block";
    } else {
      avatarLetter.style.display = "block";
      avatarLetter.textContent = user.name.charAt(0).toUpperCase();
      avatarImg.style.display = "none";
    }

    // Provider badge
    const badge = document.getElementById("profile-provider-badge");
    if (user.provider === "google") {
      badge.innerHTML = '<i data-lucide="chrome"></i> Conta Google';
      badge.classList.add("profile-badge-google");
      document.getElementById("security-card").style.display = "none";
    } else {
      badge.innerHTML = '<i data-lucide="shield-check"></i> Conta Local';
      badge.classList.remove("profile-badge-google");
      document.getElementById("security-card").style.display = "block";
    }

    // Info fields
    document.getElementById("profile-info-name").textContent = user.name;
    document.getElementById("profile-info-email").textContent = user.email;
    document.getElementById("profile-info-phone").textContent = user.phone || "Não informado";
    document.getElementById("profile-info-birthdate").textContent = user.birthdate
      ? new Date(user.birthdate + 'T12:00:00').toLocaleDateString("pt-BR")
      : "Não informado";
    document.getElementById("profile-info-since").textContent =
      new Date(user.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

    // Budget Limits Form
    document.getElementById("limit-alimentacao").value = state.categoryLimits["Alimentação"] || 0;
    document.getElementById("limit-moradia").value = state.categoryLimits["Moradia"] || 0;
    document.getElementById("limit-transporte").value = state.categoryLimits["Transporte"] || 0;
    document.getElementById("limit-lazer").value = state.categoryLimits["Lazer"] || 0;

    renderWalletsList();
    lucide.createIcons();
  }

  const budgetForm = document.getElementById("budget-limits-form");
  budgetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const newLimits = {
      "Alimentação": parseFloat(document.getElementById("limit-alimentacao").value) || 0,
      "Moradia": parseFloat(document.getElementById("limit-moradia").value) || 0,
      "Transporte": parseFloat(document.getElementById("limit-transporte").value) || 0,
      "Lazer": parseFloat(document.getElementById("limit-lazer").value) || 0
    };

    try {
      showToast("Salvando limites...", "info");
      await update(ref(db, `users/${user.uid}`), { categoryLimits: newLimits });
      
      state.categoryLimits = newLimits;
      updateDashboard(); // re-render the budgets
      showToast("Limites de categoria salvos no Firebase!", "success");
    } catch (err) {
      console.error(err);
      showToast("Falha ao salvar limites no Firebase.", "error");
    }
  });

  // Edit Profile Toggle
  const editProfileBtn = document.getElementById("edit-profile-btn");
  const profileInfoDisplay = document.getElementById("profile-info-display");
  const profileEditForm = document.getElementById("profile-edit-form");
  const cancelProfileEdit = document.getElementById("cancel-profile-edit");

  editProfileBtn.addEventListener("click", () => {
    const user = Auth.getCurrentUser();
    if (!user) return;

    document.getElementById("profile-edit-name").value = user.name;
    document.getElementById("profile-edit-phone").value = user.phone || "";
    document.getElementById("profile-edit-birthdate").value = user.birthdate || "";

    profileInfoDisplay.style.display = "none";
    editProfileBtn.style.display = "none";
    profileEditForm.style.display = "block";
  });

  cancelProfileEdit.addEventListener("click", () => {
    profileEditForm.style.display = "none";
    profileInfoDisplay.style.display = "grid";
    editProfileBtn.style.display = "flex";
  });

  profileEditForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const result = await Auth.updateProfile({
      name: document.getElementById("profile-edit-name").value,
      phone: document.getElementById("profile-edit-phone").value,
      birthdate: document.getElementById("profile-edit-birthdate").value,
    });

    if (result.success) {
      profileEditForm.style.display = "none";
      profileInfoDisplay.style.display = "grid";
      editProfileBtn.style.display = "flex";
      updateProfileUI();
    }
  });

  // Change Password
  const passwordForm = document.getElementById("password-change-form");
  const passwordError = document.getElementById("password-change-error");

  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPw = document.getElementById("current-password-input").value;
    const newPw = document.getElementById("new-password-input").value;
    const confirmPw = document.getElementById("confirm-new-password").value;

    if (newPw !== confirmPw) {
      passwordError.textContent = "As novas senhas não coincidem.";
      passwordError.style.display = "block";
      return;
    }

    const result = await Auth.changePassword(currentPw, newPw);

    if (result.success) {
      passwordError.style.display = "none";
      passwordForm.reset();
      showToast("Senha alterada com sucesso!", "success");
    } else {
      passwordError.textContent = result.message;
      passwordError.style.display = "block";
    }
  });

  // ===================================
  // AVATAR (Camera + Upload)
  // ===================================

  const avatarModal = document.getElementById("avatar-modal");
  const closeAvatarModal = document.getElementById("close-avatar-modal");
  const avatarChangeBtn = document.getElementById("avatar-change-btn");
  const uploadPhotoBtn = document.getElementById("upload-photo-btn");
  const takePhotoBtn = document.getElementById("take-photo-btn");
  const removePhotoBtn = document.getElementById("remove-photo-btn");
  const avatarFileInput = document.getElementById("avatar-file-input");
  const cameraContainer = document.getElementById("camera-container");
  const cameraFeed = document.getElementById("camera-feed");
  const cameraCanvas = document.getElementById("camera-canvas");
  const capturePhotoBtn = document.getElementById("capture-photo-btn");
  const stopCameraBtn = document.getElementById("stop-camera-btn");
  const saveAvatarBtn = document.getElementById("save-avatar-btn");
  const avatarActionButtons = document.getElementById("avatar-action-buttons");
  const avatarPreviewCircle = document.getElementById("avatar-preview-circle");
  const avatarPreviewLetter = document.getElementById("avatar-preview-letter");
  const avatarPreviewImg = document.getElementById("avatar-preview-img");

  let pendingAvatarData = null;
  let cameraStream = null;

  avatarChangeBtn.addEventListener("click", () => {
    const user = Auth.getCurrentUser();
    if (user && user.avatar) {
      avatarPreviewLetter.style.display = "none";
      avatarPreviewImg.src = user.avatar;
      avatarPreviewImg.style.display = "block";
    } else {
      avatarPreviewLetter.style.display = "block";
      avatarPreviewLetter.textContent = (user ? user.name.charAt(0).toUpperCase() : "U");
      avatarPreviewImg.style.display = "none";
    }
    pendingAvatarData = null;
    saveAvatarBtn.style.display = "none";
    cameraContainer.style.display = "none";
    avatarActionButtons.style.display = "flex";
    avatarModal.classList.add("active");
    lucide.createIcons();
  });

  closeAvatarModal.addEventListener("click", () => {
    stopCamera();
    avatarModal.classList.remove("active");
  });

  // Upload file
  uploadPhotoBtn.addEventListener("click", () => {
    avatarFileInput.click();
  });

  avatarFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("A imagem deve ter no máximo 2MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      // Resize image
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        // Crop to square
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        pendingAvatarData = canvas.toDataURL("image/webp", 0.85);
        avatarPreviewLetter.style.display = "none";
        avatarPreviewImg.src = pendingAvatarData;
        avatarPreviewImg.style.display = "block";
        saveAvatarBtn.style.display = "block";
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    avatarFileInput.value = "";
  });

  // Camera
  takePhotoBtn.addEventListener("click", async () => {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }
      });
      cameraFeed.srcObject = cameraStream;
      cameraContainer.style.display = "block";
      avatarActionButtons.style.display = "none";
      lucide.createIcons();
    } catch (err) {
      showToast("Não foi possível acessar a câmera. Verifique as permissões do navegador.", "error");
      console.error(err);
    }
  });

  capturePhotoBtn.addEventListener("click", () => {
    const size = 256;
    cameraCanvas.width = size;
    cameraCanvas.height = size;
    const ctx = cameraCanvas.getContext("2d");

    const video = cameraFeed;
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - minDim) / 2;
    const sy = (video.videoHeight - minDim) / 2;
    ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);

    pendingAvatarData = cameraCanvas.toDataURL("image/webp", 0.85);
    avatarPreviewLetter.style.display = "none";
    avatarPreviewImg.src = pendingAvatarData;
    avatarPreviewImg.style.display = "block";

    stopCamera();
    cameraContainer.style.display = "none";
    avatarActionButtons.style.display = "flex";
    saveAvatarBtn.style.display = "block";
  });

  stopCameraBtn.addEventListener("click", () => {
    stopCamera();
    cameraContainer.style.display = "none";
    avatarActionButtons.style.display = "flex";
  });

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
  }

  // Remove photo
  removePhotoBtn.addEventListener("click", async () => {
    pendingAvatarData = null;
    const user = Auth.getCurrentUser();
    await Auth.updateProfile({ avatar: null });
    avatarPreviewLetter.textContent = user ? user.name.charAt(0).toUpperCase() : "U";
    avatarPreviewLetter.style.display = "block";
    avatarPreviewImg.style.display = "none";
    saveAvatarBtn.style.display = "none";
    updateProfileUI();
  });

  // Save avatar
  saveAvatarBtn.addEventListener("click", async () => {
    if (pendingAvatarData) {
      await Auth.updateProfile({ avatar: pendingAvatarData });
      pendingAvatarData = null;
      saveAvatarBtn.style.display = "none";
      avatarModal.classList.remove("active");
      updateProfileUI();
    }
  });

  // ===================================
  // TABLE TOOLBAR: PRINT, EXCEL, CSV
  // ===================================

  // --- Column Filters ---
  const filterDesc = document.getElementById("filter-desc");
  const filterCategory = document.getElementById("filter-category");
  const filterDate = document.getElementById("filter-date");
  const filterValue = document.getElementById("filter-value");
  const btnClearFilters = document.getElementById("btn-clear-filters");

  function getFilteredTransactions() {
    let filtered = [...state.transactions];
    const descVal = filterDesc ? filterDesc.value.toLowerCase() : "";
    const catVal = filterCategory ? filterCategory.value : "";
    const dateVal = filterDate ? filterDate.value : "";
    const valVal = filterValue ? filterValue.value.toLowerCase() : "";

    if (descVal) filtered = filtered.filter(t => t.desc.toLowerCase().includes(descVal));
    if (catVal) filtered = filtered.filter(t => t.category === catVal);
    if (dateVal) filtered = filtered.filter(t => t.date === dateVal);
    if (valVal) filtered = filtered.filter(t => t.amount.toString().includes(valVal) || formatCurrency(t.amount).toLowerCase().includes(valVal));
    return filtered;
  }

  function renderFilteredExpensesTable() {
    const filtered = getFilteredTransactions();
    allExpensesTableBody.innerHTML = "";

    const sorted = [...filtered].sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return 0;
    });

    let currentCategory = "";
    sorted.forEach((t) => {
      if (t.category !== currentCategory) {
        currentCategory = t.category;
        const headerRow = document.createElement("tr");
        headerRow.className = "category-row";
        headerRow.innerHTML = `<td colspan="5">${escapeHTML(currentCategory)}</td>`;
        allExpensesTableBody.appendChild(headerRow);
      }

      const row = document.createElement("tr");
      if (t.confirmed === false) row.className = "unconfirmed-row";

      let installmentInfo = "";
      if (t.expenseType === 'debt' && t.installments) {
        installmentInfo = `<br><small style="color: var(--text-muted)">Parcela ${t.installments.current}/${t.installments.total}</small>`;
      }

      const typeLabel = t.expenseType === 'fixed' ? 'Fixo' : (t.expenseType === 'debt' ? 'Dívida' : (t.type === 'income' ? 'Receita' : 'Variável'));
      const statusClass = t.confirmed === false ? 'status-pending' : `status-${t.type}`;
      const statusLabel = t.confirmed === false ? 'Pendente' : typeLabel;

      let confirmBtn = "";
      if (t.confirmed === false) {
        confirmBtn = `
          <button class="btn-confirm" onclick="confirmTransaction('${t.id}')">
            <i data-lucide="check" style="width: 14px"></i> Confirmar
          </button>
        `;
      }

      row.innerHTML = `
        <td data-label="Descrição">${escapeHTML(t.desc)}${installmentInfo}</td>
        <td data-label="Categoria">${escapeHTML(t.category)}</td>
        <td data-label="Data">${new Date(t.date + 'T12:00:00').toLocaleDateString("pt-BR")}</td>
        <td data-label="Valor" style="font-weight: 600; color: ${t.type === "income" ? "var(--success)" : "var(--danger)"}">
          ${t.type === "income" ? "+" : "-"} ${formatCurrency(t.amount)}
        </td>
        <td data-label="Ações">
          <div style="display: flex; align-items: center; gap: 8px">
            <span class="status-badge ${statusClass}">${statusLabel}</span>
            ${confirmBtn}
            <button class="btn-text" onclick="editTransaction('${t.id}')">
              <i data-lucide="edit-3" style="width: 18px; color: var(--primary)"></i>
            </button>
            <button class="btn-text" onclick="deleteTransaction('${t.id}')">
              <i data-lucide="trash-2" style="width: 18px; color: var(--danger)"></i>
            </button>
          </div>
        </td>
      `;
      allExpensesTableBody.appendChild(row);
    });

    // Update counter
    const countEl = document.getElementById("expenses-count");
    if (countEl) countEl.textContent = `${filtered.length} registro${filtered.length !== 1 ? 's' : ''}`;

    lucide.createIcons();
  }

  // Override renderExpensesTable to use filtered version
  const _origRenderExpenses = renderExpensesTable;
  renderExpensesTable = renderFilteredExpensesTable;

  // Attach filter listeners
  if (filterDesc) filterDesc.addEventListener("input", renderExpensesTable);
  if (filterCategory) filterCategory.addEventListener("change", renderExpensesTable);
  if (filterDate) filterDate.addEventListener("change", renderExpensesTable);
  if (filterValue) filterValue.addEventListener("input", renderExpensesTable);
  if (btnClearFilters) {
    btnClearFilters.addEventListener("click", () => {
      if (filterDesc) filterDesc.value = "";
      if (filterCategory) filterCategory.value = "";
      if (filterDate) filterDate.value = "";
      if (filterValue) filterValue.value = "";
      renderExpensesTable();
    });
  }

  // --- Print ---
  document.getElementById("btn-print-table").addEventListener("click", () => {
    window.print();
  });

  // --- Export to Excel ---
  document.getElementById("btn-export-excel").addEventListener("click", () => {
    const data = getFilteredTransactions().map(t => ({
      "Descrição": t.desc,
      "Categoria": t.category,
      "Tipo": t.type === "income" ? "Receita" : (t.expenseType === "fixed" ? "Fixo" : (t.expenseType === "debt" ? "Dívida" : "Variável")),
      "Data": new Date(t.date + 'T12:00:00').toLocaleDateString("pt-BR"),
      "Valor": t.amount,
      "Status": t.confirmed === false ? "Pendente" : "Confirmado",
      "Parcela": t.installments ? `${t.installments.current}/${t.installments.total}` : "-"
    }));

    if (data.length === 0) {
      showToast("Nenhum registro para exportar.", "warning");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);

    // Column widths
    ws["!cols"] = [
      { wch: 30 }, // Descrição
      { wch: 15 }, // Categoria
      { wch: 12 }, // Tipo
      { wch: 12 }, // Data
      { wch: 14 }, // Valor
      { wch: 12 }, // Status
      { wch: 10 }, // Parcela
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lançamentos");

    // Add summary sheet
    const totalExtraIncome = state.transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const totalExpenses = state.transactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
    const totalIncome = state.salary + totalExtraIncome;

    const summaryData = [
      { "Resumo Financeiro": "Salário Base", "Valor": `R$ ${state.salary.toFixed(2)}` },
      { "Resumo Financeiro": "Receita Extra", "Valor": `R$ ${totalExtraIncome.toFixed(2)}` },
      { "Resumo Financeiro": "Renda Total", "Valor": `R$ ${totalIncome.toFixed(2)}` },
      { "Resumo Financeiro": "Gastos Totais", "Valor": `R$ ${totalExpenses.toFixed(2)}` },
      { "Resumo Financeiro": "Saldo", "Valor": `R$ ${(totalIncome - totalExpenses).toFixed(2)}` },
      { "Resumo Financeiro": "", "Valor": "" },
      { "Resumo Financeiro": `Exportado em: ${new Date().toLocaleString("pt-BR")}`, "Valor": "" },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

    const now = new Date();
    const fileName = `Fluxo_Lancamentos_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  });

  // --- Export to PDF ---
  document.getElementById("btn-export-pdf").addEventListener("click", () => {
    const data = getFilteredTransactions();
    if (data.length === 0) {
      showToast("Nenhum registro para exportar.", "warning");
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast("Biblioteca de PDF ainda está sendo carregada. Tente novamente em alguns segundos.", "info");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Premium Document Styling
    doc.setFillColor(99, 102, 241); // Indigo Primary
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Relatório de Lançamentos", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Controle Financeiro", 14, 28);
    
    const now = new Date();
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 255);
    doc.text(`Gerado em: ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR")}`, 14, 34);

    doc.setTextColor(60, 60, 60); // Reset for table text

    const tableColumn = ["Descrição", "Categoria", "Tipo", "Data", "Valor (R$)", "Status", "Parcela"];
    const tableRows = [];

    data.forEach(t => {
      const tipo = t.type === "income" ? "Receita" : (t.expenseType === "fixed" ? "Fixo" : (t.expenseType === "debt" ? "Dívida" : "Variável"));
      const dateStr = new Date(t.date + 'T12:00:00').toLocaleDateString("pt-BR");
      const status = t.confirmed === false ? "Pendente" : "Confirmado";
      const parcela = t.installments ? `${t.installments.current}/${t.installments.total}` : "-";

      const rowData = [
        t.desc,
        t.category,
        tipo,
        dateStr,
        t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
        status,
        parcela
      ];
      tableRows.push(rowData);
    });

    const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#6366f1';

    // Parse hex to RGB array for jsPDF
    const hexToRgb = (hex) => {
      let r = 0, g = 0, b = 0;
      if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
      } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
      }
      return [+r, +g, +b];
    };

    let headColor = [99, 102, 241]; // Default indigo
    if (primaryColor.startsWith('#')) {
      headColor = hexToRgb(primaryColor);
    }

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: {
        fillColor: headColor,
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        font: "helvetica",
        textColor: [50, 50, 50]
      }
    });

    // Add summary
    const totalExtraIncome = state.transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const totalExpenses = state.transactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
    const totalIncome = state.salary + totalExtraIncome;
    const balance = totalIncome - totalExpenses;

    const finalY = doc.lastAutoTable.finalY || 35;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Resumo Financeiro", 14, finalY + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Renda Total: R$ ${totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 14, finalY + 23);
    doc.text(`Gastos Totais: R$ ${totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 14, finalY + 30);

    doc.setFont("helvetica", "bold");
    doc.text(`Saldo Atual: R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 14, finalY + 37);

    const fileName = `Fluxo_Lancamentos_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.pdf`;
    doc.save(fileName);
  });

  // --- Export to CSV ---
  document.getElementById("btn-export-csv").addEventListener("click", () => {
    const data = getFilteredTransactions();
    if (data.length === 0) {
      showToast("Nenhum registro para exportar.", "warning");
      return;
    }

    let csv = "Descrição;Categoria;Tipo;Data;Valor;Status;Parcela\n";
    data.forEach(t => {
      const tipo = t.type === "income" ? "Receita" : (t.expenseType === "fixed" ? "Fixo" : (t.expenseType === "debt" ? "Dívida" : "Variável"));
      const dateStr = new Date(t.date + 'T12:00:00').toLocaleDateString("pt-BR");
      const status = t.confirmed === false ? "Pendente" : "Confirmado";
      const parcela = t.installments ? `${t.installments.current}/${t.installments.total}` : "-";
      const amountStr = t.amount.toFixed(2).replace('.', ',');
      csv += `"${t.desc}";"${t.category}";"${tipo}";"${dateStr}";"${amountStr}";"${status}";"${parcela}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    a.href = url;
    a.download = `Fluxo_Lancamentos_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ===================================
  // AI CHAT BOX (with multi-conversation history)
  // ===================================
  const aiChatOverlay = document.getElementById("ai-chat-overlay");
  const openAiChatBtn = document.getElementById("open-ai-chat");
  const closeAiChatBtn = document.getElementById("close-ai-chat");
  const aiChatMessages = document.getElementById("ai-chat-messages");
  const aiChatInput = document.getElementById("ai-chat-input");
  const aiChatSendBtn = document.getElementById("ai-chat-send");
  const btnNewConversation = document.getElementById("btn-new-conversation");
  const chatHistoryModal = document.getElementById("chat-history-modal");
  const openChatHistoryModalBtn = document.getElementById("open-chat-history-modal");
  const closeChatHistoryModalBtn = document.getElementById("close-chat-history-modal");
  const chatConversationsList = document.getElementById("chat-conversations-list");

  let chatHistory = [];             // Messages of the CURRENT active conversation
  let currentConversationId = null;  // ID of active conversation (null = new unsaved)
  let chatConversations = [];        // Array of all saved conversations

  // --- Load / Save conversations from localStorage ---

  async function saveAllConversations() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await update(ref(db, `users/${user.uid}/profile`), { chat_conversations: chatConversations });
    } catch (e) {
        console.error("Failed to save chat conversation to Firebase", e);
    }
  }

  function loadActiveConversation() {
    // Rely on memory to avoid localStorage sync drifts.
    if (!currentConversationId) {
       chatHistory = [];
       return;
    }
  }

  function saveActiveConversation() {
    // Empty locally - will rely on the global saveAllConversations() which pushes to DB
  }

  // --- Archive current conversation to history ---
  function archiveCurrentConversation() {
    if (chatHistory.length === 0) return; // Nothing to archive

    const firstUserMsg = chatHistory.find(m => m.role === "user");
    const title = firstUserMsg ? firstUserMsg.parts[0].text.substring(0, 80) : "Conversa sem título";

    if (currentConversationId) {
      // Update existing conversation
      const idx = chatConversations.findIndex(c => c.id === currentConversationId);
      if (idx !== -1) {
        chatConversations[idx].messages = [...chatHistory];
        chatConversations[idx].title = title;
        chatConversations[idx].date = new Date().toISOString();
      } else {
        // Create new conversation entry if ID was generated but not in the list yet
        const conv = {
          id: currentConversationId,
          title: title,
          date: new Date().toISOString(),
          messages: [...chatHistory]
        };
        chatConversations.unshift(conv); // Add to beginning
      }
    } else {
      // Create new conversation entry
      const conv = {
        id: Date.now(),
        title: title,
        date: new Date().toISOString(),
        messages: [...chatHistory]
      };
      chatConversations.unshift(conv); // Add to beginning (most recent first)
      currentConversationId = conv.id;
    }
    saveAllConversations();
  }

  // --- Start new conversation ---
  function startNewConversation() {
    // Archive current if there are messages
    archiveCurrentConversation();

    // Start fresh
    chatHistory = [];
    currentConversationId = null;
    saveActiveConversation();
    renderChatFromHistory();
  }

  // --- Load a saved conversation ---
  function loadConversation(convId) {
    // Archive current first
    archiveCurrentConversation();

    const conv = chatConversations.find(c => c.id === convId);
    if (!conv) return;

    chatHistory = [...conv.messages];
    currentConversationId = conv.id;
    saveActiveConversation();
    renderChatFromHistory();

    // Close history modal and open chat
    chatHistoryModal.classList.remove("active");
    aiChatOverlay.classList.add("active");
    lucide.createIcons();
    aiChatInput.focus();
    setTimeout(() => { aiChatMessages.scrollTop = aiChatMessages.scrollHeight; }, 100);
  }

  // --- Delete a conversation ---
  function deleteConversation(convId, event) {
    event.stopPropagation();
    if (!confirm("Excluir esta conversa permanentemente?")) return;

    chatConversations = chatConversations.filter(c => c.id !== convId);
    saveAllConversations();

    // If we deleted the active one, clear it
    if (currentConversationId === convId) {
      chatHistory = [];
      currentConversationId = null;
      saveActiveConversation();
    }
    renderConversationsList();
  }

  // Expose to global
  window.loadConversation = loadConversation;
  window.deleteConversation = deleteConversation;

  // --- Render conversations history modal ---
  function renderConversationsList() {
    if (!chatConversationsList) return;

    if (chatConversations.length === 0) {
      chatConversationsList.innerHTML = `
        <div class="conv-empty">
          <i data-lucide="message-square-off" style="width:48px;height:48px;"></i>
          <p>Nenhuma conversa salva ainda</p>
          <small>Use o botão <strong>+</strong> no chat para iniciar uma nova conversa e salvar a anterior</small>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    chatConversationsList.innerHTML = chatConversations.map(conv => {
      const msgCount = conv.messages.filter(m => m.role === "user").length;
      const date = new Date(conv.date);
      const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
      const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const lastBotMsg = [...conv.messages].reverse().find(m => m.role === "model");
      const preview = lastBotMsg ? lastBotMsg.parts[0].text.substring(0, 80).replace(/\*/g, "").replace(/\n/g, " ") + "..." : "Sem resposta";
      const isActive = conv.id === currentConversationId;

      return `
        <div class="conv-item${isActive ? ' active' : ''}" onclick="loadConversation('${conv.id}')" style="${isActive ? 'border-color:var(--primary);background:rgba(99,102,241,0.06);' : ''}">
          <div class="conv-icon">
            <i data-lucide="${isActive ? 'message-circle' : 'message-square'}" style="width:20px;height:20px;"></i>
          </div>
          <div class="conv-details">
            <div class="conv-title">${escapeHTML(conv.title)}${isActive ? ' <small style="color:var(--success);font-weight:400;">● ativa</small>' : ''}</div>
            <div class="conv-preview">${escapeHTML(preview)}</div>
          </div>
          <div class="conv-meta">
            <span class="conv-date">${dateStr} ${timeStr}</span>
            <span class="conv-msg-count">${msgCount} pergunta${msgCount !== 1 ? 's' : ''}</span>
          </div>
          <button class="conv-delete" onclick="deleteConversation('${conv.id}', event)" title="Excluir conversa">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </div>
      `;
    }).join("");

    lucide.createIcons();
  }

  // --- Render chat messages from history ---
  function renderChatFromHistory() {
    aiChatMessages.innerHTML = "";

    if (chatHistory.length === 0) {
      aiChatMessages.innerHTML = `
        <div class="ai-chat-welcome">
          <div class="ai-chat-welcome-icon">
            <i data-lucide="sparkles" style="width:40px;height:40px;color:var(--primary);"></i>
          </div>
          <h4>Olá! Sou seu Consultor Financeiro IA</h4>
          <p>Pergunte qualquer coisa sobre finanças pessoais, investimentos, economia, e mais. Vou te ajudar com conselhos personalizados!</p>
          <div class="ai-chat-suggestions">
            <button class="ai-suggestion-chip" data-question="Como posso economizar mais dinheiro?">💰 Como economizar</button>
            <button class="ai-suggestion-chip" data-question="Qual a melhor forma de investir com pouco dinheiro?">📈 Investir</button>
            <button class="ai-suggestion-chip" data-question="Como organizar meu orçamento mensal?">📊 Orçamento</button>
            <button class="ai-suggestion-chip" data-question="Quais são os melhores métodos para quitar dívidas?">💳 Quitar dívidas</button>
          </div>
        </div>
      `;
      attachSuggestionChipListeners();
    } else {
      chatHistory.forEach(entry => {
        const role = entry.role === "user" ? "user" : "bot";
        const text = entry.parts[0].text;
        const msg = document.createElement("div");
        msg.className = `ai-msg ${role === "user" ? "ai-msg-user" : "ai-msg-bot"}`;
        if (role === "bot") {
          msg.innerHTML = formatBotMessage(text);
        } else {
          msg.textContent = text;
        }
        aiChatMessages.appendChild(msg);
      });
    }
    lucide.createIcons();
  }

  function formatBotMessage(content) {
    let html = content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^[-•]\s(.+)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
    if (html.includes('<li>')) {
      html = html.replace(/(<li>.*<\/li>)/gs, '<ul style="margin:0.5rem 0;padding-left:1.2rem;">$1</ul>');
    }
    return html;
  }

  function attachSuggestionChipListeners() {
    document.querySelectorAll(".ai-suggestion-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const question = chip.getAttribute("data-question");
        aiChatInput.value = question;
        sendChatMessage();
      });
    });
  }

  // --- Open chat ---
  openAiChatBtn.addEventListener("click", () => {
    if (!state.geminiKey) {
      showToast("Por favor, configure sua chave do Gemini primeiro na seção acima!", "warning");
      return;
    }
    loadActiveConversation();
    renderChatFromHistory();
    aiChatOverlay.classList.add("active");
    lucide.createIcons();
    aiChatInput.focus();
    setTimeout(() => { aiChatMessages.scrollTop = aiChatMessages.scrollHeight; }, 100);
  });

  closeAiChatBtn.addEventListener("click", () => {
    // Auto-save current conversation when closing
    archiveCurrentConversation();
    aiChatOverlay.classList.remove("active");
  });

  aiChatOverlay.addEventListener("click", (e) => {
    if (e.target === aiChatOverlay) {
      archiveCurrentConversation();
      aiChatOverlay.classList.remove("active");
    }
  });

  // --- New Conversation button ---
  btnNewConversation.addEventListener("click", () => {
    startNewConversation();
  });

  // --- History Modal ---
  openChatHistoryModalBtn.addEventListener("click", () => {
    renderConversationsList();
    chatHistoryModal.classList.add("active");
    lucide.createIcons();
  });

  closeChatHistoryModalBtn.addEventListener("click", () => {
    chatHistoryModal.classList.remove("active");
  });

  // Initial suggestion chip listeners
  attachSuggestionChipListeners();

  aiChatSendBtn.addEventListener("click", sendChatMessage);
  aiChatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  function addChatMessage(content, role) {
    const welcome = aiChatMessages.querySelector(".ai-chat-welcome");
    if (welcome) welcome.remove();

    const msg = document.createElement("div");
    msg.className = `ai-msg ${role === "user" ? "ai-msg-user" : "ai-msg-bot"}`;
    if (role === "bot") {
      msg.innerHTML = formatBotMessage(content);
    } else {
      msg.textContent = content;
    }
    aiChatMessages.appendChild(msg);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }

  function showTypingIndicator() {
    const typing = document.createElement("div");
    typing.className = "ai-msg-typing";
    typing.id = "chat-typing";
    typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    aiChatMessages.appendChild(typing);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }

  function removeTypingIndicator() {
    const typing = document.getElementById("chat-typing");
    if (typing) typing.remove();
  }

  // Clear current chat (delete without archiving)
  window.clearChatHistory = () => {
    if (confirm("Deseja apagar esta conversa atual?")) {
      // Also remove from saved conversations if it was an active one
      if (currentConversationId) {
        chatConversations = chatConversations.filter(c => c.id !== currentConversationId);
        saveAllConversations();
      }
      chatHistory = [];
      currentConversationId = null;
      saveActiveConversation();
      renderChatFromHistory();
    }
  };

  async function sendChatMessage() {
    const text = aiChatInput.value.trim();
    if (!text) return;

    // If this is a brand new conversation, create an ID
    if (!currentConversationId && chatHistory.length === 0) {
      currentConversationId = Date.now();
    }

    aiChatInput.value = "";
    addChatMessage(text, "user");
    chatHistory.push({ role: "user", parts: [{ text }] });
    saveActiveConversation();

    showTypingIndicator();

    // Build financial context
    const totalExtraIncome = state.transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const totalExpenses = state.transactions.filter(t => t.type === "expense" && t.confirmed !== false).reduce((a, t) => a + t.amount, 0);
    const totalIncome = state.salary + totalExtraIncome;
    const balance = totalIncome - totalExpenses;

    let personaContext = "consultor financeiro pessoal focado em economias familiares";
    let personaGreeting = "Entendido! Sou seu consultor financeiro pessoal. Como posso te ajudar?";
    if (state.aiPersona === "mercado") {
      personaContext = "analista de mercado financeiro focado em investimentos, rendimentos e tendências econômicas";
      personaGreeting = "Entendido! Sou seu analista de mercado. Aqui para ajudar com investimentos e tendências. Como posso ajudar?";
    }
    if (state.aiPersona === "loja") {
      personaContext = "consultor de negócios e gestão de loja focado em lucro, fluxo de caixa e estratégias de vendas";
      personaGreeting = "Entendido! Sou seu consultor de negócios. Como posso ajudar com sua loja hoje?";
    }
    if (state.aiPersona === "agressivo") {
      personaContext = "especialista financeiro agressivo focado em metas rígidas e cortes severos de gastos";
      personaGreeting = "Entendido! Sou seu especialista financeiro. Prepare-se para metas duras e cortes essenciais. Diga o seu problema.";
    }

    const systemContext = `Você é um ${personaContext} brasileiro especialista. O usuário tem: Renda mensal de R$${totalIncome.toFixed(2)}, gastos confirmados de R$${totalExpenses.toFixed(2)}, saldo de R$${balance.toFixed(2)}, e ${state.transactions.length} transação(ões) registradas. Responda de forma clara, prática e amigável (de acordo com sua persona), em português. Use markdown para formatação quando apropriado (negrito com **, itálico com *, listas com -).`;

    const contents = [
      { role: "user", parts: [{ text: systemContext }] },
      { role: "model", parts: [{ text: personaGreeting }] },
      ...chatHistory
    ];

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      const result = await response.json();
      removeTypingIndicator();

      if (result.candidates && result.candidates[0] && result.candidates[0].content) {
        const reply = result.candidates[0].content.parts[0].text;
        chatHistory.push({ role: "model", parts: [{ text: reply }] });
        saveActiveConversation();
        addChatMessage(reply, "bot");
      } else {
        addChatMessage("Desculpe, não consegui processar sua pergunta. Tente reformular.", "bot");
      }
    } catch (error) {
      removeTypingIndicator();
      console.error("AI Chat error:", error);
      addChatMessage("Erro de conexão. Verifique sua chave do Gemini e sua internet.", "bot");
    }
  }

  // ===================================
  // GOALS (METAS)
  // ===================================

  goalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    const name = document.getElementById("goal-name").value;
    const target = parseFloat(document.getElementById("goal-target").value) || 0;
    const current = parseFloat(document.getElementById("goal-current").value) || 0;
    const deadline = document.getElementById("goal-deadline").value;

    const goalData = { name, targetAmount: target, currentAmount: current, deadline };

    try {
      showToast("Salvando meta...", "info");
      if (editingGoalId) {
        await update(ref(db, `users/${user.uid}/goals/${editingGoalId}`), goalData);
        const index = state.goals.findIndex(g => g.id === editingGoalId);
        state.goals[index] = { ...goalData, id: editingGoalId };
      } else {
        const newRef = push(ref(db, `users/${user.uid}/goals`));
        await set(newRef, goalData);
        state.goals.push({ id: newRef.key, ...goalData });
      }

      renderGoals();
      goalModal.classList.remove("active");
      goalForm.reset();
      editingGoalId = null;
      showToast("Meta salva com sucesso!", "success");
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar meta no Firebase", "error");
    }
  });

  window.editGoal = (id) => {
    const g = state.goals.find(g => g.id === id);
    if (!g) return;
    editingGoalId = id;
    document.querySelector("#goal-modal h2").textContent = "Editar Meta";
    document.querySelector("#goal-form .btn-submit").textContent = "Atualizar Meta";
    document.getElementById("goal-name").value = g.name;
    document.getElementById("goal-target").value = g.targetAmount;
    document.getElementById("goal-current").value = g.currentAmount;
    document.getElementById("goal-deadline").value = g.deadline || "";
    goalModal.classList.add("active");
  };

  window.deleteGoal = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    if (confirm("Deseja realmente excluir esta meta?")) {
      try {
        await remove(ref(db, `users/${user.uid}/goals/${id}`));
        
        state.goals = state.goals.filter(g => g.id !== id);
        renderGoals();
        showToast("Meta excluída", "success");
      } catch (err) {
        console.error(err);
        showToast("Erro ao excluir meta", "error");
      }
    }
  };

  window.addFundsToGoal = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    const val = prompt("Qual valor você deseja guardar nesta meta agora? (Será descontado do saldo como despesa)");
    if (!val) return;
    const amount = parseFloat(val);
    if (isNaN(amount) || amount <= 0) return showToast("Valor inválido.", "error");

    const g = state.goals.find(g => g.id === id);
    if (!g) return;

    try {
      const newCurrent = g.currentAmount + amount;
      
      // Update goal in Firebase
      await update(ref(db, `users/${user.uid}/goals/${id}`), { currentAmount: newCurrent });
      g.currentAmount = newCurrent;

      // Create transaction in Firebase
      const tPayload = {
        desc: `Depósito na Meta: ${g.name}`,
        amount,
        type: 'expense',
        walletId: 'default',
        expenseType: 'variable',
        category: 'Investimentos',
        date: new Date().toISOString().split('T')[0],
        confirmed: true
      };
      
      const newTRef = push(ref(db, `users/${user.uid}/transactions`));
      await set(newTRef, tPayload);
      
      state.transactions.unshift({ id: newTRef.key, ...tPayload });

      renderGoals();
      updateDashboard();
      showToast(`R$${amount.toFixed(2)} guardados na sua meta!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Erro ao depositar fundos no Firebase", "error");
    }
  };

  function renderGoals() {
    if (!goalsContainer) return;
    goalsContainer.innerHTML = "";

    if (state.goals.length === 0) {
      goalsContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 1rem;">Você ainda não tem metas cadastradas.</p>';
      return;
    }

    state.goals.forEach(g => {
      const percentage = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100).toFixed(1) : 0;
      let dateHtml = "";
      if (g.deadline) {
        const d = new Date(g.deadline + 'T12:00:00').toLocaleDateString("pt-BR");
        dateHtml = `<span style="font-size:0.8rem;color:var(--text-muted);"><i data-lucide="calendar" style="width:12px;height:12px;display:inline;"></i> Até ${d}</span>`;
      }

      let barColor = 'var(--primary)';
      if (percentage >= 100) barColor = 'var(--success)';

      const card = document.createElement("div");
      card.className = "goal-card";
      card.innerHTML = `
        <div class="goal-header" style="margin-bottom: 0.5rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3 style="margin:0; font-size: 1.1rem; color: var(--text-main);">${g.name}</h3>
            ${dateHtml}
          </div>
          <div style="display:flex; gap: 4px;">
            <button class="btn-icon" onclick="addFundsToGoal('${g.id}')" title="Guardar Dinheiro"><i data-lucide="plus-circle" style="width:18px;height:18px;color:var(--success);"></i></button>
            <button class="btn-icon" onclick="editGoal('${g.id}')" title="Editar"><i data-lucide="edit-2" style="width:16px;height:16px;color:var(--text-muted);"></i></button>
            <button class="btn-icon" onclick="deleteGoal('${g.id}')" title="Excluir"><i data-lucide="trash-2" style="width:16px;height:16px;color:var(--danger);"></i></button>
          </div>
        </div>
        <div class="goal-progress-info" style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
          <span style="color: ${percentage >= 100 ? 'var(--success)' : 'var(--text-main)'}; font-weight: 500;">
            ${formatCurrency(g.currentAmount)} guardado
          </span>
          <span style="color: var(--text-muted);">objetivo: ${formatCurrency(g.targetAmount)}</span>
        </div>
        <div class="goal-progress-bar-container" style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
          <div class="goal-progress-bar" style="width: ${percentage}%; background: ${barColor}; height: 100%; transition: width 0.3s ease;"></div>
        </div>
        <div style="font-size: 0.8rem; color: ${barColor}; text-align: right; font-weight: bold;">
          ${percentage}% alcançado
        </div>
      `;
      goalsContainer.appendChild(card);
    });
    lucide.createIcons();
  }

  // ===================================
  // BUDGETS (ORÇAMENTOS)
  // ===================================

  function renderBudgets() {
    const container = document.getElementById("budget-progress-container");
    if (!container) return;
    container.innerHTML = "";

    const activeLimits = Object.entries(state.categoryLimits || {}).filter(([cat, limit]) => limit > 0);

    if (activeLimits.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">Nenhum limite de orçamento definido. Configure no seu Perfil.</p>';
      return;
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // calculate current spent per category
    const spentPerCategory = {};
    activeLimits.forEach(([cat]) => spentPerCategory[cat] = 0);

    state.transactions.forEach(t => {
      if (t.type === "expense" && t.confirmed !== false) {
        const d = new Date(t.date + 'T12:00:00');
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          if (spentPerCategory[t.category] !== undefined) {
            spentPerCategory[t.category] += Math.abs(t.amount);
          }
        }
      }
    });

    activeLimits.forEach(([cat, limit]) => {
      const spent = spentPerCategory[cat] || 0;
      const percentage = Math.min((spent / limit) * 100, 100).toFixed(1);

      let barColor = 'var(--primary)';
      if (percentage >= 100) {
        barColor = 'var(--danger)';
      } else if (percentage >= 80) {
        barColor = '#f59e0b'; // warning orange
      }

      const card = document.createElement("div");
      card.className = "goal-card";
      card.innerHTML = `
        <div class="goal-header" style="margin-bottom: 0.5rem;">
          <h3 style="margin:0; font-size: 1.1rem; display:flex; align-items:center; gap:0.5rem;">
            ${percentage >= 100 ? '<i data-lucide="alert-circle" style="color:var(--danger); width:18px;"></i>' : ''}
            ${cat}
          </h3>
        </div>
        <div class="goal-progress-info" style="display:flex; justify-content:space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
          <span style="color: ${percentage >= 100 ? 'var(--danger)' : 'var(--text-main)'}; font-weight: 500;">
            ${formatCurrency(spent)} gastou
          </span>
          <span style="color: var(--text-muted);">limite: ${formatCurrency(limit)}</span>
        </div>
        <div class="goal-progress-bar-container" style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
          <div class="goal-progress-bar" style="width: ${percentage}%; background: ${barColor}; height: 100%; transition: width 0.3s ease;"></div>
        </div>
        <div style="font-size: 0.8rem; color: ${barColor}; text-align: right; font-weight: bold;">
          ${percentage}% utilizado
        </div>
      `;
      container.appendChild(card);
    });

    lucide.createIcons();
  }

  // ===================================
  // WALLETS (CARTEIRAS)
  // ===================================

  walletForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const name = document.getElementById("wallet-name").value;
    const type = document.getElementById("wallet-type").value;
    const color = document.getElementById("wallet-color").value;
    const initialBalance = parseFloat(document.getElementById("wallet-initial").value) || 0;
    const overdraft = parseFloat(document.getElementById("wallet-overdraft").value) || 0;

    const payload = { name, type, color, initial: initialBalance, overdraft };

    try {
      showToast("Configurando carteira...", "info");
      
      if (editingWalletId) {
        await update(ref(db, `users/${user.uid}/wallets/${editingWalletId}`), payload);
        const index = state.wallets.findIndex((w) => w.id === editingWalletId);
        state.wallets[index] = { id: editingWalletId, ...payload };
      } else {
        const newRef = push(ref(db, `users/${user.uid}/wallets`));
        await set(newRef, payload);
        state.wallets.push({ id: newRef.key, ...payload });
      }

      renderWalletsList();
      updateDashboard();
      walletModal.classList.remove("active");
      walletForm.reset();
      editingWalletId = null;
      showToast("Carteira configurada no Firebase!", "success");

    } catch (err) {
      console.error(err);
      showToast("Erro ao configurar carteira no Firebase", "error");
    }
  });

  window.editWallet = (id) => {
    const w = state.wallets.find(w => w.id === id);
    if (!w) return;

    editingWalletId = id;
    document.querySelector("#wallet-modal h2").textContent = "Editar Carteira";
    document.querySelector("#wallet-form .btn-submit").textContent = "Atualizar Carteira";

    document.getElementById("wallet-name").value = w.name;
    document.getElementById("wallet-type").value = w.type;
    document.getElementById("wallet-color").value = w.color;
    document.getElementById("wallet-initial").value = w.initial;
    document.getElementById("wallet-overdraft").value = w.overdraft || 0;

    walletModal.classList.add("active");
  };

  window.deleteWallet = async (id) => {
    const user = auth.currentUser;
    if (!user) return;

    if (confirm("Deseja realmente excluir esta carteira? As transações vinculadas ficarão sem carteira específica.")) {
      try {
        await remove(ref(db, `users/${user.uid}/wallets/${id}`));

        state.wallets = state.wallets.filter(w => w.id !== id);
        state.transactions = state.transactions.map(t => {
          if (t.walletId == id) return { ...t, walletId: "default" };
          return t;
        });
        
        renderWalletsList();
        updateDashboard();
        showToast("Carteira excluída do Firebase", "success");
      } catch (err) {
        console.error(err);
        showToast("Erro ao excluir carteira do Firebase", "error");
      }
    }
  };

  function renderWalletsList() {
    if (!walletsList) return;
    walletsList.innerHTML = "";

    if (state.wallets.length === 0) {
      walletsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem;">Você ainda não tem carteiras cadastradas. Tudo está sendo lançado na Carteira Principal.</p>';
      return;
    }

    state.wallets.forEach(w => {
      let icon = "credit-card";
      if (w.type === "cash") icon = "banknote";
      if (w.type === "savings") icon = "piggy-bank";
      if (w.type === "checking") icon = "landmark";

      const item = document.createElement("div");
      item.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding: 1rem; border: 1px solid var(--border); border-radius: 0.75rem; margin-bottom: 0.5rem; background: rgba(255,255,255,0.02);";

      const tl = document.createElement("div");
      tl.style.cssText = "display:flex; align-items:center; gap: 1rem;";
      tl.innerHTML = `
        <div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${w.color}20;color:${w.color};">
          <i data-lucide="${icon}" style="width:20px;height:20px;"></i>
        </div>
        <div>
          <h4 style="margin:0;font-size:1rem;color:var(--text-main);">${w.name}</h4>
          <span style="font-size:0.8rem;color:var(--text-muted);">${w.type.toUpperCase()}</span>
        </div>
      `;

      const tr = document.createElement("div");
      tr.style.cssText = "display:flex; gap: 0.5rem;";
      tr.innerHTML = `
        <button class="btn-icon" onclick="editWallet('${w.id}')" title="Editar"><i data-lucide="edit-2" style="width:16px;height:16px;color:var(--text-muted);"></i></button>
        <button class="btn-icon" onclick="deleteWallet('${w.id}')" title="Excluir"><i data-lucide="trash-2" style="width:16px;height:16px;color:var(--danger);"></i></button>
      `;

      item.appendChild(tl);
      item.appendChild(tr);
      walletsList.appendChild(item);
    });
    lucide.createIcons();
  }

  function renderWalletsSelect() {
    const wSelect = document.getElementById("wallet");
    if (!wSelect) return;
    wSelect.innerHTML = '<option value="default">Carteira Principal</option>';
    state.wallets.forEach(w => {
      const opt = document.createElement("option");
      opt.value = w.id;
      opt.textContent = w.name;
      wSelect.appendChild(opt);
    });
  }

  function renderDashboardWallets() {
    let container = document.getElementById("dashboard-wallets-container");

    // Create the section if it doesn't exist
    if (!container) {
      const budgetSection = document.querySelector(".budget-overview");
      if (!budgetSection) return;

      const sectionWrap = document.createElement("div");
      sectionWrap.className = "dashboard-wallets";
      sectionWrap.style.marginBottom = "2rem";
      sectionWrap.innerHTML = `
        <div class="section-header">
          <h3>Saldos por Carteira</h3>
        </div>
        <div class="stats-grid" id="dashboard-wallets-container" style="grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));">
        </div>
      `;
      budgetSection.parentNode.insertBefore(sectionWrap, budgetSection);
      container = document.getElementById("dashboard-wallets-container");
    }

    container.innerHTML = "";

    // Calculate Default Wallet balance
    const defaultTxs = state.transactions.filter(t => !t.walletId || t.walletId === "default");
    const dInc = state.salary + defaultTxs.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
    const dExp = defaultTxs.filter(t => t.type === "expense" && t.confirmed !== false).reduce((a, t) => a + t.amount, 0);
    const dBal = dInc - dExp;

    container.innerHTML += `
      <div class="stat-card" style="padding: 1rem; flex-direction: column; align-items: flex-start;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <i data-lucide="wallet" style="width:16px;height:16px;color:var(--text-muted);"></i>
          <span style="color:var(--text-muted); font-size:0.9rem;">Carteira Principal</span>
        </div>
        <span class="stat-value" style="font-size: 1.25rem;">${formatCurrency(dBal)}</span>
      </div>
    `;

    state.wallets.forEach(w => {
      const wTxs = state.transactions.filter(t => t.walletId == w.id);
      const wInc = wTxs.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
      const wExp = wTxs.filter(t => t.type === "expense" && t.confirmed !== false).reduce((a, t) => a + t.amount, 0);
      const wBal = w.initial + wInc - wExp;

      // icon logic
      let icon = "credit-card";
      if (w.type === "cash") icon = "banknote";
      if (w.type === "savings") icon = "piggy-bank";
      if (w.type === "checking") icon = "landmark";

      container.innerHTML += `
        <div class="stat-card" style="padding: 1rem; flex-direction: column; align-items: flex-start;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <i data-lucide="${icon}" style="width:16px;height:16px;color:${w.color};"></i>
            <span style="color:var(--text-muted); font-size:0.9rem;">${w.name}</span>
          </div>
          <span class="stat-value" style="font-size: 1.25rem; color:${wBal >= 0 ? "var(--text-main)" : "var(--danger)"};">${formatCurrency(wBal)}</span>
        </div>
      `;
    });

    lucide.createIcons();
  }

  // ===================================
  // PWA SERVICE WORKER REGISTRATION
  // ===================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }

  // ===================================
  // FIREBASE AUTH LISTENER
  // ===================================
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("Firebase Auth: User logged in", user.uid);
      await enterApp();
    } else {
      console.log("Firebase Auth: No user");
      authScreen.style.display = "flex";
      appContainer.style.display = "none";
    }
  });
});
