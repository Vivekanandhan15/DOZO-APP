document.addEventListener('DOMContentLoaded', async () => {
    // Check auth
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Load Data
    await loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/attendance/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Failed to fetch stats');

        const data = await res.json();
        renderStats(data);
    } catch (err) {
        console.error("Error loading dashboard:", err);
        // Handle error visually if needed
    }
}

function renderStats(data) {
    const stats = data.stats;
    const batches = data.batches;
    const leaves = data.recent_leaves;

    // 1. Top Cards
    document.getElementById('present-count').textContent = `${stats.present_today} out of ${stats.total_students}`;
    document.getElementById('total-students').textContent = stats.total_students; // Actually hidden in textContent above, fixed below
    document.getElementById('present-count').innerHTML = `${stats.present_today} <span style="font-size: 14px; color: #64748b; font-weight: normal;">out of ${stats.total_students}</span>`;

    document.getElementById('present-rate').textContent = `${stats.overall_rate}%`;
    document.getElementById('present-progress').style.width = `${stats.overall_rate}%`;

    // Absent Card
    document.getElementById('absent-count').textContent = `${stats.absent_today} unexcused`; // Logic adjustment
    document.getElementById('unexcused-count').textContent = stats.unexcused_absent || stats.absent_today; // Assuming API returns unexcused
    document.getElementById('on-leave-count').textContent = stats.on_leave;
    document.getElementById('total-absent').textContent = (stats.absent_today + stats.on_leave);

    // Pending Card
    document.getElementById('pending-count').textContent = stats.pending_leaves;

    // 2. Batches
    const batchContainer = document.getElementById('batch-list');
    batchContainer.innerHTML = '';

    if (batches.length === 0) {
        batchContainer.innerHTML = '<p style="color: #64748b; text-align: center;">No active batches today.</p>';
    } else {
        batches.forEach((batch, index) => {
            const colors = ['#e0e7ff', '#dcfce7', '#f3e8ff']; // Blue, Green, Purple
            const textColors = ['#4338ca', '#15803d', '#7e22ce'];
            const letters = ['A', 'B', 'C']; // Or first letter of Name

            const colorBg = colors[index % colors.length];
            const colorTxt = textColors[index % textColors.length];
            const letter = batch.name.charAt(0).toUpperCase();

            const html = `
                <div class="batch-item">
                    <div class="batch-info">
                        <div class="batch-icon" style="background: ${colorBg}; color: ${colorTxt};">
                            ${letter}
                        </div>
                        <div class="batch-details">
                            <h4>${batch.name}</h4>
                            <p>${batch.total_students} students</p>
                        </div>
                    </div>
                    <div class="batch-stats">
                        <div class="batch-percent" style="color: ${colorTxt}">${batch.percentage}%</div>
                        <div class="batch-ratio">${batch.present_count}/${batch.total_students} present</div>
                    </div>
                </div>
            `;
            batchContainer.insertAdjacentHTML('beforeend', html);
        });
    }

    // 3. Leaves
    const leaveContainer = document.getElementById('leave-list');
    leaveContainer.innerHTML = '';

    if (leaves.length === 0) {
        leaveContainer.innerHTML = '<p style="color: #64748b; text-align: center;">No pending requests.</p>';
    } else {
        leaves.forEach(leave => {
            const html = `
                <div class="leave-item">
                    <div class="student-info">
                        <div class="avatar" style="background: white; color: ${getRandomColor()};">
                            ${leave.student_name.substring(0, 2)}
                        </div>
                        <div class="student-details">
                            <h4>${leave.student_name}</h4>
                            <p>${leave.reason}</p>
                        </div>
                    </div>
                    <div class="leave-actions">
                        <button class="btn-approve" onclick="approveLeave(${leave.leave_id})">Approve</button>
                        <button class="btn-reject" onclick="rejectLeave(${leave.leave_id})">Reject</button>
                    </div>
                </div>
            `;
            leaveContainer.insertAdjacentHTML('beforeend', html);
        });
    }
}

function getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    return colors[Math.floor(Math.random() * colors.length)];
}

async function approveLeave(id) {
    if (!confirm('Approve this leave request?')) return;
    try {
        const token = localStorage.getItem('access_token');
        await fetch(`/leaves/${id}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadDashboardStats(); // Reload
    } catch (e) { console.error(e); }
}

async function rejectLeave(id) {
    if (!confirm('Reject this leave request?')) return;
    try {
        const token = localStorage.getItem('access_token');
        await fetch(`/leaves/${id}/reject`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadDashboardStats(); // Reload
    } catch (e) { console.error(e); }
}
