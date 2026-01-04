document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Set Greeting
    const hour = new Date().getHours();
    const greetingText = document.getElementById('greeting-text');
    let greeting = "Good Evening";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 17) greeting = "Good Afternoon";
    if (greetingText) greetingText.innerText = greeting + "!";

    // Load Dashboard Stats
    loadDashboardStats();
    // Load Tasks
    loadRecentTasks();
    // Load Announcements
    loadRecentAnnouncements();
    // Load Leaves
    loadRecentLeaves();
});

async function loadDashboardStats() {
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch('/student/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            document.getElementById('stat-streak').innerText = data.streak;
            document.getElementById('stat-attendance').innerText = data.attendance_percentage + '%';
            document.getElementById('stat-pending-tasks').innerText = data.pending_tasks;
            document.getElementById('stat-avg-grade').innerText = data.avg_grade;
            document.getElementById('student-name-nav').innerText = data.name;
            document.getElementById('greeting-text').innerText += ' ' + data.name;
        } else {
            handleAuthError(res);
        }
    } catch (e) {
        console.error("Error loading stats", e);
    }
}

async function loadRecentTasks() {
    const token = localStorage.getItem('access_token');
    const taskList = document.getElementById('student-task-list');
    try {
        const res = await fetch('/assignments/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const tasks = await res.json();
            taskList.innerHTML = '';

            // Show top 3 tasks or tasks due today
            const today = new Date().toISOString().split('T')[0];
            const relevantTasks = tasks.slice(0, 3);

            if (relevantTasks.length === 0) {
                taskList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No tasks assigned yet. Enjoy!</p>';
                return;
            }

            relevantTasks.forEach(t => {
                const item = document.createElement('div');
                item.className = 'schedule-item'; // Using existing admin.css styles

                const isDueToday = t.due_date === today;

                item.innerHTML = `
                    <div class="schedule-info">
                        <div>
                            <div style="font-weight: 600; color: #333;">${t.title}</div>
                            <div style="font-size: 0.8rem; color: #666;">Due: ${t.due_date} ${isDueToday ? '<span style="color: red; font-weight: bold;">(Today)</span>' : ''}</div>
                        </div>
                    </div>
                    <div class="schedule-time">
                        <a href="/student/tasks" class="btn-primary" style="font-size: 0.75rem; padding: 6px 12px; text-decoration: none;">View</a>
                    </div>
                `;
                taskList.appendChild(item);
            });
        }
    } catch (e) {
        console.error("Error loading tasks", e);
    }
}

async function loadRecentAnnouncements() {
    const token = localStorage.getItem('access_token');
    const annList = document.getElementById('student-announcement-list');
    try {
        const res = await fetch('/announcements/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            annList.innerHTML = '';

            const recent = data.slice(0, 3);
            if (recent.length === 0) {
                annList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No announcements.</p>';
                return;
            }

            recent.forEach(ann => {
                const item = document.createElement('div');
                item.style.padding = '12px';
                item.style.borderBottom = '1px solid #eee';

                item.innerHTML = `
                    <div style="font-weight: 600; color: #444;">${ann.title}</div>
                    <div style="font-size: 0.8rem; color: #666; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${ann.content}</div>
                    <div style="font-size: 0.7rem; color: #999; margin-top: 4px;">${new Date(ann.created_at).toLocaleDateString()}</div>
                `;
                annList.appendChild(item);
            });
        }
    } catch (e) {
        console.error("Error loading announcements", e);
    }
}

async function loadRecentLeaves() {
    const token = localStorage.getItem('access_token');
    const leaveList = document.getElementById('dashboard-leave-list');
    try {
        const res = await fetch('/leaves/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const leaves = await res.json();
            if (leaves.length === 0) return;

            leaveList.innerHTML = '';
            leaves.slice(0, 4).forEach(l => {
                const statusColor = {
                    'PENDING': '#f59e0b',
                    'APPROVED': '#10b981',
                    'REJECTED': '#ef4444'
                }[l.status.toUpperCase()] || '#6b7280';

                const leaveItem = document.createElement('div');
                leaveItem.style.minWidth = '200px';
                leaveItem.style.padding = '15px';
                leaveItem.style.borderRadius = '10px';
                leaveItem.style.border = '1px solid #eee';
                leaveItem.style.background = '#fcfcfc';

                leaveItem.innerHTML = `
                    <div style="font-size: 0.75rem; color: #888; margin-bottom: 5px;">${new Date(l.date).toLocaleDateString()}</div>
                    <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${l.reason}</div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor};"></span>
                        <span style="font-size: 0.75rem; font-weight: bold; color: ${statusColor};">${l.status}</span>
                    </div>
                `;
                leaveList.appendChild(leaveItem);
            });
        }
    } catch (e) { console.error("Error loading leaves", e); }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    window.location.href = '/';
}

function handleAuthError(res) {
    if (res.status === 401 || res.status === 403) {
        logout();
    }
}
