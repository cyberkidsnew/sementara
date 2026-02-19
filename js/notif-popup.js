/**
 * Notification Dropdown - Compact bell dropdown
 * Attaches dropdown to the header bell icon (#notifBadge)
 */

(function () {
  'use strict';

  if (typeof AttendanceStore === 'undefined') return;

  // --- Icon SVGs by type ---
  var icons = {
    pengumuman: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    siswa: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    infaq: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    kehadiran: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    kelas: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'
  };

  // --- Navigation map ---
  var navMap = {
    pengumuman: 'pengumuman.html',
    siswa: 'data-siswa.html',
    infaq: 'infaq.html',
    kehadiran: 'laporan.html',
    kelas: 'data-kelas.html'
  };

  // --- Time ago helper ---
  function timeAgo(isoStr) {
    var now = new Date();
    var then = new Date(isoStr);
    var diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
    if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
    if (diff < 172800) return 'Kemarin';
    return Math.floor(diff / 86400) + ' hari lalu';
  }

  // --- Create dropdown HTML and attach to bell icon ---
  function createDropdown(bellEl) {
    // Make bell a positioning anchor
    bellEl.style.position = 'relative';

    // Invisible overlay to catch outside clicks
    var overlay = document.createElement('div');
    overlay.className = 'notif-overlay';
    overlay.id = 'notifOverlay';
    document.body.appendChild(overlay);

    // Dropdown panel inside the bell parent
    var dropdown = document.createElement('div');
    dropdown.className = 'notif-popup';
    dropdown.id = 'notifPopup';
    dropdown.innerHTML =
      '<div class="notif-popup-header">' +
        '<h2 class="notif-popup-title">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>' +
          'Notifikasi <span class="notif-popup-badge" id="notifPopupBadge">0</span>' +
        '</h2>' +
        '<button class="notif-popup-mark-read" id="notifMarkAllRead">Baca semua</button>' +
      '</div>' +
      '<div class="notif-popup-list" id="notifPopupList"></div>' +
      '<div class="notif-popup-footer">' +
        '<a href="pengumuman.html" class="notif-popup-viewall">' +
          'Lihat Semua' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</a>' +
      '</div>';

    bellEl.appendChild(dropdown);
  }

  // --- Render notification items ---
  function renderNotifications() {
    var list = AttendanceStore.getAllNotifications();
    var container = document.getElementById('notifPopupList');
    var badge = document.getElementById('notifPopupBadge');
    if (!container) return;

    var unread = AttendanceStore.getUnreadCount();
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'inline-flex' : 'none';
    }

    updateHeaderBadge(unread);

    if (list.length === 0) {
      container.innerHTML =
        '<div class="notif-empty">' +
          '<div class="notif-empty-icon">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
          '</div>' +
          '<p class="notif-empty-text">Belum ada notifikasi</p>' +
          '<p class="notif-empty-sub">Notifikasi baru akan muncul di sini</p>' +
        '</div>';
      return;
    }

    var html = '';
    list.forEach(function (n) {
      var iconClass = 'notif-icon-' + n.type;
      var iconSvg = icons[n.type] || icons.pengumuman;
      var unreadClass = n.read ? '' : ' unread';
      var dotHtml = n.read ? '' : '<span class="notif-unread-dot"></span>';

      html +=
        '<div class="notif-item' + unreadClass + '" data-notif-id="' + n.id + '" data-notif-type="' + n.type + '">' +
          '<div class="notif-item-icon ' + iconClass + '">' + iconSvg + '</div>' +
          '<div class="notif-item-content">' +
            '<div class="notif-item-title">' + n.title + dotHtml + '</div>' +
            '<p class="notif-item-message">' + n.message + '</p>' +
            '<span class="notif-item-time">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
              timeAgo(n.time) +
            '</span>' +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;

    var items = container.querySelectorAll('.notif-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        var id = parseInt(item.getAttribute('data-notif-id'), 10);
        var type = item.getAttribute('data-notif-type');
        AttendanceStore.markNotifRead(id);
        window.location.href = navMap[type] || 'pengumuman.html';
      });
    });
  }

  // --- Update header badge count ---
  function updateHeaderBadge(count) {
    var badgeEl = document.getElementById('badgeCount');
    if (!badgeEl) return;
    badgeEl.textContent = count > 9 ? '9+' : count;
    badgeEl.style.display = count > 0 ? 'flex' : 'none';
  }

  // --- Show/Hide ---
  var isOpen = false;

  function showDropdown() {
    renderNotifications();
    var overlay = document.getElementById('notifOverlay');
    var popup = document.getElementById('notifPopup');
    if (overlay) overlay.classList.add('active');
    if (popup) popup.classList.add('active');
    isOpen = true;
  }

  function hideDropdown() {
    var overlay = document.getElementById('notifOverlay');
    var popup = document.getElementById('notifPopup');
    if (popup) popup.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    isOpen = false;
  }

  function toggleDropdown() {
    if (isOpen) { hideDropdown(); } else { showDropdown(); }
  }

  // --- Init ---
  document.addEventListener('DOMContentLoaded', function () {
    var bellEl = document.getElementById('notifBadge');
    if (!bellEl) return;

    createDropdown(bellEl);

    bellEl.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown();
    });
    bellEl.style.cursor = 'pointer';

    // Close on overlay click
    var overlay = document.getElementById('notifOverlay');
    if (overlay) overlay.addEventListener('click', hideDropdown);

    // Mark all read
    var markAllBtn = document.getElementById('notifMarkAllRead');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', function () {
        AttendanceStore.markAllNotifRead();
        renderNotifications();
      });
    }

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) hideDropdown();
    });

    // Initial badge count
    var unread = AttendanceStore.getUnreadCount();
    updateHeaderBadge(unread);

    // Cross-tab sync
    window.addEventListener('storage', function (e) {
      if (e.key === 'absensi_notifications') renderNotifications();
    });
  });

})();
