/**
 * Absensi Santri - Akun (Account) Script
 * Handles logout and menu interactions
 */

document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  if (!AuthModule.requireAuth()) return;

  // Load user data
  var currentUser = AuthModule.getCurrentUser();
  if (currentUser) {
    var avatarEl = document.querySelector('.profile-avatar');
    var nameEl = document.querySelector('.profile-name');
    var emailTag = document.querySelector('.profile-tags');

    if (avatarEl) {
      avatarEl.textContent = AuthModule.getInitials(currentUser.name);
    }
    if (nameEl) {
      nameEl.textContent = currentUser.name;
    }
    
    // Update profile tags with email
    if (emailTag) {
      var existingTags = emailTag.innerHTML;
      emailTag.innerHTML = '<span class="profile-tag">' + currentUser.email + '</span>' + 
                          '<span class="profile-tag">' + (currentUser.role === 'admin' ? 'Administrator' : 'User') + '</span>';
    }
  }

  // --- Load profile registration number from store ---
  if (typeof AttendanceStore !== 'undefined') {
    var students = AttendanceStore.getAllStudents();
    if (students && students.length > 0) {
      var profileReg = document.getElementById('profileReg');
      if (profileReg) {
        profileReg.textContent = 'No. Registrasi: ' + students[0].nis;
      }
    }
  }

  // --- Logout Button ---
  var btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', function () {
      var confirmLogout = confirm('Apakah Anda yakin ingin keluar dari akun?');
      if (confirmLogout) {
        AuthModule.logout();
        window.location.href = 'index.html';
      }
    });
  }

  // --- Menu Item Ripple Effect ---
  var menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (!href || href === '#') {
        e.preventDefault();
      }
    });
  });
});
