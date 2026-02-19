# Integrasi Login dan Dashboard

## Overview

Sistem autentikasi telah diintegrasikan dengan dashboard dan semua halaman aplikasi. User yang login akan melihat data mereka di seluruh aplikasi.

## Fitur Autentikasi

### 1. Modul Auth (js/auth.js)

Modul autentikasi yang mengelola:
- Registrasi user baru
- Login user
- Logout user
- Update profil user
- Ubah password
- Session management
- Proteksi halaman

#### Data User
```javascript
{
  id: number,
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'user',
  avatar: string,
  createdAt: string (ISO date)
}
```

#### Default Admin Account
- Email: `admin@akamid.com`
- Password: `admin123`
- Role: `admin`

### 2. Fungsi Utama

#### `AuthModule.register(name, email, password)`
Mendaftarkan user baru
- Validasi email unik
- Generate avatar dari initial nama
- Return: `{ success, user }` atau `{ success: false, error }`

#### `AuthModule.login(email, password)`
Login user
- Validasi email dan password
- Set session di localStorage
- Return: `{ success, user }` atau `{ success: false, error }`

#### `AuthModule.logout()`
Logout user
- Clear session dari localStorage
- Return: `{ success: true }`

#### `AuthModule.getCurrentUser()`
Mendapatkan data user yang sedang login
- Return: user object atau null

#### `AuthModule.isLoggedIn()`
Cek apakah user sudah login
- Return: boolean

#### `AuthModule.requireAuth()`
Proteksi halaman - redirect ke login jika belum login
- Return: boolean
- Usage: Panggil di awal setiap halaman yang memerlukan autentikasi

#### `AuthModule.redirectIfLoggedIn()`
Redirect ke dashboard jika sudah login
- Return: boolean
- Usage: Panggil di halaman login/register

#### `AuthModule.updateProfile(userId, data)`
Update profil user
- Update name dan/atau email
- Validasi email unik
- Update session jika user update profil sendiri
- Return: `{ success, user }` atau `{ success: false, error }`

#### `AuthModule.changePassword(userId, oldPassword, newPassword)`
Ubah password user
- Validasi password lama
- Update password baru
- Return: `{ success: true }` atau `{ success: false, error }`

## Integrasi dengan Halaman

### 1. Halaman Login (index.html)

#### Fitur:
- Form login dengan validasi
- Form register dengan validasi
- Toggle antara login dan register
- Password visibility toggle
- Remember me checkbox
- Auto-redirect jika sudah login

#### Flow Login:
1. User input email dan password
2. Validasi form
3. `AuthModule.login(email, password)`
4. Jika berhasil, redirect ke dashboard
5. Jika gagal, tampilkan error

#### Flow Register:
1. User input nama, email, password, dan konfirmasi password
2. Validasi form (termasuk password match)
3. `AuthModule.register(name, email, password)`
4. Jika berhasil, switch ke form login dan pre-fill email
5. Jika gagal (email sudah terdaftar), tampilkan error

### 2. Dashboard (dashboard.html)

#### Fitur:
- Cek autentikasi saat load
- Tampilkan nama user di greeting card
- Tampilkan avatar (initial nama) di greeting card
- Load statistik kehadiran
- Greeting realtime (Selamat Pagi/Siang/Sore/Malam)

#### Implementasi:
```javascript
// Check auth
if (!AuthModule.requireAuth()) return;

// Load user data
var currentUser = AuthModule.getCurrentUser();
if (currentUser) {
  avatarEl.textContent = AuthModule.getInitials(currentUser.name);
  nameEl.textContent = currentUser.name;
}
```

### 3. Halaman Akun (akun.html)

#### Fitur:
- Tampilkan profil user lengkap
- Tampilkan avatar, nama, email, dan role
- Menu pengaturan (Edit Profil, Ubah Password, Notifikasi)
- Tombol logout dengan konfirmasi

#### Implementasi:
```javascript
// Load user data
var currentUser = AuthModule.getCurrentUser();
avatarEl.textContent = AuthModule.getInitials(currentUser.name);
nameEl.textContent = currentUser.name;

// Logout
btnLogout.addEventListener('click', function () {
  if (confirm('Apakah Anda yakin ingin keluar?')) {
    AuthModule.logout();
    window.location.href = 'index.html';
  }
});
```

### 4. Edit Profil (edit-profil.html)

#### Fitur:
- Form edit nama dan email
- Validasi email format
- Update profil dengan `AuthModule.updateProfile()`
- Toast notification saat berhasil
- Auto-reload untuk refresh data

#### Implementasi:
```javascript
// Load current data
nameInput.value = currentUser.name;
emailInput.value = currentUser.email;

// Save changes
var result = AuthModule.updateProfile(currentUser.id, {
  name: name,
  email: email
});

if (result.success) {
  // Show toast and reload
  window.location.reload();
} else {
  alert(result.error);
}
```

### 5. Ubah Password (ubah-password.html)

#### Fitur:
- Form ubah password (current, new, confirm)
- Password visibility toggle
- Password strength indicator
- Validasi password match
- Update password dengan `AuthModule.changePassword()`

#### Implementasi:
```javascript
var result = AuthModule.changePassword(
  currentUser.id,
  currentPassword,
  newPassword
);

if (result.success) {
  // Show toast and clear form
} else {
  alert(result.error); // "Kata sandi lama salah"
}
```

### 6. Pengumuman (pengumuman.html)

#### Fitur:
- Cek autentikasi saat load
- Tampilkan nama user di greeting card
- Tampilkan avatar di greeting card

## Storage Structure

### localStorage Keys:

1. `absensi_users` - Array of all registered users
2. `absensi_current_user` - Current logged in user (session)

### Session Data:
```javascript
{
  id: number,
  name: string,
  email: string,
  role: string,
  avatar: string
  // Note: password tidak disimpan di session
}
```

## Security Notes

1. **Password Storage**: Password disimpan dalam plain text di localStorage. Untuk production, gunakan hashing (bcrypt, etc.)

2. **Session Management**: Session disimpan di localStorage, bukan sessionStorage. Ini berarti session persist setelah browser ditutup.

3. **Client-Side Only**: Ini adalah autentikasi client-side. Untuk production, gunakan server-side authentication dengan JWT/session cookies.

4. **XSS Protection**: Pastikan semua input di-sanitize untuk mencegah XSS attacks.

## Testing

### Test Login:
1. Buka `index.html`
2. Login dengan:
   - Email: `admin@akamid.com`
   - Password: `admin123`
3. Harus redirect ke dashboard
4. Nama "Ahmad Ramadhan" muncul di greeting card

### Test Register:
1. Buka `index.html`
2. Klik "Daftar Sekarang"
3. Isi form register
4. Klik "Daftar"
5. Harus switch ke form login dengan email pre-filled
6. Login dengan akun baru

### Test Logout:
1. Di halaman akun, klik "Keluar"
2. Konfirmasi logout
3. Harus redirect ke halaman login

### Test Edit Profil:
1. Di halaman akun, klik "Edit Profil"
2. Ubah nama atau email
3. Klik "Simpan Perubahan"
4. Halaman reload dan data terupdate

### Test Ubah Password:
1. Di halaman akun, klik "Ubah Password"
2. Isi password lama, baru, dan konfirmasi
3. Klik "Ubah Password"
4. Toast muncul dan form di-clear

### Test Proteksi Halaman:
1. Logout dari aplikasi
2. Coba akses `dashboard.html` langsung
3. Harus auto-redirect ke `index.html`

## Troubleshooting

### User tidak bisa login
- Cek console untuk error
- Pastikan email dan password benar
- Cek localStorage apakah data user ada

### Data user tidak muncul di dashboard
- Cek apakah `AuthModule.getCurrentUser()` return data
- Cek console untuk error
- Pastikan auth.js di-load sebelum script lain

### Logout tidak berfungsi
- Cek apakah `AuthModule.logout()` dipanggil
- Cek localStorage apakah session di-clear
- Pastikan redirect ke index.html

## Future Improvements

1. **Server-Side Auth**: Implementasi backend API untuk autentikasi
2. **Password Hashing**: Hash password sebelum disimpan
3. **JWT Tokens**: Gunakan JWT untuk session management
4. **Refresh Tokens**: Implementasi refresh token untuk security
5. **Email Verification**: Verifikasi email saat register
6. **Forgot Password**: Fitur reset password via email
7. **2FA**: Two-factor authentication untuk security tambahan
8. **Role-Based Access**: Implementasi permission berdasarkan role
9. **Session Timeout**: Auto-logout setelah inactive
10. **Remember Me**: Implementasi proper remember me dengan expiry
