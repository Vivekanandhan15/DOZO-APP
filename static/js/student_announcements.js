document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.href = '/'; return; }

    fetchAnnouncements();
});

async function fetchAnnouncements() {
    const token = localStorage.getItem('access_token');
    const container = document.getElementById('announcementsList');
    try {
        const res = await fetch('/announcements/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const announcements = await res.json();
            if (announcements.length === 0) {
                container.innerHTML = '<p style="color: #888; text-align: center; padding: 40px; grid-column: 1/-1;">No announcements yet.</p>';
                return;
            }

            container.innerHTML = announcements.map(ann => {
                const expiryDate = new Date(ann.expiry_date);
                const isExpired = expiryDate < new Date();

                return `
                    <div class="announcement-card ${isExpired ? 'expired' : ''}" style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: relative; border-left: 4px solid var(--primary-color);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <h3 style="margin: 0; font-size: 1.1rem; color: #333;">${ann.title}</h3>
                            <span style="font-size: 0.75rem; color: #999;">${new Date(ann.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style="color: #666; font-size: 0.9rem; line-height: 1.5; margin-bottom: 15px;">${ann.content}</p>
                        <div style="font-size: 0.8rem; color: #888; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between;">
                            <span><i class="fa fa-user" style="margin-right: 5px;"></i> ${ann.author_name || 'Admin'}</span>
                            ${isExpired ? '<span style="color: #ff6b6b; font-weight: bold;">EXPIRED</span>' : ''}
                        </div>
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
