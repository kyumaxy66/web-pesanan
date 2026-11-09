let orders = JSON.parse(localStorage.getItem('pesanan_sate_db_v3') || '[]');
let currentFilter = 'today';

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatDateISO(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateIndo(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(dateObj) {
  const h = String(dateObj.getHours()).padStart(2, '0');
  const m = String(dateObj.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateClock() {
  const now = new Date();
  const hari = dayNames[now.getDay()];
  const tgl = String(now.getDate()).padStart(2, '0');
  const bln = monthNames[now.getMonth()];
  const thn = now.getFullYear();
  const jam = formatTime(now);
  const dtk = String(now.getSeconds()).padStart(2, '0');

  document.getElementById('clockDisplay').innerText = `${hari}, ${tgl} ${bln} ${thn} • ${jam}:${dtk}`;
}

function resetPickupDefaults() {
  const now = new Date();
  const targetTime = new Date(now.getTime() + 30 * 60 * 1000);
  document.getElementById('pickupDateInput').value = formatDateISO(now);
  document.getElementById('pickupTimeInput').value = formatTime(targetTime);
}

function setPickupDateOffset(daysOffset) {
  const target = new Date();
  target.setDate(target.getDate() + daysOffset);
  document.getElementById('pickupDateInput').value = formatDateISO(target);
}

function addMinutesToPickup(minutes) {
  const picker = document.getElementById('pickupTimeInput');
  const baseDate = new Date();

  if (picker.value) {
    const parts = picker.value.split(':');
    baseDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0);
  }

  const newTime = new Date(baseDate.getTime() + minutes * 60 * 1000);
  picker.value = formatTime(newTime);
}

function addKg(val) {
  const input = document.getElementById('kgInput');
  const current = parseFloat(input.value) || 0;
  input.value = (current + val).toFixed(1);
}

function setFilter(filterType) {
  currentFilter = filterType;
  document.getElementById('tabToday').classList.toggle('active', filterType === 'today');
  document.getElementById('tabAll').classList.toggle('active', filterType === 'all');
  render();
}

function handleSave() {
  const nameInput = document.getElementById('nameInput');
  const kgInput = document.getElementById('kgInput');
  const dateInput = document.getElementById('pickupDateInput');
  const timeInput = document.getElementById('pickupTimeInput');

  const nama = nameInput.value.trim();
  const berat = parseFloat(kgInput.value);

  // Validasi wajib isi nama
  if (!nama) {
    alert('Nama pemesan harus diisi!');
    nameInput.focus();
    return;
  }

  if (!berat || berat <= 0) {
    alert('Masukkan berat kg yang valid!');
    kgInput.focus();
    return;
  }

  if (!dateInput.value || !timeInput.value) {
    alert('Lengkapi tanggal dan waktu pengambilan!');
    return;
  }

  const now = new Date();
  const item = {
    id: Date.now(),
    namaPemesan: nama,
    tanggalPesan: formatDateISO(now),
    jamPesan: formatTime(now),
    tanggalAmbil: dateInput.value,
    waktuAmbil: timeInput.value,
    beratKg: berat,
    selesai: false
  };

  orders.unshift(item);
  saveToStorage();
  nameInput.value = '';
  kgInput.value = '';
  resetPickupDefaults();
  nameInput.focus();
  render();
}

function toggleSelesai(id) {
  orders = orders.map(o => {
    if (o.id === id) {
      return { ...o, selesai: !o.selesai };
    }
    return o;
  });
  saveToStorage();
  render();
}

function deleteOrder(id) {
  orders = orders.filter(o => o.id !== id);
  saveToStorage();
  render();
}

function saveToStorage() {
  localStorage.setItem('pesanan_sate_db_v3', JSON.stringify(orders));
}

function createOrderCard(order) {
  const container = document.createElement('div');
  container.className = 'swipe-container';

  const isDone = Boolean(order.selesai);
  const nama = escapeHtml(order.namaPemesan);
  const tglPesan = formatDateIndo(order.tanggalPesan);
  const tglAmbil = formatDateIndo(order.tanggalAmbil);
  const berat = order.beratKg.toFixed(1);
  const cardDoneClass = isDone ? 'swipe-card is-done' : 'swipe-card';
  const btnDoneClass = isDone ? 'btn-check done' : 'btn-check';
  const statusText = isDone
    ? `Selesai • ${tglAmbil} (${order.waktuAmbil})`
    : `Ambil: ${tglAmbil} (${order.waktuAmbil})`;

  container.innerHTML = [
    '<div class="swipe-background">Hapus ✕</div>',
    `<div class="${cardDoneClass}" id="card-${order.id}">`,
    '  <div class="card-left">',
    `    <button type="button" class="${btnDoneClass}" onclick="toggleSelesai(${order.id})">✓</button>`,
    '    <div class="item-meta">',
    `      <span class="item-customer">${nama}</span>`,
    `      <span class="item-date-pesan">Dipesan: ${tglPesan} • ${order.jamPesan}</span>`,
    '      <div>',
    `        <span class="badge-pickup">${statusText}</span>`,
    '      </div>',
    '    </div>',
    '  </div>',
    `  <span class="item-weight">${berat} kg</span>`,
    '</div>'
  ].join('\n');

  attachSwipeToDelete(container.querySelector('.swipe-card'), order.id);
  return container;
}

function render() {
  const listEl = document.getElementById('orderList');
  listEl.innerHTML = '';

  const todayISO = formatDateISO(new Date());
  let totalAllToday = 0;
  let remainingPickupToday = 0;
  let activeCountToday = 0;

  orders.forEach(order => {
    if (order.tanggalAmbil === todayISO) {
      totalAllToday += order.beratKg;
      if (!order.selesai) {
        remainingPickupToday += order.beratKg;
        activeCountToday++;
      }
    }
  });

  document.getElementById('todayPickupTotal').innerText = `${remainingPickupToday.toFixed(1)} kg`;
  document.getElementById('todayOrderTotal').innerText = `${totalAllToday.toFixed(1)} kg`;
  document.getElementById('badgeToday').innerText = activeCountToday;
  document.getElementById('badgeAll').innerText = orders.length;

  let filteredOrders = [];
  if (currentFilter === 'today') {
    filteredOrders = orders
      .filter(o => o.tanggalAmbil === todayISO)
      .sort((a, b) => {
        if (Boolean(a.selesai) !== Boolean(b.selesai)) {
          return a.selesai ? 1 : -1;
        }
        return a.waktuAmbil.localeCompare(b.waktuAmbil);
      });
  } else {
    filteredOrders = [...orders].sort((a, b) => {
      if (Boolean(a.selesai) !== Boolean(b.selesai)) {
        return a.selesai ? 1 : -1;
      }
      return b.id - a.id;
    });
  }

  if (filteredOrders.length === 0) {
    const emptyMsg = currentFilter === 'today'
      ? 'Belum ada jadwal ambil untuk hari ini.'
      : 'Belum ada riwayat pesanan.';
    listEl.innerHTML = `<div class="empty-state">${emptyMsg}</div>`;
    return;
  }

  filteredOrders.forEach(order => {
    listEl.appendChild(createOrderCard(order));
  });
}

function attachSwipeToDelete(element, id) {
  let startX = 0;
  let currentX = 0;
  let isSwiping = false;

  element.addEventListener('touchstart', (e) => {
    if (e.target.closest('.btn-check')) return;
    startX = e.touches[0].clientX;
    isSwiping = true;
    element.style.transition = 'none';
  }, { passive: true });

  element.addEventListener('touchmove', (e) => {
    if (!isSwiping) return;
    currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff < 0) {
      element.style.transform = `translateX(${diff}px)`;
    }
  }, { passive: true });

  element.addEventListener('touchend', () => {
    if (!isSwiping) return;
    isSwiping = false;
    element.style.transition = 'transform 0.2s ease-out';
    const diff = currentX - startX;

    if (diff < -100) {
      element.style.transform = 'translateX(-100%)';
      setTimeout(() => deleteOrder(id), 180);
    } else {
      element.style.transform = 'translateX(0)';
    }
  });
}

setInterval(updateClock, 1000);
updateClock();
resetPickupDefaults();
render();