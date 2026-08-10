let myChart = null;

// Fungsi Format Rupiah
const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

// Event Listener Upload File
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        
        // Ambil sheet pertama
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert ke JSON
        const rawJson = XLSX.utils.sheet_to_json(worksheet);
        prosesData(rawJson);
    };
    reader.readAsArrayBuffer(file);
});

function prosesData(data) {
    let totalBiaya = 0, totalPenjualan = 0;
    let totalKlik = 0, totalPesanan = 0, totalDilihat = 0;
    
    let labels = [];
    let roasData = [];

    // Algoritma Pembersihan & Kalkulasi 2026
    data.forEach(row => {
        // Ambil nilai, bersihkan format koma/titik bawaan ekspor jika perlu
        let biaya = parseFloat(String(row['Biaya Iklan'] || 0).replace(/[^\d]/g, '')) || 0;
        let penjualan = parseFloat(String(row['Penjualan Iklan'] || 0).replace(/[^\d]/g, '')) || 0;
        let dilihat = parseInt(row['Dilihat']) || 0;
        let klik = parseInt(row['Jumlah Klik']) || 0;
        let pesanan = parseInt(row['Pesanan']) || 0;

        totalBiaya += biaya;
        totalPenjualan += penjualan;
        totalDilihat += dilihat;
        totalKlik += klik;
        totalPesanan += pesanan;

        let namaProduk = row['Nama Produk'] ? row['Nama Produk'].substring(0, 15) + '...' : 'Produk X';
        let roas = biaya > 0 ? (penjualan / biaya) : 0;
        
        // Hanya ambil produk dengan metrik untuk chart
        if(biaya > 0) {
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

    // Render Chart
    renderChart(labels, roasData);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('roasChart').getContext('2d');
    
    if (myChart) myChart.destroy(); // Hapus grafik lama jika upload file baru

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
