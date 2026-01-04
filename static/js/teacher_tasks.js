document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    const batchSelect = document.getElementById('batchSelect');
    const tableBody = document.getElementById('tasksTableBody');
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const createBtn = document.getElementById('createTaskBtn');
    const closeBtn = document.querySelector('.close');

    if (!token) return;

    // 0. Fetch User Profile for Ownership checks
    let currentUser = null;
    try {
        const res = await fetch('/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        currentUser = await res.json();
    } catch (e) { console.error("Error fetching user profile"); }

    // 1. Load Batches
    try {
        const response = await fetch('/teacher/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        data.batches.forEach(b => {
            const option = document.createElement('option');
            option.value = b.id;
            option.innerText = b.name;
            batchSelect.appendChild(option);
        });
    } catch (e) { console.error("Error loading batches"); }

    // 2. Load Tasks on Selection
    batchSelect.onchange = loadTasks;

    async function loadTasks() {
        const batchId = batchSelect.value;
        if (!batchId) return;

        try {
            const res = await fetch(`/assignments/batch/${batchId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tasks = await res.json();

            tableBody.innerHTML = '';
            if (tasks.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No tasks created for this batch yet.</td></tr>';
                return;
            }

            tasks.forEach(task => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #eee';

                // Show actions only for owner or admin
                const canModify = currentUser && (currentUser.role.toUpperCase() === 'ADMIN' || task.teacher_id === currentUser.user_id);

                tr.innerHTML = `
                    <td style="padding:15px;">
                        <div style="font-weight:bold;">${task.title}</div>
                        <div style="font-size:0.85em; color:#666;">${task.description.substring(0, 50)}...</div>
                    </td>
                    <td style="padding:15px;">
                        <span style="background:#f1f5f9; color:#64748b; padding:4px 10px; border-radius:12px; font-size:0.85rem;">
                            ${task.teacher_name}
                        </span>
                    </td>
                    <td style="padding:15px;">${new Date(task.due_date).toLocaleDateString()}</td>
                    <td style="padding:15px;">${task.points}</td>
                    <td style="padding:15px; text-align:right;">
                        ${canModify ? `
                        <button onclick="editTask(${task.assignment_id})" style="color:#2563eb; background:none; border:none; cursor:pointer; margin-right:10px;"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteTask(${task.assignment_id})" style="color:#ef4444; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
                        ` : '<span style="color:#94a3b8; font-size:0.85rem;">View Only</span>'}
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } catch (e) { console.error(e); }
    }

    // Modal Handling
    createBtn.onclick = () => {
        if (!batchSelect.value) { alert("Please select a batch first!"); return; }
        document.getElementById('taskId').value = '';
        form.reset();
        document.getElementById('modalTitle').innerText = 'Create New Task';
        modal.style.display = 'block';
    };

    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    // Form Submit
    form.onsubmit = async (e) => {
        e.preventDefault();
        const taskId = document.getElementById('taskId').value;
        const payload = {
            batch_id: parseInt(batchSelect.value),
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDesc').value,
            due_date: document.getElementById('taskDueDate').value,
            points: parseInt(document.getElementById('taskPoints').value)
        };

        const method = taskId ? 'PUT' : 'POST';
        const url = taskId ? `/assignments/${taskId}` : '/assignments/';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Saved successfully!");
                modal.style.display = 'none';
                loadTasks();
            } else {
                const err = await res.json();
                alert("Error: " + (err.detail || "Failed"));
            }
        } catch (e) { console.error(e); alert("Network error"); }
    };

    // Actions
    window.editTask = async (id) => {
        try {
            const res = await fetch(`/assignments/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const task = await res.json();
                document.getElementById('taskId').value = task.assignment_id;
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDesc').value = task.description;
                document.getElementById('taskDueDate').value = task.due_date;
                document.getElementById('taskPoints').value = task.points;

                document.getElementById('modalTitle').innerText = 'Edit Task';
                modal.style.display = 'block';
            }
        } catch (e) { console.error(e); }
    };

    window.deleteTask = async (id) => {
        if (!confirm("Delete this task? Submissions will also be deleted.")) return;
        try {
            const res = await fetch(`/assignments/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) loadTasks();
            else alert("Failed to delete");
        } catch (e) { alert("Error"); }
    };

});
