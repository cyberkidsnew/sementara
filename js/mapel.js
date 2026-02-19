/**
 * Absensi Santri - Mapel (Mata Pelajaran) Script
 * Full CRUD: Create, Read, Update, Delete with search & day filter
 */

document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('searchInput');
  var mapelList = document.getElementById('mapelList');
  var emptyState = document.getElementById('emptyState');

  // Modal elements
  var modalOverlay = document.getElementById('mapelModalOverlay');
  var modalTitle = document.getElementById('modalTitle');
  var formMapel = document.getElementById('formMapel');
  var formGuru = document.getElementById('formGuru');
  var formStart = document.getElementById('formStart');
  var formEnd = document.getElementById('formEnd');
  var formKelas = document.getElementById('formKelas');
  var formError = document.getElementById('formError');
  var formErrorText = document.getElementById('formErrorText');
  var btnSave = document.getElementById('btnSaveMapel');
  var btnCancel = document.getElementById('btnCancelMapel');
  var btnCloseModal = document.getElementById('btnCloseModal');
  var hariCheckboxes = document.querySelectorAll('.mp-hari-check input[type="checkbox"]');

  // Delete dialog elements
  var deleteOverlay = document.getElementById('deleteDialogOverlay');
  var deleteMapelName = document.getElementById('deleteMapelName');
  var btnConfirmDelete = document.getElementById('btnConfirmDelete');
  var btnCancelDelete = document.getElementById('btnCancelDelete');

  // Detail modal elements
  var detailOverlay = document.getElementById('detailModalOverlay');
  var detailIcon = document.getElementById('detailIcon');
  var detailNama = document.getElementById('detailNama');
  var detailGuru = document.getElementById('detailGuru');
  var detailJam = document.getElementById('detailJam');
  var detailHari = document.getElementById('detailHari');
  var detailKelas = document.getElementById('detailKelas');
  var btnCloseDetail = document.getElementById('btnCloseDetail');
  var btnCloseDetailFooter = document.getElementById('btnCloseDetailFooter');
  var btnEditFromDetail = document.getElementById('btnEditFromDetail');
  var btnDeleteFromDetail = document.getElementById('btnDeleteFromDetail');
  var detailCurrentId = null;

  var editingId = null;
  var deletingId = null;
  var currentFilter = 'senin';

  // Color palette for mapel icons
  var mapelGradients = [
    'linear-gradient(135deg, #6366F1, #818CF8)',
    'linear-gradient(135deg, #F59E0B, #FBBF24)',
    'linear-gradient(135deg, #10B981, #34D399)',
    'linear-gradient(135deg, #0D9488, #2DD4BF)',
    'linear-gradient(135deg, #EC4899, #F472B6)',
    'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    'linear-gradient(135deg, #0EA5E9, #38BDF8)',
    'linear-gradient(135deg, #EF4444, #F87171)',
    'linear-gradient(135deg, #D946EF, #E879F9)',
    'linear-gradient(135deg, #84CC16, #A3E635)',
    'linear-gradient(135deg, #F97316, #FB923C)',
    'linear-gradient(135deg, #06B6D4, #22D3EE)'
  ];

  // Day abbreviations
  var dayLabels = {
    'senin': 'Sen', 'selasa': 'Sel', 'rabu': 'Rab',
    'kamis': 'Kam', 'jumat': 'Jum', 'sabtu': 'Sab', 'minggu': 'Min'
  };

  // Book icon SVG
  var bookSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>';
  var teacherSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>';
  var clockSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

  // --- Get gradient by id ---
  function getGradient(id) {
    return mapelGradients[(id - 1) % mapelGradients.length];
  }

  // --- Format hari display ---
  function formatHari(hariStr) {
    var days = hariStr.trim().split(/\s+/);
    var allWeekdays = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
    var allDays = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

    // Check if all weekdays
    var hasAll = true;
    for (var i = 0; i < allWeekdays.length; i++) {
      if (days.indexOf(allWeekdays[i]) === -1) { hasAll = false; break; }
    }
    if (hasAll && days.indexOf('sabtu') !== -1) return 'Setiap Hari';
    if (hasAll && days.indexOf('sabtu') === -1) return 'Setiap Hari';

    if (days.length === 1) {
      // Full name for single day
      return days[0].charAt(0).toUpperCase() + days[0].slice(1);
    }

    // Abbreviated
    var labels = [];
    for (var j = 0; j < days.length; j++) {
      labels.push(dayLabels[days[j]] || days[j]);
    }
    return labels.join(' & ');
  }

  // --- Escape HTML ---
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Calculate hours per week for a mapel ---
  function calcHours(m) {
    var startParts = m.start.split(':');
    var endParts = m.end.split(':');
    var startMin = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
    var endMin = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
    var duration = (endMin - startMin) / 60;
    var days = m.hari.trim().split(/\s+/).length;
    return duration * days;
  }

  // --- Update stats ---
  function updateStats(list) {
    var totalMapel = list.length;
    var totalJam = 0;
    var guruSet = {};

    for (var i = 0; i < list.length; i++) {
      totalJam += calcHours(list[i]);
      guruSet[list[i].guru] = true;
    }

    document.getElementById('statTotal').textContent = totalMapel;
    document.getElementById('statJam').textContent = Math.round(totalJam);
    document.getElementById('statGuru').textContent = Object.keys(guruSet).length;
  }

  // --- Render mapel list ---
  function renderMapel() {
    var list = AttendanceStore.getAllMapel();
    mapelList.innerHTML = '';

    list.forEach(function (m) {
      var card = document.createElement('div');
      card.className = 'mp-card';
      card.setAttribute('data-day', m.hari);
      card.setAttribute('data-id', m.id);

      var gradient = getGradient(m.id);
      var hariLabel = formatHari(m.hari);

      card.innerHTML =
        '<div class="mp-color-dot" style="background: ' + gradient + ';">' + bookSVG + '</div>' +
        '<div class="mp-info">' +
          '<span class="mp-subject">' + escapeHtml(m.mapel) + '</span>' +
          '<span class="mp-teacher">' + teacherSVG + ' ' + escapeHtml(m.guru) + '</span>' +
          '<div class="mp-meta">' +
            '<span class="mp-badge mp-badge-time">' + clockSVG + ' ' + m.start + ' - ' + m.end + '</span>' +
            '<span class="mp-badge mp-badge-day">' + hariLabel + '</span>' +
            '<span class="mp-badge mp-badge-class">' + escapeHtml(m.kelas) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="mp-actions">' +
          '<button class="mp-action-btn mp-edit-btn" data-id="' + m.id + '" title="Edit" aria-label="Edit ' + escapeHtml(m.mapel) + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>' +
          '</button>' +
          '<button class="mp-action-btn mp-delete-btn" data-id="' + m.id + '" title="Hapus" aria-label="Hapus ' + escapeHtml(m.mapel) + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
          '</button>' +
        '</div>';

      mapelList.appendChild(card);
    });

    updateStats(list);
    applyFilters();
    bindCardActions();
  }

  // --- Bind card actions ---
  function bindCardActions() {
    document.querySelectorAll('.mp-card').forEach(function (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-id'), 10);
        openDetailModal(id);
      });
    });

    document.querySelectorAll('.mp-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(this.getAttribute('data-id'), 10);
        openEditModal(id);
      });
    });

    document.querySelectorAll('.mp-delete-btn').forEach(function (btn) {
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

  // --- Day Filter ---
  document.querySelectorAll('.mp-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.mp-filter').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentFilter = this.getAttribute('data-day');
      applyFilters();
    });
  });

  function applyFilters() {
    var query = searchInput.value.toLowerCase().trim();
    var cards = document.querySelectorAll('.mp-card');
    var visibleCount = 0;
    var animIdx = 0;

    cards.forEach(function (card) {
      var subject = card.querySelector('.mp-subject').textContent.toLowerCase();
      var teacher = card.querySelector('.mp-teacher').textContent.toLowerCase();
      var cardDays = card.getAttribute('data-day');

      var matchSearch = !query || subject.indexOf(query) !== -1 || teacher.indexOf(query) !== -1;
      var matchDay = !currentFilter || cardDays.indexOf(currentFilter) !== -1;

      if (matchSearch && matchDay) {
        card.style.display = '';
        // Reset animation
        card.style.animation = 'none';
        card.offsetHeight;
        card.style.animation = 'mp-card-in 0.35s ease forwards';
        card.style.animationDelay = (animIdx * 0.03) + 's';
        animIdx++;
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (visibleCount === 0) {
      mapelList.style.display = 'none';
      emptyState.style.display = '';
    } else {
      mapelList.style.display = '';
      emptyState.style.display = 'none';
    }
  }

  // ==============================
  // DETAIL MODAL
  // ==============================

  function openDetailModal(id) {
    var m = AttendanceStore.getMapelById(id);
    if (!m) return;

    detailCurrentId = m.id;
    detailIcon.style.background = getGradient(m.id);
    detailNama.textContent = m.mapel;
    detailGuru.textContent = m.guru;
    detailJam.textContent = m.start + ' - ' + m.end;
    detailHari.textContent = formatHari(m.hari);
    detailKelas.textContent = m.kelas;

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

  document.getElementById('btnAddMapel').addEventListener('click', function () {
    openAddModal();
  });

  function openAddModal() {
    editingId = null;
    modalTitle.textContent = 'Tambah Mapel Baru';
    btnSave.textContent = 'Simpan';
    formMapel.value = '';
    formGuru.value = '';
    formStart.value = '07:00';
    formEnd.value = '08:30';
    formKelas.value = 'VII-A';
    hariCheckboxes.forEach(function (cb) { cb.checked = false; });
    hideFormError();
    showModal(modalOverlay);
    formMapel.focus();
  }

  function openEditModal(id) {
    var m = AttendanceStore.getMapelById(id);
    if (!m) return;

    editingId = id;
    modalTitle.textContent = 'Edit Mapel';
    btnSave.textContent = 'Perbarui';
    formMapel.value = m.mapel;
    formGuru.value = m.guru;
    formStart.value = m.start;
    formEnd.value = m.end;
    formKelas.value = m.kelas;

    var hariArr = m.hari.trim().split(/\s+/);
    hariCheckboxes.forEach(function (cb) {
      cb.checked = hariArr.indexOf(cb.value) !== -1;
    });

    hideFormError();
    showModal(modalOverlay);
    formMapel.focus();
  }

  // Save handler
  btnSave.addEventListener('click', function () { saveMapel(); });

  btnCancel.addEventListener('click', function () { closeModal(modalOverlay); });
  btnCloseModal.addEventListener('click', function () { closeModal(modalOverlay); });
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal(modalOverlay);
  });

  function saveMapel() {
    var mapelName = formMapel.value.trim();
    var guru = formGuru.value.trim();
    var start = formStart.value;
    var end = formEnd.value;
    var kelas = formKelas.value;

    // Collect checked days
    var hariArr = [];
    hariCheckboxes.forEach(function (cb) {
      if (cb.checked) hariArr.push(cb.value);
    });
    var hari = hariArr.join(' ');

    // Validation
    if (!mapelName) { showFormError('Nama mapel wajib diisi'); formMapel.focus(); return; }
    if (mapelName.length < 3) { showFormError('Nama mapel minimal 3 karakter'); formMapel.focus(); return; }
    if (!guru) { showFormError('Nama pengajar wajib diisi'); formGuru.focus(); return; }
    if (hariArr.length === 0) { showFormError('Pilih minimal satu hari'); return; }
    if (!start || !end) { showFormError('Jam mulai dan selesai wajib diisi'); return; }
    if (start >= end) { showFormError('Jam selesai harus lebih besar dari jam mulai'); return; }

    var data = { mapel: mapelName, guru: guru, start: start, end: end, hari: hari, kelas: kelas };
    var result;

    if (editingId) {
      result = AttendanceStore.updateMapel(editingId, data);
    } else {
      result = AttendanceStore.addMapel(data);
    }

    if (result.error) {
      showFormError(result.error);
      return;
    }

    closeModal(modalOverlay);
    renderMapel();
    
    // Trigger event untuk update absensi jika halaman absensi terbuka
    if (typeof window.refreshAbsensiData === 'function') {
      window.refreshAbsensiData();
    }
    
    showToast(editingId ? 'Mapel berhasil diperbarui!' : 'Mapel baru berhasil ditambahkan!');
  }

  // Enter key
  formMapel.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); saveMapel(); }
  });
  formGuru.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); saveMapel(); }
  });

  // ==============================
  // DELETE DIALOG
  // ==============================

  function openDeleteDialog(id) {
    var m = AttendanceStore.getMapelById(id);
    if (!m) return;
    deletingId = id;
    deleteMapelName.textContent = m.mapel;
    showModal(deleteOverlay);
  }

  btnConfirmDelete.addEventListener('click', function () {
    if (!deletingId) return;
    var result = AttendanceStore.deleteMapel(deletingId);
    closeModal(deleteOverlay);
    deletingId = null;

    if (result.success) {
      renderMapel();
      
      // Trigger event untuk update absensi jika halaman absensi terbuka
      if (typeof window.refreshAbsensiData === 'function') {
        window.refreshAbsensiData();
      }
      
      showToast('Mapel berhasil dihapus');
    }
  });

    if (result.success) {
      renderMapel();
      showToast('Mapel berhasil dihapus');
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

  // ESC key
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
    var existing = document.getElementById('mpToast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'mpToast';
    toast.className = 'mp-toast';
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
  renderMapel();
});
