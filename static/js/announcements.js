document.addEventListener('DOMContentLoaded', () => {
    const token = window.getAuthToken();
    if (!token) {
        window.location.href = '/';
        return;
    }
    loadAnnouncements();

    const form = document.getElementById('announcementForm');
    if (form) {
        form.addEventListener('submit', handlePostAnnouncement);
    }
});

const API_URL = '/announcements';

function getHeaders() {
    const token = window.getAuthToken ? window.getAuthToken() : localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function loadAnnouncements() {
    try {
        const response = await fetch(API_URL + '/', {
            headers: getHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            renderAnnouncements(data);
        } else {
            window.handleAuthError(response);
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

function renderAnnouncements(list) {
    const container = document.getElementById('announcementList');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">No announcements yet.</p>';
        return;
    }

    list.reverse(); // Show latest first if not already sorted

    list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'announcement-card';
        // Date formatting
        const date = new Date(item.created_at).toLocaleDateString() + ' ' + new Date(item.created_at).toLocaleTimeString();

        card.innerHTML = `
            <div class="announcement-header">
                <div>
                    <span class="announcement-title" style="display:block;">${item.title}</span>
                    <span style="font-size: 0.8rem; color: #666; font-weight: 500;">
                        <i class="fas fa-user-circle" style="font-size: 0.8rem; margin-right:4px;"></i>${item.author_name || 'System'}
                    </span>
                </div>
                <span class="announcement-date">${date}</span>
            </div>
            <div class="announcement-body">
                ${item.message || item.content} 
            </div>
            <div style="text-align:right; margin-top:10px;">
                ${(window.getCurrentRole() === 'ADMIN' || (item.created_by && item.created_by.toString() === window.getCurrentUserId()?.toString())) ?
                `<button onclick="deleteAnnouncement(${item.announcement_id})" style="color:#ef4444; border:none; background:none; cursor:pointer; font-size:0.8rem;"><i class="fas fa-trash-alt"></i> Delete</button>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

async function handlePostAnnouncement(e) {
    e.preventDefault();

    const title = document.getElementById('annTitle').value;
    const message = document.getElementById('annContent').value;

    try {
        const response = await fetch(API_URL + '/', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                title: title,
                content: message,
                expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
        });

        if (response.ok) {
            document.getElementById('announcementForm').reset();
            showToast('Announcement posted successfully', 'success');
            loadAnnouncements();
        } else {
            showToast('Failed to post announcement', 'error');
        }
    } catch (error) {
        console.error('Error posting:', error);
    }
}

window.deleteAnnouncement = async (id) => {
    if (!confirm("Delete this announcement?")) return;
    try {
        const response = await fetch(API_URL + '/' + id, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (response.ok) {
            showToast('Announcement deleted', 'success');
            loadAnnouncements();
        } else {
            showToast('Failed to delete', 'error');
        }
    } catch (error) {
        console.error('Error deleting:', error);
    }
}


