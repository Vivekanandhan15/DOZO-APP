document.addEventListener('DOMContentLoaded', () => {
    const token = window.getAuthToken();
    if (!token) {
        window.location.href = '/';
        return;
    }
    loadLeaves();
    setupFilters();
});

const API_URL = '/leaves';

function getHeaders() {
    const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

function setupFilters() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadLeaves(tab.dataset.filter);
        });
    });
}

async function loadLeaves(filter = 'all') {
    try {
        const response = await fetch(`${API_URL}/`, {
            headers: getHeaders()
        });

        if (response.ok) {
            let data = await response.json();
            if (filter !== 'all') {
                data = data.filter(l => l.status.toUpperCase() === filter.toUpperCase());
            }
            renderLeaves(data);
        } else {
            window.handleAuthError(response);
        }
    } catch (error) {
        console.error('Error loading leaves:', error);
    }
}

function renderLeaves(leaves) {
    const tbody = document.getElementById('leaveList');
    tbody.innerHTML = '';

    if (leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No leave requests found.</td></tr>';
        return;
    }

    leaves.reverse().forEach(leave => {
        const tr = document.createElement('tr');
        const date = new Date(leave.date).toLocaleDateString();

        // Robust name and type identification
        const reqName = leave.student?.user?.name || leave.teacher?.name || 'Unknown User';
        const reqType = leave.teacher ? 'Teacher' : 'Student';
        const displayLabel = `<div style="display:flex; flex-direction:column;">
                                <span style="font-weight:600;">${reqName}</span>
                                <span style="font-size:0.7rem; color:#888;">${reqType}</span>
                              </div>`;

        tr.innerHTML = `
            <td>${displayLabel}</td>
            <td>${date}</td>
            <td title="${leave.reason}">${leave.reason}</td>
            <td><span class="status-badge status-${leave.status}">${leave.status.replace('_', ' ')}</span></td>
            <td class="action-btns">
                ${['PENDING', 'PENDING_ADMIN'].includes(leave.status.toUpperCase()) ? `
                    <button class="btn-approve" onclick="updateStatus(${leave.leave_id}, 'APPROVED')">Approve</button>
                    <button class="btn-reject" onclick="updateStatus(${leave.leave_id}, 'REJECTED')">Reject</button>
                ` : `
                    <span style="color:#888; font-size:0.8rem;">Processed</span>
                `}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadLeaves(document.querySelector('.tab.active').dataset.filter);
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating leave status:', error);
    }
}
