/**
 * Absensi Santri - Edit Profil Script
 * Handles form save and toast
 */

document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  if (!AuthModule.requireAuth()) return;

  var btnSave = document.getElementById('btnSave');
  var toast = document.getElementById('toast');
  var currentUser = AuthModule.getCurrentUser();

  // --- Load profile data from auth ---
  if (currentUser) {
    var nameInput = document.getElementById('fullName');
    var emailInput = document.getElementById('email');
    var avatarImg = document.querySelector('.avatar-edit-img');

    if (nameInput) nameInput.value = currentUser.name;
    if (emailInput) emailInput.value = currentUser.email;
    if (avatarImg) avatarImg.textContent = AuthModule.getInitials(currentUser.name);
  }

  // --- Save changes ---
  btnSave.addEventListener('click', function () {
    var name = document.getElementById('fullName').value.trim();
    var email = document.getElementById('email').value.trim();

    if (!name) {
      alert('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!email) {
      alert('Email tidak boleh kosong.');
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Format email tidak valid.');
      return;
    }

    // Update profile in auth
    var result = AuthModule.updateProfile(currentUser.id, {
      name: name,
      email: email
    });

    if (result.success) {
      // Show success toast
      toast.classList.add('visible');
      setTimeout(function () {
        toast.classList.remove('visible');
        // Reload to show updated data
        window.location.reload();
      }, 2500);
    } else {
      alert(result.error || 'Gagal memperbarui profil');
    }
  });
});
