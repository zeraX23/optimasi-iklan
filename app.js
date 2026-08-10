let myChart = null;
let globalData = []; 

const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

// Tab Navigation
const btnTabUpload = document.getElementById('btnTabUpload');
const btnTabManual = document.getElementById('btnTabManual');
const uploadSection = document.getElementById('uploadSection');
const manualSection = document.getElementById('manualSection');

btnTabUpload.addEventListener('click', () => {
    btnTabUpload.classList.add('active'); btnTabManual.classList.remove('active');
    uploadSection.classList.add('active-section'); manualSection.classList.remove('active-section');
});

btnTabManual.addEventListener('click', () => {
    btnTabManual.classList.add('active'); btnTabUpload.classList.remove('active');
    manualSection.classList.add('active-section'); uploadSection.classList.remove('active-section');
});

// File Upload Logic
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);
        
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

// Manual Input Logic
document.getElementById('manualForm').addEventListener('submit', function(e) {
    e.preventDefault(); 
    const newData = {
        'Nama Produk': document.getElementById('m_nama').value,
        'Biaya Iklan': parseFloat(document.getElementById('m_biaya').value) || 0,
        'Penjualan Iklan': parseFloat(document.getElementById('m_penjualan').value) || 0,
        'Dilihat': parseInt(document.getElementById('m_dilihat').value) || 0,
        'Jumlah Klik': parseInt(document.getElementById('m_klik').value) || 0,
        'Pesanan': parseInt(document.getElementById('m_pesanan').value) || 0
    };

    globalData.push(newData);
    kalkulasiDanRender();
    this.reset();
    document.getElementById('m_nama').focus();
});

// Reset Logic
document.getElementById('btnReset').addEventListener('click', function() {
    globalData = []; 
    kalkulasiDanRender();
});

// Main Engine: Calculation & AI Diagnostics
function kalkulasiDanRender() {
    let totalBiaya = 0, totalPenjualan = 0, totalKlik = 0, totalPesanan = 0, totalDilihat = 0;
    let labels = [], roasData = [];
    
    const optPanel = document.getElementById('optimizationPanel');
    optPanel.innerHTML = '<h3>💡 AI Diagnostik & Rekomendasi Optimasi</h3>';

    if(globalData.length === 0) {
        optPanel.innerHTML += '<p style="text-align:center; color:#aaa;">Belum ada data untuk dianalisis.</p>';
        document.getElementById('totalBiaya').innerText = "Rp 0";
        document.getElementById('totalPenjualan').innerText = "Rp 0";
        document.getElementById('avgRoas').innerText = "0x";
        document.getElementById('avgKonversi').innerText = "0%";
        if (myChart) myChart.destroy();
        return;
    }

    globalData.forEach(row => {
        totalBiaya += row['Biaya Iklan'];
        totalPenjualan += row['Penjualan Iklan'];
        totalDilihat += row['Dilihat'];
        totalKlik += row['Jumlah Klik'];
        totalPesanan += row['Pesanan'];

        let namaProduk = row['Nama Produk'].substring(0, 15) + (row['Nama Produk'].length > 15 ? '...' : '');
        let roas = row['Biaya Iklan'] > 0 ? (row['Penjualan Iklan'] / row['Biaya Iklan']) : 0;
        let ctr = row['Dilihat'] > 0 ? (row['Jumlah Klik'] / row['Dilihat']) * 100 : 0;
        let konversi = row['Jumlah Klik'] > 0 ? (row['Pesanan'] / row['Jumlah Klik']) * 100 : 0;
        
        if(row['Biaya Iklan'] > 0) {
            labels.push(namaProduk);
            roasData.push(roas.toFixed(2));
        }

        // --- AI DIAGNOSTIC ALGORITHM ---
        if(row['Biaya Iklan'] > 0 || row['Dilihat'] > 0) {
            let saran = [];
            let statusClass = "opt-neutral";

            // 1. ROAS Check (Kesehatan Keuangan)
            if (roas >= 5) {
                statusClass = "opt-success";
                saran.push("🔥 <b>Winning Product!</b> (ROAS Sangat Baik). Naikkan anggaran harian sebesar 20-30% secara bertahap.");
                saran.push("📈 Pertimbangkan menaikkan bid perlahan untuk mengunci posisi teratas halaman pencarian.");
            } else if (roas > 0 && roas < 3) {
                statusClass = "opt-danger";
                saran.push("⚠️ <b>Iklan Berisiko Boncos</b>. Turunkan harga bid (CPC) pada kata kunci pencarian luas.");
                saran.push("🔍 Gunakan 'Pencarian Spesifik' (Exact Match) pada kata kunci yang paling relevan dengan produk.");
            }

            // 2. CTR Check (Daya Tarik Produk)
            if (row['Dilihat'] > 300 && ctr < 2.0) {
                saran.push("👀 <b>CTR Lemah (" + ctr.toFixed(1) + "%)</b>. Iklan sering dilihat tapi diabaikan. <b>Aksi:</b> Ganti foto utama (thumbnail) lebih menarik atau riset harga kompetitor sebelah.");
            }

            // 3. Conversion Check (Tingkat Penutupan/Closing)
            if (row['Jumlah Klik'] > 20 && konversi < 1.5) {
                if(statusClass !== "opt-danger") statusClass = "opt-warning";
                saran.push("🛒 <b>Konversi Rendah (" + konversi.toFixed(1) + "%)</b>. Pengunjung cuma 'mampir'. <b>Aksi:</b> Perbaiki deskripsi, tambah video ulasan, atau aktifkan promo diskon/voucher.");
            }

            // 4. Traffic Check (Dilihat)
            if (row['Biaya Iklan'] > 0 && row['Dilihat'] < 200) {
                saran.push("📉 <b>Trafik Sepi</b>. <b>Aksi:</b> Tambah variasi kata kunci baru atau naikkan bid sedikit agar iklan mulai berjalan.");
            }

            // Render Card
            if (saran.length > 0) {
                let htmlCard = `
                <div class="opt-card ${statusClass}">
                    <h4>${row['Nama Produk']}</h4>
                    <ul>${saran.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>`;
                optPanel.innerHTML += htmlCard;
            }
        }
    });

    const avgRoas = totalBiaya > 0 ? (totalPenjualan / totalBiaya) : 0;
    const avgKonversi = totalKlik > 0 ? (totalPesanan / totalKlik) * 100 : 0;

    document.getElementById('totalBiaya').innerText = formatRp(totalBiaya);
    document.getElementById('totalPenjualan').innerText = formatRp(totalPenjualan);
    document.getElementById('avgRoas').innerText = avgRoas.toFixed(2) + "x";
    document.getElementById('avgKonversi').innerText = avgKonversi.toFixed(2) + "%";

    renderChart(labels, roasData);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('roasChart').getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Efektivitas Iklan (ROAS)', data: data, backgroundColor: '#EE4D2D', borderRadius: 5 }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Grafik ROAS', color: '#fff' }, legend: { labels: { color: '#fff' } } },
            scales: {
                y: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
                x: { ticks: { color: '#aaa' }, grid: { display: false } }
            }
        }
    });
}
