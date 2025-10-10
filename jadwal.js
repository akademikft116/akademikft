// --- Inisialisasi Supabase ---
const SUPABASE_URL = "https://bnslruddgegoeexbjwgr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc2xydWRkZ2Vnb2VleGJqd2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODkyMTMsImV4cCI6MjA3NTQ2NTIxM30.V50LK0cosSOdZEpU96A5CM41vzapQJoB1MvJkPQE03o";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tabelBody = document.querySelector("#tabelJadwal tbody");
let semuaData = [];
let dataYangDitampilkan = []; // Variabel untuk menampung data yang sudah difilter

// --- Peta Warna Prodi ke Tailwind CSS Class (Untuk tampilan tabel) ---
function getRowColorClass(prodi) {
  switch (prodi.toLowerCase()) {
    case 'industri':
      return 'bg-red-200 hover:bg-red-300 text-red-800'; // Merah
    case 'sipil':
      return 'bg-blue-200 hover:bg-blue-300 text-blue-800'; // Biru
    case 'arsitektur':
      return 'bg-green-200 hover:bg-green-300 text-green-800'; // Hijau
    case 'elektro':
      return 'bg-amber-200 hover:bg-amber-300 text-amber-800'; // Coklat/Amber (Pilihan terdekat di Tailwind)
    case 'informatika':
      return 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'; // Kuning
    default:
      return 'bg-white hover:bg-gray-100 text-gray-800'; // Default
  }
}

// Tambahkan Peta Warna untuk Export (RGB/Hex) sesuai permintaan baru
const COLOR_MAP = {
  // Industri (Merah)
  "Industri": { 
    pdfRgb: [255, 102, 102], // Light Red
    excelBgHex: "FF6666", 
    excelTextHex: "000000"  // Teks Hitam
  }, 
  // Sipil (Biru)
  "Sipil": { 
    pdfRgb: [135, 206, 250], // Light Sky Blue 
    excelBgHex: "87CEFA",    
    excelTextHex: "000000"   
  },
  // Arsitektur (Hijau)
  "Arsitektur": { 
    pdfRgb: [144, 238, 144], // Light Green
    excelBgHex: "90EE90", 
    excelTextHex: "000000"
  },
  // Elektro (Coklat)
  "Elektro": { 
    pdfRgb: [210, 180, 140], // Tan/Light Brown
    excelBgHex: "D2B48C", 
    excelTextHex: "000000"
  },
  // Informatika (Kuning)
  "Informatika": { 
    pdfRgb: [255, 255, 0], // Yellow
    excelBgHex: "FFFF00", 
    excelTextHex: "000000"
  },
};

const filterProdiSelect = document.getElementById("filterProdi");
const exportExcelBtn = document.getElementById("exportExcelBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");


// --- Load data saat halaman dibuka ---
window.onload = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    alert("Silakan login dulu!");
    window.location.href = "index.html";
    return;
  }
  await loadData();
  toggleExportButtons(filterProdiSelect.value); 
};


// --- Ambil data jadwal dari Supabase ---
async function loadData() {
  const { data, error } = await supabase.from("jadwal").select("*").order("id", { ascending: true });
  if (error) {
    console.error(error);
    alert("Gagal memuat data");
    return;
  }
  semuaData = data;
  dataYangDitampilkan = data; // Inisialisasi data yang ditampilkan dengan semua data
  tampilkanData(dataYangDitampilkan);
}

// --- Tampilkan data ke tabel (Diperbarui untuk warna baris) ---
function tampilkanData(data) {
  tabelBody.innerHTML = "";
  if (data.length === 0) {
    tabelBody.innerHTML = '<tr><td colspan="13" class="px-3 py-4 text-center text-gray-500">Tidak ada data jadwal untuk prodi yang difilter.</td></tr>';
    return;
  }
  
  data.forEach((row, index) => {
    // Panggil fungsi untuk mendapatkan kelas warna berdasarkan prodi
    const colorClass = getRowColorClass(row.prodi);

    const tr = document.createElement("tr");
    // Terapkan kelas warna ke baris tabel
    tr.className = `${colorClass} border-b border-gray-200`; 
    tr.innerHTML = `
      <td class="px-3 py-4 whitespace-nowrap text-center">${index + 1}</td>
      <td class="px-3 py-4 whitespace-nowrap">${row.kode_matkul || '-'}</td>
      <td class="px-3 py-4 whitespace-nowrap">${row.prodi || '-'}</td>
      <td class="px-3 py-4 whitespace-nowrap">${row.hari || '-'}</td>
      <td class="px-3 py-4 whitespace-nowrap">${row.jam_mulai || '-'} - ${row.jam_akhir || '-'}</td>
      <td class="px-3 py-4 whitespace-nowrap font-medium">${row.mata_kuliah || '-'}</td>
      <td class="px-3 py-4 whitespace-nowrap text-center">${row.sks || 0}</td>
      <td class="px-3 py-4 whitespace-nowrap">${row.dosen || '-'}</td>
      <td class="px-3 py-4 whitespace-nowrap">${row.asisten || '-'}</td>
      <td class="px-3 py-4 whitespace-nowrap text-center">${row.semester || '-'}</td>
      <td class="px-3 py-4 whitespace-nowrap text-center">${row.kelas || '-'}</td>
      <td class="px-3 py-4 whitespace-nowrap">${row.ruangan || '-'}</td>
      <td class="px-3 py-4 whitespace-nowrap">
        <button onclick="bukaEditModal(${row.id})" class="text-indigo-600 hover:text-indigo-900 text-sm">Edit</button>
        <button onclick="hapusJadwal(${row.id})" class="text-red-600 hover:text-red-900 text-sm ml-2">Hapus</button>
      </td>
    `;
    tabelBody.appendChild(tr);
  });
}

// --- Tambah jadwal ---
async function tambahJadwal() {
  const data = {
    kode_matkul: document.getElementById("kode_matkul").value,
    prodi: document.getElementById("prodi").value,
    hari: document.getElementById("hari").value,
    jam_mulai: document.getElementById("jam_mulai").value,
    jam_akhir: document.getElementById("jam_akhir").value,
    mata_kuliah: document.getElementById("mata_kuliah").value,
    sks: parseInt(document.getElementById("sks").value) || 0,
    dosen: document.getElementById("dosen").value,
    asisten: document.getElementById("asisten").value,
    semester: document.getElementById("semester").value,
    kelas: document.getElementById("kelas").value,
    ruangan: document.getElementById("ruangan").value,
  };

  if (!data.kode_matkul || !data.prodi || !data.hari || !data.jam_mulai || !data.mata_kuliah || !data.ruangan) {
    alert("Kolom Kode Matkul, Prodi, Hari, Jam Mulai, Mata Kuliah, dan Ruangan wajib diisi!");
    return;
  }

  const { error } = await supabase.from("jadwal").insert([data]);
  if (error) {
    console.error(error);
    alert("Gagal menambahkan jadwal");
  } else {
    alert("Jadwal berhasil ditambahkan!");
    document.getElementById("kode_matkul").value = "";
    document.getElementById("prodi").value = "";
    document.getElementById("hari").value = "";
    document.getElementById("jam_mulai").value = "";
    document.getElementById("jam_akhir").value = "";
    document.getElementById("mata_kuliah").value = "";
    document.getElementById("sks").value = "";
    document.getElementById("dosen").value = "";
    document.getElementById("asisten").value = "";
    document.getElementById("semester").value = "";
    document.getElementById("kelas").value = "";
    document.getElementById("ruangan").value = "";
    loadData();
  }
}

// --- Buka modal edit ---
function bukaEditModal(id) {
  const row = semuaData.find(r => r.id === id);
  if (!row) return;

  document.getElementById("edit_id").value = id;
  document.getElementById("edit_kode_matkul").value = row.kode_matkul || '';
  document.getElementById("edit_prodi").value = row.prodi || '';
  document.getElementById("edit_hari").value = row.hari || '';
  document.getElementById("edit_jam_mulai").value = row.jam_mulai || '';
  document.getElementById("edit_jam_akhir").value = row.jam_akhir || '';
  document.getElementById("edit_mata_kuliah").value = row.mata_kuliah || '';
  document.getElementById("edit_sks").value = row.sks || 0;
  document.getElementById("edit_dosen").value = row.dosen || '';
  document.getElementById("edit_asisten").value = row.asisten || '';
  document.getElementById("edit_semester").value = row.semester || '';
  document.getElementById("edit_kelas").value = row.kelas || '';
  document.getElementById("edit_ruangan").value = row.ruangan || '';

  document.getElementById("editModal").classList.remove("hidden");
  document.getElementById("editModal").classList.add("flex");
}

// --- Tutup modal edit ---
function tutupEditModal() {
  document.getElementById("editModal").classList.add("hidden");
  document.getElementById("editModal").classList.remove("flex");
}

// --- Simpan hasil edit ---
async function simpanEdit() {
  const id = document.getElementById("edit_id").value;
  const data = {
    kode_matkul: document.getElementById("edit_kode_matkul").value,
    prodi: document.getElementById("edit_prodi").value,
    hari: document.getElementById("edit_hari").value,
    jam_mulai: document.getElementById("edit_jam_mulai").value,
    jam_akhir: document.getElementById("edit_jam_akhir").value,
    mata_kuliah: document.getElementById("edit_mata_kuliah").value,
    sks: parseInt(document.getElementById("edit_sks").value) || 0,
    dosen: document.getElementById("edit_dosen").value,
    asisten: document.getElementById("edit_asisten").value,
    semester: document.getElementById("edit_semester").value,
    kelas: document.getElementById("edit_kelas").value,
    ruangan: document.getElementById("edit_ruangan").value,
  };

  const { error } = await supabase.from("jadwal").update(data).eq("id", id);
  if (error) {
    console.error(error);
    alert("Gagal memperbarui jadwal");
  } else {
    alert("Berhasil diperbarui");
    tutupEditModal();
    loadData();
  }
}

// --- Hapus jadwal ---
async function hapusJadwal(id) {
  if (!confirm("Yakin ingin menghapus jadwal ini?")) return;
  const { error } = await supabase.from("jadwal").delete().eq("id", id);
  if (error) {
    console.error(error);
    alert("Gagal menghapus");
  } else {
    alert("Berhasil dihapus");
    loadData();
  }
}

// --- Fungsi untuk mengaktifkan/menonaktifkan tombol export ---
function toggleExportButtons(prodiFilter) {
  const isProdiSelected = prodiFilter && prodiFilter !== "";
  
  if (isProdiSelected) {
    exportExcelBtn.disabled = false;
    exportPdfBtn.disabled = false;
    exportExcelBtn.textContent = `Export Excel (${prodiFilter} Berwarna)`;
    exportPdfBtn.textContent = `Export PDF (${prodiFilter} Berwarna)`;
    exportExcelBtn.classList.remove('disabled:opacity-50');
    exportPdfBtn.classList.remove('disabled:opacity-50');
  } else {
    exportExcelBtn.disabled = true;
    exportPdfBtn.disabled = true;
    exportExcelBtn.textContent = `Export Excel (Pilih Prodi)`;
    exportPdfBtn.textContent = `Export PDF (Pilih Prodi)`;
    exportExcelBtn.classList.add('disabled:opacity-50');
    exportPdfBtn.classList.add('disabled:opacity-50');
  }
}

// --- Filter data berdasarkan prodi ---
function filterData() {
  const filter = document.getElementById("filterProdi").value;
  // Memfilter data dan menyimpan hasilnya ke dataYangDitampilkan
  dataYangDitampilkan = filter ? semuaData.filter(row => row.prodi === filter) : semuaData;
  tampilkanData(dataYangDitampilkan);
  toggleExportButtons(filter); // Panggil fungsi baru
}

// --- Export ke Excel dengan Warna Berdasarkan Prodi ---
function exportExcelByProdi() {
  const prodi = filterProdiSelect.value;
  if (!prodi || dataYangDitampilkan.length === 0) {
    return alert("Pilih satu Prodi dan pastikan ada data untuk dieksport.");
  }
  
  const warna = COLOR_MAP[prodi];
  if (!warna) {
     return alert(`Peta warna untuk prodi ${prodi} tidak ditemukan.`);
  }

  const dataBersih = dataYangDitampilkan.map(row => ({
    "Kode": row.kode_matkul || '-',
    "Prodi": row.prodi || '-',
    "Hari": row.hari || '-',
    "Mulai": row.jam_mulai || '-',
    "Akhir": row.jam_akhir || '-',
    "Mata Kuliah": row.mata_kuliah || '-',
    "SKS": row.sks || 0,
    "Dosen": row.dosen || '-',
    "Asisten": row.asisten || '-',
    "Semester": row.semester || '-',
    "Kelas": row.kelas || '-',
    "Ruangan": row.ruangan || '-',
  }));
  
  const ws = XLSX.utils.json_to_sheet(dataBersih); 
  const range = XLSX.utils.decode_range(ws['!ref']);

  // Terapkan warna ke setiap sel data
  for (let R = range.s.r + 1; R <= range.e.r; ++R) { // Mulai dari baris data (R=1)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({c:C, r:R});
      if (ws[cell_address]) {
        ws[cell_address].s = {
          font: { color: { rgb: warna.excelTextHex }, bold: (C === 2) }, 
          fill: { fgColor: { rgb: warna.excelBgHex } }                   
        };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Jadwal_${prodi}`);
  XLSX.writeFile(wb, `jadwal_${prodi.toLowerCase()}_berwarna.xlsx`);
  alert(`Data ${prodi} berhasil dieksport ke Excel dengan pewarnaan!`);
}

// --- Export ke PDF dengan Warna Berdasarkan Prodi ---
function exportPDFByProdi() {
  const prodi = filterProdiSelect.value;
  if (!prodi || dataYangDitampilkan.length === 0) {
    return alert("Pilih satu Prodi dan pastikan ada data untuk dieksport.");
  }

  const warna = COLOR_MAP[prodi];
  if (!warna) {
     return alert(`Peta warna untuk prodi ${prodi} tidak ditemukan.`);
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4'); // 'l' untuk landscape

  // 1. Proses data untuk format tabel
  const dataPDF = dataYangDitampilkan.map((row, index) => [
    index + 1, 
    row.kode_matkul || '-', row.prodi || '-', row.hari || '-', row.jam_mulai || '-', 
    row.jam_akhir || '-', row.mata_kuliah || '-', row.sks || 0, row.dosen || '-', 
    row.asisten || '-', row.semester || '-', row.kelas || '-', row.ruangan || '-',
  ]);
  
  // 2. Definisikan Header Kolom
  const headers = [
      "No", "Kode", "Prodi", "Hari", "Mulai", "Akhir", "Mata Kuliah", 
      "SKS", "Dosen", "Asisten", "Semester", "Kelas", "Ruangan"
  ];

  doc.setFontSize(14);
  doc.text(`Jadwal Kuliah Prodi ${prodi} (Berwarna)`, 14, 15);
  
  // 3. Buat Tabel menggunakan autoTable dengan pewarnaan
  doc.autoTable({
    head: [headers],
    body: dataPDF,
    startY: 20, 
    theme: 'grid',
    styles: { 
        fontSize: 7, 
        cellPadding: 1.5, 
        halign: 'left',
        textColor: [0, 0, 0] // Teks hitam
    },
    headStyles: { 
        fillColor: [200, 200, 200], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold', 
        halign: 'center' 
    },
    bodyStyles: {
         // Latar belakang sel diwarnai sesuai prodi
         fillColor: warna.pdfRgb, 
         textColor: [0, 0, 0] 
    },
    columnStyles: {
        0: { halign: 'center', cellWidth: 8 }, 1: { halign: 'center', cellWidth: 15 }, 
        3: { halign: 'center', cellWidth: 15 }, 4: { halign: 'center', cellWidth: 15 }, 
        5: { halign: 'center', cellWidth: 15 }, 7: { halign: 'center', cellWidth: 10 }, 
        10: { halign: 'center', cellWidth: 15 }, 11: { halign: 'center', cellWidth: 15 }, 
        12: { halign: 'center', cellWidth: 15 }, 
        2: { halign: 'left', cellWidth: 25 }, 6: { halign: 'left', cellWidth: 45 }, 
        8: { halign: 'left', cellWidth: 35 }, 9: { halign: 'left', cellWidth: 35 }, 
    },
    margin: { top: 18, left: 5, right: 5, bottom: 5 },
  });
  
  doc.save(`jadwal_${prodi.toLowerCase()}_berwarna.pdf`);
  alert(`File PDF ${prodi} berhasil dibuat dengan pewarnaan!`);
}


// --- Logout ---
async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error(error);
    alert("Gagal logout");
  } else {
    window.location.href = "index.html";
  }
}
