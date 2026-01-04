document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    let allStudents = [];

    // Elements
    const modal = document.getElementById('studentModal');
    const closeX = document.querySelector('.close-modal');
    const closeBtn = document.getElementById('closeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const form = document.getElementById('studentForm');

    // Modal Helpers
    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    closeX.onclick = closeModal;
    closeBtn.onclick = closeModal;

    window.onclick = (event) => {
        if (event.target == modal) closeModal();
    };

    // Load Data
    if (!token) {
        window.location.href = '/';
        return;
    }

    async function loadStudents() {
        try {
            const response = await fetch('/students/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const students = await response.json();
            allStudents = students;
            renderStudentList(students);
            setupSearchAndFilters(students);
        } catch (error) {
            console.error('Error:', error);
            document.querySelector('.student-list-card').innerHTML = `<p style="padding:20px; color:red;">Error loading students.</p>`;
        }
    }

    loadStudents();
    loadBatches();

    // Render List
    function renderStudentList(students) {
        const container = document.querySelector('.student-list-card');
        container.innerHTML = `
            <div class="list-header">
                <span class="header-col student-info-col">Student Name</span>
                <span class="header-col">Email</span>
                <span class="header-col">Batch</span>
                <span class="header-col">Attendance</span>
                <span class="header-col">Status</span>
                <span class="header-col actions-col">Actions</span>
            </div>
        `;

        if (students.length === 0) {
            container.innerHTML += '<p style="padding:20px; text-align:center;">No students found.</p>';
            return;
        }

        students.forEach(student => {
            const initial = student.user.name.charAt(0).toUpperCase();
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="student-info-col">
                    <div class="avatar avatar-a">${initial}</div>
                    <div>
                        <span class="student-name">${student.user.name}</span>
                        <span class="student-id">${student.roll_no}</span>
                    </div>
                </div>
                <span class="email-col">${student.user.email || 'N/A'}</span>
                <span class="batch-col">${student.batch_name}</span>
                <span class="attendance-col">--%</span>
                <span class="status-col status-active">${student.status}</span>
                <span class="actions-col">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="action-btn btn-view-lite" title="View Student">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn btn-edit-lite" title="Edit Student">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete-lite" title="Delete Student">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </span>
            `;

            // Attach Events
            item.querySelector('.btn-view-lite').onclick = () => openModal(student, 'view');
            item.querySelector('.btn-edit-lite').onclick = () => openModal(student, 'edit');
            item.querySelector('.btn-delete-lite').onclick = () => deleteStudent(student.student_id);

            container.appendChild(item);
        });
    }

    // Modal Logic
    function openModal(student, mode) {
        document.getElementById('studentId').value = student.student_id;
        document.getElementById('studentName').value = student.user.name;
        document.getElementById('studentRoll').value = student.roll_no;
        document.getElementById('parentContact').value = student.parent_contact;

        const inputs = ['studentRoll', 'parentContact'];

        if (mode === 'view') {
            document.getElementById('modalTitle').innerText = 'Student Details';
            saveBtn.style.display = 'none';
            inputs.forEach(id => {
                document.getElementById(id).disabled = true;
                document.getElementById(id).style.backgroundColor = '#f9f9f9';
            });
        } else {
            document.getElementById('modalTitle').innerText = 'Edit Student';
            saveBtn.style.display = 'inline-block';
            inputs.forEach(id => {
                document.getElementById(id).disabled = false;
                document.getElementById(id).style.backgroundColor = 'white';
            });
        }

        modal.style.display = 'flex';
    }

    // Save Edit
    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('studentId').value;
        const data = {
            roll_no: document.getElementById('studentRoll').value,
            parent_contact: document.getElementById('parentContact').value
        };

        try {
            const res = await fetch(`/students/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                showToast('Student updated successfully', 'success');
                closeModal();
                loadStudents();
            } else {
                showToast('Failed to update student', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error updating student', 'error');
        }
    };

    // Delete
    async function deleteStudent(id) {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/students/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                showToast('Student deleted successfully', 'success');
                loadStudents();
            } else {
                showToast('Failed to delete student', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error deleting student', 'error');
        }
    }

    // Load Batches for Filter
    async function loadBatches() {
        try {
            const response = await fetch('/batches/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const batches = await response.json();
                const batchFilter = document.getElementById('batchFilter');
                batches.forEach(batch => {
                    const option = document.createElement('option');
                    option.value = batch.batch_id;
                    option.textContent = batch.name;
                    batchFilter.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading batches:', error);
        }
    }

    // Search & Filter
    function setupSearchAndFilters(students) {
        const searchInput = document.querySelector('.search-input');
        const batchFilter = document.getElementById('batchFilter');
        const statusFilter = document.getElementById('statusFilter');

        function applyFilters() {
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const selectedBatch = batchFilter.value;
            const selectedStatus = statusFilter.value;

            const filtered = allStudents.filter(s => {
                const matchesSearch = !searchTerm ||
                    s.user.name.toLowerCase().includes(searchTerm) ||
                    s.roll_no.toLowerCase().includes(searchTerm) ||
                    (s.user.email && s.user.email.toLowerCase().includes(searchTerm));

                const matchesBatch = !selectedBatch || s.batch_id == selectedBatch;
                const matchesStatus = !selectedStatus || s.status.toUpperCase() === selectedStatus;

                return matchesSearch && matchesBatch && matchesStatus;
            });

            renderStudentList(filtered);
        }

        if (searchInput) {
            searchInput.oninput = applyFilters;
        }

        if (batchFilter) {
            batchFilter.onchange = applyFilters;
        }

        if (statusFilter) {
            statusFilter.onchange = applyFilters;
        }
    }
});
