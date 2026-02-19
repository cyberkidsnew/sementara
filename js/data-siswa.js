/**
 * Absensi Santri - Data Siswa Script
 * Full CRUD: Create, Read, Update, Delete with search & filter
 */

document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('searchInput');
  var studentList = document.getElementById('studentList');
  var emptyState = document.getElementById('emptyState');
  

  // Modal elements
  var modalOverlay = document.getElementById('studentModalOverlay');
  var modalTitle = document.getElementById('modalTitle');
  var formNama = document.getElementById('formNama');
  var formNIS = document.getElementById('formNIS');
  var formKelas = document.getElementById('formKelas');
  var formKelamin = document.getElementById('formKelamin');
  var formStatus = document.getElementById('formStatus');
  var formError = document.getElementById('formError');
  var formErrorText = document.getElementById('formErrorText');
  var btnSave = document.getElementById('btnSaveStudent');
  var btnCancel = document.getElementById('btnCancelStudent');
  var btnCloseModal = document.getElementById('btnCloseModal');

  // Delete dialog elements
  var deleteOverlay = document.getElementById('deleteDialogOverlay');
  var deleteStudentName = document.getElementById('deleteStudentName');
  var btnConfirmDelete = document.getElementById('btnConfirmDelete');
  var btnCancelDelete = document.getElementById('btnCancelDelete');

  // Detail modal elements
  var detailOverlay = document.getElementById('detailModalOverlay');
  var detailAvatar = document.getElementById('detailAvatar');
  var detailNama = document.getElementById('detailNama');
  var detailStatus = document.getElementById('detailStatus');
  var detailNIS = document.getElementById('detailNIS');
  var detailKelas = document.getElementById('detailKelas');
  var detailKelamin = document.getElementById('detailKelamin');
  var btnCloseDetail = document.getElementById('btnCloseDetail');
  var btnCloseDetailFooter = document.getElementById('btnCloseDetailFooter');
  var btnEditFromDetail = document.getElementById('btnEditFromDetail');
  var btnDeleteFromDetail = document.getElementById('btnDeleteFromDetail');
  var detailCurrentId = null;

  var editingId = null; // null = creating, number = editing
  var deletingId = null;

  // Avatar gradient palette
  var avatarGradients = [
    'linear-gradient(135deg, #6366F1, #818CF8)',
    'linear-gradient(135deg, #0D9488, #2DD4BF)',
    'linear-gradient(135deg, #F59E0B, #FBBF24)',
    'linear-gradient(135deg, #EC4899, #F472B6)',
    'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    'linear-gradient(135deg, #EF4444, #F87171)',
    'linear-gradient(135deg, #14B8A6, #5EEAD4)',
    'linear-gradient(135deg, #D946EF, #E879F9)',
    'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    'linear-gradient(135deg, #84CC16, #A3E635)',
    'linear-gradient(135deg, #F97316, #FB923C)',
    'linear-gradient(135deg, #06B6D4, #22D3EE)'
  ];

  // Kelas labels mapping - akan diisi dari data kelas
  var kelasLabels = {};

  // SVG for registration number icon in cards
  var regSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>';

  // --- Load kelas data and build labels mapping ---
  function loadKelasLabels() {
    var kelasList = AttendanceStore.getAllKelas();
    kelasLabels = {};
    kelasList.forEach(function (k) {
      kelasLabels[k.kode] = k.nama;
    });
  }

  // --- Populate kelas dropdown ---
  function populateKelasDropdown() {
    var kelasList = AttendanceStore.getAllKelas();
    formKelas.innerHTML = '';
    
    if (kelasList.length === 0) {
      var opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Belum ada kelas';
      formKelas.appendChild(opt);
      return;
    }
    
    kelasList.forEach(function (k) {
      var opt = document.createElement('option');
      opt.value = k.kode;
      opt.textContent = k.nama;
      formKelas.appendChild(opt);
    });
  }

  // --- Get initials from name ---
  function getInitials(name) {
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // --- Get avatar gradient by student id ---
  function getAvatarGradient(id) {
    return avatarGradients[(id - 1) % avatarGradients.length];
  }

  // --- Render student list ---
  function renderStudents() {
    loadKelasLabels(); // Refresh kelas labels
    var students = AttendanceStore.getAllStudents();
    studentList.innerHTML = '';

    students.forEach(function (s) {
      var card = document.createElement('div');
      card.className = 'ds-card';
      card.setAttribute('data-kelas', s.kelas);
      card.setAttribute('data-id', s.id);

      var initials = getInitials(s.nama);
      var gradient = getAvatarGradient(s.id);
      var label = kelasLabels[s.kelas] || s.kelas;
      var statusClass = s.status === 'active' ? 'active' : 'inactive';
      var statusTitle = s.status === 'active' ? 'Aktif' : 'Tidak Aktif';

      card.innerHTML =
        '<div class="ds-avatar" style="background: ' + gradient + ';">' + initials + '</div>' +
        '<div class="ds-info">' +
          '<span class="ds-name">' + escapeHtml(s.nama) + '</span>' +
          '<div class="ds-meta">' +
            '<span class="ds-nis">' + regSVG + ' ' + s.nis + '</span>' +
            '<span class="ds-kelas">' + label + '</span>' +
            '<span class="ds-kelamin-badge ds-kelamin-' + s.kelamin.toLowerCase() + '">' + (s.kelamin === 'L' ? 'L' : 'P') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="ds-actions">' +
          '<button class="ds-action-btn ds-edit-btn" data-id="' + s.id + '" title="Edit" aria-label="Edit ' + escapeHtml(s.nama) + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>' +
          '</button>' +
          '<button class="ds-action-btn ds-delete-btn" data-id="' + s.id + '" title="Hapus" aria-label="Hapus ' + escapeHtml(s.nama) + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
          '</button>' +
        '</div>' +
        '<span class="ds-status ' + statusClass + '" title="' + statusTitle + '"></span>';

      studentList.appendChild(card);
    });

    updateStats(students);
    applyFilters();
    bindCardActions();

    // Re-init QR buttons after re-render
    if (typeof window.initQRButtons === 'function') {
      window.initQRButtons();
    }
  }

  // --- Escape HTML ---
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Update stats summary ---
  function updateStats(students) {
    var total = students.length;
    var lk = 0;
    var pr = 0;
    students.forEach(function (s) {
      if (s.kelamin === 'L') lk++;
      else pr++;
    });

    var statNumbers = document.querySelectorAll('.ds-stat-number');
    if (statNumbers.length >= 3) {
      statNumbers[0].textContent = total;
      statNumbers[1].textContent = lk;
      statNumbers[2].textContent = pr;
    }
  }

  // --- Bind card click and action buttons ---
  function bindCardActions() {
    // Card click → open detail
    document.querySelectorAll('.ds-card').forEach(function (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-id'), 10);
        openDetailModal(id);
      });
    });

    document.querySelectorAll('.ds-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(this.getAttribute('data-id'), 10);
        openEditModal(id);
      });
    });

    document.querySelectorAll('.ds-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(this.getAttribute('data-id'), 10);
        openDeleteDialog(id);
      });
    });
  }

  // --- Search ---
  searchInput.addEventListener('input', function () {
    applyFilters();
  });

  function applyFilters() {
    var query = searchInput.value.toLowerCase().trim();
    var cards = document.querySelectorAll('.ds-card');
    var visibleCount = 0;

    cards.forEach(function (card) {
      var name = card.querySelector('.ds-name').textContent.toLowerCase();
      var nis = card.querySelector('.ds-nis').textContent.toLowerCase();
      var kelas = card.getAttribute('data-kelas');

      var matchSearch = !query || name.indexOf(query) !== -1 || nis.indexOf(query) !== -1;

      if (matchSearch) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (visibleCount === 0) {
      studentList.style.display = 'none';
      emptyState.style.display = '';
    } else {
      studentList.style.display = '';
      emptyState.style.display = 'none';
    }
  }

  // ==============================
  // DETAIL MODAL
  // ==============================

  function openDetailModal(id) {
    var student = AttendanceStore.getStudentById(id);
    if (!student) return;

    var initials = getInitials(student.nama);
    var gradient = getAvatarGradient(student.id);
    var label = kelasLabels[student.kelas] || student.kelas;

    detailAvatar.textContent = initials;
    detailAvatar.style.background = gradient;
    detailNama.textContent = student.nama;
    detailCurrentId = student.id;
    detailNIS.textContent = student.nis;
    detailKelas.textContent = label;
    detailKelamin.textContent = student.kelamin === 'L' ? 'Laki-laki' : 'Perempuan';

    if (student.status === 'active') {
      detailStatus.textContent = 'Aktif';
      detailStatus.className = 'ds-detail-status ds-detail-status-active';
    } else {
      detailStatus.textContent = 'Tidak Aktif';
      detailStatus.className = 'ds-detail-status ds-detail-status-inactive';
    }

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

  // Open modal for adding
  document.getElementById('btnAddSiswa').addEventListener('click', function () {
    openAddModal();
  });

  var formNISGroup = document.getElementById('formNISGroup');

  function openAddModal() {
    editingId = null;
    modalTitle.textContent = 'Tambah Siswa Baru';
    btnSave.textContent = 'Simpan';
    formNama.value = '';
    formNIS.value = '';
    formNISGroup.style.display = 'none';
    populateKelasDropdown();
    formKelamin.value = 'L';
    formStatus.value = 'active';
    hideFormError();
    showModal(modalOverlay);
    formNama.focus();
  }

  function openEditModal(id) {
    var student = AttendanceStore.getStudentById(id);
    if (!student) return;

    editingId = id;
    modalTitle.textContent = 'Edit Data Siswa';
    btnSave.textContent = 'Perbarui';
    formNama.value = student.nama;
    formNIS.value = student.nis;
    formNISGroup.style.display = '';
    populateKelasDropdown();
    formKelas.value = student.kelas;
    formKelamin.value = student.kelamin;
    formStatus.value = student.status;
    hideFormError();
    showModal(modalOverlay);
    formNama.focus();
  }

  // Save handler
  btnSave.addEventListener('click', function () {
    saveStudent();
  });

  // Cancel handlers
  btnCancel.addEventListener('click', function () { closeModal(modalOverlay); });
  btnCloseModal.addEventListener('click', function () { closeModal(modalOverlay); });
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal(modalOverlay);
  });

  function saveStudent() {
    var nama = formNama.value.trim();
    var kelas = formKelas.value;
    var kelamin = formKelamin.value;
    var status = formStatus.value;

    // Validation
    if (!nama) { showFormError('Nama siswa wajib diisi'); formNama.focus(); return; }
    if (nama.length < 3) { showFormError('Nama minimal 3 karakter'); formNama.focus(); return; }
    if (!kelas) { showFormError('Kelas wajib dipilih'); formKelas.focus(); return; }

    var data = { nama: nama, kelas: kelas, kelamin: kelamin, status: status };
    var result;

    if (editingId) {
      result = AttendanceStore.updateStudent(editingId, data);
    } else {
      result = AttendanceStore.addStudent(data);
    }

    if (result.error) {
      showFormError(result.error);
      return;
    }

    closeModal(modalOverlay);
    renderStudents();
    
    // Trigger event untuk update data kelas jika halaman data-kelas terbuka
    if (typeof window.refreshKelasStats === 'function') {
      window.refreshKelasStats();
    }
    
    // Trigger event untuk update absensi jika halaman absensi terbuka
    if (typeof window.refreshAbsensiData === 'function') {
      window.refreshAbsensiData();
    }
    
    showToast(editingId ? 'Data siswa berhasil diperbarui!' : 'Siswa baru berhasil ditambahkan!');
  }

  // Enter key to save
  formNama.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); saveStudent(); }
  });

  // ==============================
  // DELETE DIALOG
  // ==============================

  function openDeleteDialog(id) {
    var student = AttendanceStore.getStudentById(id);
    if (!student) return;
    deletingId = id;
    deleteStudentName.textContent = student.nama;
    showModal(deleteOverlay);
  }

  btnConfirmDelete.addEventListener('click', function () {
    if (!deletingId) return;
    var result = AttendanceStore.deleteStudent(deletingId);
    closeModal(deleteOverlay);
    deletingId = null;

    if (result.success) {
      renderStudents();
      
      // Trigger event untuk update data kelas jika halaman data-kelas terbuka
      if (typeof window.refreshKelasStats === 'function') {
        window.refreshKelasStats();
      }
      
      // Trigger event untuk update absensi jika halaman absensi terbuka
      if (typeof window.refreshAbsensiData === 'function') {
        window.refreshAbsensiData();
      }
      
      showToast('Siswa berhasil dihapus');
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
    var existing = document.getElementById('dsToast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'dsToast';
    toast.className = 'ds-toast';
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
  renderStudents();
});
