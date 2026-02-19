// Fungsi untuk mendapatkan greeting berdasarkan waktu
function getGreeting() {
  const hour = new Date().getHours();
  
  if (hour >= 4 && hour < 11) {
    return 'Selamat Pagi!';
  } else if (hour >= 11 && hour < 15) {
    return 'Selamat Siang!';
  } else if (hour >= 15 && hour < 18) {
    return 'Selamat Sore!';
  } else {
    return 'Selamat Malam!';
  }
}

// Update greeting saat halaman dimuat
function updateGreeting() {
  const greetingLabel = document.querySelector('.greeting-label');
  if (greetingLabel) {
    greetingLabel.textContent = getGreeting();
  }
}

// Jalankan saat DOM siap
document.addEventListener('DOMContentLoaded', updateGreeting);

// Update greeting setiap 1 menit untuk memastikan tetap akurat
setInterval(updateGreeting, 60000);
