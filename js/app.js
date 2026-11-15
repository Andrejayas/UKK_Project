/**
 * @file js/app.js
 * @description Pintu masuk (entry point) aplikasi SchoolTask.
 *              Mengatur semua event listeners antarmuka, inisialisasi lifecycle saat DOM ready,
 *              serta mengekspos API publik `window._schoolTask` untuk pengujian & asesmen UKK.
 * @author Andre
 */

/* ============================================================
   SECTION 1: EVENT LISTENERS SETUP
   ============================================================ */

/**
 * Menginisialisasi semua event listener aplikasi.
 * @returns {void}
 */
function setupEventListeners() {

  /* ----- SIDEBAR TOGGLE ----- */
  document.getElementById("sidebarToggle").addEventListener("click", toggleSidebar);
  document.getElementById("topbarToggle").addEventListener("click", toggleSidebar);

  /* Sidebar backdrop (mobile) */
  const backdrop = document.getElementById("sidebarBackdrop");
  backdrop.addEventListener("click", closeMobileSidebar);

  /* ----- NAV ITEMS ----- */
  document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchView(btn.dataset.view);
      if (window.innerWidth <= 768) { closeMobileSidebar(); }
    });
  });

  /* ----- PROFILE DROPDOWN ----- */
  document.getElementById("avatarBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById("profileDropdown");
    const isOpen   = !dropdown.classList.contains("hidden");
    dropdown.classList.toggle("hidden", isOpen);
    document.getElementById("avatarBtn").setAttribute("aria-expanded", String(!isOpen));
    if (!isOpen) { renderProfileDropdown(); }
  });

  document.addEventListener("click", (e) => {
    const dropdown  = document.getElementById("profileDropdown");
    const avatarBtn = document.getElementById("avatarBtn");
    if (!dropdown.classList.contains("hidden") && !avatarBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add("hidden");
      avatarBtn.setAttribute("aria-expanded", "false");
    }
  });

  /* ----- TOPBAR SEARCH (syncs with filter) ----- */
  document.getElementById("topbarSearch").addEventListener("input", (e) => {
    if (currentView === "dashboard") {
      currentFilter.search = e.target.value;
      document.getElementById("filterSearch").value = e.target.value;
      applyFilters();
    }
  });

  /* ----- FILTER TOOLBAR ----- */
  document.getElementById("filterSearch").addEventListener("input", (e) => {
    currentFilter.search = e.target.value;
    document.getElementById("topbarSearch").value = e.target.value;
    applyFilters();
  });

  document.getElementById("filterStatus").addEventListener("change", (e) => {
    currentFilter.status = e.target.value;
    applyFilters();
  });

  document.getElementById("filterSubject").addEventListener("change", (e) => {
    currentFilter.subject = e.target.value;
    applyFilters();
  });

  document.getElementById("filterSort").addEventListener("change", (e) => {
    currentFilter.sort = e.target.value;
    applyFilters();
  });

  /* ----- QUICK ADD FORM ----- */
  const qaSubject = document.getElementById("qaSubject");
  qaSubject.addEventListener("change", () => {
    const wrapper = document.getElementById("qaCustomSubjectWrapper");
    wrapper.classList.toggle("hidden", qaSubject.value !== "__new__");
  });

  document.getElementById("quickAddForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const titleEl   = document.getElementById("qaTitle");
    const subjectEl = document.getElementById("qaSubject");
    const dueDateEl = document.getElementById("qaDueDate");
    const dueTimeEl = document.getElementById("qaDueTime");
    const priorityEl = document.getElementById("qaPriority");
    const customSubjEl = document.getElementById("qaCustomSubject");

    const titleErr = validateTitle(titleEl.value);
    if (titleErr) { showToast(titleErr, "error"); titleEl.focus(); return; }

    let subject = subjectEl.value;
    if (subject === "__new__") {
      subject = customSubjEl.value.trim();
    }
    const subjErr = validateSubject(subject);
    if (subjErr) { showToast(subjErr, "error"); return; }

    /* Auto-add to custom subjects if not in list */
    if (!getAllSubjects().includes(subject)) {
      addCustomSubject(subject);
    }

    addTask({
      title:    titleEl.value.trim(),
      subject,
      dueDate:  dueDateEl.value,
      dueTime:  dueTimeEl ? dueTimeEl.value : "",
      priority: priorityEl.value,
    });

    applyFilters();
    renderMetricCards();
    renderSubjectProgress();
    renderDonutChart();
    renderWeeklyChart();

    /* Reset form */
    document.getElementById("quickAddForm").reset();
    document.getElementById("qaCustomSubjectWrapper").classList.add("hidden");
    updateSubjectSelects();

    showToast("Tugas berhasil ditambahkan! 🎉", "success");
  });

  /* ----- PROFILE MODAL ----- */
  document.getElementById("sidebarProfileBtn").addEventListener("click", () => {
    openProfileModal();
    if (window.innerWidth <= 768) { closeMobileSidebar(); }
  });

  document.getElementById("dropdownEditProfileBtn").addEventListener("click", () => {
    document.getElementById("profileDropdown").classList.add("hidden");
    openProfileModal();
  });

  document.getElementById("profileModalClose").addEventListener("click", closeProfileModal);

  document.getElementById("profileModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("profileModal")) { closeProfileModal(); }
  });

  /* Profile form submission */
  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fullNameVal = document.getElementById("profileFullName").value.trim() || "Siswa";
    saveProfile({
      fullName: fullNameVal,
    });
    updateAvatarDisplays();
    renderProfileDropdown();
    closeProfileModal();
    showToast("Profil berhasil disimpan! ✨", "success");
  });

  /* Welcome onboarding form submission */
  const welcomeForm = document.getElementById("welcomeForm");
  if (welcomeForm) {
    welcomeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputEl = document.getElementById("welcomeNameInput");
      const rawName = inputEl ? inputEl.value.trim() : "";
      const finalName = rawName || "Siswa";
      const newUser = {
        username: finalName.toLowerCase().replace(/\s+/g, ""),
        fullName: finalName,
        avatar: null,
        rawAvatar: null,
      };
      saveProfile(newUser);
      currentUser = newUser;
      updateAvatarDisplays();
      renderProfileDropdown();
      closeWelcomeModal();
      showToast(`Halo, ${finalName}! Selamat datang di SchoolTask 🎉`, "success");
    });
  }

  const welcomeModal = document.getElementById("welcomeModal");
  if (welcomeModal) {
    welcomeModal.addEventListener("click", (e) => {
      if (e.target === welcomeModal) {
        closeWelcomeModal();
      }
    });
  }

  /* ----- AVATAR UPLOAD & CROPPER CONTROLS ----- */
  const avatarFileInput = document.getElementById("avatarFileInput");
  if (avatarFileInput) {
    avatarFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) { handleAvatarUpload(file); }
      e.target.value = "";
    });
  }

  const btnUploadAvatar = document.getElementById("btnUploadAvatar");
  if (btnUploadAvatar) {
    btnUploadAvatar.addEventListener("click", () => {
      if (avatarFileInput) { avatarFileInput.click(); }
    });
  }

  const btnOpenCropper = document.getElementById("btnOpenCropper");
  if (btnOpenCropper) {
    btnOpenCropper.addEventListener("click", () => {
      const currentSrc = (currentUser && (currentUser.rawAvatar || currentUser.avatar));
      if (currentSrc && !currentSrc.startsWith("data:image/svg+xml")) {
        initCropperWithImage(currentSrc);
      } else if (avatarFileInput) {
        avatarFileInput.click();
      }
    });
  }

  const avatarUploadArea = document.getElementById("avatarUploadArea");
  if (avatarUploadArea) {
    avatarUploadArea.addEventListener("click", () => {
      const currentSrc = (currentUser && (currentUser.rawAvatar || currentUser.avatar));
      if (currentSrc && !currentSrc.startsWith("data:image/svg+xml")) {
        initCropperWithImage(currentSrc);
      } else if (avatarFileInput) {
        avatarFileInput.click();
      }
    });
    avatarUploadArea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (avatarFileInput) { avatarFileInput.click(); }
      }
    });
  }

  /* Cropper Modal Close */
  const cropModalClose = document.getElementById("cropModalClose");
  if (cropModalClose) { cropModalClose.addEventListener("click", closeCropModal); }

  const cropCancelBtn = document.getElementById("cropCancelBtn");
  if (cropCancelBtn) { cropCancelBtn.addEventListener("click", closeCropModal); }

  const avatarCropModal = document.getElementById("avatarCropModal");
  if (avatarCropModal) {
    avatarCropModal.addEventListener("click", (e) => {
      if (e.target === avatarCropModal) { closeCropModal(); }
    });
  }

  /* Cropper Dragging (Mouse & Touch) */
  const cropVp = document.getElementById("cropViewport");
  if (cropVp) {
    cropVp.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onCropDragStart(e.clientX, e.clientY);
    });

    cropVp.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches.length === 1) {
        onCropDragStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    cropVp.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 12 : -12;
      setCropZoom((cropperState.zoomFactor * 100) + delta);
    }, { passive: false });
  }

  window.addEventListener("mousemove", (e) => {
    if (cropperState.isDragging) {
      onCropDragMove(e.clientX, e.clientY);
    }
  });

  window.addEventListener("touchmove", (e) => {
    if (cropperState.isDragging && e.touches && e.touches.length === 1) {
      onCropDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener("mouseup", () => {
    if (cropperState.isDragging) {
      onCropDragEnd();
    }
  });

  window.addEventListener("touchend", () => {
    if (cropperState.isDragging) {
      onCropDragEnd();
    }
  });

  /* Cropper Zoom Controls */
  const cropZoomSlider = document.getElementById("cropZoomSlider");
  if (cropZoomSlider) {
    cropZoomSlider.addEventListener("input", (e) => {
      setCropZoom(Number(e.target.value));
    });
  }

  const cropZoomOutBtn = document.getElementById("cropZoomOutBtn");
  if (cropZoomOutBtn) {
    cropZoomOutBtn.addEventListener("click", () => {
      setCropZoom((cropperState.zoomFactor * 100) - 15);
    });
  }

  const cropZoomInBtn = document.getElementById("cropZoomInBtn");
  if (cropZoomInBtn) {
    cropZoomInBtn.addEventListener("click", () => {
      setCropZoom((cropperState.zoomFactor * 100) + 15);
    });
  }

  /* Cropper Presets */
  const cropPresetCenter = document.getElementById("cropPresetCenter");
  if (cropPresetCenter) {
    cropPresetCenter.addEventListener("click", () => {
      cropperState.offsetX = 0;
      cropperState.offsetY = 0;
      applyCropTransform();
    });
  }

  const cropPresetFace = document.getElementById("cropPresetFace");
  if (cropPresetFace) {
    cropPresetFace.addEventListener("click", () => {
      setCropZoom(140);
      cropperState.offsetX = 0;
      const dispH = cropperState.imgNaturalH * cropperState.scale;
      const maxOffsetY = Math.max(0, (dispH - cropperState.circleD) / 2);
      cropperState.offsetY = Math.round(maxOffsetY * 0.7);
      applyCropTransform();
    });
  }

  const cropPresetReset = document.getElementById("cropPresetReset");
  if (cropPresetReset) {
    cropPresetReset.addEventListener("click", () => {
      setCropZoom(100);
      cropperState.offsetX = 0;
      cropperState.offsetY = 0;
      applyCropTransform();
    });
  }

  /* Cropper Apply */
  const cropApplyBtn = document.getElementById("cropApplyBtn");
  if (cropApplyBtn) {
    cropApplyBtn.addEventListener("click", applyAvatarCrop);
  }

  /* ----- EDIT TASK MODAL ----- */
  document.getElementById("editTaskModalClose").addEventListener("click", closeEditModal);

  document.getElementById("editTaskModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("editTaskModal")) { closeEditModal(); }
  });

  document.getElementById("editTaskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = Number(document.getElementById("editTaskId").value);

    const titleVal = document.getElementById("editTitle").value.trim();
    const titleErr = validateTitle(titleVal);
    if (titleErr) { showToast(titleErr, "error"); return; }

    const subjectVal = document.getElementById("editSubject").value;
    const subjectErr = validateSubject(subjectVal);
    if (subjectErr) { showToast(subjectErr, "error"); return; }

    updateTask(id, {
      title:    titleVal,
      subject:  subjectVal,
      dueDate:  document.getElementById("editDueDate").value,
      dueTime:  document.getElementById("editDueTime").value,
      priority: document.getElementById("editPriority").value,
      status:   document.getElementById("editStatus").value,
    });

    closeEditModal();
    showToast("Tugas diperbarui.", "success");
  });

  /* ----- SETTINGS: ADD SUBJECT ----- */
  document.getElementById("addSubjectForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp  = document.getElementById("newSubjectInput");
    const name = inp.value.trim();
    if (!name) { showToast("Nama mapel tidak boleh kosong.", "error"); return; }
    const added = addCustomSubject(name);
    if (added) {
      showToast(`Mapel "${name}" ditambahkan.`, "success");
      inp.value = "";
      renderSettingsSubjects();
    } else {
      showToast("Mapel sudah ada atau tidak valid.", "warning");
    }
  });

  /* ----- SETTINGS: EXPORT DATA ----- */
  document.getElementById("exportDataBtn").addEventListener("click", () => {
    const data = {
      exportedAt: new Date().toISOString(),
      tasks,
      customSubjects,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `schooltask-export-${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data berhasil diekspor.", "success");
  });

  /* ----- SETTINGS: RESET DATA ----- */
  document.getElementById("resetDataBtn").addEventListener("click", () => {
    if (confirm("Yakin ingin menghapus SEMUA data tugas dan pengaturan? Tindakan ini tidak dapat dibatalkan.")) {
      tasks = [];
      customSubjects = [];
      saveTasks();
      saveSubjects();
      applyFilters();
      renderMetricCards();
      renderSubjectProgress();
      renderDonutChart();
      renderWeeklyChart();
      renderSettingsSubjects();
      updateSubjectSelects();
      showToast("Semua data telah direset.", "warning");
    }
  });

  /* ----- TOPBAR SCROLL ELEVATION (Persis gaya PT Artha Haridra Cipta) ----- */
  const mainTopbar = document.getElementById("mainTopbar");
  if (mainTopbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 15) {
        mainTopbar.classList.add("topbar-scrolled");
      } else {
        mainTopbar.classList.remove("topbar-scrolled");
      }
    }, { passive: true });
  }

  /* ----- WINDOW RESIZE: Redraw charts ----- */
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      renderDonutChart();
      renderWeeklyChart();
      if (currentView === "analytics") { renderAnalyticsWeeklyChart(); }
    }, 150);
  });
}

/* ============================================================
   SECTION 2: INIT APP & PUBLIC API
   ============================================================ */

/**
 * Menginisialisasi seluruh aplikasi SchoolTask.
 * Dipanggil saat halaman selesai dimuat.
 * @returns {void}
 */
function initApp() {
  /* 1. Pastikan user default ada */
  initDefaultUser();
  const isFirstVisit = !currentUser;
  if (isFirstVisit) {
    currentUser = {
      username:  "siswa",
      fullName:  "Siswa",
      avatar:    null,
      rawAvatar: null,
    };
  }

  /* 2. Pastikan sidebar backdrop untuk mobile ada */
  let backdrop = document.getElementById("sidebarBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "sidebarBackdrop";
    backdrop.className = "sidebar-backdrop";
    document.body.appendChild(backdrop);
  }

  /* 3. Pasang event listeners */
  setupEventListeners();

  /* 4. Tampilkan app dan render UI langsung */
  showApp();

  /* 5. Set view awal */
  switchView("dashboard");

  /* 6. Jika pengunjung baru (belum ada data di localStorage), tampilkan modal sambutan onboarding */
  if (isFirstVisit) {
    openWelcomeModal();
  }

  /* 7. Expose ke window untuk keperluan penilaian UKK & pengujian */
  window._schoolTask = {
    get tasks() { return tasks; },
    addTask,
    updateTask,
    deleteTask,
    updateStatus,
    filterTasks,
    getAllSubjects,
    addCustomSubject,
    removeCustomSubject,
    applyFilters,
    sortTasks,
    getDueStatus,
    formatDate,
    getTodayString,
    showToast,
    openWelcomeModal,
    closeWelcomeModal,
    loadProfile,
    saveProfile,
    currentUser: () => currentUser,
  };
}

/* Jalankan aplikasi setelah DOM siap */
document.addEventListener("DOMContentLoaded", initApp);
