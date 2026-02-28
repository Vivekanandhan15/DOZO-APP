document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.href = '/'; return; }

    loadTeacherInfo();
    loadLeaveHistory();

    const form = document.getElementById('leave-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const date = document.getElementById('leave-date').value;
        const reason = document.getElementById('leave-reason').value;

        if (!date || !reason) {
            alert('Please fill all fields');
            return;
        }

        const inputDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (inputDate < today) {
            alert('Leave date cannot be in the past');
            return;
        }

        if (reason.trim().length < 10) {
            alert('Reason must be at least 10 characters long');
            return;
        }

        try {
            const res = await fetch('/teachers/leaves/me', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date, reason })
            });

            if (res.ok) {
                alert('✅ Leave request submitted successfully');
                form.reset();
                loadLeaveHistory();
            } else {
                alert('❌ Failed to submit request');
            }
        } catch (error) {
            console.error(error);
        }
    });
});

async function loadTeacherInfo() {
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch('/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const user = await res.json();
            document.getElementById('teacher-name-nav').innerText = user.name;
        }
    } catch (e) { }
}

async function loadLeaveHistory() {
    const token = localStorage.getItem('access_token');
    const container = document.getElementById('leave-history');
    try {
        const res = await fetch('/teachers/leaves/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const leaves = await res.json();
            if (leaves.length === 0) return;

            container.innerHTML = leaves.map(l => `
                <div class="schedule-item" style="margin-bottom: 10px; border: 1px solid #eee; padding: 15px; border-radius: 12px;">
                    <div class="schedule-info">
                        <div>
                            <div style="font-weight: 600; color: #333;">${new Date(l.date).toLocaleDateString()}</div>
                            <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">${l.reason}</div>
                        </div>
                    </div>
                    <div class="status-badge ${l.status.toLowerCase()}" style="padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; background: ${getStatusBg(l.status)}; color: ${getStatusColor(l.status)};">
                        ${l.status}
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error(e);
    }
}

function getStatusBg(status) {
    if (status === 'APPROVED') return '#dcfce7';
    if (status === 'REJECTED') return '#fee2e2';
    return '#fef3c7';
}

function getStatusColor(status) {
    if (status === 'APPROVED') return '#166534';
    if (status === 'REJECTED') return '#991b1b';
    return '#92400e';
}

function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/';
}
