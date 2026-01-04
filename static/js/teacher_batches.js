document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
        // Reuse stats endpoint as it returns batches
        const response = await fetch('/teacher/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Failed to load");

        const data = await response.json();
        renderBatches(data.batches);

    } catch (e) {
        console.error(e);
        document.getElementById('batchesContainer').innerHTML = "<p>Error loading batches</p>";
    }
});

function renderBatches(batches) {
    const container = document.getElementById('batchesContainer');
    container.innerHTML = '';

    if (batches.length === 0) {
        container.innerHTML = "<p>No batches assigned.</p>";
        return;
    }

    batches.forEach(batch => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.padding = '20px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:15px;">
                <div>
                    <h3 style="margin:0; font-size:1.2rem; color:#333;">${batch.name}</h3>
                    <span style="font-size:0.9rem; color:#666;">${batch.time || 'Time not set'}</span>
                </div>
                <div style="background:#e0e7ff; color:#4f46e5; padding:5px 10px; border-radius:15px; font-size:0.8rem; font-weight:bold;">
                    Active
                </div>
            </div>
            
            <div style="margin-top:20px; display:flex; gap:10px;">
                <button onclick="window.location.href='/teacher/attendance/mark?batch_id=${batch.id}'" style="flex:1; padding:8px; border:1px solid #4f46e5; background:white; color:#4f46e5; border-radius:5px; cursor:pointer;">Mark Attendance</button>
            </div>
        `;
        container.appendChild(div);
    });
}
