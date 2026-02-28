// Modal Elements
const modal = document.getElementById('batchModal');
const createBtn = document.getElementById('createBatchBtn');
const closeBtn = document.querySelector('.close-modal');
const cancelBtn = document.getElementById('cancelBtn');
const batchForm = document.getElementById('batchForm');
const modalTitle = document.getElementById('modalTitle');
const batchesTableBody = document.getElementById('batchesTableBody');

// State
let editingBatchId = null;
let teacherMap = {};

// Open Modal for Create
createBtn.addEventListener('click', () => {
    editingBatchId = null;
    modalTitle.textContent = 'Create New Batch';
    batchForm.reset();
    document.getElementById('batchId').value = '';
    modal.classList.add('active');
});

// Close Modal
closeBtn.addEventListener('click', () => modal.classList.remove('active'));
cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

// Fetch and Display Batches
async function fetchBatches() {
    const token = window.getAuthToken();
    if (!token) {
        console.warn('No access token found. Redirecting to login.');
        window.logout();
        return;
    }

    try {
        const res = await fetch('/batches/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const batches = await res.json();
            renderBatches(batches);
        } else {
            window.handleAuthError(res);
        }
    } catch (error) {
        console.error('Error fetching batches:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

function renderBatches(batches) {
    if (!batches || batches.length === 0) {
        batchesTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #a0aec0;">
          No batches found. Create your first batch!
        </td>
      </tr>
    `;
        return;
    }

    batchesTableBody.innerHTML = batches.map(batch => {
        const teacherName = teacherMap[batch.teacher_id] || `ID: ${batch.teacher_id}`;
        return `
    <tr>
      <td><strong>${batch.name}</strong></td>
      <td><span style="color:#6b7280; font-size:0.9rem;"><i class="fas fa-user-tie" style="margin-right:5px;"></i>${teacherName}</span></td>
      <td>${new Date(batch.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      <td>${new Date(batch.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
      <td style="text-align: right;">
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="action-btn btn-edit-lite" title="Edit Batch" onclick="editBatch(${batch.batch_id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn btn-delete-lite" title="Delete Batch" onclick="deleteBatch(${batch.batch_id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
      </td>
    </tr>
  `;
    }).join('');
}

// Create/Update Batch
batchForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = window.getAuthToken();
    if (!token) { window.logout(); return; }
    const data = {
        name: document.getElementById('batchName').value,
        teacher_id: parseInt(document.getElementById('teacherId').value),
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value
    };

    const batchIdVal = document.getElementById('batchId').value;

    const isEdit = batchIdVal !== '';
    const url = isEdit ? `/batches/${batchIdVal}` : '/batches/';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast(isEdit ? 'Batch updated successfully!' : 'Batch created successfully!', 'success');
            modal.classList.remove('active');
            fetchBatches();
        } else {
            const errorData = await res.json();
            showToast(`Error: ${errorData.detail || 'Operation failed'}`, 'error');
        }
    } catch (error) {
        console.error('Error saving batch:', error);
        showToast('Network error. Please try again.', 'error');
    }
});

// Edit Batch
window.editBatch = async function (id) {
    const token = window.getAuthToken();
    if (!token) { window.logout(); return; }

    try {
        const res = await fetch('/batches/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const batches = await res.json();
            const batch = batches.find(b => b.batch_id === id);

            if (batch) {
                document.getElementById('batchId').value = batch.batch_id;
                document.getElementById('batchName').value = batch.name;
                document.getElementById('teacherId').value = batch.teacher_id;
                document.getElementById('startDate').value = batch.start_date;
                document.getElementById('endDate').value = batch.end_date;

                modalTitle.textContent = 'Edit Batch';
                modal.classList.add('active');
            }
        }
    } catch (error) {
        console.error('Error loading batch:', error);
        showToast('Failed to load batch details', 'error');
    }
};

// Delete Batch
window.deleteBatch = async function (id) {
    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
        return;
    }

    const token = window.getAuthToken();
    if (!token) { window.logout(); return; }

    try {
        const res = await fetch(`/batches/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            showToast('Batch deleted successfully!', 'success');
            fetchBatches();
        } else {
            const errorData = await res.json();
            showToast(`Error: ${errorData.detail || 'Failed to delete batch'}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting batch:', error);
        showToast('Network error. Please try again.', 'error');
    }
};

// Load Teachers for Dropdown
async function loadTeachers() {
    const token = window.getAuthToken();
    try {
        const res = await fetch('/teachers/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const teachers = await res.json();
            const select = document.getElementById('teacherId');
            select.innerHTML = '<option value="" disabled selected>Select Teacher</option>';
            teachers.forEach(t => {
                teacherMap[t.user_id] = t.name;
                const opt = document.createElement('option');
                opt.value = t.user_id;
                opt.innerText = t.name;
                select.appendChild(opt);
            });
            // Re-render batches to show names if batches loaded first
            fetchBatches();
        }
    } catch (e) {
        console.error("Error loading teachers", e);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = window.getAuthToken();
    if (!token) {
        window.logout();
        return;
    }
    fetchBatches();
    loadTeachers();

    // Search Listener
    const searchInput = document.getElementById('batchSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase();
            const rows = document.querySelectorAll('#batchesTableBody tr');
            rows.forEach(row => {
                const batchName = row.cells[0]?.textContent.toLowerCase() || '';
                const teacherName = row.cells[1]?.textContent.toLowerCase() || '';
                if (batchName.includes(term) || teacherName.includes(term)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});

// Toast Notification Helper
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
