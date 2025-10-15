// --- Inisialisasi Supabase ---
const SUPABASE_URL = "https://bnslruddgegoeexbjwgr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc2xydWRkZ2Vnb2VleGJqd2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODkyMTMsImV4cCI6MjA3NTQ2NTIxM30.V50LK0cosSOdZEpU96A5CM41vzapQJoB1MvJkPQE03o";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// --- Variabel Global TomSelect & Data (BARU DITAMBAHKAN) ---
let tsMataKuliah;
let tsEditMataKuliah;
let tsFilterMataKuliah; 
let tsFilterDosen; 
let mataKuliahData = []; 

const tabelBody = document.querySelector("#tabelJadwal tbody");
let semuaData = []; 
let dataYangDitampilkan = []; // Digunakan untuk keperluan Export

// --- FUNGSI Memuat opsi pilihan dan inisialisasi Tom Select (BARU DITAMBAHKAN) ---
async function loadReferences() {
    // 1. Ambil dan Inisialisasi Mata Kuliah (TomSelect)
    const { data: mkData, error: mkError } = await supabase
        .from('matakuliah')
        .select('kode, nama')
        .order('kode', { ascending: true }); 

    if (mkError) {
        console.error('Gagal memuat data Mata Kuliah:', mkError);
        if (typeof showToast === 'function') showToast("Gagal memuat data Mata Kuliah", 'error'); 
    } else {
        mataKuliahData = mkData; 
        const tomSelectOptions = mkData.map(item => ({
            value: item.kode + ' | ' + item.nama, 
            text: item.kode + ' | ' + item.nama, 
            kode: item.kode,
            nama: item.nama
        }));

        // TomSelect untuk Form Tambah
        tsMataKuliah = new TomSelect('#kode_matkul_search', {
            valueField: 'value',
            labelField: 'text',
            searchField: ['kode', 'nama'], 
            options: tomSelectOptions,
            placeholder: 'Cari Kode atau Nama Mata Kuliah',
            render: {
                option: (data, escape) => `<div><span class="font-bold">${escape(data.kode)}</span> | ${escape(data.nama)}</div>`,
                item: (data, escape) => `<div>${escape(data.text)}</div>`
            }
        });
        
         // TomSelect untuk Form Edit
        tsEditMataKuliah = new TomSelect('#edit_kode_matkul_search', {
            valueField: 'value',
            labelField: 'text',
            searchField: ['kode', 'nama'], 
            options: tomSelectOptions,
            placeholder: 'Cari Kode atau Nama Mata Kuliah',
            render: {
                option: (data, escape) => `<div><span class="font-bold">${escape(data.kode)}</span> | ${escape(data.nama)}</div>`,
                item: (data, escape) => `<div>${escape(data.text)}</div>`
            }
        });
        
        // TomSelect untuk Filter Mata Kuliah
        const filterOptionsMk = [{ value: '', text: 'Semua Mata Kuliah', kode: '', nama: '' }, ...tomSelectOptions];
        
        tsFilterMataKuliah = new TomSelect('#filterMataKuliah', {
            valueField: 'value',
            labelField: 'text',
            searchField: ['kode', 'nama'], 
            options: filterOptionsMk,
            placeholder: 'Semua Mata Kuliah',
             plugins: ['dropdown_input'],
            render: {
                option: (data, escape) => `<div><span class="font-bold">${escape(data.kode)}</span> | ${escape(data.nama)}</div>`,
                item: (data, escape) => `<div>${escape(data.text)}</div>`
            },
            onInitialize: function() {
                this.setValue(''); 
            }
        });
    }
    
    // 2. Ambil dan Inisialisasi Dosen, Asisten, Kelas, Ruangan, Tahun Akademik
    const references = [
        { table: 'dosen', elementId: 'dosen', editElementId: 'edit_dosen', column: 'nama', defaultText: 'Pilih Dosen', isFilter: true, filterElementId: 'filterDosen', filterDefaultText: 'Semua Dosen', isTomSelectFilter: true }, 
        { table: 'asisten', elementId: 'asisten', editElementId: 'edit_asisten', column: 'nama', defaultText: 'Pilih Asisten' },
        { table: 'kelas', elementId: 'kelas', editElementId: 'edit_kelas', column: 'nama', defaultText: 'Pilih Kelas', isFilter: true, filterElementId: 'filterKelas', filterDefaultText: 'Semua Kelas' },
        { table: 'ruangan', elementId: 'ruangan', editElementId: 'edit_ruangan', column: 'nama', defaultText: 'Pilih Ruangan' },
    ];
    
    const populateSelect = (elementId, dataArray, defaultText, isFilter = false) => {
        const selectElement = document.getElementById(elementId);
        if (!selectElement) return; 
        
        selectElement.innerHTML = `<option value="" ${isFilter ? '' : 'disabled selected'}>${defaultText}</option>`;
        
        dataArray.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            selectElement.appendChild(option);
        });
    };

    for (const ref of references) {
        const { data, error } = await supabase
            .from(ref.table)
            .select(ref.column)
            .order(ref.column, { ascending: true }); 

        if (error) {
            console.error(`Gagal memuat data ${ref.table}:`, error);
            continue;
        }

        const dataValues = data.map(item => item[ref.column]);
        
        populateSelect(ref.elementId, dataValues, ref.defaultText); 
        if (ref.editElementId) {
            populateSelect(ref.editElementId, dataValues, ref.defaultText);
        }

        // Populasikan dan inisialisasi TomSelect untuk filter Dosen
        if (ref.isFilter && ref.isTomSelectFilter) {
            const filterOptionsDosen = [{ value: '', text: 'Semua Dosen' }, ...dataValues.map(v => ({ value: v, text: v }))];
            
            tsFilterDosen = new TomSelect('#filterDosen', {
                valueField: 'value',
                labelField: 'text',
                searchField: ['text'], 
                options: filterOptionsDosen,
                placeholder: 'Semua Dosen',
                plugins: ['dropdown_input'],
                onInitialize: function() {
                    this.setValue(''); 
                }
            });
        } else if (ref.isFilter) {
            populateSelect(ref.filterElementId, dataValues, ref.filterDefaultText, true);
        }
    }
    
    // 3. Isi Tahun Akademik
    const tahunAkademikOptions = [
        '2025/2026 Ganjil', '2024/2025 Genap', '2024/2025 Ganjil', 
        '2023/2024 Genap', '2023/2024 Ganjil', '2022/2023 Genap', '2022/2023 Ganjil'
    ].sort((a, b) => b.localeCompare(a)); 

    const taDefaultText = 'Pilih Tahun Akademik';
    const taFilterDefaultText = 'Semua Tahun Akademik';

    populateSelect('tahun_akademik', tahunAkademikOptions, taDefaultText); 
    populateSelect('edit_tahun_akademik', tahunAkademikOptions, taDefaultText);
    populateSelect('filterTahunAkademik', tahunAkademikOptions, taFilterDefaultText, true);
}


// --- GANTI: window.onload lama diganti agar memanggil loadReferences ---
window.onload = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
        if (typeof showToast === 'function') showToast("Silakan login dulu!", 'error'); 
        window.location.href = "index.html";
        return;
    }
    
    await loadReferences(); // MEMUAT OPSI DAN TOM SELECT
    
    // Inisialisasi TomSelect untuk Dosen dan Asisten (form tambah)
    new TomSelect("#dosen", { create: true, sortField: { field: "text", direction: "asc" } });
    new TomSelect("#asisten", { create: true, sortField: { field: "text", direction: "asc" } });
    
    loadData();
};


// --- Ambil data jadwal dari Supabase (TETAP) ---
async function loadData() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  const { data, error } = await supabase
    .from("jadwal")
    .select("*")
    .eq("user_id", user.id)
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    if (typeof showToast === 'function') showToast("Gagal memuat data", 'error'); 
    return;
  }
  semuaData = data;
  tampilkanData(semuaData);
}

// --- Tampilkan data ke tabel HTML (TETAP) ---
function tampilkanData(data) {
  dataYangDitampilkan = data; 
  
  tabelBody.innerHTML = "";
  data.forEach((row, index) => {
    const prodiClass = row.prodi ? `row-${row.prodi.replace(/\s/g, '')}` : ''; 
    const tr = document.createElement("tr");
    tr.classList.add("border-b", prodiClass);
    tr.innerHTML = `
      <td class="border px-2 py-1 text-center">${index + 1}</td>
      <td class="border px-2 py-1 text-center">${row.tahun_akademik || "-"}</td> 
      <td class="border px-2 py-1 text-center">${row.kode_matkul || "-"}</td>
      <td class="border px-2 py-1 text-left">${row.prodi || "-"}</td>
      <td class="border px-2 py-1 text-center">${row.hari || "-"}</td>
      <td class="border px-2 py-1 text-center">${row.jam_mulai || "-"}</td>
      <td class="border px-2 py-1 text-center">${row.jam_akhir || "-"}</td>
      <td class="border px-2 py-1 text-left">${row.mata_kuliah || "-"}</td>
      <td class="border px-2 py-1 text-center">${row.sks || "-"}</td>
      <td class="border px-2 py-1 text-left">${row.dosen || "-"}</td>
      <td class="border px-2 py-1 text-left">${row.asisten || "-"}</td>
      <td class="border px-2 py-1 text-center">${row.semester || "-"}</td>
      <td class="border px-2 py-1 text-center">${row.kelas || "-"}</td>
      <td class="border px-2 py-1 text-center">${row.ruangan || "-"}</td>
      <td class="border px-2 py-1 text-center">
        <button onclick="editJadwal(${row.id})" class="bg-yellow-400 px-2 py-1 rounded text-gray-800">Edit</button>
        <button onclick="hapusJadwal(${row.id})" class="bg-red-500 text-white px-2 py-1 rounded ml-1">Hapus</button>
      </td>
    `;
    tabelBody.appendChild(tr);
  });
}

// --- Tambah Jadwal (Diperbarui untuk menggunakan Tom Select) ---
async function simpanJadwal() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    if (typeof showToast === 'function') showToast("Kamu belum login!", 'error'); 
    window.location.href = "index.html";
    return;
  }
  
  // Ambil nilai dari TomSelect Mata Kuliah
  const mkValue = tsMataKuliah.getValue();
  
  if (!mkValue) {
      if (typeof showToast === 'function') showToast("Pilih Kode/Mata Kuliah terlebih dahulu!", 'warning');
      return;
  }
  
  const [kode, nama] = mkValue.split(' | ').map(s => s.trim());
  
  const prodi = document.getElementById("prodi").value;
  const hari = document.getElementById("hari").value;
  
  // Ambil nilai dari SELECT biasa untuk Dosen & Asisten
  const dosen = document.getElementById("dosen").value; 
  const asisten = document.getElementById("asisten").value;
  
  const semester = document.getElementById("semester").value;
  const kelas = document.getElementById("kelas").value;
  const ruangan = document.getElementById("ruangan").value;
  const sks = document.getElementById("sks").value;
  const tahun_akademik = document.getElementById("tahun_akademik").value; 

  if (!prodi || !hari || !semester || !dosen || !kelas || !ruangan || !sks || !tahun_akademik) {
    if (typeof showToast === 'function') showToast("Semua kolom wajib diisi!", 'warning'); 
    return;
  }

  const jadwal = {
    user_id: user.id, 
    kode_matkul: kode, 
    mata_kuliah: nama, 
    prodi: prodi,
    hari: hari,
    jam_mulai: document.getElementById("jam_mulai").value,
    jam_akhir: document.getElementById("jam_akhir").value,
    sks: parseInt(sks),
    dosen: dosen,
    asisten: asisten,
    semester: semester,
    kelas: kelas,
    ruangan: ruangan,
    tahun_akademik: tahun_akademik,
  };

  const { error } = await supabase.from("jadwal").insert([jadwal]);
  if (error) {
    console.error(error);
    if (typeof showToast === 'function') showToast("Gagal menambah jadwal: " + error.message, 'error'); 
  } else {
    if (typeof showToast === 'function') showToast("Jadwal berhasil ditambahkan!", 'success'); 
    
    // Reset form
    if(tsMataKuliah) tsMataKuliah.setValue(''); 
    // Reset select biasa yang diinisialisasi TomSelect di onload
    const dosenSelect = document.getElementById("dosen");
    if(dosenSelect && dosenSelect.tomselect) dosenSelect.tomselect.setValue(''); 
    const asistenSelect = document.getElementById("asisten");
    if(asistenSelect && asistenSelect.tomselect) asistenSelect.tomselect.setValue('');

    document.getElementById("sks").value = '';
    document.getElementById("jam_mulai").value = '';
    document.getElementById("jam_akhir").value = '';
    document.getElementById("prodi").value = '';
    document.getElementById("hari").value = '';
    document.getElementById("semester").value = '';
    document.getElementById("kelas").value = '';
    document.getElementById("ruangan").value = '';
    document.getElementById("tahun_akademik").value = '';
    loadData();
  }
}

// --- GANTI: Fungsi editJadwal lama diganti dengan fungsi Modal (BARU) ---
function editJadwal(id) {
    const row = semuaData.find(r => r.id === id);
    if (!row) return if (typeof showToast === 'function') showToast("Data tidak ditemukan.", 'error'); 

    // Nilai yang akan di-set di TomSelect: "KODE | NAMA"
    const mkValueToSelect = (row.kode_matkul && row.mata_kuliah) 
                            ? `${row.kode_matkul} | ${row.mata_kuliah}` 
                            : '';
    
    // Set nilai di TomSelect
    if (tsEditMataKuliah) {
        tsEditMataKuliah.clear(); 
        
        if (mkValueToSelect && tsEditMataKuliah.options.hasOwnProperty(mkValueToSelect)) {
             tsEditMataKuliah.setValue(mkValueToSelect);
        } else if (mkValueToSelect) {
            // Tambahkan opsi sementara jika tidak ada di list master
            tsEditMataKuliah.addOption({ value: mkValueToSelect, text: mkValueToSelect, kode: row.kode_matkul, nama: row.mata_kuliah });
            tsEditMataKuliah.setValue(mkValueToSelect);
        }
    }

    // Isi form modal
    document.getElementById('edit_id').value = row.id;
    document.getElementById('edit_prodi').value = row.prodi || '';
    document.getElementById('edit_hari').value = row.hari || '';
    document.getElementById('edit_jam_mulai').value = row.jam_mulai || '';
    document.getElementById('edit_jam_akhir').value = row.jam_akhir || '';
    document.getElementById('edit_sks').value = row.sks || '';
    
    document.getElementById('edit_dosen').value = row.dosen || ''; 
    document.getElementById('edit_asisten').value = row.asisten || '';
    
    document.getElementById('edit_semester').value = row.semester || '';
    document.getElementById('edit_kelas').value = row.kelas || '';
    document.getElementById('edit_ruangan').value = row.ruangan || '';
    document.getElementById('edit_tahun_akademik').value = row.tahun_akademik || '';

    // Menampilkan Modal
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editModal').classList.add('flex'); 
}

// --- FUNGSI Update Jadwal (BARU) ---
async function updateJadwal() {
    const id = document.getElementById('edit_id').value;
    
    // Ambil nilai dari TomSelect Edit (KODE | NAMA)
    const mkValue = tsEditMataKuliah.getValue();
    if (!mkValue) {
         if (typeof showToast === 'function') showToast("Pilih Kode/Mata Kuliah terlebih dahulu!", 'warning');
         return;
    }
    const [kode, nama] = mkValue.split(' | ').map(s => s.trim());


    const updatedJadwal = {
        kode_matkul: kode, 
        mata_kuliah: nama, 
        prodi: document.getElementById('edit_prodi').value,
        hari: document.getElementById('edit_hari').value,
        jam_mulai: document.getElementById('edit_jam_mulai').value,
        jam_akhir: document.getElementById('edit_jam_akhir').value,
        sks: parseInt(document.getElementById('edit_sks').value) || 0,
        dosen: document.getElementById('edit_dosen').value,
        asisten: document.getElementById('edit_asisten').value,
        semester: document.getElementById('edit_semester').value,
        kelas: document.getElementById('edit_kelas').value,
        ruangan: document.getElementById('edit_ruangan').value,
        tahun_akademik: document.getElementById('edit_tahun_akademik').value, 
    };
    
    if (!updatedJadwal.prodi || !updatedJadwal.hari || !updatedJadwal.mata_kuliah || !updatedJadwal.tahun_akademik) {
        if (typeof showToast === 'function') showToast("Kolom wajib diisi!", 'warning'); 
        return;
    }


    const { error } = await supabase
        .from("jadwal")
        .update(updatedJadwal)
        .eq("id", id);
        
    if (error) {
        console.error("Error update:", error);
        if (typeof showToast === 'function') showToast("Gagal memperbarui jadwal: " + error.message, 'error'); 
    } else {
        if (typeof showToast === 'function') showToast("Jadwal berhasil diperbarui!", 'success'); 
        
        document.getElementById('editModal').classList.add('hidden');
        document.getElementById('editModal').classList.remove('flex');
        loadData();
    }
}


// --- Hapus jadwal (TETAP) ---
async function hapusJadwal(id) {
  if (!confirm("Yakin ingin menghapus jadwal ini?")) return; 
  
  const { error } = await supabase.from("jadwal").delete().eq("id", id);
  if (error) if (typeof showToast === 'function') showToast("Gagal menghapus jadwal", 'error'); 
  else {
    if (typeof showToast === 'function') showToast("Jadwal berhasil dihapus!", 'success'); 
    loadData();
  }
}

// --- Filter data (Diperbarui untuk menggunakan Tom Select) ---
function filterData() {
    const filterProdi = document.getElementById("filterProdi").value;
    const filterSemester = document.getElementById("filterSemester").value;
    const filterKelas = document.getElementById("filterKelas").value;
    
    // Ambil nilai filter dari TomSelect Mata Kuliah & Dosen
    const filterMataKuliahRaw = tsFilterMataKuliah ? tsFilterMataKuliah.getValue() : "";
    const filterDosenRaw = tsFilterDosen ? tsFilterDosen.getValue() : "";
    
    let filterMataKuliah = "";
    // Jika nilai yang dipilih bukan "Semua Mata Kuliah" (yaitu kosong), ambil NAMA mata kuliah (nama ada di indeks 1)
    if(filterMataKuliahRaw !== "") {
        filterMataKuliah = filterMataKuliahRaw.split(' | ')[1].trim(); 
    }

    const filterDosen = filterDosenRaw; 
    
    const filterTahunAkademik = document.getElementById("filterTahunAkademik").value;

    let hasilFilter = semuaData.filter(row => {
        const rowProdi = String(row.prodi || '');
        const rowSemester = String(row.semester || '');
        const rowKelas = String(row.kelas || '');
        const rowMataKuliah = String(row.mata_kuliah || ''); 
        const rowDosen = String(row.dosen || '');             
        const rowTahunAkademik = String(row.tahun_akademik || '');

        const matchProdi = !filterProdi || rowProdi === filterProdi;
        const matchSemester = !filterSemester || rowSemester === filterSemester; 
        const matchKelas = !filterKelas || rowKelas === filterKelas; 
        const matchMataKuliah = !filterMataKuliah || rowMataKuliah === filterMataKuliah; 
        const matchDosen = !filterDosen || rowDosen === filterDosen;                     
        const matchTahunAkademik = !filterTahunAkademik || rowTahunAkademik === filterTahunAkademik;

        return matchProdi && matchSemester && matchKelas && matchTahunAkademik && matchMataKuliah && matchDosen;
    });
    
    tampilkanData(hasilFilter);
}

// --- Export ke Excel (TETAP) ---
function exportExcel() {
  const dataBersih = dataYangDitampilkan.map(row => ({
    "Tahun Akademik": row.tahun_akademik || '-',
    "Kode Matkul": row.kode_matkul || '-',
    "Prodi": row.prodi || '-',
    "Hari": row.hari || '-',
    "Jam Mulai": row.jam_mulai || '-',
    "Jam Akhir": row.jam_akhir || '-',
    "Mata Kuliah": row.mata_kuliah || '-',
    "SKS": row.sks || 0,
    "Dosen": row.dosen || '-',
    "Asisten": row.asisten || '-',
    "Semester": row.semester || '-',
    "Kelas": row.kelas || '-',
    "Ruangan": row.ruangan || '-',
  }));
  
  const ws = XLSX.utils.json_to_sheet(dataBersih); 
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jadwal_Terfilter");
  XLSX.writeFile(wb, "jadwal_kuliah.xlsx");
  if (typeof showToast === 'function') showToast("Data berhasil diexport ke Excel!", 'info');
}

// --- Export ke PDF (TETAP) ---
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4'); 
  const docWidth = doc.internal.pageSize.getWidth(); 

  if (dataYangDitampilkan.length === 0) {
      if (typeof showToast === 'function') showToast("Tidak ada data terfilter untuk diekspor!", 'info'); 
      return;
  }
  
  // Ambil filter yang tersisa dari SELECT biasa
  const filterProdi = document.getElementById("filterProdi").value;
  const filterKelas = document.getElementById("filterKelas").value;
  const filterTahunAkademik = document.getElementById("filterTahunAkademik").value;
  
  let prodiJudul = filterProdi || "SEMUA PRODI";
  let kelasJudul = filterKelas || "MULTIPLE KELAS";
  let tahunAkademikJudul = filterTahunAkademik || "SEMUA TAHUN AKADEMIK"; 

  function getProdiColors(prodi) {
      switch (prodi) {
          case 'Industri': return { header: [231, 76, 60], text: [255, 255, 255], background: [252, 235, 235] }; 
          case 'Sipil': return { header: [52, 152, 219], text: [255, 255, 255], background: [235, 245, 251] }; 
          case 'Arsitektur': return { header: [39, 174, 96], text: [255, 255, 255], background: [234, 247, 238] }; 
          case 'Elektro': return { header: [180, 100, 50], text: [255, 255, 255], background: [250, 235, 215] }; 
          case 'Informatika': return { header: [241, 196, 15], text: [0, 0, 0], background: [255, 251, 230] }; 
          default: return { header: [52, 73, 94], text: [255, 255, 255], background: [240, 240, 240] };
      }
  }
  
  const prodiColor = getProdiColors(filterProdi || null);

  const dataPDF = dataYangDitampilkan.map((row, index) => [
    index + 1, row.tahun_akademik || '-', row.kode_matkul || '-', row.prodi || '-', row.hari || '-', 
    row.jam_mulai || '-', row.jam_akhir || '-', row.mata_kuliah || '-', row.sks || 0, row.dosen || '-', 
    row.asisten || '-', row.semester || '-', row.kelas || '-', row.ruangan || '-',
  ]);
  
  const headers = [
      "No", "Tahun Akademik", "Kode", "Prodi", "Hari", "Mulai", "Akhir", "Mata Kuliah", 
      "SKS", "Dosen", "Asisten", "Semester", "Kelas", "Ruangan"
  ];

  const lineHeight = 5; 
  let currentY = 15; 
  
  const mainTitle = "JADWAL PERKULIAHAN";
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const mainTitleWidth = doc.getStringUnitWidth(mainTitle) * doc.internal.getFontSize() / doc.internal.scaleFactor;
  const mainTitleX = (docWidth - mainTitleWidth) / 2; 
  doc.text(mainTitle, mainTitleX, currentY); 
  currentY += lineHeight;

  const subTitle1 = `TAHUN AKADEMIK: ${tahunAkademikJudul.toUpperCase()}`;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const subTitle1Width = doc.getStringUnitWidth(subTitle1) * doc.internal.getFontSize() / doc.internal.scaleFactor;
  const subTitle1X = (docWidth - subTitle1Width) / 2; 
  doc.text(subTitle1, subTitle1X, currentY); 
  currentY += lineHeight;

  const subTitle2 = `PROGRAM STUDI : ${prodiJudul.toUpperCase()} (${kelasJudul.toUpperCase()})`;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const subTitle2Width = doc.getStringUnitWidth(subTitle2) * doc.internal.getFontSize() / doc.internal.scaleFactor;
  const subTitle2X = (docWidth - subTitle2Width) / 2;
  doc.text(subTitle2, subTitle2X, currentY); 
  currentY += lineHeight + 3; 

  doc.autoTable({
    head: [headers],
    body: dataPDF,
    startY: currentY, 
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, halign: 'left' },
    margin: { left: 5, right: 5 }, 
    headStyles: { 
        fillColor: prodiColor.header, 
        textColor: prodiColor.text, 
        fontStyle: 'bold', 
        halign: 'center' 
    },
    columnStyles: {
        0: { halign: 'center', cellWidth: 7 }, 1: { halign: 'center', cellWidth: 20 }, 
        2: { halign: 'center', cellWidth: 15 }, 4: { halign: 'center', cellWidth: 15 }, 
        5: { halign: 'center', cellWidth: 15 }, 6: { halign: 'center', cellWidth: 15 }, 
        8: { halign: 'center', cellWidth: 10 }, 11: { halign: 'center', cellWidth: 15 }, 
        12: { halign: 'center', cellWidth: 15 }, 13: { halign: 'center', cellWidth: 15 }, 
        3: { halign: 'left', cellWidth: 25 }, 7: { halign: 'left', cellWidth: 40 }, 
        9: { halign: 'left', cellWidth: 30 }, 10: { halign: 'left', cellWidth: 30 }, 
    },
    didParseCell: function (data) {
        if (data.section === 'body') { 
            const prodi = data.row.raw[3]; 
            const rowColors = getProdiColors(prodi);
            data.cell.styles.fillColor = rowColors.background;
        }
    },
  });
  
  doc.save(`jadwal_kuliah_${prodiJudul.replace(/\s/g, '_')}_${tahunAkademikJudul.replace(/\s/g, '_')}.pdf`);
  if (typeof showToast === 'function') showToast("File PDF berhasil dibuat!", 'success'); 
}
