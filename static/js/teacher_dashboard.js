document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'TEACHER') {
        window.location.href = '/login';
        return;
    }

    // Load Teacher Data
    await loadTeacherStats();
});

async function loadTeacherStats() {
    try {
        const token = localStorage.getItem('access_token');
        const [statsRes, todosRes] = await Promise.all([
            fetch('/teacher/dashboard/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/todos/?status=Pending', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (statsRes.ok) {
            const data = await statsRes.json();
            const todos = todosRes.ok ? await todosRes.json() : [];
            renderTeacherDashboard(data, todos);
        }
    } catch (e) {
        console.error("Error loading teacher data:", e);
    }
}

function renderTeacherDashboard(data, todos) {
    // Header
    document.querySelector('.welcome-title').textContent = `Welcome, ${data.teacher_name}`;

    // Stats
    document.getElementById('stat-students').textContent = data.total_students;
    document.getElementById('stat-attendance').textContent = `${data.attendance_rate}%`;
    document.getElementById('stat-pending-reviews').textContent = data.pending_leaves;

    // Priority Todos (Top 3 Pending tasks)
    const skedList = document.getElementById('teacher-schedule-list');
    const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };

    // Sort all pending todos by priority, then by due date
    const displayItems = todos
        .sort((a, b) => {
            const pDiff = (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
            if (pDiff !== 0) return pDiff;
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
        })
        .slice(0, 3);

    if (displayItems.length > 0) {
        skedList.innerHTML = displayItems.map(t => {
            let dueInfo = t.due_date ? `Due: ${new Date(t.due_date).toLocaleDateString()}` : 'No due date';
            const statusColor = t.priority === 'High' ? '#ef4444' : (t.priority === 'Medium' ? '#d97706' : '#6b7280');
            const bg = t.priority === 'High' ? '#fee2e2' : (t.priority === 'Medium' ? '#fef3c7' : '#f3f4f6');

            return `
                <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="font-size: 0.95rem;">${t.title}</strong>
                        <div style="font-size: 11px; color: #666; margin-top: 2px;">${dueInfo}</div>
                    </div>
                    <span class="badge" style="background: ${bg}; color: ${statusColor}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${t.priority}</span>
                </div>
            `;
        }).join('');
    } else {
        skedList.innerHTML = '<p style="color: #888; text-align: center; padding: 15px;">No pending tasks.</p>';
    }

    // Leaves
    const leaveList = document.getElementById('teacher-leave-list');
    if (data.recent_leaves && data.recent_leaves.length > 0) {
        leaveList.innerHTML = data.recent_leaves.map(l => `
            <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: bold;">${l.student_name}</div>
                    <div style="font-size: 12px; color: #666;">${l.reason}</div>
                </div>
                <div>
                    <button style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;" onclick="approveLeave('${l.leave_id}')">Approve</button>
                    <button style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-left: 5px;" onclick="rejectLeave('${l.leave_id}')">Reject</button>
                </div>
            </div>
        `).join('');
    }
}

window.approveLeave = async (id) => {
    // Approve logic (PUT /leaves/{id}/approve) - Teacher Level
    if (!confirm('Approve for forwarding to Admin?')) return;
    const token = localStorage.getItem('access_token');
    await fetch(`/leaves/${id}/approve`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    loadTeacherStats();
};

window.rejectLeave = async (id) => {
    if (!confirm('Reject request?')) return;
    const token = localStorage.getItem('access_token');
    await fetch(`/leaves/${id}/reject`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    loadTeacherStats();
};
