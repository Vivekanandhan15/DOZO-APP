document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') {
        window.location.href = '/login';
        return;
    }

    loadTeachers();

    // Modal Logic
    const modal = document.getElementById('teacherModal');
    const addBtn = document.getElementById('addTeacherBtn');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('teacherForm');

    addBtn.onclick = () => {
        openModal();
    };

    closeBtn.onclick = () => modal.classList.remove('active');
    cancelBtn.onclick = () => modal.classList.remove('active');

    window.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveTeacher();
    };

    // Event Delegation for Table Actions
    const tbody = document.getElementById('teacherTableBody');
    tbody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-lite');
        const deleteBtn = e.target.closest('.btn-delete-lite');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const name = editBtn.dataset.name;
            const email = editBtn.dataset.email;
            const phone = editBtn.dataset.phone;
            window.editTeacher(id, name, email, phone);
        }

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            window.deleteTeacher(id);
        }
    });
});

async function loadTeachers() {
    try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/teachers/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const teachers = await res.json();
            renderTeachers(teachers);
        } else {
            console.error("Failed to fetch teachers");
        }
    } catch (e) {
        console.error(e);
    }
}

function renderTeachers(teachers) {
    const tbody = document.getElementById('teacherTableBody');
    tbody.innerHTML = '';

    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No teachers found.</td></tr>';
        return;
    }

    teachers.forEach(t => {
        const html = `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:32px; height:32px; background:#e0e7ff; color:#4f46e5; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                            ${t.name.charAt(0).toUpperCase()}
                        </div>
                        ${t.name}
                    </div>
                </td>
                <td>${t.email}</td>
                <td>${t.phone || '-'}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="action-btn btn-edit-lite" title="Edit Teacher" 
                            data-id="${t.user_id}" 
                            data-name="${t.name}" 
                            data-email="${t.email}" 
                            data-phone="${t.phone || ''}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete-lite" title="Delete Teacher" 
                            data-id="${t.user_id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', html);
    });
}

function openModal(id = null, name = '', email = '', phone = '') {
    const modal = document.getElementById('teacherModal');
    const title = document.getElementById('modalTitle');
    const idInput = document.getElementById('teacherId');
    const nameInput = document.getElementById('teacherName');
    const emailInput = document.getElementById('teacherEmail');
    const phoneInput = document.getElementById('teacherPhone');
    const passGroup = document.getElementById('passwordGroup');
    const passInput = document.getElementById('teacherPassword');

    idInput.value = id || '';
    nameInput.value = name;
    emailInput.value = email;
    phoneInput.value = phone || '';

    if (id) {
        title.textContent = 'Edit Teacher';
        passGroup.style.display = 'none'; // Don't require password on edit for now
        passInput.required = false;
    } else {
        title.textContent = 'Add New Teacher';
        passGroup.style.display = 'block';
        passInput.required = true;
        passInput.value = '';
    }

    modal.classList.add('active');
}

window.editTeacher = function (id, name, email, phone) {
    openModal(id, name, email, phone === 'null' ? '' : phone); // Fix null string issue
};

async function saveTeacher() {
    const id = document.getElementById('teacherId').value;
    const name = document.getElementById('teacherName').value;
    const email = document.getElementById('teacherEmail').value;
    const phone = document.getElementById('teacherPhone').value;
    const password = document.getElementById('teacherPassword').value;

    const data = { name, email, phone };
    if (!id) data.password = password; // Only send password on create

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/teachers/${id}` : '/teachers/';

    try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast(id ? 'Updated successfully' : 'Created successfully', 'success');
            document.getElementById('teacherModal').classList.remove('active');
            loadTeachers();
        } else {
            const err = await res.json();
            showToast(`Error: ${err.detail}`, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error', 'error');
    }
}

window.deleteTeacher = async function (id) {
    if (!confirm('Are you sure you want to delete this teacher? This might affect batches assigned to them.')) return;

    try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/teachers/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            showToast('Teacher deleted successfully', 'success');
            loadTeachers();
        } else {
            const data = await res.json();
            showToast(`Failed to delete: ${data.detail || 'Unknown error'}`, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Network error', 'error');
    }
};

