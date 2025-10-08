// =================================================================
// 🚨 GANTI DENGAN KUNCI SUPABASE ANDA!
// =================================================================
const SUPABASE_URL = 'GANTI_DENGAN_PROJECT_URL_ANDA'; 
const SUPABASE_ANON_KEY = 'GANTI_DENGAN_ANON_KEY_ANDA';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const JADWAL_TABLE_NAME = 'jadwal_kuliah'; 
// =================================================================

// Variabel Global & Elemen DOM
let dataJadwal = []; 
const jadwalBody = document.getElementById('jadwal-body');
const form = document.getElementById('jadwal-form');
const filterProdiSelect = document.getElementById('filter-prodi');
const batalEditButton = document.getElementById('batal-edit');
const submitButton = document.getElementById('submit-btn');


// --- Helper Functions ---
const getInputValues = () => ({
    // Pastikan semua nama key di sini sama persis dengan nama kolom di Supabase
    kode_matkul: document.getElementById('kode_matkul').value,
    prodi: document.getElementById('prodi').value,
    mata_kuliah: document.getElementById('mata_kuliah').value,
    dosen: document.getElementById('dosen').value,
    asisten: document.getElementById('asisten').value || null,
    // Menggunakan parseFloat agar nilai default 0 jika input kosong, bukan NaN
    sks: parseFloat(document.getElementById('sks').value) || 0, 
    hari: document.getElementById('hari').value,
    jam_mulai: document.getElementById('jam_mulai').value,
    jam_akhir: document.getElementById('jam_akhir').value,
    semester: document.getElementById('semester').value,
    kelas: document.getElementById('kelas').value,
    ruangan: document.getElementById('ruangan').value,
});

const resetForm = () => {
    document.getElementById('jadwal-id').value = '';
    form.reset();
    submitButton.textContent = 'Simpan Jadwal';
    batalEditButton.style.display = 'none';
};

// --- CRUD Functions ---

// READ: Fetch all schedule data
const fetchJadwal = async () => {
    const { data, error } = await supabase
        .from(JADWAL_TABLE_NAME)
        .select('*')
        .order('id', { ascending: true }); 

    if (error) {
        console.error('Error fetching data:', error.message);
        dataJadwal = [];
    } else {
        dataJadwal = data;
    }
    renderJadwal();
};

// CREATE/UPDATE
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = getInputValues();
    const id = document.getElementById('jadwal-id').value;
    
    // Validasi sederhana untuk SKS (mencegah Supabase error jika 0)
    if (data.sks < 1) {
        alert("SKS harus diisi dengan angka minimal 1.");
        return;
    }

    let error = null;

    if (id) {
        // Update logic
        ({ error } = await supabase
            .from(JADWAL_TABLE_NAME)
            .update(data)
            .eq('id', id)); 
        
        if (!error) alert('Jadwal berhasil diperbarui!');
    } else {
        // Create logic
        ({ error } = await supabase
            .from(JADWAL_TABLE_NAME)
            .insert([data])); 

        if (!error) alert('Jadwal berhasil ditambahkan!');
    }
    
    if (error) {
        console.error(`Operation Failed: ${error.message}`);
        alert(`Gagal menyimpan jadwal. Cek console browser untuk detail error. Error: ${error.message.substring(0, 50)}...`);
    }
    
    resetForm();
    await fetchJadwal(); 
});

// DELETE
window.deleteJadwal = async (id) => {
    if (confirm('Yakin ingin menghapus jadwal ini?')) {
        const { error } = await supabase
            .from(JADWAL_TABLE_NAME)
            .delete()
            .eq('id', id); 

        if (error) {
            console.error('Error during delete:', error.message);
            alert('Gagal menghapus jadwal.');
        } else {
            await fetchJadwal(); 
            alert('Jadwal berhasil dihapus!');
        }
    }
};

// --- Rendering, Filtering, Export ---

const renderJadwal = (dataToRender = dataJadwal) => {
    jadwalBody.innerHTML = '';
    
    dataToRender.forEach((jadwal, index) => {
        const row = jadwalBody.insertRow();
        
        // Data Cell Population 
        row.insertCell(0).textContent = index + 1;
        row.insertCell(1).textContent = jadwal.kode_matkul;
        row.insertCell(2).textContent = jadwal.prodi;
        row.insertCell(3).textContent = jadwal.mata_kuliah;
        row.insertCell(4).textContent = jadwal.hari;
        // Hanya ambil jam:menit (5 karakter pertama)
        row.insertCell(5).textContent = `${jadwal.jam_mulai.substring(0, 5)} - ${jadwal.jam_akhir.substring(0, 5)}`; 
        row.insertCell(6).textContent = jadwal.sks;
        row.insertCell(7).textContent = jadwal.dosen;
        row.insertCell(8).textContent = jadwal.asisten || '-';
        row.insertCell(9).textContent = `${jadwal.kelas} / ${jadwal.ruangan}`;
        
        const actionCell = row.insertCell(10);
        actionCell.innerHTML = `
            <button onclick="editJadwal(${jadwal.id})">Edit</button>
            <button onclick="deleteJadwal(${jadwal.id})" style="background-color: #e74c3c;">Hapus</button>
        `;
    });
    
    updateFilterOptions();
};

window.editJadwal = (id) => {
    const jadwal = dataJadwal.find(j => j.id == id);
    if (!jadwal) return;
    
    document.getElementById('jadwal-id').value = jadwal.id;
    document.getElementById('kode_matkul').value = jadwal.kode_matkul;
    document.getElementById('prodi').value = jadwal.prodi;
    document.getElementById('mata_kuliah').value = jadwal.mata_kuliah;
    document.getElementById('dosen').value = jadwal.dosen;
    document.getElementById('asisten').value = jadwal.asisten;
    document.getElementById('sks').value = jadwal.sks;
    document.getElementById('hari').value = jadwal.hari;
    document.getElementById('jam_mulai').value = jadwal.jam_mulai.substring(0, 5);
    document.getElementById('jam_akhir').value = jadwal.jam_akhir.substring(0, 5);
    document.getElementById('semester').value = jadwal.semester;
    document.getElementById('kelas').value = jadwal.kelas;
    document.getElementById('ruangan').value = jadwal.ruangan;
    
    submitButton.textContent = 'Update Jadwal';
    batalEditButton.style.display = 'inline-block';
};

batalEditButton.onclick = resetForm;


const updateFilterOptions = () => {
    const uniqueProdi = [...new Set(dataJadwal.map(j => j.prodi))].sort();
    filterProdiSelect.innerHTML = '<option value="">-- Semua Prodi --</option>';
    
    uniqueProdi.forEach(prodi => {
        const option = document.createElement('option');
        option.value = prodi;
        option.textContent = prodi;
        filterProdiSelect.appendChild(option);
    });
};

window.filterJadwal = async () => {
    const selectedProdi = filterProdiSelect.value;
    
    let query = supabase.from(JADWAL_TABLE_NAME).select('*');
    
    if (selectedProdi) {
        query = query.eq('prodi', selectedProdi); 
    }

    const { data, error } = await query.order('id', { ascending: true });

    if (!error) {
        renderJadwal(data); 
    }
};

// Export Logic
const getTableDataForExport = () => {
    const rows = jadwalBody.querySelectorAll('tr');
    const header = [
        'No.', 'Kode', 'Prodi', 'Matkul', 'Hari', 'Jam', 'SKS', 
        'Dosen', 'Asisten', 'Ruangan/Kelas'
    ]; 
    const data = [header];

    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        const rowData = Array.from(cells).slice(0, 10).map(cell => cell.textContent);
        
        rowData[0] = index + 1; 
        data.push(rowData);
    });
    return data;
};

window.exportToExcel = () => {
    const data = getTableDataForExport();
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal_Kuliah");
    XLSX.writeFile(wb, "Jadwal_Kuliah_Filter.xlsx");
};

window.exportToPdf = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' }); 
    const data = getTableDataForExport();
    
    doc.setFontSize(14);
    doc.text("Tabel Jadwal Kuliah", 14, 15);

    doc.autoTable({
        head: [data[0]],
        body: data.slice(1),
        startY: 20,
        theme: 'striped',
        headStyles: { fillColor: [52, 73, 94] },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { top: 15 }
    });

    doc.save('Jadwal_Kuliah_Filter.pdf');
};


// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchJadwal();
});
