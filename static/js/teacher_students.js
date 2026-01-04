document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Set Teacher Name
    const role = localStorage.getItem('role');
    if (role !== 'TEACHER') {
        alert("Access Denied");
        window.location.href = '/';
        return;
    }

    try {
        // Fetch Students Logic
        const response = await fetch('/teacher/dashboard/students', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load students');

        const students = await response.json();
        renderStudents(students);

    } catch (error) {
        console.error(error);
        document.getElementById('studentTableBody').innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error loading data</td></tr>`;
    }
});

function renderStudents(students) {
    const tbody = document.getElementById('studentTableBody');
    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No students found in your batches.</td></tr>`;
        return;
    }

    students.forEach(student => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #eee';
        row.innerHTML = `
            <td style="padding:15px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:30px; height:30px; background:#e0e7ff; color:#4f46e5; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                        ${student.name.charAt(0).toUpperCase()}
                    </div>
                    ${student.name}
                </div>
            </td>
            <td style="padding:15px;">${student.roll_no}</td>
            <td style="padding:15px;"><span style="background:#f3f4f6; padding:4px 8px; border-radius:4px; font-size:0.9em;">${student.batch_name}</span></td>
            <td style="padding:15px;">${student.attendance_rate}%</td>
            <td style="padding:15px;">${student.contact}</td>
        `;
        tbody.appendChild(row);
    });
}
