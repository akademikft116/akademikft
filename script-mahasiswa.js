// === FILTER DAN PENCARIAN ===
let allMahasiswa = [];

async function loadMahasiswaData() {
  const { data, error } = await supabaseClient.from('mahasiswa').select('*').order('nama');
  const tbody = document.getElementById('mahasiswaTable');
  tbody.innerHTML = '';

  if (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-500 p-4">Gagal memuat data.</td></tr>`;
    return;
  }

  allMahasiswa = data || [];

  // Populate filter tahun hanya sekali
  const tahunSelect = document.getElementById('filterTahun');
  const tahunUnik = [...new Set(allMahasiswa.map(m => m.tahunmasuk).filter(Boolean))].sort((a,b)=>b-a);
  tahunSelect.innerHTML = '<option value="">Semua Tahun</option>' + tahunUnik.map(t => `<option value="${t}">${t}</option>`).join('');

  renderTable(allMahasiswa);
}

function renderTable(data) {
  const tbody = document.getElementById('mahasiswaTable');
  tbody.innerHTML = '';
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-500 p-4">Tidak ada data ditemukan.</td></tr>`;
    return;
  }

  data.forEach(mhs => {
    const row = `
      <tr>
        <td class="p-2">${mhs.npm || '-'}</td>
        <td class="p-2">${mhs.nama || '-'}</td>
        <td class="p-2">${mhs.prodi || '-'}</td>
        <td class="p-2 text-center">${mhs.kelas || '-'}</td>
        <td class="p-2 text-center">${mhs.tahunmasuk || '-'}</td>
        <td class="p-2 text-center">${mhs.status || '-'}</td>
        <td class="p-2 text-center">
          <button onclick="editMahasiswa('${mhs.id}')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"><i class="fas fa-edit"></i></button>
          <button onclick="deleteMahasiswa('${mhs.id}')" class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });
}

function applyFilters() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const tahun = document.getElementById('filterTahun').value;
  const status = document.getElementById('filterStatus').value;

  let filtered = allMahasiswa;

  if (keyword) {
    filtered = filtered.filter(m =>
      (m.nama && m.nama.toLowerCase().includes(keyword)) ||
      (m.npm && m.npm.toLowerCase().includes(keyword))
    );
  }

  if (tahun) filtered = filtered.filter(m => m.tahunmasuk == tahun);
  if (status) filtered = filtered.filter(m => m.status == status);

  renderTable(filtered);
}
