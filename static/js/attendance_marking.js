
// Attendance Marking Logic

let allEnrollments = [];
let currentBatchId = null;

document.addEventListener("DOMContentLoaded", async () => {
  const token = window.getAuthToken();
  if (!token) {
    console.warn("No access token found. Redirecting to login.");
    window.logout();
    return;
  }

  // Set today as default date
  const dateInput = document.getElementById('attendance-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // RELOAD when date changes
    dateInput.addEventListener('change', () => {
      if (currentBatchId) loadStudents(currentBatchId);
    });
  }

  // Handle query param for automatic selection
  const urlParams = new URLSearchParams(window.location.search);
  const batchIdParam = urlParams.get('batch_id');

  const select = document.getElementById('batch-select');

  if (batchIdParam) {
    currentBatchId = batchIdParam;
    loadStudents(batchIdParam);
  }

  // Only populate batches if the select dropdown exists (Admin flow)
  if (select) {
    try {
      const res = await fetch('/batches/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const batches = await res.json();
        select.addEventListener('change', () => {
          currentBatchId = select.value;
          loadStudents(currentBatchId);
        });
        batches.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b.batch_id;
          opt.textContent = b.name;
          if (batchIdParam && b.batch_id == batchIdParam) opt.selected = true;
          select.appendChild(opt);
        });
      } else {
        if (res.status !== 403) window.handleAuthError(res);
      }
    } catch (err) {
      console.error("Failed to load batches", err);
    }
  }

  // Search Listener
  const searchInput = document.getElementById('attendance-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase();
      const filtered = allEnrollments.filter(e => e.student.user.name.toLowerCase().includes(term));
      // Re-render will need attendance data too, but for simplicity we filter current list
      const items = document.querySelectorAll('.student-item');
      items.forEach(item => {
        const name = item.querySelector('.student-name-col').textContent.toLowerCase();
        item.style.display = name.includes(term) ? 'flex' : 'none';
      });
    });
  }

  // Mark All Present Listener
  const markAllBtn = document.querySelector('.mark-all-btn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.student-item:not(.already-marked) input[type="radio"][value="PRESENT"]').forEach(radio => {
        radio.checked = true;
      });
    });
  }
});

async function loadStudents(batchId) {
  if (!batchId) return;

  const date = document.getElementById('attendance-date').value;
  if (!date) return;

  const container = document.getElementById('student-list-container');
  container.innerHTML = '<p style="padding: 20px; text-align: center;">Loading students...</p>';

  const token = window.getAuthToken();
  try {
    const [enrollRes, attendRes] = await Promise.all([
      fetch(`/enrollment/batch/${batchId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`/attendance/batch/${batchId}/date/${date}`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    if (enrollRes.ok && attendRes.ok) {
      const enrollments = await enrollRes.json();
      const attendance = await attendRes.json();
      allEnrollments = enrollments;
      renderStudentList(enrollments, attendance);

      const countEl = document.getElementById('studentCount');
      if (countEl) countEl.textContent = `(${enrollments.length} Students)`;

    } else {
      window.handleAuthError(enrollRes.ok ? attendRes : enrollRes);
    }
  } catch (err) {
    console.error(err);
    showToast("Failed to load data", 'error');
  }
}

function renderStudentList(enrollments, attendanceRecords = []) {
  const container = document.getElementById('student-list-container');
  container.innerHTML = '';

  if (enrollments.length === 0) {
    container.innerHTML = '<p style="padding: 20px; text-align: center;">No students found in this batch.</p>';
    return;
  }

  const role = localStorage.getItem('role');

  enrollments.forEach((enroll, index) => {
    const student = enroll.student;
    const user = student.user;
    const name = user.name;
    const sId = student.student_id;

    // Check if attendance already marked
    const record = attendanceRecords.find(a => a.student_id === sId);
    const isMarked = !!record;
    const status = record ? record.status : 'PRESENT';

    const div = document.createElement('div');
    div.className = 'student-item' + (isMarked ? ' already-marked' : '');
    div.dataset.studentId = sId;
    if (isMarked) {
      div.style.background = '#f8fafc';
      div.style.opacity = '0.8';
    }

    const presentId = `status_${sId}_present`;
    const absentId = `status_${sId}_absent`;

    // Disable if marked and is teacher (as per backend logic where teachers can't update)
    const isDisabled = isMarked && role === 'TEACHER';

    div.innerHTML = `
                <div class="student-name-col">
                    <span>${index + 1}. ${name}</span>
                    ${isMarked ? '<span style="font-size: 10px; color: #10b981; margin-left: 10px;">(Already Marked)</span>' : ''}
                </div>
                <div class="status-col status-controls">
                    <div class="radio-option">
                        <input type="radio" id="${presentId}" name="status_${sId}" value="PRESENT" 
                               ${status === 'PRESENT' ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                        <label for="${presentId}" class="present">Present</label>
                    </div>

                    <div class="radio-option">
                        <input type="radio" id="${absentId}" name="status_${sId}" value="ABSENT" 
                               ${status === 'ABSENT' ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                        <label for="${absentId}" class="absent">Absent</label>
                    </div>
                </div>
                <input type="text" class="note-col student-note" placeholder="Note" ${isDisabled ? 'disabled' : ''}>
            `;
    container.appendChild(div);
  });
}

const form = document.getElementById("markAttendanceForm");

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const batchId = currentBatchId || (document.getElementById('batch-select') ? document.getElementById('batch-select').value : null);
    const date = document.getElementById('attendance-date').value;
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');

    if (!batchId || !date) {
      showToast("Select batch and date", 'error');
      return;
    }

    // Only mark students who ARE NOT already marked OR if we are Admin (who can update)
    const students = document.querySelectorAll('.student-item');
    const toMark = [];

    students.forEach(item => {
      if (role === 'ADMIN' || !item.classList.contains('already-marked')) {
        toMark.push(item);
      }
    });

    if (toMark.length === 0) {
      showToast("No new records to save", 'info');
      return;
    }

    const submitBtn = form.querySelector('.btn-primary');
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    const promises = [];
    for (const item of toMark) {
      const sId = item.dataset.studentId;
      const statusInput = item.querySelector(`input[name="status_${sId}"]:checked`);
      const status = statusInput ? statusInput.value : 'PRESENT';

      const p = fetch('/attendance/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          batch_id: parseInt(batchId),
          student_id: parseInt(sId),
          status: status,
          date: date
        })
      }).then(res => {
        if (!res.ok) {
          // If 400 Already marked, we can ignore it for bulk success if we wanted, 
          // but here we check before sending anyway.
          return res.json().then(data => {
            throw new Error(data.detail || `Failed for student ${sId}`);
          });
        }
        return res.json();
      });
      promises.push(p);
    }

    try {
      await Promise.all(promises);
      showToast("Attendance saved successfully! ✅", 'success');

      setTimeout(() => {
        if (role === 'TEACHER') {
          window.location.href = "/teacher/batches";
        } else {
          window.location.href = "/admin";
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to save attendance", 'error');
      submitBtn.textContent = "Save Attendance";
      submitBtn.disabled = false;
    }
  });
}
