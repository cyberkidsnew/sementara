# Integrasi Data Absensi dengan Data Siswa dan Data Kelas

## Perubahan yang Dilakukan

### 1. Halaman Absensi (absensi.html & js/absensi.js)

#### Dropdown Kelas Dinamis
- Dropdown kelas sekarang diisi secara dinamis dari data kelas yang tersedia
- Fungsi `populateKelasDropdown()` mengambil data dari `AttendanceStore.getAllKelas()`
- Jika tidak ada kelas, akan menampilkan "Belum ada kelas"

#### Dropdown Mapel Dinamis
- Dropdown mata pelajaran sekarang diisi secara dinamis dari data mapel
- Fungsi `populateMapelDropdown()` mengambil data dari `AttendanceStore.getAllMapel()`
- Jika tidak ada mapel, akan menampilkan "Belum ada mapel"

#### Daftar Siswa Dinamis Berdasarkan Kelas
- Daftar siswa di halaman absensi sekarang dirender secara dinamis
- Fungsi `renderStudentList()` memfilter siswa berdasarkan kelas yang dipilih
- Hanya menampilkan siswa dengan status 'active'
- Jika tidak ada siswa di kelas tersebut, menampilkan pesan kosong

#### Filter Kelas Real-time
- Ketika user mengubah dropdown kelas, daftar siswa otomatis terupdate
- Event listener pada `selectKelas.addEventListener('change', ...)`
- Absensi yang sudah tersimpan tetap dipertahankan saat ganti kelas

#### Fungsi Refresh Global
- Menambahkan `window.refreshAbsensiData()` yang bisa dipanggil dari halaman lain
- Fungsi ini akan merender ulang dropdown kelas, mapel, dan daftar siswa

### 2. Data Siswa (js/data-siswa.js)

#### Callback ke Absensi
- Setelah tambah/edit/hapus siswa, memanggil `window.refreshAbsensiData()` jika tersedia
- Memastikan daftar siswa di halaman absensi selalu update

### 3. Data Kelas (js/data-kelas.js)

#### Callback ke Absensi
- Setelah tambah/edit/hapus kelas, memanggil `window.refreshAbsensiData()` jika tersedia
- Memastikan dropdown kelas di halaman absensi selalu update

### 4. Data Mapel (js/mapel.js)

#### Callback ke Absensi
- Setelah tambah/edit/hapus mapel, memanggil `window.refreshAbsensiData()` jika tersedia
- Memastikan dropdown mapel di halaman absensi selalu update

## Cara Kerja Integrasi

### Flow Absensi Normal
1. User membuka halaman absensi
2. `populateKelasDropdown()` mengisi dropdown dengan data kelas aktual
3. `populateMapelDropdown()` mengisi dropdown dengan data mapel aktual
4. `renderStudentList()` menampilkan siswa dari kelas pertama (default)
5. User bisa memilih kelas lain untuk melihat siswa kelas tersebut

### Flow Ganti Kelas
1. User memilih kelas lain dari dropdown
2. Event handler `selectKelas.change` terpicu
3. `currentKelas` diupdate dengan kelas yang dipilih
4. `renderStudentList()` dipanggil untuk render ulang daftar siswa
5. Siswa dari kelas baru ditampilkan dengan status absensi yang tersimpan

### Flow Tambah Siswa Baru
1. User menambah siswa baru di halaman Data Siswa
2. Setelah berhasil, `window.refreshAbsensiData()` dipanggil
3. Jika halaman absensi terbuka, dropdown dan daftar siswa di-refresh
4. Siswa baru langsung muncul di daftar absensi (jika kelasnya sesuai)

### Flow Edit Kelas Siswa
1. User mengubah kelas siswa di halaman Data Siswa
2. Setelah berhasil, `window.refreshAbsensiData()` dipanggil
3. Siswa akan pindah ke kelas baru di halaman absensi
4. Absensi yang sudah tersimpan tetap ada di localStorage

### Flow Tambah/Edit/Hapus Kelas
1. User mengelola data kelas di halaman Data Kelas
2. Setelah berhasil, `window.refreshAbsensiData()` dipanggil
3. Dropdown kelas di halaman absensi otomatis terupdate
4. Jika kelas dihapus, siswa di kelas tersebut tidak akan muncul (karena validasi mencegah hapus kelas yang masih ada siswanya)

### Flow Tambah/Edit/Hapus Mapel
1. User mengelola data mapel di halaman Mapel
2. Setelah berhasil, `window.refreshAbsensiData()` dipanggil
3. Dropdown mapel di halaman absensi otomatis terupdate

## Fitur Tambahan

### Empty State
- Jika tidak ada siswa di kelas yang dipilih, menampilkan pesan:
  - Icon siswa
  - "Tidak ada siswa aktif di kelas ini"
- Statistik absensi tetap menampilkan 0 untuk semua status

### Escape HTML
- Semua nama siswa di-escape untuk mencegah XSS
- Fungsi `escapeHtml()` memastikan keamanan data

### Nomor Urut Otomatis
- Siswa diberi nomor urut otomatis (1, 2, 3, ...)
- Nomor urut berdasarkan urutan di array, bukan ID siswa

## Keuntungan Integrasi

1. **Data Konsisten**: Absensi selalu menampilkan data siswa dan kelas terbaru
2. **Fleksibel**: Admin bisa mengelola siswa/kelas/mapel tanpa khawatir absensi rusak
3. **Real-time Update**: Perubahan di satu halaman langsung terlihat di halaman lain
4. **User-Friendly**: Dropdown otomatis terisi, tidak perlu hardcode
5. **Scalable**: Mudah menambah kelas/siswa/mapel baru tanpa ubah kode
6. **Filter Otomatis**: Siswa otomatis difilter berdasarkan kelas yang dipilih
7. **Validasi Terintegrasi**: Tidak bisa hapus kelas yang masih ada siswanya

## Catatan Teknis

- Integrasi menggunakan localStorage untuk menyimpan data
- Komunikasi antar halaman menggunakan global function `window.refreshAbsensiData()`
- Semua perubahan data melalui `AttendanceStore` untuk konsistensi
- Filter kelas menggunakan `Array.filter()` untuk performa optimal
- Event listener dibind ulang setiap kali render untuk menghindari memory leak
- Status absensi tersimpan per NIS, jadi tetap valid meskipun siswa pindah kelas

## Struktur Data

### Data Siswa
```javascript
{
  id: 1,
  nama: "Ahmad Ramadhan",
  nis: "REG-5346727236",
  kelas: "7a",  // Kode kelas (bukan nama)
  kelamin: "L",
  status: "active"
}
```

### Data Kelas
```javascript
{
  id: 1,
  nama: "VII-A",  // Nama tampilan
  kode: "7a",     // Kode untuk referensi
  wali: "Ust. Abdullah",
  registrasi: "KLS-5346727236"
}
```

### Data Mapel
```javascript
{
  id: 1,
  mapel: "Fiqih",
  guru: "Ust. Abdullah",
  start: "07:00",
  end: "08:30",
  hari: "senin kamis",
  kelas: "VII-A"
}
```

### Data Absensi (localStorage)
```javascript
// Key: "absensi_YYYY-MM-DD"
{
  "REG-5346727236": "h",  // h=Hadir, i=Izin, s=Sakit, a=Alpha
  "REG-8291450378": "i",
  "REG-1748362950": "s"
}
```

## Testing

### Skenario Test
1. ✅ Tambah siswa baru → Muncul di absensi
2. ✅ Edit kelas siswa → Pindah ke kelas baru di absensi
3. ✅ Hapus siswa → Hilang dari absensi
4. ✅ Tambah kelas baru → Muncul di dropdown absensi
5. ✅ Edit nama kelas → Nama terupdate di dropdown
6. ✅ Hapus kelas (tanpa siswa) → Hilang dari dropdown
7. ✅ Ganti kelas di dropdown → Daftar siswa berubah
8. ✅ Absensi tersimpan saat ganti kelas → Data tidak hilang
9. ✅ Tambah mapel baru → Muncul di dropdown absensi
10. ✅ Edit/hapus mapel → Dropdown terupdate

## Troubleshooting

### Siswa tidak muncul di absensi
- Pastikan siswa memiliki status 'active'
- Pastikan kode kelas siswa sesuai dengan kode kelas yang ada
- Cek console untuk error JavaScript

### Dropdown kelas kosong
- Pastikan ada data kelas di localStorage
- Cek `AttendanceStore.getAllKelas()` di console
- Refresh halaman untuk reload data

### Absensi hilang saat ganti kelas
- Ini normal, absensi disimpan per tanggal dan NIS
- Ganti kembali ke kelas sebelumnya untuk lihat absensi
- Data tersimpan di localStorage dengan key `absensi_YYYY-MM-DD`
