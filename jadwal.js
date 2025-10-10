// --- Inisialisasi Supabase ---
const SUPABASE_URL = "https://bnslruddgegoeexbjwgr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc2xydWRkZ2Vnb2VleGJqd2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODkyMTMsImV4cCI6MjA3NTQ2NTIxM30.V50LK0cosSOdZEpU96A5CM41vzapQJoB1MvJkPQE03o";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tabelBody = document.querySelector("#tabelJadwal tbody");
let semuaData = [];

// --- FUNGSI PENTING (getColorClass) ---
function getColorClass(prodi) {
  // Kelas default jika Prodi kosong atau null
  if (!prodi) return 'badge bg-gray-200 text-gray-800';
  
  // Normalisasi string prodi
  const normalizedProdi = prodi.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  // Logika Pencocokan Fleksibel
  if (normalizedProdi.includes('industri')) {
    return 'badge bg-green-100'; // Hijau
  } else if (normalizedProdi.includes('sipil')) {
    return 'badge bg-blue-100'; // Biru
  } else if (normalizedProdi.includes('elektro')) {
    return 'badge bg-yellow-100'; // Kuning
  } else if (normalizedProdi.includes('mesin')) {
    return 'badge bg-red-100'; // Merah
  } else {
    return 'badge bg-purple-100'; // Ungu (Lainnya)
  }
}

// --- Load data saat halaman dibuka ---
window.onload = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    alert("Silakan login dulu!");
    window.location.href = "index.html";
    return;
  }
  loadData();
};

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

// --- Ambil data jadwal dari Supabase ---
async function loadData() {
  const { data, error } = await supabase.from("jadwal").select("*").order("id", { ascending: true });
  if (error) {
    console.error(error);
    alert("Gagal memuat data");
    return;
  }
  semuaData = data;
  tampilkanData(data);
}

// --- Menampilkan data ke tabel ---
function tampilkanData(data) {
  tabelBody.innerHTML = ''; // Kosongkan tabel
  if (data.length === 0) {
    tabelBody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">Tidak ada data jadwal yang ditemukan.</td></tr>';
    return;
  }

  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    
    // Tentukan kelas warna untuk badge prodi
    const prodiClass = getColorClass(row.prodi);
    
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${index + 1}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.kode || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm">
        <span class="${prodiClass}">${row.prodi || 'TIDAK ADA'}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.hari || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.mulai || '-'} - ${row.akhir || '-'}</td>
      <td class="px-6 py-4 whitespace-wrap text-sm text-gray-900 font-medium">${row.mata_kuliah || '-'} <span class="text-xs text-gray-500">(${row.sks || 0} SKS)</span></td>
      <td class="px-6 py-4 whitespace-wrap text-sm text-gray-500">${row.dosen || '-'}<br><span class="text-xs italic">${row.asisten ? `Asisten: ${row.asisten}` : ''}</span></td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.semester || '-'}<br>${row.kelas || '-'}<br>${row.ruangan || '-'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="ubahJadwal(${row.id})" class="text-indigo-600 hover:text-indigo-900 mx-1">Ubah</button>
        <button onclick="hapusJadwal(${row.id})" class="text-red-600 hover:text-red-900 mx-1">Hapus</button>
      </td>
    `;
    tabelBody.appendChild(tr);
  });
}

// --- Tambah Jadwal ---\
async function tambahJadwal() {
  const jadwal = {
    kode: document.getElementById("inputKode").value,
    prodi: document.getElementById("inputProdi").value,
    hari: document.getElementById("inputHari").value,
    mulai: document.getElementById("inputMulai").value,
    akhir: document.getElementById("inputAkhir").value,
    mata_kuliah: document.getElementById("inputMataKuliah").value,
    sks: parseInt(document.getElementById("inputSks").value),
    dosen: document.getElementById("inputDosen").value,
    asisten: document.getElementById("inputAsisten").value || null,
    semester: document.getElementById("inputSemester").value,
    kelas: document.getElementById("inputKelas").value,
    ruangan: document.getElementById("inputRuangan").value,
  };

  if (!jadwal.prodi || !jadwal.hari || !jadwal.mulai || !jadwal.akhir || !jadwal.mata_kuliah) {
    alert("Pastikan kolom Prodi, Hari, Waktu, dan Mata Kuliah terisi.");
    return;
  }
  
  const { error } = await supabase.from("jadwal").insert([jadwal]);
  if (error) alert("Gagal menambah jadwal: " + error.message);
  else {
    alert("Jadwal berhasil ditambahkan!");
    document.getElementById("jadwal-form").reset();
    loadData();
  }
}

// --- Ubah Jadwal (Contoh Sederhana) ---
async function ubahJadwal(id) {
  const row = semuaData.find(r => r.id === id);
  if (!row) return;
  
  const mata_kuliah = prompt("Ubah nama mata kuliah:", row.mata_kuliah);
  if (!mata_kuliah) return;

  // Anda bisa menambahkan prompt/modal untuk mengubah kolom lainnya
  
  const { error } = await supabase.from("jadwal").update({ mata_kuliah }).eq("id", id);
  if (error) alert("Gagal memperbarui jadwal");
  else {
    alert("Berhasil diperbarui");
    loadData();
  }
}

// --- Hapus jadwal ---
async function hapusJadwal(id) {
  if (!confirm("Yakin ingin menghapus jadwal ini?")) return;
  const { error } = await supabase.from("jadwal").delete().eq("id", id);
  if (error) alert("Gagal menghapus");
  else {
    alert("Berhasil dihapus");
    loadData();
  }
}

// --- Filter data berdasarkan prodi ---
function filterData() {
  const filter = document.getElementById("filterProdi").value;
  // Jika filter kosong, tampilkan semua data (semuaData)
  const hasil = filter ? semuaData.filter(row => row.prodi === filter) : semuaData;
  tampilkanData(hasil);
}

// --- Export ke Excel ---
function exportExcel() {
  const dataExport = semuaData.map((row, index) => ({
    No: index + 1,
    Kode: row.kode || '-',
    Prodi: row.prodi || '-', 
    Hari: row.hari || '-',
    Mulai: row.mulai || '-',
    Akhir: row.akhir || '-',
    'Mata Kuliah': row.mata_kuliah || '-',
    SKS: row.sks || 0,
    Dosen: row.dosen || '-',
    Asisten: row.asisten || '-',
    Semester: row.semester || '-',
    Kelas: row.kelas || '-',
    Ruangan: row.ruangan || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(dataExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jadwal");
  XLSX.writeFile(wb, "jadwal_kuliah.xlsx");
}

// --- Export ke PDF ---
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const dataPDF = semuaData.map((row, index) => [
    index + 1,
    row.kode || '-',
    row.prodi || '-', 
    row.hari || '-',
    row.mulai || '-',
    row.akhir || '-',
    row.mata_kuliah || '-',
    row.sks || '-',
    row.dosen || '-',
    row.asisten || '-',
    row.semester || '-',
    row.kelas || '-',
    row.ruangan || '-',
  ]);
  
  const headers = [
      "No", "Kode", "Prodi", "Hari", "Mulai", "Akhir", "Mata Kuliah", 
      "SKS", "Dosen", "Asisten", "Semester", "Kelas", "Ruangan"
  ];

  doc.setFontSize(14);
  doc.text("Jadwal Kuliah", 14, 15);
  
  doc.autoTable({
    head: [headers],
    body: dataPDF,
    startY: 20, 
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'left' },
    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
        0: { halign: 'center', cellWidth: 8 }, 1: { halign: 'center', cellWidth: 15 }, 
        3: { halign: 'center', cellWidth: 15 }, 4: { halign: 'center', cellWidth: 15 }, 
        5: { halign: 'center', cellWidth: 15 }, 7: { halign: 'center', cellWidth: 10 }, 
        10: { halign: 'center', cellWidth: 15 }, 11: { halign: 'center', cellWidth: 15 }, 
        12: { halign: 'center', cellWidth: 15 }
    }
  });

  doc.save('jadwal_kuliah.pdf');
}

// Daftarkan fungsi ke window agar bisa dipanggil dari HTML
window.logout = logout;
window.tambahJadwal = tambahJadwal;
window.ubahJadwal = ubahJadwal;
window.hapusJadwal = hapusJadwal;
window.filterData = filterData;
window.exportExcel = exportExcel;
window.exportPDF = exportPDF;
