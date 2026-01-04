const greetingEl = document.querySelector(".left-content h2");

if (greetingEl) {
  const hour = new Date().getHours();
  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  greetingEl.textContent = `${greeting}, Vivekanandhan P`; // Ideally should come from user profile
}

// Logout function
function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('role');
  window.location.href = '/';
}
window.logout = logout;



let adminAssignedTasks = [];

async function fetchAssignments() {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    // Fetch Assignments & Submissions
    const [assignmentsRes, submissionsRes] = await Promise.all([
      fetch('/assignments/me', { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch('/submissions/me', { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    let assignments = [];
    if (assignmentsRes.ok) assignments = await assignmentsRes.json();

    let submissions = [];
    if (submissionsRes.ok) submissions = await submissionsRes.json();

    // Map Backend Data to Frontend UI Structure
    adminAssignedTasks = assignments.map(a => {
      const sub = submissions.find(s => s.assignment_id === a.assignment_id);

      // Due Date Calc
      const due = new Date(a.due_date);
      const today = new Date();
      const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
      const dueText = diff < 0 ? "Overdue" : diff === 0 ? "Today" : `${diff} days`;

      return {
        id: a.assignment_id, // Use real ID
        subject: a.title,
        topic: "Coursework",
        description: a.description,
        dueIn: dueText,
        status: sub ? "submitted" : "pending",
        priority: "Medium",
        time: `${a.points} pts`,
        color: "blue",
        icon: "fa-book"
      };
    });

    renderTasks(adminAssignedTasks);

  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}


const taskGrid = document.querySelector(".task-grid");

function renderTasks(tasks) {
  if (!taskGrid) return;

  taskGrid.innerHTML = "";

  tasks.forEach(task => {
    let actionBtn = "";

    if (task.status === "pending") {
      actionBtn = `<button class="start-btn" data-id="${task.id}">Start Task</button>`;
    }
    else if (task.status === "in-progress") {
      // Changed to 'Submit' button per request, opens modal
      actionBtn = `<button class="submit-btn" data-id="${task.id}" style="background-color: #f1c40f; color: white;">Submit Task</button>`;
    }
    else if (task.status === "submitted") {
      actionBtn = `<button class="view-btn" data-id="${task.id}">View Submission</button>`;
    }

    const card = document.createElement("div");
    card.className = `task-card ${task.color}`;

    card.innerHTML = `
      <div class="task-top">
        <div class="icon"><i class="fas ${task.icon}"></i></div>
        <span class="due">Due in ${task.dueIn}</span>
      </div>

      <h3>${task.subject}</h3>
      <p class="sub">${task.topic}</p>
      <p>${task.description}</p>

      <div class="task-info">
        <span><i class="fas fa-stopwatch"></i> ${task.time}</span>
        <span>${task.priority} Priority</span>
      </div>

      ${actionBtn}
    `;

    taskGrid.appendChild(card);
  });
}



if (taskGrid) {
  taskGrid.addEventListener("click", e => {
    const taskId = e.target.dataset.id;
    if (!taskId) return;

    const task = adminAssignedTasks.find(t => t.id == taskId);

    if (e.target.classList.contains("start-btn")) {
      task.status = "in-progress";
      alert("Task started 🚀");
      renderTasks(adminAssignedTasks); // Re-render to show Submit button
    }

    if (e.target.classList.contains("submit-btn")) {
      openSubmissionModal(taskId);
    }

    if (e.target.classList.contains("view-btn")) {
      alert("Viewing submission... (Feature pending)");
    }
  });
}

// Submission Modal Logic
function openSubmissionModal(taskId) {
  const modal = document.getElementById('submissionModal');
  const taskIdInput = document.getElementById('submitTaskId');
  if (modal && taskIdInput) {
    taskIdInput.value = taskId;
    modal.style.display = 'flex';
  }
}

function closeSubmissionModal() {
  const modal = document.getElementById('submissionModal');
  if (modal) {
    modal.style.display = 'none';
    document.getElementById('submissionForm').reset();
  }
}
window.closeSubmissionModal = closeSubmissionModal; // Expose global

async function handleSubmission(event) {
  event.preventDefault();
  const taskId = document.getElementById('submitTaskId').value;
  const fileUrl = document.getElementById('submitFileUrl').value;
  const desc = document.getElementById('submitDesc').value; // Not used by backend yet, but good for future
  const token = localStorage.getItem('access_token');

  try {
    const res = await fetch('/submissions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        assignment_id: taskId,
        file_url: fileUrl
      })
    });

    if (res.ok) {
      alert("Task submitted successfully! 🎉");
      closeSubmissionModal();
      // Update local state and re-render
      const task = adminAssignedTasks.find(t => t.id == taskId);
      if (task) {
        task.status = 'submitted';
        renderTasks(adminAssignedTasks);
      }
    } else {
      const err = await res.json();
      alert(`Submission failed: ${err.detail || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert('Network error during submission');
  }
}
window.handleSubmission = handleSubmission;



const filterBtns = document.querySelectorAll(".task-filters button");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.textContent.toLowerCase();

    if (filter === "all") {
      renderTasks(adminAssignedTasks);
    }
    else {
      const filtered = adminAssignedTasks.filter(task =>
        task.status === filter
      );
      renderTasks(filtered);
    }
  });
});



const leaveForm = document.getElementById("leaveRequestForm");
const leaveList = document.getElementById("leaveList");

if (leaveForm) {
  leaveForm.addEventListener("submit", async e => {
    e.preventDefault();


    const date = document.getElementById("leaveDate").value;
    const reason = document.getElementById("leaveReason").value;
    const token = localStorage.getItem('access_token');

    if (!date || !reason) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await fetch('/leaves/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date, reason })
      });

      if (res.ok) {
        alert("Leave request submitted ✅");
        leaveForm.reset();

        // Optimistically add to list (or fetch again)
        const leaveItem = document.createElement("div");
        leaveItem.className = "leave-item pending";
        leaveItem.innerHTML = `
          <div>
            <strong>${reason}</strong>
            <p>${new Date(date).toDateString()}</p>
          </div>
          <span class="status pending">Pending</span>
        `;
        leaveList.appendChild(leaveItem);

      } else {
        const d = await res.json();
        alert(`Error: ${d.detail || 'Failed to submit'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  });
}



const downloadBtn = document.querySelector(".download-report-mini");

if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const report = `
DOZO STUDENT REPORT
------------------
Name: Vivekanandhan P
Attendance: 92%
Streak: 15 Days
Pending Tasks: ${adminAssignedTasks.filter(t => t.status === "pending").length}
Average Grade: A+
`;

    const blob = new Blob([report], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "DOZO_Report.txt";
    link.click();
  });
}



const streakEl = document.querySelector(".info-box:nth-child(2) h3");

if (streakEl) {
  let streak = parseInt(streakEl.textContent) || 15;

  setTimeout(() => {
    streak++;
    streakEl.textContent = streak;
  }, 2000);
}


document.addEventListener("DOMContentLoaded", () => {
  fetchAssignments();
  fetchAnnouncements();
  fetchLeaveRequests();
});


// Fetch Announcements
async function fetchAnnouncements() {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const res = await fetch('/announcements/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const announcements = await res.json();
      renderAnnouncements(announcements);
    }
  } catch (error) {
    console.error("Error fetching announcements:", error);
  }
}

function renderAnnouncements(announcements) {
  const container = document.getElementById('announcementsList');
  if (!container) return;

  if (!announcements || announcements.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 40px;">No announcements yet</p>';
    return;
  }

  container.innerHTML = announcements.map(ann => {
    const expiryDate = new Date(ann.expiry_date);
    const isExpired = expiryDate < new Date();

    return `
      <div class="announcement-card ${isExpired ? 'expired' : ''}">
        <div class="announcement-header">
          <h3>${ann.title}</h3>
          <span class="announcement-date">${new Date(ann.created_at).toLocaleDateString()}</span>
        </div>
        <p class="announcement-content">${ann.content}</p>
        <div class="announcement-footer">
          <span class="expiry">Expires: ${expiryDate.toLocaleDateString()}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Fetch My Leave Requests
async function fetchLeaveRequests() {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const res = await fetch('/leaves/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const leaves = await res.json();
      renderLeaveRequests(leaves);
    }
  } catch (error) {
    console.error("Error fetching leaves:", error);
  }
}

function renderLeaveRequests(leaves) {
  const container = document.getElementById('leaveList');
  if (!container) return;

  if (!leaves || leaves.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #a0aec0; padding: 20px;">No leave requests yet</p>';
    return;
  }

  container.innerHTML = leaves.map(leave => {
    const statusClass = leave.status.toLowerCase();
    const statusColor = {
      'pending': '#f59e0b',
      'approved': '#10b981',
      'rejected': '#ef4444'
    }[statusClass] || '#6b7280';

    return `
      <div class="leave-item ${statusClass}">
        <div>
          <strong>${leave.reason}</strong>
          <p>${new Date(leave.date).toDateString()}</p>
        </div>
        <span class="status" style="background: ${statusColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
          ${leave.status}
        </span>
      </div>
    `;
  }).join('');
}
