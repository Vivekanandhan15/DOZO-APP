// Admin Dashboard - Dynamic Data Loading

const API_BASE = '';
let authToken = '';

// Helper functions
function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return document.querySelectorAll(selector);
}

// Auth check
document.addEventListener('DOMContentLoaded', async () => {
  authToken = window.getAuthToken();
  if (!authToken) {
    window.location.href = '/';
    return;
  }

  // Load all dynamic data
  await Promise.all([
    loadUserProfile(),
    loadDashboardStats(),
    loadAnnouncements(),
    loadTopTodos(),
    loadTaskStats(),
    loadRecentTasks(),
    loadAttendanceSections()
  ]);
});

// Load Detailed Attendance Sections
async function loadAttendanceSections() {
  try {
    const res = await fetch('/attendance/stats', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.ok) {
      const data = await res.json();
      renderAttendanceSections(data);
    }
  } catch (err) {
    console.error("Error loading attendance sections:", err);
  }
}

function renderAttendanceSections(data) {
  const stats = data.stats;
  const batches = data.batches;
  const leaves = data.recent_leaves;

  // 1. Stats Cards
  const presentText = document.getElementById('att-present-text');
  if (presentText) presentText.innerHTML = `<strong>${stats.present_today}</strong> out of ${stats.total_students} students`;

  const rateEl = document.getElementById('att-rate');
  if (rateEl) rateEl.textContent = `${stats.overall_rate}%`;

  const barEl = document.getElementById('att-progress-bar');
  if (barEl) barEl.style.width = `${stats.overall_rate}%`;

  const absentDetails = document.getElementById('att-absent-details');
  if (absentDetails) absentDetails.innerHTML = `${stats.absent_today} unexcused<br>${stats.on_leave} on leave`;

  const absentCount = document.getElementById('att-absent-count');
  if (absentCount) absentCount.textContent = (stats.absent_today + stats.on_leave);

  const pendingCount = document.getElementById('att-pending-count');
  if (pendingCount) pendingCount.textContent = stats.pending_leaves;

  // 2. Batches
  const batchContainer = document.getElementById('att-batch-list');
  if (batchContainer) {
    batchContainer.innerHTML = '';
    if (batches.length === 0) {
      batchContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">No active batches.</p>';
    } else {
      batches.forEach((batch, index) => {
        const bgColors = ['blue-bg', 'green-bg', 'purple-bg'];
        const textColors = ['blue-text', 'green-text', 'orange-text']; // Matching screenshot approximately
        const bgClass = bgColors[index % 3];
        const textClass = textColors[index % 3];

        const html = `
                <div class="batch-item ${bgClass}">
                    <div class="batch-left">
                      <div class="batch-icon">${batch.name.charAt(0)}</div>
                      <div>
                        <h3>${batch.name}</h3>
                        <p>${batch.total_students} students</p>
                      </div>
                    </div>
                    <div class="batch-right">
                      <h3 class="attendance-percentage ${textClass}">${batch.percentage}%</h3>
                      <p>${batch.present_count}/${batch.total_students} present</p>
                    </div>
                </div>
              `;
        batchContainer.insertAdjacentHTML('beforeend', html);
      });
    }
  }

  // 3. Leaves
  const leaveContainer = document.getElementById('att-leave-list');
  if (leaveContainer) {
    leaveContainer.innerHTML = '';
    if (leaves.length === 0) {
      leaveContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">No pending leave requests.</p>';
    } else {
      leaves.forEach(leave => {
        // Creating a simple avatar placeholder with initials
        const initials = leave.student_name.slice(0, 2).toUpperCase();

        const html = `
                <div class="leave-card yellow-bg">
                  <div class="leave-left">
                    <div class="leave-avatar" style="background:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#555;">${initials}</div>
                    <div>
                      <h3 style="margin:0; font-size:1rem;">${leave.student_name}</h3>
                      <span style="font-size:0.7rem; color:#888; font-weight:600;">${leave.requester_type || 'Student'}</span>
                      <p style="margin:5px 0 0 0; font-size:0.85rem;">${leave.reason}</p>
                    </div>
                  </div>
                  <div class="leave-actions">
                    <button class="btn-approve" onclick="approveLeaveDash(${leave.leave_id})">Approve</button>
                    <button class="btn-reject" onclick="rejectLeaveDash(${leave.leave_id})">Reject</button>
                  </div>
                </div>
              `;
        leaveContainer.insertAdjacentHTML('beforeend', html);
      });
    }
  }
}

// Inline actions for dashboard
window.approveLeaveDash = async function (id) {
  if (!confirm('Approve this leave?')) return;
  try {
    await fetch(`/leaves/${id}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    loadAttendanceSections();
  } catch (e) { console.error(e); }
};

window.rejectLeaveDash = async function (id) {
  if (!confirm('Reject this leave?')) return;
  try {
    await fetch(`/leaves/${id}/reject`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    loadAttendanceSections();
  } catch (e) { console.error(e); }
};

// Load Top 3 High Priority Todos for "Today's Schedule"
async function loadTopTodos() {
  try {
    const res = await fetch('/dashboard/todos/top', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const todos = await res.json();
      renderTopTodos(todos);
    } else {
      window.handleAuthError(res);
    }
  } catch (err) {
    console.error("Error loading top todos:", err);
  }
}

function renderTopTodos(todos) {
  const list = document.querySelector('.schedule-list');
  if (!list) return;

  // The user wants Top 3 High Priority Todos in "Today's Schedule"
  // We will clear the hardcoded ones and show these
  list.innerHTML = '';

  if (todos.length === 0) {
    list.innerHTML = '<p style="text-align:center; padding:10px; color:#888;">No high-priority tasks for today.</p>';
    return;
  }

  todos.forEach(todo => {
    const item = document.createElement('div');
    item.className = 'schedule-item'; // Use existing class for style

    const dateStr = todo.due_date ? new Date(todo.due_date).toLocaleDateString() : 'Today';

    item.innerHTML = `
            <div class="schedule-info">
              <div class="icon blue"><i class="fa fa-thumbtack"></i></div>
              <div>
                <h3>${todo.title}</h3>
                <p>Priority: ${todo.priority} • Due: ${dateStr}</p>
              </div>
            </div>
            <div class="schedule-time">
              <h4>${todo.status}</h4>
              <p class="status ${todo.priority === 'High' ? 'urgent' : 'upcoming'}">${todo.priority}</p>
            </div>
        `;
    list.appendChild(item);
  });
}

// Load and Render Schedule
async function loadSchedule() {
  try {
    const res = await fetch('/dashboard/schedule', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const schedule = await res.json();
      renderSchedule(schedule);
    }
  } catch (err) {
    console.error("Error loading schedule:", err);
  }
}

function renderSchedule(scheduleItems) {
  const list = document.querySelector('.schedule-list');
  if (!list) return;

  // Clear existing items but keep "View All" link if inside the list (usually it's in header)
  // Let's check structure. Assuming .schedule-list contains ul/divs.
  // We'll replace inner content effectively.
  list.innerHTML = '';

  if (scheduleItems.length === 0) {
    list.innerHTML = '<p style="text-align:center; padding:10px; color:#888;">No classes scheduled today.</p>';
    return;
  }

  scheduleItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'schedule-card'; // Reuse or create simpler style
    // If no specific class exists, we use inline or reuse announcement card style with mods
    // Given the image, it looks like a card with icon, title, details, and status.

    // Determine status color
    const statusClass = item.status === 'In Progress' ? 'status-green' : (item.status === 'Upcoming' ? 'status-blue' : 'status-gray');

    card.innerHTML = `
        <div class="schedule-icon" style="background:${stringToColor(item.batch_name)}; width:40px; height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-right:15px; color:white; font-size:1.2em;">
            <i class="fas fa-chalkboard-teacher"></i>
        </div>
        <div style="flex-grow:1;">
            <h4 style="margin:0; font-size:1em; color:#333;">${item.batch_name}</h4>
            <span style="font-size:0.85em; color:#666;">
                 ${item.room} • ${item.student_count} students
            </span>
        </div>
        <div style="text-align:right;">
             <div style="font-weight:600; font-size:0.9em; color:#333;">${item.time}</div>
             <div style="font-size:0.8em; color:${statusClass === 'status-green' ? '#2ecc71' : '#3498db'}; font-weight:500;">
                 ${item.status}
             </div>
        </div>
    `;
    // Add basic flex styling if class doesn't exist
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.padding = '15px';
    card.style.border = '1px solid #f0f0f0';
    card.style.borderRadius = '10px';
    card.style.marginBottom = '10px';
    card.style.backgroundColor = '#fff';

    list.appendChild(card);
  });
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// Load User Profile (Welcome Message)
async function loadUserProfile() {
  try {
    const res = await fetch('/users/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const user = await res.json();
      const navUserEl = document.getElementById('nav-user-name');
      if (navUserEl) {
        navUserEl.textContent = user.name || 'Admin';
      }
    } else {
      window.handleAuthError(res);
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// Load Dashboard Stats
async function loadDashboardStats() {
  try {
    const res = await fetch('/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      const stats = await res.json();

      // Update Greeting
      const welcomeUserName = document.getElementById('welcome-user-name');
      if (welcomeUserName) {
        welcomeUserName.textContent = stats.user_name || 'Admin';
      }

      // Update Active Tasks
      const activeTasks = document.getElementById('stat-active-tasks');
      if (activeTasks) {
        activeTasks.textContent = stats.active_tasks || 0;
      }
      const tasksChange = document.getElementById('stat-tasks-change');
      if (tasksChange && stats.tasks_change !== undefined) {
        const changeValue = stats.tasks_change;
        tasksChange.className = 'stat-change ' + (changeValue >= 0 ? 'positive' : 'negative');
        tasksChange.textContent = `${changeValue >= 0 ? '+' : ''}${changeValue}% from last week`;
      }

      // Update Attendance Rate
      const attendanceRate = document.getElementById('stat-attendance-rate');
      if (attendanceRate) {
        attendanceRate.textContent = `${stats.attendance_rate || 0}%`;
      }
      const attendanceChange = document.getElementById('stat-attendance-change');
      if (attendanceChange && stats.attendance_change !== undefined) {
        const changeValue = stats.attendance_change;
        attendanceChange.className = 'stat-change ' + (changeValue >= 0 ? 'positive' : 'negative');
        attendanceChange.textContent = `${changeValue >= 0 ? '+' : ''}${changeValue}% from yesterday`;
      }

      // Update Avg Performance
      const avgPerformance = document.getElementById('stat-avg-performance');
      if (avgPerformance) {
        avgPerformance.textContent = `${stats.avg_performance || 0}%`;
      }
      const performanceChange = document.getElementById('stat-performance-change');
      if (performanceChange && stats.performance_change !== undefined) {
        const changeValue = stats.performance_change;
        performanceChange.className = 'stat-change ' + (changeValue >= 0 ? 'positive' : 'negative');
        performanceChange.textContent = changeValue >= 0
          ? `+${changeValue}% improvement`
          : `${changeValue}% needs attention`;
      }

      // Update Pending Reviews
      const pendingReviews = document.getElementById('stat-pending-reviews');
      if (pendingReviews) {
        pendingReviews.textContent = stats.pending_reviews || 0;
      }
      const reviewsChange = document.getElementById('stat-reviews-change');
      if (reviewsChange) {
        const reviewCount = stats.pending_reviews || 0;
        reviewsChange.className = 'stat-change ' + (reviewCount > 5 ? 'urgent' : (reviewCount > 0 ? 'warning' : 'positive'));
        reviewsChange.textContent = reviewCount > 5
          ? 'Urgent action needed'
          : (reviewCount > 0 ? `${reviewCount} pending` : 'All caught up!');
      }
    } else {
      window.handleAuthError(res);
    }
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

// Fetch and display leave requests
async function loadLeaveRequests() {
  try {
    const response = await fetch(`${API_BASE}/leaves/`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!response.ok) throw new Error('Failed to fetch leaves');

    const leaves = await response.json();
    renderLeaveRequests(leaves);
  } catch (error) {
    console.error('Error loading leave requests:', error);
  }
}

function renderLeaveRequests(leaves) {
  const container = $('.leave-section');
  if (!container) return;

  // Keep the title
  const title = container.querySelector('.leave-section-title');
  container.innerHTML = '';
  container.appendChild(title);

  if (leaves.length === 0) {
    container.innerHTML += '<p style="padding: 20px; text-align: center;">No pending leave requests</p>';
    return;
  }

  leaves.forEach(leave => {
    const isPending = leave.status === 'PENDING';
    const bgClass = isPending ? 'yellow-bg' : (leave.status === 'APPROVED' ? 'green-bg' : 'red-bg');

    const card = document.createElement('div');
    card.className = `leave-card ${bgClass}`;

    // Fallback for requester info
    const reqName = leave.student?.user?.name || leave.teacher?.name || leave.student_name || 'User';
    const reqType = leave.teacher ? 'Teacher' : 'Student';

    card.innerHTML = `
      <div class="leave-left">
        <div class="leave-avatar" style="background:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#555; width:45px; height:45px; border-radius:50%; margin-right:12px; border:1px solid #eee;">
            ${reqName.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 style="margin:0;">${reqName}</h3>
          <span style="font-size:0.75rem; color:#666; font-weight:600;">${reqType}</span>
          <p style="margin:5px 0;">${leave.reason}</p>
          <small>Date: ${new Date(leave.date).toLocaleDateString()}</small>
        </div>
      </div>
      <div class="leave-actions">
        ${isPending ? `
          <button class="btn-approve" data-leave-id="${leave.leave_id}">Approve</button>
          <button class="btn-reject" data-leave-id="${leave.leave_id}">Reject</button>
        ` : `
          <button class="btn-approved" disabled>${leave.status}</button>
        `}
      </div>
    `;
    container.appendChild(card);
  });

  // Attach event listeners
  attachLeaveActions();
}

function attachLeaveActions() {
  $all('.btn-approve').forEach(btn => {
    btn.addEventListener('click', async () => {
      const leaveId = btn.dataset.leaveId;
      await updateLeaveStatus(leaveId, 'APPROVED');
    });
  });

  $all('.btn-reject').forEach(btn => {
    btn.addEventListener('click', async () => {
      const leaveId = btn.dataset.leaveId;
      await updateLeaveStatus(leaveId, 'REJECTED');
    });
  });
}

async function updateLeaveStatus(leaveId, status) {
  try {
    const response = await fetch(`${API_BASE}/leaves/${leaveId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) throw new Error('Failed to update leave');

    showToast(`Leave ${status.toLowerCase()} successfully`, 'success');
    await loadLeaveRequests(); // Reload
  } catch (error) {
    console.error('Error updating leave:', error);
    showToast('Failed to update leave status', 'error');
  }
}

// Fetch and display announcements
async function loadAnnouncements() {
  try {
    const response = await fetch('/dashboard/announcements/latest', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!response.ok) throw new Error('Failed to fetch announcements');

    const announcements = await response.json();
    renderAnnouncements(announcements);
  } catch (error) {
    console.error('Error loading announcements:', error);
  }
}

function renderAnnouncements(announcements) {
  const container = $('.recent-announcements');
  if (!container) return;

  // Keep header
  const header = container.querySelector('.announcements-header');
  container.innerHTML = '';
  container.appendChild(header);

  if (announcements.length === 0) {
    container.innerHTML += '<p style="padding: 20px;">No announcements yet</p>';
    return;
  }

  announcements.slice(0, 3).forEach((ann, index) => {
    const colors = ['blue-border', 'green-border', 'yellow-border'];
    const card = document.createElement('div');
    card.className = `announcement-card ${colors[index % 3]}`;
    card.innerHTML = `
      <div class="announcement-content">
        <div class="announcement-header">
          <h3>${ann.title}</h3>
          <span class="time">${getTimeAgo(ann.posted_date)}</span>
        </div>
        <p>${ann.content}</p>
        <div class="announcement-meta">
          <span><i class="fas fa-user"></i> Admin</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  // For very recent (less than 1 hour), show minutes or "Just now"
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

  // For today (less than 24 hours), show hours
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;

  // For recent days (less than 7 days), show days
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  // For older dates, show actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

// Create new announcement - Redirect to dedicated page
const announcementBtn = $('.comm-btn');
if (announcementBtn) {
  announcementBtn.addEventListener('click', () => {
    window.location.href = '/static/pages/announcements.html';
  });
}

// Sidebar navigation
$all('.menu-item').forEach(link => {
  link.addEventListener('click', () => {
    $all('.menu-item').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// Load Task Management Stats
async function loadTaskStats() {
  try {
    const res = await fetch('/dashboard/tasks/stats', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.ok) {
      const stats = await res.json();

      // Update Total Tasks
      const totalEl = document.getElementById('task-total');
      if (totalEl) totalEl.textContent = stats.total_tasks || 0;

      // Update Pending Review
      const pendingEl = document.getElementById('task-pending');
      if (pendingEl) pendingEl.textContent = stats.pending_review || 0;

      // Update Completed
      const completedEl = document.getElementById('task-completed');
      if (completedEl) completedEl.textContent = stats.completed || 0;

      // Update Overdue
      const overdueEl = document.getElementById('task-overdue');
      if (overdueEl) overdueEl.textContent = stats.overdue || 0;
    } else {
      window.handleAuthError(res);
    }
  } catch (err) {
    console.error("Error loading task stats:", err);
  }
}

// Load Recent Tasks
async function loadRecentTasks() {
  try {
    const res = await fetch('/dashboard/tasks/recent', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.ok) {
      const tasks = await res.json();
      renderRecentTasks(tasks);
    } else {
      window.handleAuthError(res);
    }
  } catch (err) {
    console.error("Error loading recent tasks:", err);
  }
}

function renderRecentTasks(tasks) {
  const tbody = document.getElementById('recent-tasks-tbody');
  if (!tbody) return;

  if (!tasks || tasks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: #888;">
          <i class="fas fa-tasks" style="font-size: 3em; opacity: 0.3; margin-bottom: 10px;"></i>
          <p>No recent tasks found. Create your first task!</p>
        </td>
      </tr>
    `;
    return;
  }

  // Show only 3 most recent tasks
  tbody.innerHTML = tasks.slice(0, 3).map(task => {
    // Format due date
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) : 'No due date';

    // Determine status class and color
    let statusClass = 'status-active';
    let statusColor = '#10b981'; // green

    if (task.status === 'Overdue') {
      statusClass = 'status-overdue';
      statusColor = '#ef4444'; // red
    } else if (task.status === 'In Progress') {
      statusClass = 'status-progress';
      statusColor = '#3b82f6'; // blue
    } else if (task.status === 'Completed') {
      statusClass = 'status-completed';
      statusColor = '#8b5cf6'; // purple
    }

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center;">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
              <i class="fas fa-clipboard-list" style="color: white; font-size: 1.2em;"></i>
            </div>
            <div>
              <strong style="display: block; font-size: 0.95em;">${task.title}</strong>
              <small style="color: #64748b; font-size: 0.85em;">${task.description || 'No description'}</small>
            </div>
          </div>
        </td>
        <td><span class="batch-badge">${task.batch_name}</span></td>
        <td style="color: ${task.status === 'Overdue' ? '#ef4444' : '#475569'};">${dueDate}</td>
        <td><strong>${task.submissions}</strong></td>
        <td>
          <span class="status-badge ${statusClass}" style="background-color: ${statusColor}20; color: ${statusColor}; padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: 600;">
            ${task.status}
          </span>
        </td>
        <td>
          <button class="action-btn" onclick="viewTask(${task.assignment_id})" title="View Details">
            <i class="fas fa-eye" style="color: var(--primary-color);"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// View task details
window.viewTask = async function (taskId) {
  try {
    const res = await fetch(`/assignments/${taskId}/detail`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.ok) {
      const data = await res.json();

      // Populate Modal
      $('#detailTaskTitle').textContent = data.title;
      $('#detailBatchName').textContent = data.batch_name;
      $('#detailDueDate').textContent = new Date(data.due_date).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });
      $('#detailDescription').textContent = data.description || 'No description provided.';

      $('#detailTotalSub').textContent = data.submission_stats.total;
      $('#detailGradedSub').textContent = data.submission_stats.graded;
      $('#detailPendingSub').textContent = data.submission_stats.ungraded;

      const rate = data.submission_stats.expected > 0
        ? Math.round((data.submission_stats.total / data.submission_stats.expected) * 100)
        : 0;
      $('#detailSubmissionRate').textContent = `${rate}% Completion`;

      $('#reviewTaskLink').href = `/admin/task-review?assignment_id=${taskId}`;

      $('#taskDetailModal').classList.add('active');
    } else {
      showToast('Failed to load task details', 'error');
    }
  } catch (err) {
    console.error("Error viewing task:", err);
    showToast('Network error', 'error');
  }
};

// Modal Close Listeners
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = $('#closeDetailModal');
  const closeBtnFooter = $('#closeDetailBtn');
  const modal = $('#taskDetailModal');

  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
  if (closeBtnFooter) closeBtnFooter.onclick = () => modal.classList.remove('active');

  window.onclick = (event) => {
    if (event.target == modal) {
      modal.classList.remove('active');
    }
  }
});

// Initial logout function was here - now handled by auth.js helper
window.logout = window.logout || function () {
  localStorage.removeItem('access_token');
  localStorage.removeItem('role');
  window.location.href = '/';
};
