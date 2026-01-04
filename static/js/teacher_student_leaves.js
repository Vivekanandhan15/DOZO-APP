document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'TEACHER') {
        window.location.href = '/login';
        return;
    }

    loadStudentLeaves();
});

async function loadStudentLeaves() {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch('/teacher/dashboard/leaves', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            renderLeaves(data);
        }
    } catch (e) {
        console.error("Error loading student leaves:", e);
    }
}

function renderLeaves(leaves) {
    const list = document.getElementById('leaveList');
    list.innerHTML = '';

    if (leaves.length === 0) {
        list.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">No leave requests found.</td></tr>';
        return;
    }

    leaves.forEach(l => {
        const row = document.createElement('tr');

        let actionButtons = '';
        if (l.status === 'PENDING') {
            actionButtons = `
                <div class="action-btns">
                    <button class="btn-approve" onclick="updateLeaveStatus(${l.leave_id}, 'APPROVED')">Approve</button>
                    <button class="btn-reject" onclick="updateLeaveStatus(${l.leave_id}, 'REJECTED')">Reject</button>
                </div>
            `;
        } else if (l.status === 'PENDING_ADMIN') {
            actionButtons = `
                <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
                    <span style="color:#4338ca; font-size:0.75rem; font-weight:600;">Forwarded to Admin</span>
                    <button class="btn-reject" style="font-size:0.7rem; padding:4px 8px;" onclick="updateLeaveStatus(${l.leave_id}, 'REJECTED')">Revoke & Reject</button>
                </div>
            `;
        } else {
            actionButtons = '<span style="color:#888; font-size:0.8rem;">Processed</span>';
        }

        row.innerHTML = `
            <td style="font-weight:600;">${l.student_name}</td>
            <td>${l.batch_name}</td>
            <td>${new Date(l.date).toLocaleDateString()}</td>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${l.reason}">${l.reason}</td>
            <td><span class="status-badge status-${l.status}">${l.status.replace('_', ' ')}</span></td>
            <td>${actionButtons}</td>
        `;
        list.appendChild(row);
    });
}

async function updateLeaveStatus(id, status) {
    let confirmMsg = '';
    if (status === 'APPROVED') {
        confirmMsg = 'Approve this leave and forward to Admin for final confirmation?';
    } else if (status === 'REJECTED') {
        confirmMsg = 'Reject this leave request?';
    }

    if (!confirm(confirmMsg)) return;

    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`/leaves/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: status })
        });

        if (response.ok) {
            showToast(`Leave request ${status.toLowerCase()} successfully`, 'success');
            loadStudentLeaves();
        } else {
            showToast('Failed to update leave status', 'error');
        }
    } catch (e) {
        console.error("Error updating leave:", e);
        showToast('Network error', 'error');
    }
}
