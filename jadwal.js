// --- Inisialisasi Supabase ---
const SUPABASE_URL = "https://bnslruddgegoeexbjwgr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc2xydWRkZ2Vnb2VleGJqd2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODkyMTMsImV4cCI6MjA3NTQ2NTIxM30.V50LK0cosSOdZEpU96A5CM41vzapQJoB1MvJkPQE03o";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tabelBody = document.querySelector("#tabelJadwal tbody");
let semuaData = [];

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
    const tr = document.createElement("tr");
    tr.classList.add("border-b");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${row.kode_matkul || "-"}</td>
      <td>${row.prodi || "-"}</td>
      <td>${row.hari || "-"}</td>
      <td>${row.jam_mulai || "-"}</td>
      <td>${row.jam_akhir || "-"}</td>
      <td>${row.mata_kuliah || "-"}</td>
      <td>${row.sks || "-"}</td>
      <td>${row.dosen || "-"}</td>
      <td>${row.asisten || "-"}</td>
      <td>${row.semester || "-"}</td>
      <td>${row.kelas || "-"}</td>
      <td>${row.ruangan || "-"}</td>
      <td>
        <button onclick="editJadwal(${row.id})" class="bg-yellow-400 px-2 py-1 rounded">Edit</button>
        <button onclick="hapusJadwal(${row.id})" class="bg-red-500 text-white px-2 py-1 rounded ml-1">Hapus</button>
      </td>
    `;
    tabelBody.appendChild(tr);
  });
}

// --- Tambah jadwal baru ---
async function tambahJadwal(jadwal) {
  const { data, error } = await supabase.from("jadwal").insert([jadwal]);
  if (error) {
    alert("Gagal menambah jadwal");
    console.error(error);
  } else {
    alert("Jadwal berhasil ditambahkan");
    loadData();
  }
}

// --- Edit jadwal (popup sederhana) ---
async function editJadwal(id) {
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
  doc.text("Jadwal Kuliah", 14, 15);
  let y = 25;
  semuaData.forEach((r, i) => {
    doc.text(`${i + 1}. ${r.mata_kuliah || "-"} (${r.prodi || "-"})`, 14, y);
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });
  doc.save("jadwal_kuliah.pdf");
}
