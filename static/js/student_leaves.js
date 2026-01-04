document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.href = '/'; return; }

    fetchLeaveRequests();

    const leaveForm = document.getElementById("leaveRequestForm");
    if (leaveForm) {
        leaveForm.addEventListener("submit", async e => {
            e.preventDefault();
            const date = document.getElementById("leaveDate").value;
            const reason = document.getElementById("leaveReason").value;

            try {
                const res = await fetch('/leaves/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ date, reason })
                });

                if (res.ok) {
                    alert("Leave request submitted ✅");
                    leaveForm.reset();
                    fetchLeaveRequests();
                } else {
                    const d = await res.json();
                    alert(`Error: ${d.detail || 'Failed to submit'}`);
                }
            } catch (err) { alert("Network error"); }
        });
    }
});

async function fetchLeaveRequests() {
    const token = localStorage.getItem('access_token');
    const container = document.getElementById('leaveList');
    try {
        const res = await fetch('/leaves/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const leaves = await res.json();
            if (leaves.length === 0) {
                container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No leave requests found.</p>';
                return;
            }

            container.innerHTML = leaves.map(leave => {
                const statusClass = leave.status.toLowerCase();
                const statusColor = {
                    'pending': '#f59e0b',
                    'pending_admin': '#f59e0b',
                    'approved': '#10b981',
                    'rejected': '#ef4444'
                }[statusClass] || '#6b7280';

                return `
                    <div class="leave-item" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 12px 0;">
                        <div>
                            <div style="font-weight: 600;">${leave.reason}</div>
                            <div style="font-size: 0.85rem; color: #666;">${new Date(leave.date).toDateString()}</div>
                        </div>
                        <span class="status" style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; text-transform: uppercase; font-weight: bold;">
                            ${leave.status.replace('_', ' ')}
                        </span>
                    </div>
                `;
            }).join('');
        }
    } catch (e) { console.error(e); }
}

function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/';
}
