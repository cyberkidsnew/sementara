/**
 * Absensi Santri - Attendance Store
 * Shared localStorage utility for attendance data across pages
 *
 * Storage format:
 *   key:   "absensi_YYYY-MM-DD"
 *   value: { "2026001": "h", "2026003": "s", ... }
 *
 * Status codes: h = Hadir, i = Izin, s = Sakit, a = Alpha
 */

var AttendanceStore = (function () {
  'use strict';

  // --- Student Data Store (localStorage) ---
  var STUDENTS_KEY = 'absensi_students';

  // Default seed data
  var defaultStudents = [
    { id: 1,  nama: 'Ahmad Ramadhan',    nis: 'REG-5346727236', kelas: '7a', kelamin: 'L', status: 'active' },
    { id: 2,  nama: 'Muhammad Fauzan',   nis: 'REG-8291450378', kelas: '7a', kelamin: 'L', status: 'active' },
    { id: 3,  nama: 'Aisyah Zahra',      nis: 'REG-1748362950', kelas: '7a', kelamin: 'P', status: 'active' },
    { id: 4,  nama: 'Nur Khadijah',      nis: 'REG-6023819457', kelas: '7b', kelamin: 'P', status: 'active' },
    { id: 5,  nama: 'Ibrahim Al-Farisi', nis: 'REG-3957184062', kelas: '7b', kelamin: 'L', status: 'active' },
    { id: 6,  nama: 'Hafidz Mubarok',    nis: 'REG-7412638509', kelas: '8a', kelamin: 'L', status: 'active' },
    { id: 7,  nama: 'Siti Rahmawati',    nis: 'REG-2685091743', kelas: '8a', kelamin: 'P', status: 'inactive' },
    { id: 8,  nama: 'Yusuf Hakim',       nis: 'REG-9130472586', kelas: '9a', kelamin: 'L', status: 'active' },
    { id: 9,  nama: 'Fatimah Azzahra',   nis: 'REG-4867205931', kelas: '9a', kelamin: 'P', status: 'active' },
    { id: 10, nama: 'Bilal Husain',      nis: 'REG-0574923168', kelas: '7a', kelamin: 'L', status: 'active' }
  ];

  function loadStudents() {
    try {
      var data = localStorage.getItem(STUDENTS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    // Seed defaults
    saveStudents(defaultStudents);
    return defaultStudents;
  }

  function saveStudents(list) {
    try {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[AttendanceStore] Failed to save students:', e);
    }
  }

  function getAllStudents() {
    return loadStudents();
  }

  function getStudentById(id) {
    var list = loadStudents();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  // --- Generate unique 10-digit registration number (REG-XXXXXXXXXX) ---
  function generateRegNumber(list) {
    var existingNIS = {};
    for (var i = 0; i < list.length; i++) {
      existingNIS[list[i].nis] = true;
    }
    var nis;
    do {
      var digits = '';
      for (var d = 0; d < 10; d++) {
        digits += String(Math.floor(Math.random() * 10));
      }
      nis = 'REG-' + digits;
    } while (existingNIS[nis]);
    return nis;
  }

  function addStudent(data) {
    var list = loadStudents();
    var maxId = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id > maxId) maxId = list[i].id;
    }
    var regNumber = generateRegNumber(list);
    var student = {
      id: maxId + 1,
      nama: data.nama,
      nis: regNumber,
      kelas: data.kelas,
      kelamin: data.kelamin || 'L',
      status: data.status || 'active'
    };
    list.push(student);
    saveStudents(list);
    rebuildStudentsCompat(list);
    return { success: true, student: student };
  }

  function updateStudent(id, data) {
    var list = loadStudents();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].nama = data.nama;
        list[i].kelas = data.kelas;
        list[i].kelamin = data.kelamin || list[i].kelamin;
        list[i].status = data.status || list[i].status;
        // nis is auto-generated, not editable
        saveStudents(list);
        rebuildStudentsCompat(list);
        return { success: true, student: list[i] };
      }
    }
    return { error: 'Siswa tidak ditemukan' };
  }

  function deleteStudent(id) {
    var list = loadStudents();
    var newList = [];
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { found = true; continue; }
      newList.push(list[i]);
    }
    if (!found) return { error: 'Siswa tidak ditemukan' };
    saveStudents(newList);
    rebuildStudentsCompat(newList);
    return { success: true };
  }

  // Rebuild legacy 'students' compat object from list
  function rebuildStudentsCompat(list) {
    // clear and rebuild
    for (var k in students) {
      if (students.hasOwnProperty(k)) delete students[k];
    }
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      var kelasLabel = s.kelas.replace('7a','A').replace('7b','B').replace('8a','A').replace('9a','A');
      students[s.nis] = { name: s.nama, kelas: kelasLabel };
    }
  }

  // Build legacy compat on init
  var studentsList = loadStudents();
  var students = {};
  for (var si = 0; si < studentsList.length; si++) {
    var ss = studentsList[si];
    var kl = ss.kelas.replace('7a','A').replace('7b','B').replace('8a','A').replace('9a','A');
    students[ss.nis] = { name: ss.nama, kelas: kl };
  }

  // --- Schedule / Jadwal configuration ---
  // Each slot has a time window during which scanning is allowed
  var schedule = [
    { id: 'fiqih',   mapel: 'Fiqih',            start: '07:00', end: '08:30', guru: 'Ust. Abdullah' },
    { id: 'nahwu',   mapel: 'Nahwu Shorof',     start: '08:30', end: '10:00', guru: 'Ust. Mahmud'  },
    { id: 'hadits',  mapel: 'Hadits',            start: '10:15', end: '11:45', guru: 'Ust. Hasan'   },
    { id: 'tahfidz', mapel: 'Tahfidz Al-Quran',  start: '13:00', end: '14:30', guru: 'Ust. Ibrahim' },
    { id: 'aqidah',  mapel: 'Aqidah Akhlak',     start: '15:30', end: '17:00', guru: 'Ust. Salim'   }
  ];

  // --- WhatsApp config ---
  var WA_SETTINGS_KEY = 'absensi_wa_settings';

  // Default: siswa dianggap terlambat jika datang lebih dari 15 menit setelah jam mulai
  var DEFAULT_LATE_MINUTES = 15;

  function getWASettings() {
    try {
      var data = localStorage.getItem(WA_SETTINGS_KEY);
      var defaults = { phone: '', enabled: true, lateMinutes: DEFAULT_LATE_MINUTES };
      if (!data) return defaults;
      var parsed = JSON.parse(data);
      // ensure lateMinutes always has a value
      if (typeof parsed.lateMinutes !== 'number') parsed.lateMinutes = DEFAULT_LATE_MINUTES;
      return parsed;
    } catch (e) {
      return { phone: '', enabled: true, lateMinutes: DEFAULT_LATE_MINUTES };
    }
  }

  function saveWASettings(settings) {
    try {
      localStorage.setItem(WA_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('[AttendanceStore] Failed to save WA settings:', e);
    }
  }

  // --- Helpers ---
  function formatDateKey(date) {
    var d = date || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return 'absensi_' + y + '-' + m + '-' + day;
  }

  function todayKey() {
    return formatDateKey(new Date());
  }

  // --- Format date for display ---
  function formatDateDisplay(date) {
    var d = date || new Date();
    var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return days[d.getDay()] + ', ' +
      String(d.getDate()).padStart(2, '0') + ' ' +
      months[d.getMonth()] + ' ' +
      d.getFullYear();
  }

  // --- Time helpers ---
  function timeToMinutes(timeStr) {
    var parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function getCurrentTimeMinutes() {
    var now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  // --- Get current active schedule slot ---
  function getCurrentSlot() {
    var nowMin = getCurrentTimeMinutes();
    for (var i = 0; i < schedule.length; i++) {
      var slot = schedule[i];
      var startMin = timeToMinutes(slot.start);
      var endMin = timeToMinutes(slot.end);
      if (nowMin >= startMin && nowMin <= endMin) {
        return slot;
      }
    }
    return null;
  }

  // --- Scan tracking (once per student per slot per day) ---
  function getScanLogKey(date) {
    var d = date || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return 'scan_log_' + y + '-' + m + '-' + day;
  }

  function getScanLog(date) {
    try {
      var data = localStorage.getItem(getScanLogKey(date));
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function saveScanLog(log, date) {
    try {
      localStorage.setItem(getScanLogKey(date), JSON.stringify(log));
    } catch (e) {
      console.warn('[AttendanceStore] Failed to save scan log:', e);
    }
  }

  /**
   * Check if a student can scan right now.
   * Returns { allowed: true, slot: {...} } or { allowed: false, reason: '...' }
   */
  function canScan(nis) {
    var slot = getCurrentSlot();
    if (!slot) {
      // Find next slot info for better message
      var nowMin = getCurrentTimeMinutes();
      var nextSlot = null;
      for (var i = 0; i < schedule.length; i++) {
        if (timeToMinutes(schedule[i].start) > nowMin) {
          nextSlot = schedule[i];
          break;
        }
      }
      if (nextSlot) {
        return {
          allowed: false,
          reason: 'Scan tidak tersedia saat ini. Jadwal berikutnya: ' +
            nextSlot.mapel + ' (' + nextSlot.start + ' - ' + nextSlot.end + ')'
        };
      }
      return {
        allowed: false,
        reason: 'Tidak ada jadwal yang aktif saat ini. Scan hanya bisa dilakukan sesuai jadwal pelajaran.'
      };
    }

    // Check if student already scanned for this slot today
    var log = getScanLog();
    var logKey = nis + '_' + slot.id;
    if (log[logKey]) {
      return {
        allowed: false,
        reason: 'Sudah melakukan scan untuk ' + slot.mapel +
          ' (' + slot.start + ' - ' + slot.end + '). Scan hanya bisa dilakukan sekali per jadwal.'
      };
    }

    return { allowed: true, slot: slot };
  }

  /**
   * Record that a student has scanned for the current slot
   */
  function recordScan(nis, slotId) {
    var log = getScanLog();
    var logKey = nis + '_' + slotId;
    log[logKey] = new Date().toISOString();
    saveScanLog(log);
  }

  // --- Get all records for a date ---
  function getByDate(date) {
    var key = date ? formatDateKey(date) : todayKey();
    try {
      var data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  // --- Save full record for a date ---
  function saveByDate(records, date) {
    var key = date ? formatDateKey(date) : todayKey();
    try {
      localStorage.setItem(key, JSON.stringify(records));
    } catch (e) {
      console.warn('[AttendanceStore] Failed to save:', e);
    }
  }

  // --- Timestamp store (individual realtime per student) ---
  function getTimestampKey(date) {
    var d = date || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return 'absensi_time_' + y + '-' + m + '-' + day;
  }

  function getTimestamps(date) {
    try {
      var data = localStorage.getItem(getTimestampKey(date));
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function saveTimestamp(nis, date) {
    var timestamps = getTimestamps(date);
    timestamps[nis] = new Date().toISOString();
    try {
      localStorage.setItem(getTimestampKey(date), JSON.stringify(timestamps));
    } catch (e) {
      console.warn('[AttendanceStore] Failed to save timestamp:', e);
    }
  }

  function getStudentTimestamp(nis, date) {
    var timestamps = getTimestamps(date);
    if (!timestamps[nis]) return null;
    var d = new Date(timestamps[nis]);
    return formatFullTime(d);
  }

  /**
   * Seed demo timestamps with varied entry times for today.
   * Some students arrive on time, others arrive late.
   * Uses the current active schedule slot as reference.
   */
  function seedDemoTimestamps() {
    var today = new Date();
    var existing = getTimestamps(today);

    // Only seed if no timestamps exist for today
    if (Object.keys(existing).length > 0) return;

    var slot = getCurrentSlot();
    if (!slot) {
      // No active slot, find the nearest past slot for demo
      var nowMin = getCurrentTimeMinutes();
      for (var i = schedule.length - 1; i >= 0; i--) {
        if (timeToMinutes(schedule[i].start) <= nowMin) {
          slot = schedule[i];
          break;
        }
      }
      // If still no slot (before first class), use first slot
      if (!slot) slot = schedule[0];
    }

    var settings = getWASettings();
    var tolerance = settings.lateMinutes || DEFAULT_LATE_MINUTES;
    var startParts = slot.start.split(':');
    var slotHour = parseInt(startParts[0], 10);
    var slotMinute = parseInt(startParts[1], 10);

    // Define varied arrival offsets in minutes from slot start
    // Negative = early, 0-tolerance = on time, >tolerance = late
    var nisList = Object.keys(students);
    var offsets = [
      { minutes: 2,  seconds: 15 },   // Tepat Waktu
      { minutes: 5,  seconds: 32 },   // Tepat Waktu
      { minutes: 8,  seconds: 47 },   // Tepat Waktu
      { minutes: 12, seconds: 5  },   // Tepat Waktu (within 15 min)
      { minutes: 18, seconds: 22 },   // Terlambat
      { minutes: 25, seconds: 10 },   // Terlambat
      { minutes: 33, seconds: 41 },   // Terlambat
      { minutes: 40, seconds: 58 }    // Terlambat
    ];

    var timestamps = {};
    var records = getByDate(today);

    for (var idx = 0; idx < nisList.length; idx++) {
      var nis = nisList[idx];
      var offset = offsets[idx] || offsets[offsets.length - 1];

      var entryTime = new Date(today);
      entryTime.setHours(slotHour, slotMinute + offset.minutes, offset.seconds, 0);

      timestamps[nis] = entryTime.toISOString();
      // Also mark as Hadir so the recap has data
      records[nis] = 'h';
    }

    // Save timestamps and attendance
    try {
      localStorage.setItem(getTimestampKey(today), JSON.stringify(timestamps));
    } catch (e) {
      console.warn('[AttendanceStore] Failed to seed timestamps:', e);
    }
    saveByDate(records, today);
  }

  // --- Mark a single student's status for today ---
  function markAttendance(nis, status, date) {
    var records = getByDate(date);
    records[nis] = status;
    saveByDate(records, date);
    // Save individual realtime timestamp
    saveTimestamp(nis, date);
    return records;
  }

  // --- Get student name by NIS ---
  function getStudentName(nis) {
    var s = students[nis];
    return s ? s.name : null;
  }

  // --- Get student class/kelas by NIS ---
  function getStudentClass(nis) {
    var s = students[nis];
    return s ? s.kelas : null;
  }

  // --- Check if NIS is valid ---
  function isValidNIS(nis) {
    return students.hasOwnProperty(nis);
  }

  // --- Get attendance stats for a date ---
  function getStats(date) {
    var records = getByDate(date);
    var stats = { h: 0, i: 0, s: 0, a: 0 };
    for (var nis in records) {
      if (records.hasOwnProperty(nis)) {
        var s = records[nis];
        if (stats.hasOwnProperty(s)) {
          stats[s]++;
        }
      }
    }
    return stats;
  }

  // --- Punctuality check ---
  /**
   * Determine if a student is on time or late for a given slot.
   * Returns { punctuality: 'Tepat Waktu' | 'Terlambat', lateBy: minutes }
   */
  function checkPunctuality(slot, dateObj) {
    if (!slot) return { punctuality: '-', lateBy: 0 };
    var settings = getWASettings();
    var tolerance = settings.lateMinutes || DEFAULT_LATE_MINUTES;
    var d = dateObj || new Date();
    var nowMin = d.getHours() * 60 + d.getMinutes();
    var slotStart = timeToMinutes(slot.start);
    var diff = nowMin - slotStart;

    if (diff <= tolerance) {
      return { punctuality: 'Tepat Waktu ✅', lateBy: 0, isLate: false };
    }
    return { punctuality: 'Terlambat ⚠️', lateBy: diff, isLate: true };
  }

  // --- Format full time string HH:MM:SS ---
  function formatFullTime(date) {
    var d = date || new Date();
    return String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');
  }

  // --- WhatsApp phone number formatter ---
  function formatWAPhone(rawPhone) {
    var phone = rawPhone.replace(/[\s\-\(\)]/g, '');
    if (phone.charAt(0) === '0') {
      phone = '62' + phone.substring(1);
    }
    if (phone.charAt(0) !== '+' && phone.substring(0, 2) !== '62') {
      phone = '62' + phone;
    }
    return phone.replace('+', '');
  }

  // --- WhatsApp sharing ---

  /**
   * Send attendance data to WhatsApp
   * Message format: Nama Siswa, Waktu (HH:MM:SS), Status (Tepat Waktu / Terlambat)
   *
   * @param {string} nis - Student NIS
   * @param {string} status - Status code (h/i/s/a)
   * @param {string} method - 'scan' or 'manual'
   * @param {object} [slot] - Schedule slot object (optional)
   */
  function shareToWhatsApp(nis, status, method, slot) {
    var settings = getWASettings();
    if (!settings.enabled || !settings.phone) return;

    var studentName = getStudentName(nis) || nis;
    var studentClass = getStudentClass(nis) || '-';
    var now = new Date();
    var timeStr = formatFullTime(now);
    var dateStr = formatDateDisplay(now);

    // Determine punctuality
    var punct = checkPunctuality(slot, now);

    var message = '📢 *LAPORAN KEHADIRAN SANTRI*\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '👤 Nama: *' + studentName + '*\n' +
      '🏫 Kelas: *' + studentClass + '*\n' +
      '🕐 Waktu: *' + timeStr + '*\n' +
      '📊 Status: *' + punct.punctuality + '*\n';

    if (punct.isLate) {
      message += '⏱️ Terlambat: ' + punct.lateBy + ' menit dari jadwal ' + (slot ? slot.start : '') + '\n';
    }

    if (slot) {
      message += '📚 Mapel: ' + slot.mapel + ' (' + slot.start + ' - ' + slot.end + ')\n';
    }

    message += '📅 Tanggal: ' + dateStr + '\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '_Dikirim otomatis oleh Sistem Absensi AKAMID_';

    var phone = formatWAPhone(settings.phone);
    var waUrl = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
    window.open(waUrl, '_blank');
  }

  // --- Parse QR code text to extract NIS ---
  function parseQRCode(text) {
    if (!text) return null;
    var trimmed = text.trim();

    // Format: "ABSENSI:REG-1234567890" or "NIS:REG-1234567890"
    var prefixMatch = trimmed.match(/^(?:ABSENSI|NIS|SANTRI)[:\-](REG-\d{10})$/i);
    if (prefixMatch) {
      return prefixMatch[1].toUpperCase();
    }

    // Format: REG-XXXXXXXXXX
    var regMatch = trimmed.match(/^REG-(\d{10})$/i);
    if (regMatch) {
      return trimmed.toUpperCase();
    }

    // Format: plain NIS number (10 digits)
    if (/^\d{10}$/.test(trimmed)) {
      return 'REG-' + trimmed;
    }

    // Format: JSON with nis field
    try {
      var json = JSON.parse(trimmed);
      if (json.nis) return String(json.nis);
      if (json.NIS) return String(json.NIS);
      if (json.id) return String(json.id);
    } catch (e) {
      // not JSON
    }

    return null;
  }

  // --- Auto-seed demo data on load ---
  seedDemoTimestamps();

  // ==============================
  // MAPEL (Mata Pelajaran) CRUD
  // ==============================

  var MAPEL_KEY = 'absensi_mapel';

  var defaultMapel = [
    { id: 1, mapel: 'Fiqih',              guru: 'Ust. Abdullah', start: '07:00', end: '08:30', hari: 'senin kamis',                      kelas: 'VII-A' },
    { id: 2, mapel: 'Nahwu Shorof',       guru: 'Ust. Mahmud',  start: '08:30', end: '10:00', hari: 'senin rabu',                       kelas: 'VII-A' },
    { id: 3, mapel: 'Hadits',             guru: 'Ust. Hasan',   start: '10:15', end: '11:45', hari: 'selasa kamis',                     kelas: 'VII-A' },
    { id: 4, mapel: "Tahfidz Al-Qur'an",  guru: 'Ust. Ibrahim', start: '13:00', end: '14:30', hari: 'senin selasa rabu kamis jumat',    kelas: 'Semua' },
    { id: 5, mapel: 'Aqidah Akhlak',      guru: 'Ust. Salim',   start: '15:30', end: '17:00', hari: 'rabu jumat',                      kelas: 'VII-A' },
    { id: 6, mapel: 'Tafsir',             guru: 'Ust. Yusuf',   start: '08:30', end: '10:00', hari: 'selasa sabtu',                    kelas: 'VIII-A' },
    { id: 7, mapel: 'Bahasa Arab',        guru: 'Ust. Mahmud',  start: '10:15', end: '11:45', hari: 'rabu sabtu',                      kelas: 'VII-B' },
    { id: 8, mapel: 'Sirah Nabawiyah',    guru: 'Ust. Hasan',   start: '07:00', end: '08:30', hari: 'jumat',                           kelas: 'IX-A' }
  ];

  function loadMapel() {
    try {
      var data = localStorage.getItem(MAPEL_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    saveMapel(defaultMapel);
    return defaultMapel;
  }

  function saveMapel(list) {
    try {
      localStorage.setItem(MAPEL_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[AttendanceStore] Failed to save mapel:', e);
    }
  }

  function getAllMapel() {
    return loadMapel();
  }

  function getMapelById(id) {
    var list = loadMapel();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function addMapel(data) {
    var list = loadMapel();
    var maxId = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id > maxId) maxId = list[i].id;
    }
    var item = {
      id: maxId + 1,
      mapel: data.mapel,
      guru: data.guru,
      start: data.start,
      end: data.end,
      hari: data.hari,
      kelas: data.kelas
    };
    list.push(item);
    saveMapel(list);
    return { success: true, mapel: item };
  }

  function updateMapel(id, data) {
    var list = loadMapel();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].mapel = data.mapel;
        list[i].guru = data.guru;
        list[i].start = data.start;
        list[i].end = data.end;
        list[i].hari = data.hari;
        list[i].kelas = data.kelas;
        saveMapel(list);
        return { success: true, mapel: list[i] };
      }
    }
    return { error: 'Mapel tidak ditemukan' };
  }

  function deleteMapel(id) {
    var list = loadMapel();
    var newList = [];
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { found = true; continue; }
      newList.push(list[i]);
    }
    if (!found) return { error: 'Mapel tidak ditemukan' };
    saveMapel(newList);
    return { success: true };
  }

  // ==============================
  // INFAQ (Donasi) CRUD
  // ==============================

  var INFAQ_KEY = 'absensi_infaq';

  var defaultInfaq = [
    { id: 1,  nama: 'Ahmad Ramadhan',    jumlah: 50000,  tipe: 'tunai',    tanggal: '2026-02-12', catatan: '' },
    { id: 2,  nama: 'Muhammad Fauzan',   jumlah: 25000,  tipe: 'transfer', tanggal: '2026-02-12', catatan: '' },
    { id: 3,  nama: 'Aisyah Zahra',      jumlah: 30000,  tipe: 'tunai',    tanggal: '2026-02-11', catatan: '' },
    { id: 4,  nama: 'Nur Khadijah',      jumlah: 100000, tipe: 'transfer', tanggal: '2026-02-10', catatan: '' },
    { id: 5,  nama: 'Ibrahim Al-Farisi', jumlah: 20000,  tipe: 'tunai',    tanggal: '2026-02-09', catatan: '' },
    { id: 6,  nama: 'Hafidz Mubarok',    jumlah: 75000,  tipe: 'transfer', tanggal: '2026-01-28', catatan: '' },
    { id: 7,  nama: 'Siti Rahmawati',    jumlah: 50000,  tipe: 'tunai',    tanggal: '2026-01-25', catatan: '' },
    { id: 8,  nama: 'Yusuf Hakim',       jumlah: 40000,  tipe: 'tunai',    tanggal: '2026-01-22', catatan: '' },
    { id: 9,  nama: 'Fatimah Azzahra',   jumlah: 60000,  tipe: 'transfer', tanggal: '2026-01-20', catatan: '' },
    { id: 10, nama: 'Bilal Husain',      jumlah: 35000,  tipe: 'tunai',    tanggal: '2026-01-18', catatan: '' }
  ];

  function loadInfaq() {
    try {
      var data = localStorage.getItem(INFAQ_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    saveInfaq(defaultInfaq);
    return defaultInfaq;
  }

  function saveInfaq(list) {
    try {
      localStorage.setItem(INFAQ_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[AttendanceStore] Failed to save infaq:', e);
    }
  }

  function getAllInfaq() {
    return loadInfaq();
  }

  function getInfaqById(id) {
    var list = loadInfaq();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function addInfaq(data) {
    var list = loadInfaq();
    var maxId = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id > maxId) maxId = list[i].id;
    }
    var item = {
      id: maxId + 1,
      nama: data.nama,
      jumlah: data.jumlah,
      tipe: data.tipe,
      tanggal: data.tanggal,
      catatan: data.catatan || ''
    };
    list.push(item);
    saveInfaq(list);
    return { success: true, infaq: item };
  }

  function updateInfaq(id, data) {
    var list = loadInfaq();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].nama = data.nama;
        list[i].jumlah = data.jumlah;
        list[i].tipe = data.tipe;
        list[i].tanggal = data.tanggal;
        list[i].catatan = data.catatan || '';
        saveInfaq(list);
        return { success: true, infaq: list[i] };
      }
    }
    return { error: 'Data infaq tidak ditemukan' };
  }

  function deleteInfaq(id) {
    var list = loadInfaq();
    var newList = [];
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { found = true; continue; }
      newList.push(list[i]);
    }
    if (!found) return { error: 'Data infaq tidak ditemukan' };
    saveInfaq(newList);
    return { success: true };
  }

  // ==============================
  // KELAS (Class) CRUD
  // ==============================

  var KELAS_KEY = 'absensi_kelas';

  var defaultKelas = [
    { id: 1, nama: 'VII-A', kode: '7a', wali: 'Ust. Abdullah', registrasi: 'KLS-5346727236' },
    { id: 2, nama: 'VII-B', kode: '7b', wali: 'Ust. Mahmud',  registrasi: 'KLS-8291450378' },
    { id: 3, nama: 'VIII-A', kode: '8a', wali: 'Ust. Hasan',   registrasi: 'KLS-1748362950' },
    { id: 4, nama: 'IX-A', kode: '9a', wali: 'Ust. Ibrahim',  registrasi: 'KLS-6023819457' }
  ];

  function generateKelasRegNumber(list) {
    var existing = {};
    for (var i = 0; i < list.length; i++) {
      if (list[i].registrasi) existing[list[i].registrasi] = true;
    }
    var reg;
    do {
      var digits = '';
      for (var d = 0; d < 10; d++) {
        digits += String(Math.floor(Math.random() * 10));
      }
      reg = 'KLS-' + digits;
    } while (existing[reg]);
    return reg;
  }

  function loadKelas() {
    try {
      var data = localStorage.getItem(KELAS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    saveKelas(defaultKelas);
    return defaultKelas;
  }

  function saveKelas(list) {
    try {
      localStorage.setItem(KELAS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[AttendanceStore] Failed to save kelas:', e);
    }
  }

  function getAllKelas() {
    return loadKelas();
  }

  function getKelasById(id) {
    var list = loadKelas();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function addKelas(data) {
    var list = loadKelas();
    // Check duplicate kode
    for (var i = 0; i < list.length; i++) {
      if (list[i].kode === data.kode) return { error: 'Kode kelas sudah digunakan' };
    }
    var maxId = 0;
    for (var j = 0; j < list.length; j++) {
      if (list[j].id > maxId) maxId = list[j].id;
    }
    var item = {
      id: maxId + 1,
      nama: data.nama,
      kode: data.kode,
      wali: data.wali,
      registrasi: generateKelasRegNumber(list)
    };
    list.push(item);
    saveKelas(list);
    return { success: true, kelas: item };
  }

  function updateKelas(id, data) {
    var list = loadKelas();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        // Check duplicate kode (exclude self)
        for (var j = 0; j < list.length; j++) {
          if (list[j].kode === data.kode && list[j].id !== id) return { error: 'Kode kelas sudah digunakan' };
        }
        list[i].nama = data.nama;
        list[i].kode = data.kode;
        list[i].wali = data.wali;
        saveKelas(list);
        return { success: true, kelas: list[i] };
      }
    }
    return { error: 'Kelas tidak ditemukan' };
  }

  function deleteKelas(id) {
    var list = loadKelas();
    var newList = [];
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { found = true; continue; }
      newList.push(list[i]);
    }
    if (!found) return { error: 'Kelas tidak ditemukan' };
    saveKelas(newList);
    return { success: true };
  }

  function getStudentCountByKelas(kode) {
    var students = loadStudents();
    var count = 0;
    for (var i = 0; i < students.length; i++) {
      if (students[i].kelas === kode && students[i].status === 'active') count++;
    }
    return count;
  }

  function getKelasOptions() {
    var list = loadKelas();
    return list.map(function(k) {
      return { value: k.kode, label: k.nama };
    });
  }

  // ==============================
  // PENGUMUMAN (Announcement) CRUD
  // ==============================

  var PENGUMUMAN_KEY = 'absensi_pengumuman';

  var defaultPengumuman = [
    { id: 1, judul: 'Libur Nasional - Maulid Nabi Muhammad SAW', isi: 'Diberitahukan kepada seluruh santri bahwa kegiatan belajar mengajar diliburkan pada hari Kamis, 27 Februari 2026 dalam rangka memperingati Maulid Nabi Muhammad SAW. Seluruh santri diharapkan untuk tetap menjaga adab dan mengikuti kegiatan peringatan yang diselenggarakan oleh pesantren. Kegiatan belajar mengajar akan kembali normal pada hari Jumat, 28 Februari 2026.', tipe: 'penting', tanggal: '2026-02-18', dibaca: false },
    { id: 2, judul: 'Jadwal Ujian Tengah Semester', isi: 'Ujian Tengah Semester (UTS) akan dilaksanakan pada tanggal 10-15 Maret 2026. Seluruh santri diharapkan mempersiapkan diri dengan baik. Materi ujian meliputi seluruh materi yang telah diajarkan dari awal semester hingga pertemuan terakhir sebelum ujian. Jadwal detail per mata pelajaran akan diumumkan melalui musyrif masing-masing kelas.', tipe: 'penting', tanggal: '2026-02-17', dibaca: false },
    { id: 3, judul: 'Perubahan Jam Kegiatan', isi: 'Mulai bulan Maret 2026, jam kegiatan sore akan dimajukan menjadi pukul 15.00 WIB. Perubahan ini berlaku untuk seluruh santri tanpa terkecuali. Harap seluruh santri menyesuaikan jadwal kegiatan pribadi agar tidak terlambat mengikuti kegiatan sore. Keterlambatan akan dicatat dalam buku pelanggaran.', tipe: 'info', tanggal: '2026-02-16', dibaca: false },
    { id: 4, judul: 'Kegiatan Ekstrakulikuler Baru', isi: 'Pesantren membuka pendaftaran ekstrakulikuler baru: Kaligrafi Digital dan Tahfidz Intensif. Pendaftaran dibuka hingga 5 Maret 2026. Kaligrafi Digital akan diadakan setiap hari Selasa dan Kamis pukul 16.00-17.30 WIB. Tahfidz Intensif diadakan setiap hari Senin, Rabu, dan Jumat pukul 05.00-06.00 WIB. Kuota terbatas, segera daftarkan diri melalui musyrif masing-masing.', tipe: 'kegiatan', tanggal: '2026-02-15', dibaca: true },
    { id: 5, judul: 'Lomba Hafalan Al-Quran', isi: 'Pesantren akan mengadakan lomba hafalan Al-Quran antar kelas pada tanggal 20 Maret 2026. Pendaftaran melalui musyrif masing-masing. Kategori lomba meliputi: Juz 30, Juz 29-30, dan 5 Juz pilihan. Hadiah menarik menanti para pemenang. Mari tunjukkan kemampuan hafalan terbaik kalian!', tipe: 'kegiatan', tanggal: '2026-02-11', dibaca: true }
  ];

  function loadPengumuman() {
    try {
      var data = localStorage.getItem(PENGUMUMAN_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    savePengumuman(defaultPengumuman);
    return defaultPengumuman;
  }

  function savePengumuman(list) {
    try {
      localStorage.setItem(PENGUMUMAN_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[AttendanceStore] Failed to save pengumuman:', e);
    }
  }

  function getAllPengumuman() {
    return loadPengumuman();
  }

  function getPengumumanById(id) {
    var list = loadPengumuman();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function addPengumuman(data) {
    var list = loadPengumuman();
    var maxId = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id > maxId) maxId = list[i].id;
    }
    var item = {
      id: maxId + 1,
      judul: data.judul,
      isi: data.isi,
      tipe: data.tipe,
      tanggal: data.tanggal || new Date().toISOString().split('T')[0],
      dibaca: false
    };
    list.unshift(item);
    savePengumuman(list);
    return { success: true, pengumuman: item };
  }

  function updatePengumuman(id, data) {
    var list = loadPengumuman();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].judul = data.judul;
        list[i].isi = data.isi;
        list[i].tipe = data.tipe;
        if (data.tanggal) list[i].tanggal = data.tanggal;
        savePengumuman(list);
        return { success: true, pengumuman: list[i] };
      }
    }
    return { error: 'Pengumuman tidak ditemukan' };
  }

  function deletePengumuman(id) {
    var list = loadPengumuman();
    var newList = [];
    var found = false;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { found = true; continue; }
      newList.push(list[i]);
    }
    if (!found) return { error: 'Pengumuman tidak ditemukan' };
    savePengumuman(newList);
    return { success: true };
  }

  function markPengumumanRead(id) {
    var list = loadPengumuman();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { list[i].dibaca = true; break; }
    }
    savePengumuman(list);
  }

  // ==============================
  // NOTIFICATIONS
  // ==============================

  var NOTIF_KEY = 'absensi_notifications';

  function loadNotifications() {
    try {
      var data = localStorage.getItem(NOTIF_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    var defaults = getDefaultNotifications();
    saveNotifications(defaults);
    return defaults;
  }

  function getDefaultNotifications() {
    var now = new Date();
    var d1 = new Date(now); d1.setMinutes(d1.getMinutes() - 5);
    var d2 = new Date(now); d2.setHours(d2.getHours() - 1);
    var d3 = new Date(now); d3.setHours(d3.getHours() - 3);
    var d4 = new Date(now); d4.setDate(d4.getDate() - 1);
    var d5 = new Date(now); d5.setDate(d5.getDate() - 2);
    return [
      { id: 1, type: 'pengumuman', title: 'Pengumuman Baru', message: 'Libur Nasional - Maulid Nabi Muhammad SAW', time: d1.toISOString(), read: false },
      { id: 2, type: 'siswa',      title: 'Siswa Baru Terdaftar', message: 'Yusuf Hakim telah ditambahkan ke kelas IX-A', time: d2.toISOString(), read: false },
      { id: 3, type: 'infaq',      title: 'Infaq Baru Diterima', message: 'Ahmad Ramadhan membayar infaq Rp 50.000 (Tunai)', time: d3.toISOString(), read: false },
      { id: 4, type: 'pengumuman', title: 'Pengumuman Baru', message: 'Jadwal Ujian Tengah Semester telah dipublikasikan', time: d4.toISOString(), read: true },
      { id: 5, type: 'kehadiran',  title: 'Laporan Kehadiran', message: 'Kehadiran hari ini: 10 hadir, 0 alpha', time: d5.toISOString(), read: true }
    ];
  }

  function saveNotifications(list) {
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function getAllNotifications() {
    return loadNotifications();
  }

  function getUnreadCount() {
    var list = loadNotifications();
    var count = 0;
    for (var i = 0; i < list.length; i++) {
      if (!list[i].read) count++;
    }
    return count;
  }

  function markNotifRead(id) {
    var list = loadNotifications();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { list[i].read = true; break; }
    }
    saveNotifications(list);
  }

  function markAllNotifRead() {
    var list = loadNotifications();
    for (var i = 0; i < list.length; i++) { list[i].read = true; }
    saveNotifications(list);
  }

  function addNotification(type, title, message) {
    var list = loadNotifications();
    var maxId = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id > maxId) maxId = list[i].id;
    }
    var notif = { id: maxId + 1, type: type, title: title, message: message, time: new Date().toISOString(), read: false };
    list.unshift(notif);
    if (list.length > 50) list = list.slice(0, 50);
    saveNotifications(list);
    return notif;
  }

  // --- Public API ---
  return {
    getByDate: getByDate,
    saveByDate: saveByDate,
    markAttendance: markAttendance,
    getStudentName: getStudentName,
    getStudentClass: getStudentClass,
    getStudentTimestamp: getStudentTimestamp,
    getTimestamps: getTimestamps,
    isValidNIS: isValidNIS,
    getStats: getStats,
    parseQRCode: parseQRCode,
    formatDateKey: formatDateKey,
    students: students,
    schedule: schedule,
    canScan: canScan,
    recordScan: recordScan,
    getCurrentSlot: getCurrentSlot,
    shareToWhatsApp: shareToWhatsApp,
    getWASettings: getWASettings,
    saveWASettings: saveWASettings,
    checkPunctuality: checkPunctuality,
    formatFullTime: formatFullTime,
    formatWAPhone: formatWAPhone,
    seedDemoTimestamps: seedDemoTimestamps,
    // Student CRUD
    getAllStudents: getAllStudents,
    getStudentById: getStudentById,
    addStudent: addStudent,
    updateStudent: updateStudent,
    deleteStudent: deleteStudent,
    // Mapel CRUD
    getAllMapel: getAllMapel,
    getMapelById: getMapelById,
    addMapel: addMapel,
    updateMapel: updateMapel,
    deleteMapel: deleteMapel,
    // Infaq CRUD
    getAllInfaq: getAllInfaq,
    getInfaqById: getInfaqById,
    addInfaq: addInfaq,
    updateInfaq: updateInfaq,
    deleteInfaq: deleteInfaq,
    // Kelas CRUD
    getAllKelas: getAllKelas,
    getKelasById: getKelasById,
    addKelas: addKelas,
    updateKelas: updateKelas,
    deleteKelas: deleteKelas,
    getStudentCountByKelas: getStudentCountByKelas,
    getKelasOptions: getKelasOptions,
    // Pengumuman CRUD
    getAllPengumuman: getAllPengumuman,
    getPengumumanById: getPengumumanById,
    addPengumuman: addPengumuman,
    updatePengumuman: updatePengumuman,
    deletePengumuman: deletePengumuman,
    markPengumumanRead: markPengumumanRead,
    // Notifications
    getAllNotifications: getAllNotifications,
    getUnreadCount: getUnreadCount,
    markNotifRead: markNotifRead,
    markAllNotifRead: markAllNotifRead,
    addNotification: addNotification
  };
})();
