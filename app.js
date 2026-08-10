let myChart = null;
let globalData = []; // Menyimpan semua data komputasi

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

// --- LOGIKA TAB NAVIGASI ---
const btnTabUpload = document.getElementById('btnTabUpload');
const btnTabManual = document.getElementById('btnTabManual');
const uploadSection = document.getElementById('uploadSection');
const manualSection = document.getElementById('manualSection');

btnTabUpload.addEventListener('click', () => {
    btnTabUpload.classList.add('active');
    btnTabManual.classList.remove('active');
    uploadSection.classList.add('active-section');
    manualSection.classList.remove('active-section');
});

btnTabManual.addEventListener('click', () => {
    btnTabManual.classList.add('active');
    btnTabUpload.classList.remove('active');
    manualSection.classList.add('active-section');
    uploadSection.classList.remove('active-section');
});

// --- LOGIKA UPLOAD FILE ---
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);
        
        // Format ulang data dari excel ke array global
        rawJson.forEach(row => {
            globalData.push({
                'Nama Produk': row['Nama Produk'] || 'Produk X',
                'Biaya Iklan': parseFloat(String(row['Biaya Iklan'] || 0).replace(/[^\d]/g, '')) || 0,
                'Penjualan Iklan': parseFloat(String(row['Penjualan Iklan'] || 0).replace(/[^\d]/g, '')) || 0,
                'Dilihat': parseInt(row['Dilihat']) || 0,
                'Jumlah Klik': parseInt(row['Jumlah Klik']) || 0,
                'Pesanan': parseInt(row['Pesanan']) || 0
            });
        });
        
        kalkulasiDanRender();
    };
    reader.readAsArrayBuffer(file);
});

// --- LOGIKA INPUT MANUAL ---
document.getElementById('manualForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Mencegah halaman reload
    
    // Ambil data dari form
    const newData = {
        'Nama Produk': document.getElementById('m_nama').value,
        'Biaya Iklan': parseFloat(document.getElementById('m_biaya').value) || 0,
        'Penjualan Iklan': parseFloat(document.getElementById('m_penjualan').value) || 0,
        'Dilihat': parseInt(document.getElementById('m_dilihat').value) || 0,
        'Jumlah Klik': parseInt(document.getElementById('m_klik').value) || 0,
        'Pesanan': parseInt(document.getElementById('m_pesanan').value) || 0
    };

    // Masukkan ke database lokal dan update layar
    globalData.push(newData);
    kalkulasiDanRender();
    
    // Kosongkan form setelah input
    this.reset();
    document.getElementById('m_nama').focus();
});

// --- LOGIKA RESET DATA ---
document.getElementById('btnReset').addEventListener('click', function() {
    globalData = []; // Kosongkan array
    kalkulasiDanRender();
});

// --- MESIN KALKULASI UTAMA ---
function kalkulasiDanRender() {
    let totalBiaya = 0, totalPenjualan = 0;
    let totalKlik = 0, totalPesanan = 0, totalDilihat = 0;
    
    let labels = [];
    let roasData = [];

    globalData.forEach(row => {
        totalBiaya += row['Biaya Iklan'];
        totalPenjualan += row['Penjualan Iklan'];
        totalDilihat += row['Dilihat'];
        totalKlik += row['Jumlah Klik'];
        totalPesanan += row['Pesanan'];

        let namaProduk = row['Nama Produk'].substring(0, 15) + (row['Nama Produk'].length > 15 ? '...' : '');
        let roas = row['Biaya Iklan'] > 0 ? (row['Penjualan Iklan'] / row['Biaya Iklan']) : 0;
        
        // Catat untuk grafik (hanya produk yang keluar biaya)
        if(row['Biaya Iklan'] > 0) {
            labels.push(namaProduk);
            roasData.push(roas.toFixed(2));
        }
    });

    // Update KPI di Layar
    const avgRoas = totalBiaya > 0 ? (totalPenjualan / totalBiaya) : 0;
    const avgKonversi = totalKlik > 0 ? (totalPesanan / totalKlik) * 100 : 0;

    document.getElementById('totalBiaya').innerText = formatRp(totalBiaya);
    document.getElementById('totalPenjualan').innerText = formatRp(totalPenjualan);
    document.getElementById('avgRoas').innerText = avgRoas.toFixed(2) + "x";
    document.getElementById('avgKonversi').innerText = avgKonversi.toFixed(2) + "%";

    renderChart(labels, roasData);
}

// --- RENDER GRAFIK TAMPILAN ---
function renderChart(labels, data) {
    const ctx = document.getElementById('roasChart').getContext('2d');
    
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Efektivitas Iklan (ROAS)',
                data: data,
                backgroundColor: '#EE4D2D',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Performa ROAS per Produk', color: '#fff' }, legend: { labels: { color: '#fff' } } },
            scales: {
                y: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
                x: { ticks: { color: '#aaa' }, grid: { display: false } }
            }
        }
    });
}
