const API_BASE_URL = '/api/coffees';

const form = document.getElementById('coffee-form');
const messageEl = document.getElementById('message');
const listEl = document.getElementById('coffee-list');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

const fields = {
  id: document.getElementById('coffee-id'),
  name: document.getElementById('name'),
  origin: document.getElementById('origin'),
  price: document.getElementById('price'),
  stock: document.getElementById('stock'),
  description: document.getElementById('description'),
};

function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#b30000' : '#0a7a20';
}

function resetForm() {
  form.reset();
  fields.id.value = '';
  formTitle.textContent = 'Tambah Kopi';
  submitBtn.textContent = 'Simpan';
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

async function loadCoffees() {
  try {
    const response = await fetch(API_BASE_URL);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengambil data');
    }

    listEl.innerHTML = '';

    for (const coffee of result.data || []) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${coffee.name}</td>
        <td>${coffee.origin}</td>
        <td>${formatCurrency(coffee.price)}</td>
        <td>${coffee.stock}</td>
        <td>${coffee.description || '-'}</td>
        <td>
          <div class="row-actions">
            <button data-action="edit" data-id="${coffee.id}">Edit</button>
            <button class="secondary" data-action="delete" data-id="${coffee.id}">Hapus</button>
          </div>
        </td>
      `;
      listEl.appendChild(tr);
    }

    if (!result.data || result.data.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="6">Belum ada data kopi.</td>';
      listEl.appendChild(tr);
    }
  } catch (error) {
    showMessage(error.message, true);
  }
}

function buildPayload() {
  return {
    name: fields.name.value.trim(),
    origin: fields.origin.value.trim(),
    price: Number(fields.price.value),
    stock: Number(fields.stock.value),
    description: fields.description.value.trim(),
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
    await loadCoffees();
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
      const response = await fetch(`${API_BASE_URL}/${id}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil detail data');
      }

      const coffee = result.data;
      fields.id.value = coffee.id;
      fields.name.value = coffee.name;
      fields.origin.value = coffee.origin;
      fields.price.value = coffee.price;
      fields.stock.value = coffee.stock;
      fields.description.value = coffee.description || '';

      formTitle.textContent = 'Edit Kopi';
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
      await loadCoffees();
    } catch (error) {
      showMessage(error.message, true);
    }
  }
});

loadCoffees();
