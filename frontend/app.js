const isLocalStaticServer =
  ['127.0.0.1', 'localhost'].includes(window.location.hostname) &&
  window.location.port === '8080';

const API_BASE_URL = isLocalStaticServer
  ? 'http://127.0.0.1:5000/mahasiswa'
  : '/mahasiswa';

const form = document.getElementById('mahasiswa-form');
const messageEl = document.getElementById('message');
const listEl = document.getElementById('mahasiswa-list');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

const fields = {
  id: document.getElementById('mahasiswa-id'),
  nama: document.getElementById('nama'),
  jurusan: document.getElementById('jurusan'),
  angkatan: document.getElementById('angkatan'),
};

const mahasiswaById = new Map();

function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#b30000' : '#0a7a20';
}

function resetForm() {
  form.reset();
  fields.id.value = '';
  formTitle.textContent = 'Tambah Mahasiswa';
  submitBtn.textContent = 'Simpan';
}

async function loadMahasiswa() {
  try {
    const response = await fetch(API_BASE_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengambil data');
    }

    listEl.innerHTML = '';
    mahasiswaById.clear();

    for (const mahasiswa of result.data || []) {
      mahasiswaById.set(String(mahasiswa.id), mahasiswa);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${mahasiswa.nama}</td>
        <td>${mahasiswa.jurusan}</td>
        <td>${mahasiswa.angkatan}</td>
        <td>
          <div class="row-actions">
            <button data-action="edit" data-id="${mahasiswa.id}">Edit</button>
            <button class="secondary" data-action="delete" data-id="${mahasiswa.id}">Hapus</button>
          </div>
        </td>
      `;
      listEl.appendChild(tr);
    }

    if (!result.data || result.data.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="4">Belum ada data mahasiswa.</td>';
      listEl.appendChild(tr);
    }
  } catch (error) {
    showMessage(error.message, true);
  }
}

function buildPayload() {
  return {
    nama: fields.nama.value.trim(),
    jurusan: fields.jurusan.value.trim(),
    angkatan: Number(fields.angkatan.value),
  };
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = fields.id.value;
  const isEdit = id !== '';

  try {
    const response = await fetch(isEdit ? `${API_BASE_URL}/${id}` : API_BASE_URL, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Gagal menyimpan data');
    }

    showMessage(result.message || 'Berhasil');
    resetForm();
    await loadMahasiswa();
  } catch (error) {
    showMessage(error.message, true);
  }
});

cancelBtn.addEventListener('click', () => {
  resetForm();
  showMessage('Mode edit dibatalkan');
});

listEl.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) {
    return;
  }

  if (action === 'edit') {
    try {
      const mahasiswa = mahasiswaById.get(id);
      if (!mahasiswa) {
        throw new Error('Data mahasiswa tidak ditemukan');
      }

      fields.id.value = mahasiswa.id;
      fields.nama.value = mahasiswa.nama;
      fields.jurusan.value = mahasiswa.jurusan;
      fields.angkatan.value = mahasiswa.angkatan;

      formTitle.textContent = 'Edit Mahasiswa';
      submitBtn.textContent = 'Update';
      showMessage('Mode edit aktif');
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  if (action === 'delete') {
    const ok = window.confirm('Yakin ingin menghapus data ini?');
    if (!ok) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus data');
      }

      showMessage(result.message || 'Data berhasil dihapus');
      await loadMahasiswa();
    } catch (error) {
      showMessage(error.message, true);
    }
  }
});

loadMahasiswa();
