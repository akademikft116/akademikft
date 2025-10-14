// --- Inisialisasi Supabase (PASTIKAN KUNCI INI SAMA DI index.html/dashboard.html) ---
const SUPABASE_URL = "https://bnslruddgegoeexbjwgr.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuc2xydWRkZ2Vnb2VleGJqd2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODkyMTMsImV4cCI6MjA3NTQ2NTIxM30.V50LK0cosSOdZEpU96A5CM41vzapQJoB1MvJkPQE03o";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const tabelBody = document.querySelector("#tabelJadwal tbody");
let semuaData = [];
let tomSelectInstances = {}; // Untuk menyimpan instance TomSelect


// --- Fungsi Logout (BARU) ---
async function logout() {
    if (!confirm("Apakah Anda yakin ingin keluar?")) return;
    const { error } = await supabase.auth.signOut();
    if (!error) {
        // Arahkan ke halaman login
        window.location.href = "index.html"; 
    } else {
        console.error("Gagal logout:", error);
        alert("Gagal logout. Coba lagi.");
    }
}


// --- Load data saat halaman dibuka ---
window.onload = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Silakan login dulu!");
        // Jika belum login, redirect ke halaman login
        window.location.href = "index.html";
        return;
    }

    // Panggil fungsi untuk mengisi dropdown dan inisialisasi TomSelect
    await populateDropdowns();
    await loadData();
};


// --- Ambil data jadwal dari Supabase ---
async function loadData() {
    tabelBody.innerHTML = '<tr><td colspan="13" class="text-center py-4 text-blue-500 font-semibold"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat data...</td></tr>';
    
    const { data: authUser } = await supabase.auth.getUser();
    const currentUserId = authUser.user.id;

    let query = supabase.from("jadwal").select("*");
    
    // **PENTING: Hanya tampilkan data milik user yang sedang login (RLS)**
    query = query.eq("user_id", currentUserId);
    
    // Terapkan Filter
    const filterProdi = document.getElementById("filterProdi")?.value;
    const filterSemester = document.getElementById("filterSemester")?.value;
    const filterKelas = document.getElementById("filterKelas")?.value;
    const filterMataKuliah = document.getElementById("filterMataKuliah")?.value;
    const filterDosen = document.getElementById("filterDosen")?.value;
    const filterTahun = document.getElementById("filterTahun")?.value;

    if (filterProdi) query = query.eq("prodi", filterProdi);
    if (filterSemester) query = query.eq("semester", filterSemester);
    if (filterKelas) query = query.eq("kelas", filterKelas);
    if (filterMataKuliah) query = query.eq("mata_kuliah", filterMataKuliah);
    if (filterDosen) query = query.eq("dosen", filterDosen);
    if (filterTahun) query = query.eq("tahun_akademik", filterTahun);

    const { data, error } = await query.order("hari", { ascending: true }).order("jam_mulai", { ascending: true });
    
    if (error) {
        console.error(error);
        tabelBody.innerHTML = `<tr><td colspan="13" class="text-center py-4 text-red-500">❌ Gagal memuat data: ${error.message}</td></tr>`;
        return;
    }
    
    semuaData = data;
    tampilkanData(data);
}


// --- Tampilkan data ke tabel ---
function tampilkanData(data) {
    tabelBody.innerHTML = "";
    if (data.length === 0) {
        tabelBody.innerHTML = '<tr><td colspan="13" class="text-center py-4 text-gray-500">Tidak ada data jadwal tersedia.</td></tr>';
        return;
    }
    
    const prodiColors = {
        'Industri': 'bg-teal-50',
        'Sipil': 'bg-orange-50',
        'Informatika': 'bg-violet-50',
        'Elektro': 'bg-red-50',
        'Mesin': 'bg-blue-50',
    };
    
    data.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.className = `${prodiColors[row.prodi] || 'bg-white'} hover:bg-gray-100 transition duration-150`;
        
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${index + 1}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${row.prodi}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${row.semester}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${row.kelas}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${row.hari}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${row.jam_mulai} - ${row.jam_selesai}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${row.jenis === 'Teori' ? 'text-blue-600' : 'text-green-600'}">${row.jenis}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${row.mata_kuliah}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${row.dosen}</td>
            <td class="px-6 py-4 text-sm text-gray-700">${row.asisten || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">${row.ruangan}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${row.tahun_akademik}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editJadwal(${row.id})" class="text-indigo-600 hover:text-indigo-900 mr-2"><i class="fa-solid fa-edit"></i> Edit</button>
                <button onclick="hapusJadwal(${row.id})" class="text-red-600 hover:text-red-900"><i class="fa-solid fa-trash"></i> Hapus</button>
            </td>
        `;
        tabelBody.appendChild(tr);
    });
}


// --- Isi Dropdown (Termasuk TomSelect) ---
async function populateDropdowns() {
    const dropdowns = {
        prodi: 'prodi', semester: 'semester', kelas: 'kelas', hari: 'hari', ruangan: 'ruangan',
        mata_kuliah: 'matakuliah', dosen: 'dosen', asisten: 'asisten', tahun_akademik: 'tahun_akademik'
    };
    
    const filterDropdowns = {
        filterProdi: 'prodi', filterSemester: 'semester', filterKelas: 'kelas', 
        filterTahun: 'tahun_akademik'
    };

    // Data dari tabel lookup (asumsi tabel sudah ada)
    const lookupTables = {
        prodi: { table: 'prodi', column: 'nama_prodi' },
        semester: { table: 'semester', column: 'nama_semester' },
        kelas: { table: 'kelas', column: 'nama_kelas' },
        hari: { table: 'hari', column: 'nama_hari' },
        ruangan: { table: 'ruangan', column: 'nama_ruangan' },
        matakuliah: { table: 'matakuliah', column: 'nama_matakuliah' },
        dosen: { table: 'dosen', column: 'nama_dosen' },
        asisten: { table: 'asisten', column: 'nama_asisten' },
        tahun_akademik: { table: 'tahun_akademik', column: 'nama_tahun' }
    };

    const dataPromises = Object.values(lookupTables).map(async ({ table, column }) => {
        const { data } = await supabase.from(table).select(column).order(column, { ascending: true });
        return { table, data: data ? data.map(item => item[column]) : [] };
    });

    const results = await Promise.all(dataPromises);
    const lookupData = results.reduce((acc, { table, data }) => {
        acc[table] = data;
        return acc;
    }, {});
    
    // Isi Dropdown Biasa (untuk filter standar)
    for (const [id, tableKey] of Object.entries(filterDropdowns)) {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">-- Semua --</option>';
            lookupData[tableKey].forEach(item => {
                select.innerHTML += `<option value="${item}">${item}</option>`;
            });
        }
    }
    
    // Inisialisasi TomSelect untuk Form Tambah/Edit
    const tomSelectFields = ['mata_kuliah', 'dosen', 'asisten'];
    const filterTomSelectFields = ['filterMataKuliah', 'filterDosen'];
    
    // Hancurkan dan inisialisasi ulang TomSelect jika sudah ada
    const destroyTomSelect = (id) => {
        if (tomSelectInstances[id]) {
            tomSelectInstances[id].destroy();
            delete tomSelectInstances[id];
        }
    };
    
    // Inisialisasi TomSelect untuk Form
    tomSelectFields.forEach(id => {
        destroyTomSelect(id);
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            lookupData[id].forEach(item => {
                select.innerHTML += `<option value="${item}">${item}</option>`;
            });
            tomSelectInstances[id] = new TomSelect(`#${id}`, {
                create: false, maxItems: 1, sortField: { field: "text", direction: "asc" }
            });
        }
    });

    // Inisialisasi TomSelect untuk Filter Mata Kuliah dan Dosen
    filterTomSelectFields.forEach(id => {
        destroyTomSelect(id);
        const select = document.getElementById(id);
        const tableKey = id === 'filterMataKuliah' ? 'matakuliah' : 'dosen';
        if (select) {
            select.innerHTML = '<option value="">-- Semua --</option>';
            lookupData[tableKey].forEach(item => {
                select.innerHTML += `<option value="${item}">${item}</option>`;
            });
            tomSelectInstances[id] = new TomSelect(`#${id}`, {
                create: false, maxItems: 1, sortField: { field: "text", direction: "asc" },
                onChange: loadData // Panggil loadData saat filter berubah
            });
        }
    });
    
    // Isi Dropdown Non-TomSelect di Form (Prodi, Semester, Kelas, Hari, Ruangan, Tahun)
    for (const [id, tableKey] of Object.entries(dropdowns)) {
        if (!tomSelectFields.includes(id)) {
             const select = document.getElementById(id);
             if (select) {
                select.innerHTML = '';
                lookupData[tableKey].forEach(item => {
                    select.innerHTML += `<option value="${item}">${item}</option>`;
                });
             }
        }
    }
}


// --- Submit (Tambah/Edit) Form ---
async function submitForm() {
    const id = document.getElementById("jadwal-id").value;
    const isEdit = !!id;

    // Ambil semua nilai dari form
    const formValues = {
        prodi: document.getElementById("prodi").value,
        semester: document.getElementById("semester").value,
        kelas: document.getElementById("kelas").value,
        mata_kuliah: tomSelectInstances['mata_kuliah']?.getValue(), // Ambil nilai dari TomSelect
        dosen: tomSelectInstances['dosen']?.getValue(),
        asisten: tomSelectInstances['asisten']?.getValue() || null, // Opsional
        jenis: document.getElementById("jenis").value,
        hari: document.getElementById("hari").value,
        jam_mulai: document.getElementById("jam_mulai").value,
        jam_selesai: document.getElementById("jam_selesai").value,
        ruangan: document.getElementById("ruangan").value,
        tahun_akademik: document.getElementById("tahun_akademik").value,
    };
    
    // Validasi
    const requiredFields = ['prodi', 'semester', 'kelas', 'mata_kuliah', 'dosen', 'jenis', 'hari', 'jam_mulai', 'jam_selesai', 'ruangan', 'tahun_akademik'];
    for (const field of requiredFields) {
        if (!formValues[field]) {
            alert(`Kolom ${field.replace('_', ' ')} harus diisi!`);
            return;
        }
    }
    
    const { data: authUser } = await supabase.auth.getUser();
    
    if (isEdit) {
        // Logika EDIT
        const { error } = await supabase.from("jadwal")
            .update(formValues)
            .eq("id", id)
            .eq("user_id", authUser.user.id); // RLS: Pastikan hanya user yang bersangkutan yang mengedit
            
        if (error) {
            alert("❌ Gagal memperbarui jadwal: " + error.message);
            console.error(error);
        } else {
            alert("✅ Berhasil diperbarui!");
            resetForm();
            loadData();
        }
    } else {
        // Logika TAMBAH BARU
        const newRecord = { ...formValues, user_id: authUser.user.id };
        const { error } = await supabase.from("jadwal").insert([newRecord]);
        
        if (error) {
            alert("❌ Gagal menambahkan jadwal: " + error.message);
            console.error(error);
        } else {
            alert("✅ Berhasil ditambahkan!");
            resetForm();
            loadData();
        }
    }
}


// --- Edit Jadwal ---
function editJadwal(id) {
    const row = semuaData.find(r => r.id === id);
    if (!row) return;

    // Isi ID untuk mode edit
    document.getElementById("jadwal-id").value = row.id;
    document.getElementById("form-header").textContent = "Edit Jadwal Kuliah";
    document.getElementById("submit-btn").textContent = "Simpan Perubahan";
    document.getElementById("cancel-btn").style.display = "inline-block";

    // Isi semua field form
    document.getElementById("prodi").value = row.prodi;
    document.getElementById("semester").value = row.semester;
    document.getElementById("kelas").value = row.kelas;
    document.getElementById("jenis").value = row.jenis;
    document.getElementById("hari").value = row.hari;
    document.getElementById("jam_mulai").value = row.jam_mulai;
    document.getElementById("jam_selesai").value = row.jam_selesai;
    document.getElementById("ruangan").value = row.ruangan;
    document.getElementById("tahun_akademik").value = row.tahun_akademik;
    
    // Isi TomSelect
    tomSelectInstances['mata_kuliah']?.setValue(row.mata_kuliah);
    tomSelectInstances['dosen']?.setValue(row.dosen);
    tomSelectInstances['asisten']?.setValue(row.asisten || '');
    
    // Gulir ke atas form
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// --- Reset Form ---
function resetForm() {
    document.getElementById("jadwal-id").value = "";
    document.getElementById("form-header").textContent = "Tambah Jadwal Baru";
    document.getElementById("submit-btn").textContent = "Tambah Jadwal";
    document.getElementById("cancel-btn").style.display = "none";
    
    // Reset semua input ke nilai default (kosong/pilihan pertama)
    document.getElementById("jadwal-form").reset(); 
    
    // Reset TomSelect secara manual
    tomSelectInstances['mata_kuliah']?.setValue('');
    tomSelectInstances['dosen']?.setValue('');
    tomSelectInstances['asisten']?.setValue('');
}


// --- Hapus jadwal ---
async function hapusJadwal(id) {
    if (!confirm("Yakin ingin menghapus jadwal ini?")) return;
    
    const { data: authUser } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("jadwal")
        .delete()
        .eq("id", id)
        .eq("user_id", authUser.user.id); // RLS: Pastikan hanya user yang bersangkutan yang menghapus
        
    if (error) {
        alert("❌ Gagal menghapus: " + error.message);
        console.error(error);
    } else {
        alert("✅ Berhasil dihapus!");
        loadData();
    }
}


// --- Export ke Excel ---
function exportExcel() {
    const dataToExport = semuaData.map(row => ({
        Prodi: row.prodi,
        Semester: row.semester,
        Kelas: row.kelas,
        'Mata Kuliah': row.mata_kuliah,
        Dosen: row.dosen,
        Asisten: row.asisten || '-',
        Jenis: row.jenis,
        Hari: row.hari,
        'Jam Mulai': row.jam_mulai,
        'Jam Selesai': row.jam_selesai,
        Ruangan: row.ruangan,
        Tahun: row.tahun_akademik
    }));
    
    if (dataToExport.length === 0) {
        alert("Tidak ada data yang bisa diekspor.");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal_Kuliah");
    XLSX.writeFile(wb, "jadwal_kuliah_ft.xlsx");
}


// --- Export ke PDF ---
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape'); 
    
    const head = [
        ['Prodi', 'Smt', 'Kls', 'Hari', 'Jam', 'Jenis', 'Mata Kuliah', 'Dosen', 'Asisten', 'Ruangan', 'Tahun']
    ];
    
    const body = semuaData.map(row => [
        row.prodi, row.semester, row.kelas, row.hari, 
        `${row.jam_mulai}-${row.jam_selesai}`, row.jenis, row.mata_kuliah, 
        row.dosen, row.asisten || '-', row.ruangan, row.tahun_akademik
    ]);
    
    if (body.length === 0) {
        alert("Tidak ada data yang bisa diekspor.");
        return;
    }
    
    const prodiColor = {
        header: [30, 60, 110], // Biru Tua
        text: 255,
    };
    
    // Teks Header PDF
    doc.setFontSize(16);
    doc.text("JADWAL PERKULIAHAN FAKULTAS TEKNIK", 150, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Total Jadwal: ${body.length}`, 150, 22, { align: 'center' });

    // AutoTable
    doc.autoTable({
        head: head,
        body: body,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
        margin: { left: 5, right: 5 }, 
        headStyles: { 
            fillColor: prodiColor.header, 
            textColor: prodiColor.text, 
            fontStyle: 'bold', 
            halign: 'center' 
        },
        columnStyles: {
            0: { cellWidth: 15 }, 1: { cellWidth: 10 }, 2: { cellWidth: 10 }, 
            3: { cellWidth: 15 }, 4: { cellWidth: 20 }, 5: { cellWidth: 10 }, 
            6: { cellWidth: 40, halign: 'left' }, 7: { cellWidth: 35, halign: 'left' }, 
            8: { cellWidth: 30, halign: 'left' }, 9: { cellWidth: 20 }, 10: { cellWidth: 15 }, 
        },
    });

    doc.save('jadwal_kuliah_ft.pdf');
}
