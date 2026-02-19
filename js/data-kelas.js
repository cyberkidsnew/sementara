/**
 * Absensi Santri - Data Kelas Script
 * Full CRUD: Create, Read, Update, Delete
 */

document.addEventListener('DOMContentLoaded', function () {
  var kelasList = document.getElementById('kelasList');
  var emptyState = document.getElementById('emptyState');
  var statTotalKelas = document.getElementById('statTotalKelas');
  var statTotalSantri = document.getElementById('statTotalSantri');

  // Modal elements
  var modalOverlay = document.getElementById('kelasModalOverlay');
  var modalTitle = document.getElementById('modalTitle');
  var formNama = document.getElementById('formNama');
  var formWali = document.getElementById('formWali');
  var formError = document.getElementById('formError');
  var formErrorText = document.getElementById('formErrorText');
  var btnSave = document.getElementById('btnSaveKelas');
  var btnCancel = document.getElementById('btnCancelKelas');
  var btnCloseModal = document.getElementById('btnCloseModal');

  // Detail modal elements
  var detailOverlay = document.getElementById('detailModalOverlay');
  var detailNama = document.getElementById('detailNama');
  var detailRegistrasi = document.getElementById('detailRegistrasi');
  var detailWali = document.getElementById('detailWali');
  var detailJumlah = document.getElementById('detailJumlah');
  var btnCloseDetail = document.getElementById('btnCloseDetail');
  var btnCloseDetailFooter = document.getElementById('btnCloseDetailFooter');
  var btnEditFromDetail = document.getElementById('btnEditFromDetail');
  var btnDeleteFromDetail = document.getElementById('btnDeleteFromDetail');

  // Delete dialog elements
  var deleteOverlay = document.getElementById('deleteDialogOverlay');
  var deleteKelasName = document.getElementById('deleteKelasName');
  var btnConfirmDelete = document.getElementById('btnConfirmDelete');
  var btnCancelDelete = document.getElementById('btnCancelDelete');

  var editingId = null;
  var deletingId = null;
  var detailCurrentId = null;

  // Color accents for cards (cycle through)
  var accentClasses = ['indigo', 'emerald', 'amber', 'rose', 'violet', 'cyan'];

  // SVG icons
  var waliSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>';
  var editSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';
  var deleteSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function getAccent(index) {
    return accentClasses[index % accentClasses.length];
  }

  // --- Render kelas list ---
  function renderKelas() {
    var list = AttendanceStore.getAllKelas();
    kelasList.innerHTML = '';

    var totalSantri = 0;

    list.forEach(function (kelas, idx) {
      var accent = getAccent(idx);
      var santriCount = AttendanceStore.getStudentCountByKelas(kelas.kode);
      totalSantri += santriCount;

      var card = document.createElement('div');
      card.className = 'dk-card';
      card.setAttribute('data-id', kelas.id);
      card.style.animationDelay = (idx * 0.05) + 's';

      var regSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>';

      card.innerHTML =
        '<div class="dk-card-accent dk-accent-' + accent + '"></div>' +
        '<div class="dk-card-body">' +
          '<div class="dk-card-top">' +
            '<div class="dk-card-info">' +
              '<span class="dk-card-name">' + escapeHtml(kelas.nama) + '</span>' +
              '<span class="dk-card-reg">' + regSVG + ' ' + (kelas.registrasi || '-') + '</span>' +
              '<span class="dk-card-wali">' + waliSVG + ' Wali: ' + escapeHtml(kelas.wali) + '</span>' +
            '</div>' +
            '<span class="dk-card-badge dk-badge-' + accent + '">' + santriCount + ' santri</span>' +
          '</div>' +
          '<div class="dk-card-bottom">' +
            '<div class="dk-card-actions">' +
              '<button class="dk-action-btn dk-edit-btn" data-id="' + kelas.id + '" title="Edit" aria-label="Edit">' + editSVG + '</button>' +
              '<button class="dk-action-btn dk-delete-btn" data-id="' + kelas.id + '" title="Hapus" aria-label="Hapus">' + deleteSVG + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      kelasList.appendChild(card);
    });

    // Update stats
    statTotalKelas.textContent = list.length;
    statTotalSantri.textContent = totalSantri;

    // Empty state
    if (list.length === 0) {
      kelasList.style.display = 'none';
      emptyState.style.display = '';
    } else {
      kelasList.style.display = '';
      emptyState.style.display = 'none';
    }

    bindCardActions();
  }

  // --- Bind card click and action buttons ---
  function bindCardActions() {
    document.querySelectorAll('.dk-card').forEach(function (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-id'), 10);
        openDetailModal(id);
      });
    });

    document.querySelectorAll('.dk-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(this.getAttribute('data-id'), 10);
        openEditModal(id);
      });
    });

    document.querySelectorAll('.dk-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(this.getAttribute('data-id'), 10);
        openDeleteDialog(id);
      });
    });
  }

  // ==============================
  // DETAIL MODAL
  // ==============================

  function openDetailModal(id) {
    var kelas = AttendanceStore.getKelasById(id);
    if (!kelas) return;

    detailCurrentId = kelas.id;
    detailNama.textContent = kelas.nama;
    detailRegistrasi.textContent = kelas.registrasi || '-';
    detailWali.textContent = kelas.wali;
    detailJumlah.textContent = AttendanceStore.getStudentCountByKelas(kelas.kode) + ' santri';

    showModal(detailOverlay);
  }

  btnCloseDetail.addEventListener('click', function () { closeModal(detailOverlay); });
  btnCloseDetailFooter.addEventListener('click', function () { closeModal(detailOverlay); });
  btnEditFromDetail.addEventListener('click', function () {
    if (!detailCurrentId) return;
    closeModal(detailOverlay);
    openEditModal(detailCurrentId);
  });
  btnDeleteFromDetail.addEventListener('click', function () {
    if (!detailCurrentId) return;
    closeModal(detailOverlay);
    openDeleteDialog(detailCurrentId);
  });
  detailOverlay.addEventListener('click', function (e) {
    if (e.target === detailOverlay) closeModal(detailOverlay);
  });

  // ==============================
  // ADD / EDIT MODAL
  // ==============================

  document.getElementById('btnAddKelas').addEventListener('click', function () {
    openAddModal();
  });

  function openAddModal() {
    editingId = null;
    modalTitle.textContent = 'Tambah Kelas Baru';
    btnSave.textContent = 'Simpan';
    formNama.value = '';
    formWali.value = '';
    hideFormError();
    showModal(modalOverlay);
    formNama.focus();
  }

  function openEditModal(id) {
    var kelas = AttendanceStore.getKelasById(id);
    if (!kelas) return;

    editingId = id;
    modalTitle.textContent = 'Edit Kelas';
    btnSave.textContent = 'Perbarui';
    formNama.value = kelas.nama;
    formWali.value = kelas.wali;
    hideFormError();
    showModal(modalOverlay);
    formNama.focus();
  }

  // Save handler
  btnSave.addEventListener('click', function () { saveKelas(); });
  btnCancel.addEventListener('click', function () { closeModal(modalOverlay); });
  btnCloseModal.addEventListener('click', function () { closeModal(modalOverlay); });
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal(modalOverlay);
  });

  function saveKelas() {
    var nama = formNama.value.trim();
    var wali = formWali.value.trim();

    // Validation
    if (!nama) { showFormError('Nama kelas wajib diisi'); formNama.focus(); return; }
    if (nama.length < 2) { showFormError('Nama kelas minimal 2 karakter'); formNama.focus(); return; }
    if (!wali) { showFormError('Wali kelas wajib diisi'); formWali.focus(); return; }

    // Auto-generate kode from nama
    var kode = nama.toLowerCase().replace(/[^a-z0-9]/g, '');
    var data = { nama: nama, kode: kode, wali: wali };
    var result;

    if (editingId) {
      result = AttendanceStore.updateKelas(editingId, data);
    } else {
      result = AttendanceStore.addKelas(data);
    }

    if (result.error) {
      showFormError(result.error);
      return;
    }

    closeModal(modalOverlay);
    renderKelas();
    
    // Trigger event untuk update absensi jika halaman absensi terbuka
    if (typeof window.refreshAbsensiData === 'function') {
      window.refreshAbsensiData();
    }
    
    showToast(editingId ? 'Data kelas berhasil diperbarui!' : 'Kelas baru berhasil ditambahkan!');
  }

  // Enter key to save
  formNama.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); saveKelas(); }
  });


  // ==============================
  // DELETE DIALOG
  // ==============================

  function openDeleteDialog(id) {
    var kelas = AttendanceStore.getKelasById(id);
    if (!kelas) return;
    deletingId = id;
    deleteKelasName.textContent = kelas.nama;
    showModal(deleteOverlay);
  }

  btnConfirmDelete.addEventListener('click', function () {
    if (!deletingId) return;
    
    // Cek apakah ada siswa di kelas ini
    var kelas = AttendanceStore.getKelasById(deletingId);
    if (kelas) {
      var studentCount = AttendanceStore.getStudentCountByKelas(kelas.kode);
      if (studentCount > 0) {
        closeModal(deleteOverlay);
        deletingId = null;
        showToast('Tidak dapat menghapus kelas yang masih memiliki ' + studentCount + ' siswa aktif');
        return;
      }
    }
    
    var result = AttendanceStore.deleteKelas(deletingId);
    closeModal(deleteOverlay);
    deletingId = null;

    if (result.success) {
      renderKelas();
      
      // Trigger event untuk update absensi jika halaman absensi terbuka
      if (typeof window.refreshAbsensiData === 'function') {
        window.refreshAbsensiData();
      }
      
      showToast('Kelas berhasil dihapus');
    }
  });

  btnCancelDelete.addEventListener('click', function () { closeModal(deleteOverlay); });
  deleteOverlay.addEventListener('click', function (e) {
    if (e.target === deleteOverlay) closeModal(deleteOverlay);
  });

  // ==============================
  // MODAL HELPERS
  // ==============================

  function showModal(overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showFormError(msg) {
    formErrorText.textContent = msg;
    formError.style.display = 'flex';
  }

  function hideFormError() {
    formError.style.display = 'none';
    formErrorText.textContent = '';
  }

  // ESC key to close modals
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (detailOverlay.classList.contains('active')) closeModal(detailOverlay);
      if (modalOverlay.classList.contains('active')) closeModal(modalOverlay);
      if (deleteOverlay.classList.contains('active')) closeModal(deleteOverlay);
    }
  });

  // ==============================
  // TOAST NOTIFICATION
  // ==============================

  function showToast(message) {
    var existing = document.getElementById('dkToast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'dkToast';
    toast.className = 'dk-toast';
    toast.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
      '<span>' + message + '</span>';
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.classList.add('visible');
    });

    setTimeout(function () {
      toast.classList.remove('visible');
      setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
  }

  // --- Initial render ---
  renderKelas();
  
  // Expose refresh function untuk dipanggil dari halaman lain
  window.refreshKelasStats = function() {
    renderKelas();
  };
});
