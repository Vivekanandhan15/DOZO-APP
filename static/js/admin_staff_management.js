document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.href = '/'; return; }

    initTabs();

    const dateInput = document.getElementById('attendance-date');
    dateInput.valueAsDate = new Date();

    dateInput.addEventListener('change', loadStaffList);

    // Search Listener
    const searchInput = document.getElementById('staffSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase();
            const rows = document.querySelectorAll('#staff-list tr');
            rows.forEach(row => {
                const name = row.cells[0]?.textContent.toLowerCase() || '';
                const email = row.cells[1]?.textContent.toLowerCase() || '';
                if (name.includes(term) || email.includes(term)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    loadStaffList();
    loadStaffLeaves();
});

function initTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });
}

async function loadStaffList() {
    const token = localStorage.getItem('access_token');
    const container = document.getElementById('staff-list');
    const date = document.getElementById('attendance-date').value;

    try {
        const res = await fetch('/teachers/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const teachers = await res.json();
            if (teachers.length === 0) {
                container.innerHTML = '<tr><td colspan="4" style="text-align:center;">No teachers found.</td></tr>';
                return;
            }

            container.innerHTML = teachers.map(t => `
                <tr>
                    <td>${t.name}</td>
                    <td>${t.email}</td>
                    <td>
                        <select id="status-${t.user_id}" style="padding: 5px; border-radius: 4px;">
                            <option value="PRESENT">PRESENT</option>
                            <option value="ABSENT">ABSENT</option>
                        </select>
                    </td>
                    <td>
                        <button onclick="markAttendance(${t.user_id})" class="btn-mark">Mark</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (e) { console.error(e); }
}

async function markAttendance(userId) {
    const token = localStorage.getItem('access_token');
    const date = document.getElementById('attendance-date').value;
    const status = document.getElementById(`status-${userId}`).value;

    if (!date) {
        showToast('⚠️ Please select a date first', 'error');
        return;
    }

    try {
        const res = await fetch('/teachers/attendance/mark', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId, date, status })
        });

        if (res.ok) {
            showToast('✅ Attendance marked successfully', 'success');
        } else {
            const errorData = await res.json();
            showToast(`❌ Failed to mark attendance: ${errorData.detail || 'Unknown error'}`, 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('❌ Network error. Please try again.', 'error');
    }
}

// Make function globally accessible
window.markAttendance = markAttendance;

async function loadStaffLeaves() {
    const token = localStorage.getItem('access_token');
    const container = document.getElementById('pending-leaves-list');

    try {
        const res = await fetch('/teachers/leaves/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const leaves = await res.json();
            const pending = leaves.filter(l => l.status === 'PENDING');

            if (pending.length === 0) {
                container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No pending staff leaves.</p>';
                return;
            }

            container.innerHTML = pending.map(l => `
                <div class="leave-item">
                    <div class="leave-info">
                        <h4>${l.teacher ? l.teacher.name : 'Unknown Teacher'}</h4>
                        <div class="leave-date">
                            <i class="fa fa-calendar-alt"></i> ${l.date}
                        </div>
                        <div class="leave-reason"><strong>Reason:</strong> ${l.reason}</div>
                    </div>
                    <div class="leave-actions">
                        <button onclick="updateLeaveStatus(${l.leave_id}, 'APPROVED')" class="btn-success">Approve</button>
                        <button onclick="updateLeaveStatus(${l.leave_id}, 'REJECTED')" class="btn-danger">Reject</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) { console.error(e); }
}

async function updateLeaveStatus(leaveId, status) {
    const token = localStorage.getItem('access_token');
    try {
        // Reuse general leave update endpoint
        const res = await fetch(`/leaves/${leaveId}?status=${status}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            showToast(`✅ Leave ${status.toLowerCase()}ed`, 'success');
            loadStaffLeaves();
        } else {
            showToast('❌ Failed to update status', 'error');
        }
    } catch (e) { console.error(e); }
}

// Make function globally accessible
window.updateLeaveStatus = updateLeaveStatus;

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message; // Safer than innerText

    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
window.showToast = showToast;

function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/';
}
