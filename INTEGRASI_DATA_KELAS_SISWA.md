# Integrasi Data Kelas dan Data Siswa

## Perubahan yang Dilakukan

### 1. Data Siswa (data-siswa.html & js/data-siswa.js)

#### Dropdown Kelas Dinamis
- Dropdown kelas di form siswa sekarang diisi secara dinamis dari data kelas yang tersedia
- Fungsi `populateKelasDropdown()` mengambil data dari `AttendanceStore.getAllKelas()`
- Jika tidak ada kelas, akan menampilkan "Belum ada kelas"

#### Label Kelas Dinamis
- Mapping `kelasLabels` sekarang diisi dari data kelas aktual
- Fungsi `loadKelasLabels()` dipanggil setiap kali render untuk memastikan data terbaru
- Label kelas di card siswa akan otomatis sesuai dengan nama kelas di data kelas

#### Validasi
- Menambahkan validasi bahwa kelas wajib dipilih saat menambah/edit siswa
- Validasi: `if (!kelas) { showFormError('Kelas wajib dipilih'); }`

#### Sinkronisasi dengan Data Kelas
- Ketika siswa ditambah/diubah/dihapus, akan memanggil `window.refreshKelasStats()` jika tersedia
- Ini memastikan jumlah santri di halaman data kelas selalu update

### 2. Data Kelas (data-kelas.html & js/data-kelas.js)

#### Validasi Hapus Kelas
- Sebelum menghapus kelas, sistem mengecek apakah masih ada siswa aktif di kelas tersebut
- Jika masih ada siswa, kelas tidak bisa dihapus dan akan menampilkan pesan error
- Validasi: `AttendanceStore.getStudentCountByKelas(kelas.kode)`

#### Fungsi Refresh Global
- Menambahkan `window.refreshKelasStats()` yang bisa dipanggil dari halaman lain
- Fungsi ini akan merender ulang daftar kelas dan update statistik

### 3. Attendance Store (js/attendance-store.js)

#### Fungsi Helper Baru
- `getKelasOptions()`: Mengembalikan array kelas dalam format `{ value, label }` untuk dropdown
- Fungsi ini memudahkan pengisian dropdown di berbagai halaman

## Cara Kerja Integrasi

### Flow Tambah Siswa
1. User membuka form tambah siswa
2. `populateKelasDropdown()` dipanggil untuk mengisi dropdown kelas
3. User memilih kelas dari dropdown yang berisi data kelas aktual
4. Setelah simpan, `window.refreshKelasStats()` dipanggil untuk update jumlah santri

### Flow Edit Siswa
1. User membuka form edit siswa
2. `populateKelasDropdown()` dipanggil untuk mengisi dropdown kelas
3. Kelas siswa saat ini dipilih otomatis: `formKelas.value = student.kelas`
4. User bisa mengubah kelas ke kelas lain yang tersedia
5. Setelah update, statistik kelas di-refresh

### Flow Hapus Siswa
1. User menghapus siswa
2. Setelah berhasil, `window.refreshKelasStats()` dipanggil
3. Jumlah santri di kelas berkurang otomatis

### Flow Hapus Kelas
1. User mencoba menghapus kelas
2. Sistem mengecek jumlah siswa aktif di kelas tersebut
3. Jika ada siswa, hapus dibatalkan dengan pesan error
4. Jika tidak ada siswa, kelas berhasil dihapus

## Keuntungan Integrasi

1. **Data Konsisten**: Kelas yang ditampilkan di form siswa selalu sesuai dengan data kelas yang ada
2. **Validasi Otomatis**: Tidak bisa menghapus kelas yang masih memiliki siswa
3. **Update Real-time**: Perubahan di data siswa langsung terlihat di statistik kelas
4. **Fleksibel**: Admin bisa menambah kelas baru dan langsung tersedia di form siswa
5. **User-Friendly**: Dropdown menampilkan nama kelas yang mudah dibaca (VII-A, VIII-B, dll)

## Catatan Teknis

- Integrasi menggunakan localStorage untuk menyimpan data
- Komunikasi antar halaman menggunakan global function `window.refreshKelasStats()`
- Semua perubahan data melalui `AttendanceStore` untuk konsistensi
- Validasi dilakukan di level JavaScript sebelum menyimpan ke localStorage
