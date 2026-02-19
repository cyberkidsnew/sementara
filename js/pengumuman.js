/**
 * Absensi Santri - Pengumuman (Announcements) Script
 * Full CRUD: Create, Read, Update, Delete with filter tabs
 */

document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  if (!AuthModule.requireAuth()) return;

  // Load user data
  var currentUser = AuthModule.getCurrentUser();
  if (currentUser) {
    var avatarEl = document.querySelector('.greeting-avatar');
    var nameEl = document.querySelector('.greeting-name');

    if (avatarEl) {
      avatarEl.textContent = AuthModule.getInitials(currentUser.name);
    }
    if (nameEl) {
      nameEl.textContent = currentUser.name;
    }
  }

  var announcementList = document.getElementById('announcementList');
  var emptyState = document.getElementById('emptyState');

  // Filter tabs
  var filterTabs = document.querySelectorAll('.filter-tab');
  var currentFilter = 'semua';

  // Modal elements
  var modalOverlay = document.getElementById('pgModalOverlay');
  var modalTitle = document.getElementById('pgModalTitle');
  var formJudul = document.getElementById('formJudul');
  var formTipe = document.getElementById('formTipe');
  var formIsi = document.getElementById('formIsi');
  var formError = document.getElementById('formError');
  var formErrorText = document.getElementById('formErrorText');
  var btnSave = document.getElementById('btnSavePg');
  var btnCancel = document.getElementById('btnCancelPg');
  var btnCloseModal = document.getElementById('btnCloseModal');
  var btnAdd = document.getElementById('btnAddPengumuman');

  // Delete dialog
  var deleteOverlay = document.getElementById('deleteDialogOverlay');
  var deletePgName = document.getElementById('deletePgName');
  var btnConfirmDelete = document.getElementById('btnConfirmDelete');
  var btnCancelDelete = document.getElementById('btnCancelDelete');

  // Toast
  var toast = document.getElementById('pgToast');
  var toastText = document.getElementById('pgToastText');

  var editingId = null;
  var deletingId = null;

  // Icons per type
  var typeIcons = {
    penting: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    kegiatan: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>'
  };

  var typeLabels = {
    penting: 'Penting',
    info: 'Info',
    kegiatan: 'Kegiatan'
  };

  // --- Time ago helper ---
  function timeAgo(dateStr) {
    var now = new Date();
    var then = new Date(dateStr + 'T00:00:00');
    var diffDays = Math.floor((now - then) / 86400000);

    if (diffDays <= 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return diffDays + ' hari lalu';
    if (diffDays < 30) return Math.floor(diffDays / 7) + ' minggu lalu';
    return Math.floor(diffDays / 30) + ' bulan lalu';
  }

  // --- Render list ---
  function renderList() {
    var list = AttendanceStore.getAllPengumuman();
    var filtered = [];

    // Count per type
    var counts = { semua: list.length, penting: 0, info: 0, kegiatan: 0 };
    for (var i = 0; i < list.length; i++) {
      if (counts.hasOwnProperty(list[i].tipe)) counts[list[i].tipe]++;
      if (currentFilter === 'semua' || list[i].tipe === currentFilter) {
        filtered.push(list[i]);
      }
    }

    // Update tab counts
    var cSemua = document.getElementById('countSemua');
    var cPenting = document.getElementById('countPenting');
    var cInfo = document.getElementById('countInfo');
    var cKegiatan = document.getElementById('countKegiatan');
    if (cSemua) cSemua.textContent = counts.semua;
    if (cPenting) cPenting.textContent = counts.penting;
    if (cInfo) cInfo.textContent = counts.info;
    if (cKegiatan) cKegiatan.textContent = counts.kegiatan;

    if (filtered.length === 0) {
      announcementList.style.display = 'none';
      emptyState.style.display = '';
      return;
    }

    announcementList.style.display = '';
    emptyState.style.display = 'none';

    var html = '';
    for (var j = 0; j < filtered.length; j++) {
      var item = filtered[j];
      var readClass = item.dibaca ? ' read' : '';
      var icon = typeIcons[item.tipe] || typeIcons.info;
      var label = typeLabels[item.tipe] || 'Info';
      var unreadDot = item.dibaca ? '' : '<span class="unread-dot"></span>';
      var preview = item.isi.length > 120 ? item.isi.substring(0, 120) + '...' : item.isi;

      html +=
        '<div class="announcement-card' + readClass + '" data-type="' + item.tipe + '" data-id="' + item.id + '" style="animation-delay: ' + (j * 0.05) + 's;">' +
          '<div class="announcement-card-inner">' +
            '<div class="announcement-icon">' + icon + '</div>' +
            '<div class="announcement-content">' +
              '<div class="announcement-header">' +
                '<span class="announcement-title">' + escapeHtml(item.judul) + '</span>' +
                unreadDot +
              '</div>' +
              '<p class="announcement-preview">' + escapeHtml(preview) + '</p>' +
              '<div class="announcement-footer">' +
                '<div class="announcement-meta">' +
                  '<span class="announcement-badge">' + label + '</span>' +
                  '<span class="announcement-time">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
                    timeAgo(item.tanggal) +
                  '</span>' +
                '</div>' +
                '<div class="announcement-actions">' +
                  '<button class="pg-action-btn pg-edit-btn" data-edit-id="' + item.id + '" aria-label="Edit">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>' +
                  '</button>' +
                  '<button class="pg-action-btn pg-delete-btn" data-delete-id="' + item.id + '" aria-label="Hapus">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="announcement-full-content">' +
            '<div class="full-text">' + escapeHtml(item.isi) + '</div>' +
          '</div>' +
        '</div>';
    }

    announcementList.innerHTML = html;
    bindCardEvents();
  }

  // --- Escape HTML ---
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Bind card click/expand and action buttons ---
  function bindCardEvents() {
    var cards = announcementList.querySelectorAll('.announcement-card');
    cards.forEach(function (card) {
      var inner = card.querySelector('.announcement-card-inner');
      inner.addEventListener('click', function (e) {
        // Don't expand when clicking action buttons
        if (e.target.closest('.pg-action-btn')) return;

        var wasExpanded = card.classList.contains('expanded');
        cards.forEach(function (c) { c.classList.remove('expanded'); });
        if (!wasExpanded) {
          card.classList.add('expanded');
        }

        // Mark as read
        var id = parseInt(card.getAttribute('data-id'), 10);
        if (!card.classList.contains('read')) {
          card.classList.add('read');
          AttendanceStore.markPengumumanRead(id);
        }
      });
    });

    // Edit buttons
    var editBtns = announcementList.querySelectorAll('.pg-edit-btn');
    editBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(btn.getAttribute('data-edit-id'), 10);
        openEditModal(id);
      });
    });

    // Delete buttons
    var deleteBtns = announcementList.querySelectorAll('.pg-delete-btn');
    deleteBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(btn.getAttribute('data-delete-id'), 10);
        openDeleteDialog(id);
      });
    });
  }

  // --- Filter tabs ---
  filterTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      filterTabs.forEach(function (t) { t.classList.remove('active'); });
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      renderList();
    });
  });

  // --- Modal helpers ---
  function openAddModal() {
    editingId = null;
    modalTitle.textContent = 'Tambah Pengumuman';
    formJudul.value = '';
    formTipe.value = 'penting';
    formIsi.value = '';
    hideFormError();
    modalOverlay.classList.add('active');
  }

  function openEditModal(id) {
    var item = AttendanceStore.getPengumumanById(id);
    if (!item) return;
    editingId = id;
    modalTitle.textContent = 'Edit Pengumuman';
    formJudul.value = item.judul;
    formTipe.value = item.tipe;
    formIsi.value = item.isi;
    hideFormError();
    modalOverlay.classList.add('active');
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    editingId = null;
  }

  function showFormError(msg) {
    formErrorText.textContent = msg;
    formError.style.display = '';
  }

  function hideFormError() {
    formError.style.display = 'none';
  }

  // --- Save (create / update) ---
  function handleSave() {
    var judul = formJudul.value.trim();
    var tipe = formTipe.value;
    var isi = formIsi.value.trim();

    if (!judul) { showFormError('Judul pengumuman wajib diisi'); return; }
    if (!isi) { showFormError('Isi pengumuman wajib diisi'); return; }

    var data = { judul: judul, tipe: tipe, isi: isi };

    if (editingId) {
      var result = AttendanceStore.updatePengumuman(editingId, data);
      if (result.error) { showFormError(result.error); return; }
      showToast('Pengumuman berhasil diperbarui');
    } else {
      data.tanggal = new Date().toISOString().split('T')[0];
      var result2 = AttendanceStore.addPengumuman(data);
      if (result2.error) { showFormError(result2.error); return; }
      showToast('Pengumuman berhasil ditambahkan');
    }

    closeModal();
    renderList();
  }

  // --- Delete ---
  function openDeleteDialog(id) {
    var item = AttendanceStore.getPengumumanById(id);
    if (!item) return;
    deletingId = id;
    deletePgName.textContent = item.judul;
    deleteOverlay.classList.add('active');
  }

  function closeDeleteDialog() {
    deleteOverlay.classList.remove('active');
    deletingId = null;
  }

  function handleDelete() {
    if (!deletingId) return;
    AttendanceStore.deletePengumuman(deletingId);
    closeDeleteDialog();
    renderList();
    showToast('Pengumuman berhasil dihapus');
  }

  // --- Toast ---
  function showToast(msg) {
    toastText.textContent = msg;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2500);
  }

  // --- Event bindings ---
  btnAdd.addEventListener('click', openAddModal);
  btnSave.addEventListener('click', handleSave);
  btnCancel.addEventListener('click', closeModal);
  btnCloseModal.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });

  btnConfirmDelete.addEventListener('click', handleDelete);
  btnCancelDelete.addEventListener('click', closeDeleteDialog);
  deleteOverlay.addEventListener('click', function (e) {
    if (e.target === deleteOverlay) closeDeleteDialog();
  });

  // --- Initial render ---
  renderList();
});
