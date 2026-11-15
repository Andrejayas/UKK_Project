import globals from "globals";

export default [
  {
    /* Konfigurasi untuk file JavaScript aplikasi di folder js/ */
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.node,
        document: "readonly",
        window: "readonly",
        console: "readonly",
        localStorage: "readonly",
        confirm: "readonly",
        alert: "readonly",

        /* Shared Global State across modular scripts */
        tasks: "writable",
        currentFilter: "writable",
        currentUser: "writable",
        customSubjects: "writable",
        currentView: "writable",
        sidebarCollapsed: "writable",
        mobileSidebarOpen: "writable",
        cropperState: "writable",

        /* Shared Global Constants */
        DEFAULT_SUBJECTS: "readonly",
        KEYS: "readonly",
        SUBJECT_COLORS: "readonly",

        /* Config & Auth functions */
        initDefaultUser: "readonly",
        loadProfile: "readonly",
        saveProfile: "readonly",
        generateAvatarDataUrl: "readonly",

        /* Task & Subject functions */
        loadTasks: "readonly",
        saveTasks: "readonly",
        addTask: "readonly",
        updateStatus: "readonly",
        updateTask: "readonly",
        deleteTask: "readonly",
        filterTasks: "readonly",
        getAllSubjects: "readonly",
        addCustomSubject: "readonly",
        removeCustomSubject: "readonly",
        saveSubjects: "readonly",
        loadSubjects: "readonly",
        applyFilters: "readonly",
        filterByStatus: "readonly",
        filterBySubject: "readonly",
        filterBySearch: "readonly",
        sortTasks: "readonly",
        getNowTimeString: "readonly",
        isTaskOverdue: "readonly",
        getDueStatus: "readonly",
        getDueLabel: "readonly",
        formatDate: "readonly",
        getTodayString: "readonly",
        getTomorrowString: "readonly",
        validateTitle: "readonly",
        validateSubject: "readonly",

        /* Chart functions */
        renderDonutChart: "readonly",
        renderWeeklyChart: "readonly",
        getWeeklyTaskCounts: "readonly",
        renderAnalytics: "readonly",
        renderAnalyticsWeeklyChart: "readonly",

        /* Cropper functions */
        handleAvatarUpload: "readonly",
        initCropperWithImage: "readonly",
        applyCropTransform: "readonly",
        setCropZoom: "readonly",
        updateCropZoomBadge: "readonly",
        onCropDragStart: "readonly",
        onCropDragMove: "readonly",
        onCropDragEnd: "readonly",
        closeCropModal: "readonly",
        applyAvatarCrop: "readonly",

        /* UI functions */
        showApp: "readonly",
        initClock: "readonly",
        getSubjectColors: "readonly",
        createSubjectBadge: "readonly",
        renderTasks: "readonly",
        renderMetricCards: "readonly",
        renderSubjectProgress: "readonly",
        updateSubjectSelects: "readonly",
        renderSettingsSubjects: "readonly",
        updateAvatarDisplays: "readonly",
        renderProfileDropdown: "readonly",
        openEditModal: "readonly",
        closeEditModal: "readonly",
        openProfileModal: "readonly",
        closeProfileModal: "readonly",
        openWelcomeModal: "readonly",
        closeWelcomeModal: "readonly",
        showToast: "readonly",
        capitalize: "readonly",
        switchView: "readonly",
        toggleSidebar: "readonly",
        toggleMobileSidebar: "readonly",
        closeMobileSidebar: "readonly",

        /* App lifecycle functions */
        setupEventListeners: "readonly",
        initApp: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "vars": "local", "args": "none" }],
      "no-undef": "error",
      "semi": ["error", "always"],
      "eqeqeq": ["error", "always"]
    }
  },
  {
    /* Konfigurasi untuk file konfigurasi root (ES Module) */
    files: ["*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      "semi": ["error", "always"],
      "eqeqeq": ["error", "always"]
    }
  }
];
