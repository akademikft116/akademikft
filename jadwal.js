// --- Inisialisasi Supabase ---
const SUPABASE_URL = "https://bnslruddgegoeexbjwgr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc2xydWRkZ2Vnb2VleGJqd2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODkyMTMsImV4cCI6MjA3NTQ2NTIxM30.V50LK0cosSOdZEpU96A5CM41vzapQJoB1MvJkPQE03o";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tabelBody = document.querySelector("#tabelJadwal tbody");
let semuaData = [];

// --- FUNGSI PENTING (getColorClass) ---
function getColorClass(prodi) {
  // Kelas default jika Prodi kosong atau null
  if (!prodi) return 'bg-gray-200 text-gray-800 font-medium rounded-md px-2 py-1 inline-block';
  
  // Normalisasi string prodi
  // Menghapus spasi, tanda baca, dan mengubah ke huruf kecil untuk pencocokan maksimal.
  const normalizedProdi = prodi.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  // Logika Pencocokan Fleksibel
  if (normalizedProdi.includes('industri') || normalizedProdi.includes('ti')) {
    return 'bg-red-200 text-red-800 font-medium rounded-md px-2 py-1 inline-block'; // Merah (Industri)
  }
  if (normalizedProdi.includes('sipil') || normalizedProdi.includes('ts')) {
    return 'bg-blue-200 text-blue-800 font-medium rounded-md px-2 py-1 inline-block'; // Biru (Sipil)
  }
  if (normalizedProdi.includes('arsitektur') || normalizedProdi.includes('ta')) {
    return 'bg-green-200 text-green-800 font-medium rounded-md px-2 py-1 inline-block'; // Hijau (Arsitektur)
  }
  if (normalizedProdi.includes('elektro') || normalizedProdi.includes('te')) {
    return 'bg-yellow-200 text-yellow-800 font-medium rounded-md px-2 py-1 inline-block'; // Kuning (Elektro)
  }
  if (normalizedProdi.includes('informatika') || normalizedProdi.includes('if')) {
    return 'bg-purple-200 text-purple-800 font-medium rounded-md px-2 py-1 inline-block'; // Ungu (Informatika)
  }
    
  // Warna default (Abu-abu)
  return 'bg-gray-200 text-gray-800 font-medium rounded-md px-2 py-1 inline-block'; 
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

// --- Ambil data jadwal dari Supabase ---
async function loadData() {
  const { data, error } = await supabase.from("jadwal").select("*").order("id", { ascending: true });
  if (error) {
    console.error(error);
    alert("Gagal memuat data");
    return;
  }
  semuaData = data;
  tampilkanData(semuaData);
}

// --- Tampilkan data ke tabel ---
function tampilkanData(data) {
  tabelBody.innerHTML = "";
  data.forEach((row, index) => {
    // BARIS PENTING: Panggil fungsi warna
    const prodiClass = getColorClass(row.prodi);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="py-2 px-4 border-b text-center">${index + 1}</td>
      <td class="py-2 px-4 border-b text-center">${row.kode || '-'}</td>
      <td class="py-2 px-4 border-b">
        <span class="${prodiClass}">${row.prodi || '-'}</span> </td>
      <td class="py-2 px-4 border-b text-center">${row.hari || '-'}</td>
      <td class="py-2 px-4 border-b text-center">${row.mulai || '-'}</td>
      <td class="py-2 px-4 border-b text-center">${row.akhir || '-'}</td>
      <td class="py-2 px-4 border-b">${row.mata_kuliah || '-'}</td>
      <td class="py-2 px-4 border-b text-center">${row.sks || '-'}</td>
      <td class="py-2 px-4 border-b">${row.dosen || '-'}</td>
      <td class="py-2 px-4 border-b">${row.asisten || '-'}</td>
      <td class="py-2 px-4 border-b text-center">${row.semester || '-'}</td>
      <td class="py-2 px-4 border-b">${row.kelas || '-'}</td>
      <td class="py-2 px-4 border-b">${row.ruangan || '-'}</td>
      <td class="py-2 px-4 border-b text-center">
        <button onclick="ubahJadwal(${row.id})" class="text-blue-600 hover:text-blue-900 font-semibold mx-1">Ubah</button>
        <button onclick="hapusJadwal(${row.id})" class="text-red-600 hover:text-red-900 font-semibold mx-1">Hapus</button>
      </td>
    `;
    tabelBody.appendChild(tr);
  });
}

// --- Tambah jadwal baru ---
async function tambahJadwal() {
  const prodi = document.getElementById("prodi").value;
  const kode = document.getElementById("kode").value;
  const hari = document.getElementById("hari").value;
  const mulai = document.getElementById("mulai").value;
  const akhir = document.getElementById("akhir").value;
  const mata_kuliah = document.getElementById("mata_kuliah").value;
  const sks = document.getElementById("sks").value;
  const dosen = document.getElementById("dosen").value;
  const asisten = document.getElementById("asisten").value;
  const semester = document.getElementById("semester").value;
  const kelas = document.getElementById("kelas").value;
  const ruangan = document.getElementById("ruangan").value;

  if (!prodi || !kode || !hari || !mulai || !akhir || !mata_kuliah || !sks) {
    alert("Pastikan Prodi, Kode, Hari, Waktu Mulai & Akhir, Mata Kuliah, dan SKS terisi.");
    return;
  }

  const { error } = await supabase.from("jadwal").insert([
    { prodi, kode, hari, mulai, akhir, mata_kuliah, sks, dosen, asisten, semester, kelas, ruangan },
  ]);

  if (error) {
    alert("Gagal menambahkan jadwal: " + error.message);
  } else {
    alert("Jadwal berhasil ditambahkan!");
    document.getElementById("jadwal-form").reset();
    loadData();
  }
}

// --- Ubah jadwal (prompt) ---
async function ubahJadwal(id) {
  const row = semuaData.find(r => r.id === id);
  if (!row) return;
  const mata_kuliah = prompt("Ubah nama mata kuliah:", row.mata_kuliah);
  if (!mata_kuliah) return;

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
  const hasil = filter ? semuaData.filter(row => row.prodi === filter) : semuaData;
  tampilkanData(hasil);
}

// --- Export ke Excel ---
function exportExcel() {
  const ws = XLSX.utils.json_to_sheet(semuaData);
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
    },
    didDrawCell: (data) => {
        // Logika pewarnaan di PDF harus dilakukan secara terpisah
    }
  });

  doc.save("jadwal_kuliah.pdf");
}
