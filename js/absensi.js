/**
 * Absensi Santri - Absensi (Attendance) Script
 * Handles date navigation, status marking, stats, and localStorage sync
 * Integrated with dynamic student and class data
 */

// Expose updateAbsensiStats globally so scan.js can call it
var updateAbsensiStats;

document.addEventListener('DOMContentLoaded', function () {
  var currentDate = new Date();
  var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  var dateMainEl = document.getElementById('abDateMain');
  var dateSubEl = document.getElementById('abDateSub');
  var prevBtn = document.getElementById('prevDate');
  var nextBtn = document.getElementById('nextDate');
  var btnSimpan = document.getElementById('btnSimpan');
  var toast = document.getElementById('abToast');
  var selectKelas = document.getElementById('selectKelas');
  var selectMapel = document.getElementById('selectMapel');
  var absensiList = document.getElementById('absensiList');

  var currentKelas = null;
  var currentMapel = null;

  // --- Populate Kelas Dropdown ---
  function populateKelasDropdown() {
    if (typeof AttendanceStore === 'undefined') return;
    
    var kelasList = AttendanceStore.getAllKelas();
    selectKelas.innerHTML = '';
    
    if (kelasList.length === 0) {
      var opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Belum ada kelas';
      selectKelas.appendChild(opt);
      return;
    }
    
    kelasList.forEach(function (k) {
      var opt = document.createElement('option');
      opt.value = k.kode;
      opt.textContent = k.nama;
      selectKelas.appendChild(opt);
    });
    
    currentKelas = kelasList[0].kode;
    selectKelas.value = currentKelas;
  }

  // --- Populate Mapel Dropdown ---
  function populateMapelDropdown() {
    if (typeof AttendanceStore === 'undefined') return;
    
    var mapelList = AttendanceStore.getAllMapel();
    selectMapel.innerHTML = '';
    
    if (mapelList.length === 0) {
      var opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Belum ada mapel';
      selectMapel.appendChild(opt);
      return;
    }
    
    mapelList.forEach(function (m) {
      var opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.mapel;
      selectMapel.appendChild(opt);
    });
    
    currentMapel = mapelList[0].id;
    selectMapel.value = currentMapel;
  }

  // --- Render Student List by Kelas ---
  function renderStudentList() {
    if (typeof AttendanceStore === 'undefined') return;
    
    var allStudents = AttendanceStore.getAllStudents();
    var filteredStudents = allStudents.filter(function (s) {
      return s.kelas === currentKelas && s.status === 'active';
    });
    
    absensiList.innerHTML = '';
    
    if (filteredStudents.length === 0) {
      absensiList.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #94a3b8;">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' +
        '<p style="font-size: 14px; margin: 0;">Tidak ada siswa aktif di kelas ini</p>' +
        '</div>';
      updateStats();
      return;
    }
    
    filteredStudents.forEach(function (student, index) {
      var card = document.createElement('div');
      card.className = 'ab-card';
      
      card.innerHTML = 
        '<div class="ab-num">' + (index + 1) + '</div>' +
        '<div class="ab-student">' +
          '<span class="ab-student-name">' + escapeHtml(student.nama) + '</span>' +
          '<span class="ab-student-nis">' + student.nis + '</span>' +
        '</div>' +
        '<div class="ab-status-group">' +
          '<button class="ab-status-btn" data-status="h" title="Hadir">H</button>' +
          '<button class="ab-status-btn" data-status="i" title="Izin">I</button>' +
          '<button class="ab-status-btn" data-status="s" title="Sakit">S</button>' +
          '<button class="ab-status-btn" data-status="a" title="Alpha">A</button>' +
        '</div>';
      
      absensiList.appendChild(card);
    });
    
    bindStatusButtons();
    loadAttendanceFromStore();
  }

  // --- Escape HTML ---
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Bind Status Buttons ---
  function bindStatusButtons() {
    var statusBtns = document.querySelectorAll('.ab-status-btn');
    
    statusBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = this.closest('.ab-status-group');
        var siblings = group.querySelectorAll('.ab-status-btn');
        var status = this.getAttribute('data-status');

        // Remove active state from siblings
        siblings.forEach(function (s) {
          s.classList.remove('active-h', 'active-i', 'active-s', 'active-a');
        });

        // Set active state on clicked button
        this.classList.add('active-' + status);

        // Get NIS from the card
        var card = this.closest('.ab-card');
        var nisEl = card ? card.querySelector('.ab-student-nis') : null;
        var nis = nisEl ? nisEl.textContent.trim() : null;

        // Save to AttendanceStore
        if (nis && typeof AttendanceStore !== 'undefined') {
          AttendanceStore.markAttendance(nis, status, currentDate);
        }

        // Update stats
        updateStats();
      });
    });
  }

  // --- Kelas Change Handler ---
  selectKelas.addEventListener('change', function () {
    currentKelas = this.value;
    renderStudentList();
  });

  // --- Mapel Change Handler ---
  selectMapel.addEventListener('change', function () {
    currentMapel = this.value;
  });

  // --- Display Date ---
  function renderDate() {
    dateMainEl.textContent = days[currentDate.getDay()] + ', ' +
      String(currentDate.getDate()).padStart(2, '0') + ' ' +
      monthsShort[currentDate.getMonth()] + ' ' +
      currentDate.getFullYear();
    dateSubEl.textContent = months[currentDate.getMonth()] + ' ' + currentDate.getFullYear();
  }

  renderDate();

  // --- Date Navigation ---
  prevBtn.addEventListener('click', function () {
    currentDate.setDate(currentDate.getDate() - 1);
    renderDate();
    loadAttendanceFromStore();
  });

  nextBtn.addEventListener('click', function () {
    currentDate.setDate(currentDate.getDate() + 1);
    renderDate();
    loadAttendanceFromStore();
  });

  // --- Update Stats Counts ---
  function updateStats() {
    var h = document.querySelectorAll('.ab-status-btn.active-h').length;
    var i = document.querySelectorAll('.ab-status-btn.active-i').length;
    var s = document.querySelectorAll('.ab-status-btn.active-s').length;
    var a = document.querySelectorAll('.ab-status-btn.active-a').length;

    document.getElementById('countHadir').textContent = h;
    document.getElementById('countIzin').textContent = i;
    document.getElementById('countSakit').textContent = s;
    document.getElementById('countAlpha').textContent = a;
  }

  // Expose globally for scan.js
  updateAbsensiStats = updateStats;

  // --- Load attendance data from localStorage ---
  function loadAttendanceFromStore() {
    if (typeof AttendanceStore === 'undefined') return;

    var records = AttendanceStore.getByDate(currentDate);
    var cards = document.querySelectorAll('.ab-card');

    cards.forEach(function (card) {
      var nisEl = card.querySelector('.ab-student-nis');
      if (!nisEl) return;
      var nis = nisEl.textContent.trim();

      // Clear all active states
      var btns = card.querySelectorAll('.ab-status-btn');
      btns.forEach(function (btn) {
        btn.classList.remove('active-h', 'active-i', 'active-s', 'active-a');
      });

      // Apply saved status
      if (records[nis]) {
        var status = records[nis];
        var targetBtn = card.querySelector('.ab-status-btn[data-status="' + status + '"]');
        if (targetBtn) {
          targetBtn.classList.add('active-' + status);
        }
      }
    });

    // Update stats
    updateStats();
  }

  // Load on page init
  loadAttendanceFromStore();

  // --- Submit / Save ---
  btnSimpan.addEventListener('click', function () {
    // Collect current attendance state and save
    if (typeof AttendanceStore !== 'undefined') {
      var records = {};
      var cards = document.querySelectorAll('.ab-card');
      cards.forEach(function (card) {
        var nisEl = card.querySelector('.ab-student-nis');
        if (!nisEl) return;
        var nis = nisEl.textContent.trim();

        var activeBtn = card.querySelector('.ab-status-btn[class*="active-"]');
        if (activeBtn) {
          var status = activeBtn.getAttribute('data-status');
          records[nis] = status;
        }
      });
      AttendanceStore.saveByDate(records, currentDate);

      // Build bulk summary message for WhatsApp (rekap semua santri)
      var slot = AttendanceStore.getCurrentSlot();
      shareAbsensiBulk(records, slot);
    }

    // Show toast
    toast.classList.add('visible');
    setTimeout(function () {
      toast.classList.remove('visible');
    }, 2500);
  });

  // --- Bulk WhatsApp share for all students at once ---
  function shareAbsensiBulk(records, slot) {
    if (typeof AttendanceStore === 'undefined') return;
    var settings = AttendanceStore.getWASettings();
    if (!settings.enabled || !settings.phone) return;

    var counts = { h: 0, i: 0, s: 0, a: 0 };
    var lines = [];
    var idx = 1;

    for (var nis in records) {
      if (!records.hasOwnProperty(nis)) continue;
      var name = AttendanceStore.getStudentName(nis) || nis;
      var kelas = AttendanceStore.getStudentClass(nis) || '-';
      var st = records[nis];

      // Get individual realtime timestamp for this student
      var individualTime = AttendanceStore.getStudentTimestamp(nis, currentDate) ||
        AttendanceStore.formatFullTime(new Date());

      // Determine punctuality based on individual timestamp
      var statusText = '';
      if (st === 'h') {
        var punct = slot ? AttendanceStore.checkPunctuality(slot, new Date()) : null;
        // Use stored timestamp to check punctuality
        var timestamps = AttendanceStore.getTimestamps(currentDate);
        if (timestamps[nis] && slot) {
          punct = AttendanceStore.checkPunctuality(slot, new Date(timestamps[nis]));
        }
        if (punct && punct.isLate) {
          statusText = individualTime + ' (Terlambat) ⚠️';
        } else {
          statusText = individualTime + ' (Tepat Waktu) ✅';
        }
      } else if (st === 'i') {
        statusText = 'Izin 📋';
      } else if (st === 's') {
        statusText = 'Sakit 🏥';
      } else if (st === 'a') {
        statusText = 'Alpha ❌';
      }

      lines.push(idx + '. ' + name + ' (Kelas ' + kelas + ')  — ' + statusText);
      if (counts.hasOwnProperty(st)) counts[st]++;
      idx++;
    }

    if (lines.length === 0) return;

    var dateStr = days[currentDate.getDay()] + ', ' +
      String(currentDate.getDate()).padStart(2, '0') + ' ' +
      months[currentDate.getMonth()] + ' ' +
      currentDate.getFullYear();

    var message = '📋 *REKAP ABSENSI SANTRI*\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '📅 Tanggal: ' + dateStr + '\n';

    if (slot) {
      message += '📚 Mapel: ' + slot.mapel + ' (' + slot.start + ' - ' + slot.end + ')\n';
    }

    message += '\n' + lines.join('\n') + '\n\n' +
      '📊 *Ringkasan:*\n' +
      '✅ Hadir: ' + counts.h + '\n' +
      '📋 Izin: ' + counts.i + '\n' +
      '🏥 Sakit: ' + counts.s + '\n' +
      '❌ Alpha: ' + counts.a + '\n' +
      '📝 Total: ' + (counts.h + counts.i + counts.s + counts.a) + ' santri\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '_Dikirim otomatis oleh Sistem Absensi AKAMID_';

    var phone = AttendanceStore.formatWAPhone(settings.phone);
    var waUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
    window.open(waUrl, '_blank');
  }

  // --- Listen for storage events (cross-tab sync) ---
  window.addEventListener('storage', function (e) {
    if (e.key && e.key.indexOf('absensi_') === 0) {
      loadAttendanceFromStore();
    }
  });

  // --- Initialize ---
  populateKelasDropdown();
  populateMapelDropdown();
  renderStudentList();
  
  // Expose refresh function untuk dipanggil dari halaman lain
  window.refreshAbsensiData = function() {
    populateKelasDropdown();
    populateMapelDropdown();
    renderStudentList();
  };
});
