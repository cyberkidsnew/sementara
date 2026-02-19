/**
 * Absensi Santri - Infaq (Donations) Script
 * Full CRUD: Create, Read, Update, Delete with search & month filter
 */

document.addEventListener('DOMContentLoaded', function () {
  var searchInput = document.getElementById('searchInput');
  var infaqList = document.getElementById('infaqList');
  var emptyState = document.getElementById('emptyState');
  var txCount = document.getElementById('txCount');

  // Hero stats
  var heroTotal = document.getElementById('heroTotal');
  var heroMonthly = document.getElementById('heroMonthly');
  var heroWeekly = document.getElementById('heroWeekly');
  var heroCount = document.getElementById('heroCount');

  // Modal elements
  var modalOverlay = document.getElementById('infaqModalOverlay');
  var modalTitle = document.getElementById('modalTitle');
  var formNama = document.getElementById('formNama');
  var formJumlah = document.getElementById('formJumlah');
  var formTipe = document.getElementById('formTipe');
  var formTanggal = document.getElementById('formTanggal');
  var formCatatan = document.getElementById('formCatatan');
  var formError = document.getElementById('formError');
  var formErrorText = document.getElementById('formErrorText');
  var btnSave = document.getElementById('btnSaveInfaq');
  var btnCancel = document.getElementById('btnCancelInfaq');
  var btnCloseModal = document.getElementById('btnCloseModal');

  // Detail modal elements
  var detailOverlay = document.getElementById('detailModalOverlay');
  var detailAvatar = document.getElementById('detailAvatar');
  var detailNama = document.getElementById('detailNama');
  var detailJumlah = document.getElementById('detailJumlah');
  var detailTipe = document.getElementById('detailTipe');
  var detailTanggal = document.getElementById('detailTanggal');
  var detailCatatan = document.getElementById('detailCatatan');
  var btnCloseDetail = document.getElementById('btnCloseDetail');
  var btnCloseDetailFooter = document.getElementById('btnCloseDetailFooter');
  var btnEditFromDetail = document.getElementById('btnEditFromDetail');
  var btnDeleteFromDetail = document.getElementById('btnDeleteFromDetail');

  // Delete dialog elements
  var deleteOverlay = document.getElementById('deleteDialogOverlay');
  var deleteInfaqName = document.getElementById('deleteInfaqName');
  var btnConfirmDelete = document.getElementById('btnConfirmDelete');
  var btnCancelDelete = document.getElementById('btnCancelDelete');

  var editingId = null;
  var deletingId = null;
  var detailCurrentId = null;
  var currentFilter = 'semua';

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

  // Month mapping (0-indexed)
  var monthKeys = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
  var monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // --- Helpers ---
  function getInitials(name) {
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  function getAvatarGradient(id) {
    return avatarGradients[(id - 1) % avatarGradients.length];
  }

  function formatRupiah(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
  }

  function formatTanggal(dateStr) {
    var parts = dateStr.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    return String(d).padStart(2, '0') + ' ' + monthNames[m] + ' ' + y;
  }

  function getMonthKey(dateStr) {
    var m = parseInt(dateStr.split('-')[1], 10) - 1;
    return monthKeys[m];
  }

  function getTodayStr() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Update hero stats ---
  function updateStats(list) {
    var total = 0;
    var monthly = 0;
    var weekly = 0;
    var now = new Date();
    var thisMonth = now.getMonth();
    var thisYear = now.getFullYear();

    // Week start (Monday)
    var weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    for (var i = 0; i < list.length; i++) {
      var amt = list[i].jumlah;
      total += amt;

      var parts = list[i].tanggal.split('-');
      var itemDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

      if (itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear) {
        monthly += amt;
      }
      if (itemDate >= weekStart) {
        weekly += amt;
      }
    }

    heroTotal.textContent = formatRupiah(total);
    heroMonthly.textContent = formatRupiah(monthly);
    heroWeekly.textContent = formatRupiah(weekly);
    heroCount.textContent = list.length;
  }

  // --- Render infaq list ---
  function renderInfaq() {
    var list = AttendanceStore.getAllInfaq();

    // Sort by date descending
    list.sort(function (a, b) {
      return b.tanggal.localeCompare(a.tanggal) || b.id - a.id;
    });

    infaqList.innerHTML = '';

    list.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'iq-card';
      card.setAttribute('data-month', getMonthKey(item.tanggal));
      card.setAttribute('data-id', item.id);

      var initials = getInitials(item.nama);
      var gradient = getAvatarGradient(item.id);
      var tipeClass = item.tipe === 'tunai' ? 'iq-type-tunai' : 'iq-type-transfer';
      var tipeLabel = item.tipe === 'tunai' ? 'Tunai' : 'Transfer';

      card.innerHTML =
        '<div class="iq-avatar" style="background: ' + gradient + ';">' + initials + '</div>' +
        '<div class="iq-info">' +
          '<span class="iq-name">' + escapeHtml(item.nama) + '</span>' +
          '<span class="iq-date">' + formatTanggal(item.tanggal) + '</span>' +
        '</div>' +
        '<div class="iq-amount-wrap">' +
          '<span class="iq-amount">' + formatRupiah(item.jumlah) + '</span>' +
          '<span class="iq-type ' + tipeClass + '">' + tipeLabel + '</span>' +
        '</div>' +
        '<div class="iq-actions">' +
          '<button class="iq-action-btn iq-edit-btn" data-id="' + item.id + '" title="Edit" aria-label="Edit">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>' +
          '</button>' +
          '<button class="iq-action-btn iq-delete-btn" data-id="' + item.id + '" title="Hapus" aria-label="Hapus">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>' +
          '</button>' +
        '</div>';

      infaqList.appendChild(card);
    });

    updateStats(list);
    applyFilters();
    bindCardActions();
  }

  // --- Bind card click and action buttons ---
  function bindCardActions() {
    document.querySelectorAll('.iq-card').forEach(function (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-id'), 10);
        openDetailModal(id);
      });
    });

    document.querySelectorAll('.iq-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(this.getAttribute('data-id'), 10);
        openEditModal(id);
      });
    });

    document.querySelectorAll('.iq-delete-btn').forEach(function (btn) {
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

  // --- Month filter ---
  document.querySelectorAll('.iq-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.iq-filter').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentFilter = this.getAttribute('data-month');
      applyFilters();
    });
  });

  function applyFilters() {
    var query = searchInput.value.toLowerCase().trim();
    var cards = document.querySelectorAll('.iq-card');
    var visibleCount = 0;

    cards.forEach(function (card, index) {
      var name = card.querySelector('.iq-name').textContent.toLowerCase();
      var cardMonth = card.getAttribute('data-month');

      var matchSearch = !query || name.indexOf(query) !== -1;
      var matchMonth = currentFilter === 'semua' || cardMonth === currentFilter;

      if (matchSearch && matchMonth) {
        card.style.display = '';
        card.style.animation = 'none';
        card.offsetHeight;
        card.style.animation = 'iq-card-in 0.35s ease forwards';
        card.style.animationDelay = (visibleCount * 0.03) + 's';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    txCount.textContent = visibleCount + ' transaksi';

    if (visibleCount === 0) {
      infaqList.style.display = 'none';
      emptyState.style.display = '';
    } else {
      infaqList.style.display = '';
      emptyState.style.display = 'none';
    }
  }

  // ==============================
  // DETAIL MODAL
  // ==============================

  function openDetailModal(id) {
    var item = AttendanceStore.getInfaqById(id);
    if (!item) return;

    detailCurrentId = item.id;
    var initials = getInitials(item.nama);
    var gradient = getAvatarGradient(item.id);

    detailAvatar.textContent = initials;
    detailAvatar.style.background = gradient;
    detailNama.textContent = item.nama;
    detailJumlah.textContent = formatRupiah(item.jumlah);
    detailTipe.textContent = item.tipe === 'tunai' ? 'Tunai' : 'Transfer';
    detailTanggal.textContent = formatTanggal(item.tanggal);
    detailCatatan.textContent = item.catatan || '-';

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

  document.getElementById('btnAddInfaq').addEventListener('click', function () {
    openAddModal();
  });

  function populateNamaSelect(selectedNama) {
    var students = AttendanceStore.getAllStudents();
    formNama.innerHTML = '<option value="">-- Pilih Santri --</option>';
    students.forEach(function (s) {
      if (s.status !== 'active') return;
      var opt = document.createElement('option');
      opt.value = s.nama;
      opt.textContent = s.nama;
      if (selectedNama && s.nama === selectedNama) opt.selected = true;
      formNama.appendChild(opt);
    });
  }

  function openAddModal() {
    editingId = null;
    modalTitle.textContent = 'Tambah Infaq Baru';
    btnSave.textContent = 'Simpan';
    populateNamaSelect('');
    formJumlah.value = '';
    formTipe.value = 'tunai';
    formTanggal.value = getTodayStr();
    formCatatan.value = '';
    hideFormError();
    showModal(modalOverlay);
    formNama.focus();
  }

  function openEditModal(id) {
    var item = AttendanceStore.getInfaqById(id);
    if (!item) return;

    editingId = id;
    modalTitle.textContent = 'Edit Infaq';
    btnSave.textContent = 'Perbarui';
    populateNamaSelect(item.nama);
    formJumlah.value = String(item.jumlah);
    formTipe.value = item.tipe;
    formTanggal.value = item.tanggal;
    formCatatan.value = item.catatan || '';
    hideFormError();
    showModal(modalOverlay);
    formNama.focus();
  }

  // Save handler
  btnSave.addEventListener('click', function () { saveInfaq(); });
  btnCancel.addEventListener('click', function () { closeModal(modalOverlay); });
  btnCloseModal.addEventListener('click', function () { closeModal(modalOverlay); });
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal(modalOverlay);
  });

  function saveInfaq() {
    var nama = formNama.value;
    var jumlah = parseInt(formJumlah.value, 10);
    var tipe = formTipe.value;
    var tanggal = formTanggal.value;
    var catatan = formCatatan.value.trim();

    // Validation
    if (!nama) { showFormError('Nama santri wajib dipilih'); formNama.focus(); return; }
    if (!jumlah || jumlah <= 0 || isNaN(jumlah)) { showFormError('Jumlah infaq wajib dipilih'); formJumlah.focus(); return; }
    if (!tanggal) { showFormError('Tanggal wajib diisi'); formTanggal.focus(); return; }

    var data = { nama: nama, jumlah: jumlah, tipe: tipe, tanggal: tanggal, catatan: catatan };
    var result;

    if (editingId) {
      result = AttendanceStore.updateInfaq(editingId, data);
    } else {
      result = AttendanceStore.addInfaq(data);
    }

    if (result.error) {
      showFormError(result.error);
      return;
    }

    closeModal(modalOverlay);
    renderInfaq();
    showToast(editingId ? 'Data infaq berhasil diperbarui!' : 'Infaq baru berhasil ditambahkan!');
  }



  // ==============================
  // DELETE DIALOG
  // ==============================

  function openDeleteDialog(id) {
    var item = AttendanceStore.getInfaqById(id);
    if (!item) return;
    deletingId = id;
    deleteInfaqName.textContent = item.nama;
    showModal(deleteOverlay);
  }

  btnConfirmDelete.addEventListener('click', function () {
    if (!deletingId) return;
    var result = AttendanceStore.deleteInfaq(deletingId);
    closeModal(deleteOverlay);
    deletingId = null;

    if (result.success) {
      renderInfaq();
      showToast('Data infaq berhasil dihapus');
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
    var existing = document.getElementById('iqToast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'iqToast';
    toast.className = 'iq-toast';
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
  renderInfaq();
});
