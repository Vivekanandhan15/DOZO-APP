document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    const batchSelect = document.getElementById('batchSelect');
    const form = document.getElementById('announcementForm');
    const listContainer = document.getElementById('announcementsList');

    if (!token) return;

    // 1. Load Batches
    try {
        const response = await fetch('/teacher/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        data.batches.forEach(b => {
            const option = document.createElement('option');
            option.value = b.id;
            option.innerText = b.name;
            batchSelect.appendChild(option);
        });
    } catch (e) { console.error("Error loading batches"); }

    // 2. Load Announcements (View All for now)
    loadAnnouncements();

    async function loadAnnouncements() {
        try {
            const res = await fetch('/announcements/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            listContainer.innerHTML = '';
            if (data.length === 0) {
                listContainer.innerHTML = '<p style="text-align:center; color:#777;">No active announcements.</p>';
                return;
            }

            data.forEach(a => {
                const currentUserId = localStorage.getItem('user_id');
                const isOwner = a.created_by && currentUserId && a.created_by.toString() === currentUserId.toString();

                const item = document.createElement('div');
                item.className = 'list-item'; // Reuse styles if available or inline
                item.style.padding = '15px';
                item.style.borderBottom = '1px solid #eee';
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <div>
                            <h4 style="margin:0;">${a.title}</h4>
                            <div style="font-size: 0.8rem; color: #555; margin-top:2px;">
                                <i class="fas fa-user-circle"></i> ${a.author_name || 'System'}
                            </div>
                        </div>
                        <span style="font-size:0.8rem; color:#888;">${new Date(a.created_at || a.date).toLocaleDateString()}</span>
                    </div>
                    <p style="margin:8px 0 0 0; color:#555;">${a.content}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                        <span style="font-size:0.8rem; color:#888;">
                            Batch: ${a.batch_id ? 'Specific Batch' : 'All Batches'}
                        </span>
                        ${(window.getCurrentRole() === 'ADMIN' || (a.created_by && a.created_by.toString() === window.getCurrentUserId()?.toString())) ?
                        `<button onclick="deleteAnnouncement(${a.announcement_id})" style="color:#ef4444; border:none; background:none; cursor:pointer; font-weight:600; font-size:0.85rem;"><i class="fas fa-trash-alt"></i> Delete</button>` : ''}
                    </div>
                `;
                listContainer.appendChild(item);
            });

        } catch (e) {
            console.error(e);
            listContainer.innerHTML = '<p style="color:red;">Failed to load announcements.</p>';
        }
    }

    // 3. Post Announcement
    form.onsubmit = async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const batchId = batchSelect.value || null; // Null for all? API expects int or null

        const payload = {
            title: title,
            content: content,
            batch_id: batchId ? parseInt(batchId) : null,
            expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 7 days expiry
        };

        try {
            const res = await fetch('/announcements/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Announcement Posted!");
                form.reset();
                loadAnnouncements();
            } else {
                alert("Failed to post.");
            }
        } catch (e) { console.error(e); alert("Error posting announcement"); }
    };

    // Delete global function
    window.deleteAnnouncement = async (id) => {
        if (!confirm("Delete this announcement?")) return;
        try {
            const res = await fetch(`/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) loadAnnouncements();
            else alert("Failed delete");
        } catch (e) { alert("Error"); }
    };

});
