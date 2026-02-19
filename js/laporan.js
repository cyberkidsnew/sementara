/**
 * Absensi Santri - Laporan (Report) Page
 * Multi-category: Kehadiran, Infaq, Data Siswa, Data Kelas
 */

document.addEventListener('DOMContentLoaded', function () {

  // ========================================
  // Category Tab Switching
  // ========================================

  var categoryTabs = document.querySelectorAll('.lp-category-tab');
  var contentSections = document.querySelectorAll('.lp-content-section');

  categoryTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var category = tab.getAttribute('data-category');

      // Update active tab
      categoryTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');

      // Show/hide sections
      contentSections.forEach(function (section) { section.classList.remove('active'); });

      var targetId = 'section' + category.charAt(0).toUpperCase() + category.slice(1);
      var target = document.getElementById(targetId);
      if (target) target.classList.add('active');

      // Render data for the selected category
      if (category === 'infaq') renderInfaqReport();
      if (category === 'siswa') renderSiswaReport();
      if (category === 'kelas') renderKelasReport();
    });
  });

  // ========================================
  // KEHADIRAN - Date Range Tabs
  // ========================================

  var tabMingguan = document.getElementById('tabMingguan');
  var tabBulanan = document.getElementById('tabBulanan');
  var dateLabel = document.getElementById('lpDateRange');

  var months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function getWeekRange() {
    var now = new Date();
    var day = now.getDay();
    var diff = now.getDate() - day + (day === 0 ? -6 : 1);
    var start = new Date(now);
    start.setDate(diff);
    var end = new Date(start);
    end.setDate(start.getDate() + 4);
    return String(start.getDate()).padStart(2, '0') + ' - ' +
      String(end.getDate()).padStart(2, '0') + ' ' +
      monthsShort[end.getMonth()] + ' ' + end.getFullYear();
  }

  function getMonthRange() {
    var now = new Date();
    return months[now.getMonth()] + ' ' + now.getFullYear();
  }

  if (dateLabel) dateLabel.textContent = getWeekRange();

  if (tabMingguan) {
    tabMingguan.addEventListener('click', function () {
      tabMingguan.classList.add('active');
      tabBulanan.classList.remove('active');
      if (dateLabel) dateLabel.textContent = getWeekRange();
    });
  }

  if (tabBulanan) {
    tabBulanan.addEventListener('click', function () {
      tabBulanan.classList.add('active');
      tabMingguan.classList.remove('active');
      if (dateLabel) dateLabel.textContent = getMonthRange();
    });
  }

  // ========================================
  // KEHADIRAN - WhatsApp Export
  // ========================================

  var btnExportWA = document.getElementById('btnExportWA');
  var btnExport = document.getElementById('btnExport');

  function exportToWhatsApp() {
    if (typeof AttendanceStore === 'undefined') return;
    var settings = AttendanceStore.getWASettings();
    if (!settings.phone) {
      alert('Silakan atur nomor WhatsApp di halaman Pengaturan (Presensi).');
      return;
    }

    var now = new Date();
    var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var dateStr = days[now.getDay()] + ', ' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      months[now.getMonth()] + ' ' +
      now.getFullYear();

    var rows = document.querySelectorAll('#lpTableBody tr');
    var lines = [];
    var idx = 1;
    rows.forEach(function (row) {
      var cells = row.querySelectorAll('td');
      if (cells.length >= 6) {
        var name = cells[0].textContent.trim().replace(/\s+/g, ' ');
        var nameParts = name.split(' ');
        if (nameParts.length > 1 && nameParts[0].length <= 2) nameParts.shift();
        name = nameParts.join(' ');
        var h = cells[1].textContent.trim();
        var i = cells[2].textContent.trim();
        var s = cells[3].textContent.trim();
        var a = cells[4].textContent.trim();
        var pct = cells[5].textContent.trim();
        lines.push(idx + '. ' + name + ': H=' + h + ' I=' + i + ' S=' + s + ' A=' + a + ' (' + pct + ')');
        idx++;
      }
    });

    var message = '📊 *LAPORAN KEHADIRAN SANTRI*\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '📅 Tanggal: ' + dateStr + '\n' +
      '📋 Periode: ' + (dateLabel ? dateLabel.textContent : '') + '\n\n' +
      '*Rekap Per Santri:*\n' +
      lines.join('\n') + '\n\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '_Dikirim dari Sistem Absensi AKAMID_';

    var phone = AttendanceStore.formatWAPhone(settings.phone);
    var waUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
    window.open(waUrl, '_blank');
  }

  if (btnExportWA) btnExportWA.addEventListener('click', exportToWhatsApp);
  if (btnExport) btnExport.addEventListener('click', exportToWhatsApp);

  // ========================================
  // Helper: Avatar colors
  // ========================================

  var avatarColors = [
    ['#6366F1', '#818CF8'],
    ['#0D9488', '#2DD4BF'],
    ['#F59E0B', '#FBBF24'],
    ['#EC4899', '#F472B6'],
    ['#8B5CF6', '#A78BFA'],
    ['#84CC16', '#A3E635'],
    ['#EF4444', '#F87171'],
    ['#0EA5E9', '#38BDF8'],
    ['#F97316', '#FB923C'],
    ['#14B8A6', '#5EEAD4']
  ];

  function getAvatarColor(index) {
    return avatarColors[index % avatarColors.length];
  }

  function getInitials(name) {
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  function formatCurrency(amount) {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    return String(d.getDate()).padStart(2, '0') + ' ' +
      monthsShort[d.getMonth()] + ' ' + d.getFullYear();
  }

  // ========================================
  // INFAQ Report
  // ========================================

  function renderInfaqReport() {
    if (typeof AttendanceStore === 'undefined') return;

    var infaqList = AttendanceStore.getAllInfaq();

    // Stats
    var totalAmount = 0;
    var tunaiCount = 0;
    var transferCount = 0;

    infaqList.forEach(function (item) {
      totalAmount += item.jumlah;
      if (item.tipe === 'tunai') tunaiCount++;
      else transferCount++;
    });

    var el = document.getElementById('statInfaqTotal');
    if (el) el.textContent = formatCurrency(totalAmount);

    el = document.getElementById('statInfaqCount');
    if (el) el.textContent = infaqList.length;

    el = document.getElementById('statInfaqTunai');
    if (el) el.textContent = tunaiCount;

    el = document.getElementById('statInfaqTransfer');
    if (el) el.textContent = transferCount;

    // Distribution bars
    var total = infaqList.length || 1;
    el = document.getElementById('distInfaqTunai');
    if (el) el.textContent = tunaiCount;
    el = document.getElementById('distBarInfaqTunai');
    if (el) el.style.width = Math.round((tunaiCount / total) * 100) + '%';

    el = document.getElementById('distInfaqTransfer');
    if (el) el.textContent = transferCount;
    el = document.getElementById('distBarInfaqTransfer');
    if (el) el.style.width = Math.round((transferCount / total) * 100) + '%';

    // Table
    var tbody = document.getElementById('lpInfaqTableBody');
    if (!tbody) return;

    // Sort by date descending
    var sorted = infaqList.slice().sort(function (a, b) {
      return new Date(b.tanggal) - new Date(a.tanggal);
    });

    var html = '';
    sorted.forEach(function (item, i) {
      var colors = getAvatarColor(i);
      var initials = getInitials(item.nama);
      var tipeBadge = item.tipe === 'tunai'
        ? '<span class="lp-badge lp-badge-tunai">Tunai</span>'
        : '<span class="lp-badge lp-badge-transfer">Transfer</span>';

      html += '<tr>' +
        '<td class="lp-td-name">' +
          '<span class="lp-td-avatar" style="background:linear-gradient(135deg,' + colors[0] + ',' + colors[1] + ')">' + initials + '</span>' +
          item.nama +
        '</td>' +
        '<td class="lp-td-center lp-td-amount">' + formatCurrency(item.jumlah) + '</td>' +
        '<td class="lp-td-center">' + tipeBadge + '</td>' +
        '<td class="lp-td-center" style="font-size:var(--text-xs); white-space:nowrap;">' + formatDate(item.tanggal) + '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ========================================
  // DATA SISWA Report
  // ========================================

  function renderSiswaReport() {
    if (typeof AttendanceStore === 'undefined') return;

    var students = AttendanceStore.getAllStudents();

    // Stats
    var total = students.length;
    var aktif = 0;
    var lk = 0;
    var pr = 0;

    students.forEach(function (s) {
      if (s.status === 'active') aktif++;
      if (s.kelamin === 'L') lk++;
      else pr++;
    });

    var el = document.getElementById('statSiswaTotal');
    if (el) el.textContent = total;

    el = document.getElementById('statSiswaAktif');
    if (el) el.textContent = aktif;

    el = document.getElementById('statSiswaLK');
    if (el) el.textContent = lk;

    el = document.getElementById('statSiswaPR');
    if (el) el.textContent = pr;

    // Distribution per kelas
    var kelasList = AttendanceStore.getAllKelas();
    var distHtml = '';
    var kelasColors = [
      { dot: '#6366F1', bar: 'linear-gradient(90deg,#6366F1,#818CF8)' },
      { dot: '#10B981', bar: 'linear-gradient(90deg,#10B981,#34D399)' },
      { dot: '#F59E0B', bar: 'linear-gradient(90deg,#F59E0B,#FBBF24)' },
      { dot: '#F43F5E', bar: 'linear-gradient(90deg,#F43F5E,#FB7185)' },
      { dot: '#8B5CF6', bar: 'linear-gradient(90deg,#8B5CF6,#A78BFA)' },
      { dot: '#06B6D4', bar: 'linear-gradient(90deg,#06B6D4,#22D3EE)' }
    ];

    kelasList.forEach(function (kelas, i) {
      var count = AttendanceStore.getStudentCountByKelas(kelas.kode);
      var pct = total > 0 ? Math.round((count / total) * 100) : 0;
      var color = kelasColors[i % kelasColors.length];

      distHtml += '<div class="lp-dist-item">' +
        '<div class="lp-dist-header">' +
          '<span class="lp-dist-dot" style="background:' + color.dot + '"></span>' +
          '<span class="lp-dist-name">' + kelas.nama + '</span>' +
          '<span class="lp-dist-count">' + count + ' santri</span>' +
        '</div>' +
        '<div class="lp-dist-bar-track">' +
          '<div class="lp-dist-bar" style="width:' + pct + '%; background:' + color.bar + '"></div>' +
        '</div>' +
      '</div>';
    });

    el = document.getElementById('lpSiswaDistribution');
    if (el) el.innerHTML = distHtml;

    // Table
    var tbody = document.getElementById('lpSiswaTableBody');
    if (!tbody) return;

    var kelasMap = {};
    kelasList.forEach(function (k) { kelasMap[k.kode] = k.nama; });

    var html = '';
    students.forEach(function (s, i) {
      var colors = getAvatarColor(i);
      var initials = getInitials(s.nama);
      var kelasLabel = kelasMap[s.kelas] || s.kelas;
      var jkBadge = s.kelamin === 'L'
        ? '<span class="lp-badge lp-badge-lk">L</span>'
        : '<span class="lp-badge lp-badge-pr">P</span>';
      var statusBadge = s.status === 'active'
        ? '<span class="lp-badge lp-badge-active">Aktif</span>'
        : '<span class="lp-badge lp-badge-inactive">Nonaktif</span>';

      html += '<tr>' +
        '<td class="lp-td-name">' +
          '<span class="lp-td-avatar" style="background:linear-gradient(135deg,' + colors[0] + ',' + colors[1] + ')">' + initials + '</span>' +
          s.nama +
        '</td>' +
        '<td class="lp-td-center"><span class="lp-badge lp-badge-kelas">' + kelasLabel + '</span></td>' +
        '<td class="lp-td-center">' + jkBadge + '</td>' +
        '<td class="lp-td-center">' + statusBadge + '</td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

  // ========================================
  // DATA KELAS Report
  // ========================================

  function renderKelasReport() {
    if (typeof AttendanceStore === 'undefined') return;

    var kelasList = AttendanceStore.getAllKelas();
    var students = AttendanceStore.getAllStudents();

    // Stats
    var totalSantri = 0;
    kelasList.forEach(function (k) {
      totalSantri += AttendanceStore.getStudentCountByKelas(k.kode);
    });

    var el = document.getElementById('statKelasTotal');
    if (el) el.textContent = kelasList.length;

    el = document.getElementById('statKelasSantri');
    if (el) el.textContent = totalSantri;

    // Distribution
    var distHtml = '';
    var kelasColors = [
      { dot: '#6366F1', bar: 'linear-gradient(90deg,#6366F1,#818CF8)' },
      { dot: '#10B981', bar: 'linear-gradient(90deg,#10B981,#34D399)' },
      { dot: '#F59E0B', bar: 'linear-gradient(90deg,#F59E0B,#FBBF24)' },
      { dot: '#F43F5E', bar: 'linear-gradient(90deg,#F43F5E,#FB7185)' },
      { dot: '#8B5CF6', bar: 'linear-gradient(90deg,#8B5CF6,#A78BFA)' },
      { dot: '#06B6D4', bar: 'linear-gradient(90deg,#06B6D4,#22D3EE)' }
    ];

    var maxCount = 0;
    var kelasCounts = [];
    kelasList.forEach(function (k) {
      var count = AttendanceStore.getStudentCountByKelas(k.kode);
      kelasCounts.push(count);
      if (count > maxCount) maxCount = count;
    });

    kelasList.forEach(function (kelas, i) {
      var count = kelasCounts[i];
      var pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
      var color = kelasColors[i % kelasColors.length];

      distHtml += '<div class="lp-dist-item">' +
        '<div class="lp-dist-header">' +
          '<span class="lp-dist-dot" style="background:' + color.dot + '"></span>' +
          '<span class="lp-dist-name">' + kelas.nama + '</span>' +
          '<span class="lp-dist-count">' + count + ' santri</span>' +
        '</div>' +
        '<div class="lp-dist-bar-track">' +
          '<div class="lp-dist-bar" style="width:' + pct + '%; background:' + color.bar + '"></div>' +
        '</div>' +
      '</div>';
    });

    el = document.getElementById('lpKelasDistribution');
    if (el) el.innerHTML = distHtml;

    // Table
    var tbody = document.getElementById('lpKelasTableBody');
    if (!tbody) return;

    var html = '';
    kelasList.forEach(function (kelas, i) {
      var count = kelasCounts[i];
      var colors = getAvatarColor(i);
      var initials = kelas.nama.substring(0, 2);

      html += '<tr>' +
        '<td class="lp-td-name">' +
          '<span class="lp-td-avatar" style="background:linear-gradient(135deg,' + colors[0] + ',' + colors[1] + ')">' + initials + '</span>' +
          kelas.nama +
        '</td>' +
        '<td class="lp-td-center" style="font-size:var(--text-xs); font-weight:500;">' + kelas.wali + '</td>' +
        '<td class="lp-td-center"><span class="lp-badge lp-badge-kelas">' + count + ' santri</span></td>' +
      '</tr>';
    });

    tbody.innerHTML = html;
  }

});
