// Task Management Page - Full CRUD operations

const modal = document.getElementById('editModal');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelEditBtn');
const editForm = document.getElementById('editTaskForm');
const tasksTableBody = document.getElementById('tasksTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');

let allTasks = [];
let authToken = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    authToken = window.getAuthToken();
    if (!authToken) {
        window.logout();
        return;
    }

    await loadBatches();
    await loadAllTasks();

    // Setup event listeners
    searchInput.addEventListener('input', filterTasks);
    statusFilter.addEventListener('change', filterTasks);
});

// Load batches for the dropdown
async function loadBatches() {
    try {
        const res = await fetch('/batches/', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (res.ok) {
            const batches = await res.json();
            const select = document.getElementById('editBatch');
            select.innerHTML = '<option value="">Select Batch</option>';
            batches.forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.batch_id;
                opt.textContent = b.name;
                select.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Error loading batches:', err);
    }
}

// Load all tasks
async function loadAllTasks() {
    try {
        const res = await fetch('/dashboard/tasks/recent', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (res.ok) {
            allTasks = await res.json();
            renderTasks(allTasks);
        } else {
            window.handleAuthError(res);
        }
    } catch (err) {
        console.error('Error loading tasks:', err);
        showToast('Failed to load tasks. Please try again.', 'error');
    }
}

// Render tasks table
function renderTasks(tasks) {
    if (!tasks || tasks.length === 0) {
        tasksTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #a0aec0;">
                    No tasks found.
                </td>
            </tr>
        `;
        return;
    }

    tasksTableBody.innerHTML = tasks.map(task => {
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) : 'No due date';

        let statusClass = 'status-active';
        let statusColor = '#10b981';

        if (task.status === 'Overdue') {
            statusClass = 'status-overdue';
            statusColor = '#ef4444';
        } else if (task.status === 'In Progress') {
            statusClass = 'status-progress';
            statusColor = '#3b82f6';
        } else if (task.status === 'Completed') {
            statusClass = 'status-completed';
            statusColor = '#8b5cf6';
        }

        return `
            <tr>
                <td>
                    <strong>${task.title}</strong>
                    <br>
                    <small style="color: #64748b;">${task.description || 'No description'}</small>
                </td>
                <td><span class="batch-badge">${task.batch_name}</span></td>
                <td><span class="owner-badge" style="background:#e0e7ff; color:#4f46e5; padding:2px 8px; border-radius:4px; font-size:0.8rem;">${task.owner_name}</span></td>
                <td style="color: ${task.status === 'Overdue' ? '#ef4444' : '#666'};">${dueDate}</td>
                <td><strong>${task.submissions}</strong></td>
                <td>
                    <span style="background-color: ${statusColor}20; color: ${statusColor}; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">
                        ${task.status}
                    </span>
                </td>
                <td class="action-buttons">
                    <button class="btn-icon edit" onclick="editTask(${task.assignment_id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-icon delete" onclick="deleteTask(${task.assignment_id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter tasks based on search and status
function filterTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;

    const filtered = allTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm)) ||
            task.batch_name.toLowerCase().includes(searchTerm);

        const matchesStatus = !statusValue || task.status === statusValue;

        return matchesSearch && matchesStatus;
    });

    renderTasks(filtered);
}

// Edit task - open modal
window.editTask = async function (taskId) {
    const task = allTasks.find(t => t.assignment_id === taskId);
    if (!task) {
        showToast('Task not found', 'error');
        return;
    }

    // We need to fetch the full task details including batch_id
    try {
        const res = await fetch(`/assignments/${taskId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (res.ok) {
            const fullTask = await res.json();
            document.getElementById('editTaskId').value = fullTask.assignment_id;
            document.getElementById('editTitle').value = fullTask.title;
            document.getElementById('editDescription').value = fullTask.description || '';
            document.getElementById('editBatch').value = fullTask.batch_id;
            document.getElementById('editDueDate').value = fullTask.due_date;
            document.getElementById('editPoints').value = fullTask.points || 100;

            modal.classList.add('active');
        } else {
            showToast('Failed to load task details', 'error');
        }
    } catch (err) {
        console.error('Error loading task:', err);
        showToast('Failed to load task details', 'error');
    }
};

// Update task
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const taskId = document.getElementById('editTaskId').value;
    const data = {
        title: document.getElementById('editTitle').value,
        description: document.getElementById('editDescription').value,
        batch_id: parseInt(document.getElementById('editBatch').value),
        due_date: document.getElementById('editDueDate').value,
        points: parseInt(document.getElementById('editPoints').value) || 100
    };

    try {
        const res = await fetch(`/assignments/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast('✅ Task updated successfully!', 'success');
            modal.classList.remove('active');
            await loadAllTasks();
        } else {
            const errorData = await res.json();
            showToast(`Error: ${errorData.detail || 'Failed to update task'}`, 'error');
        }
    } catch (err) {
        console.error('Error updating task:', err);
        showToast('Network error. Please try again.', 'error');
    }
});

// Delete task
window.deleteTask = async function (taskId) {
    // Get task details for better warning message
    const task = allTasks.find(t => t.assignment_id === taskId);
    const taskTitle = task ? task.title : 'this task';
    const submissions = task ? task.submissions : '0';

    // Enhanced warning message
    let warningMessage = `⚠️ DELETE TASK: "${taskTitle}"?\n\n`;
    warningMessage += `This will permanently delete:\n`;
    warningMessage += `✗ The task and all its details\n`;

    // Parse submission count (format: "X/Y")
    const submissionCount = submissions.split('/')[0];
    if (submissionCount && parseInt(submissionCount) > 0) {
        warningMessage += `✗ ${submissionCount} student submission(s)\n`;
        warningMessage += `✗ All associated student work and grades\n\n`;
        warningMessage += `⚠️ WARNING: This will DELETE student work!\n`;
    } else {
        warningMessage += `\n`;
    }

    warningMessage += `\nThis action CANNOT be undone!\n\n`;
    warningMessage += `Are you absolutely sure?`;

    if (!confirm(warningMessage)) {
        return;
    }

    try {
        const res = await fetch(`/assignments/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (res.ok) {
            const data = await res.json();
            let successMsg = `✅ Task "${data.assignment_title}" deleted successfully!`;

            if (data.deleted_submissions > 0) {
                successMsg += `\n\n${data.deleted_submissions} student submission(s) were also removed.`;
            }

            if (data.deleted_submissions > 0) {
                successMsg += `\n\n${data.deleted_submissions} student submission(s) were also removed.`;
            }

            showToast(successMsg, 'success');
            await loadAllTasks();
        } else {
            const errorData = await res.json();
            showToast(`❌ Error: ${errorData.detail || 'Failed to delete task'}`, 'error');
        }
    } catch (err) {
        console.error('Error deleting task:', err);
        showToast('❌ Network error. Please try again.', 'error');
    }
};

// Close modal
closeBtn.addEventListener('click', () => modal.classList.remove('active'));
cancelBtn.addEventListener('click', () => modal.classList.remove('active'));
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});
