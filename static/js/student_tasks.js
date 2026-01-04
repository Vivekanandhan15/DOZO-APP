let allTasks = [];

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { window.location.href = '/'; return; }

    await fetchAssignments();

    // Filters
    const filterBtns = document.querySelectorAll(".task-filters button");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const filter = btn.dataset.filter;
            renderTasks(filter === 'all' ? allTasks : allTasks.filter(t => t.status === filter));
        });
    });
});

async function fetchAssignments() {
    const token = localStorage.getItem('access_token');
    try {
        const [assignmentsRes, submissionsRes] = await Promise.all([
            fetch('/assignments/me', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/submissions/me', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        let assignments = assignmentsRes.ok ? await assignmentsRes.json() : [];
        let submissions = submissionsRes.ok ? await submissionsRes.json() : [];

        allTasks = assignments.map(a => {
            const sub = submissions.find(s => s.assignment_id === a.assignment_id);
            const due = new Date(a.due_date);
            const today = new Date();
            const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

            return {
                id: a.assignment_id,
                title: a.title,
                description: a.description,
                teacherName: a.teacher_name || "Admin",
                due_date: a.due_date,
                dueText: sub ? "SUBMITTED" : (diff < 0 ? "Overdue" : diff === 0 ? "Due: Today" : `Due: ${diff} days`),
                dueColor: sub ? "submitted" : (diff < 0 ? "overdue" : diff === 0 ? "today" : "upcoming"),
                status: sub ? "submitted" : "pending",
                points: a.points,
                submission: sub
            };
        });

        renderTasks(allTasks);
    } catch (e) { console.error(e); }
}

function extractLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

const startedTasks = JSON.parse(localStorage.getItem('startedTasks') || '[]');

function renderTasks(tasks) {
    const grid = document.querySelector(".task-grid");
    grid.innerHTML = "";

    tasks.forEach(task => {
        let actionBtn = "";
        if (task.status === "submitted") {
            actionBtn = `<button class="action-btn view-sub" onclick="viewFeedback(${task.id})">View Submission</button>`;
        } else {
            const isStarted = startedTasks.includes(task.id);
            if (isStarted) {
                actionBtn = `<button class="action-btn start-task" style="background:#4ecdc4;" onclick="openSubmissionModal(${task.id})">Submit Task</button>`;
            } else {
                actionBtn = `<button class="action-btn start-task" onclick="startTask(${task.id})">Start Task</button>`;
            }
        }

        const links = extractLinks(task.description);
        let linksHtml = "";
        if (links.length > 0) {
            linksHtml = `<div class="task-links-stack">
                ${links.map(link => `<a href="${link}" target="_blank" class="task-link"><i class="fas fa-link"></i> ${new URL(link).hostname}</a>`).join('')}
            </div>`;
        }

        const card = document.createElement("div");
        card.className = `horizontal-task-card`;
        card.innerHTML = `
            <div class="task-left-meta">
                <div class="task-icon-box">
                    <i class="fas fa-book-open"></i>
                </div>
                <span class="due-pill ${task.dueColor}">${task.dueText}</span>
            </div>
            
            <div class="task-main-details">
                <div class="task-header-info">
                    <h3 class="task-title">${task.title}</h3>
                    <span class="posted-by">Posted by ${task.teacherName}</span>
                </div>
                <p class="task-description">${task.description.replace(/(https?:\/\/[^\s]+)/g, '')}</p>
                ${linksHtml}
            </div>

            <div class="task-right-actions">
                <div class="task-points-badge">
                    <i class="fas fa-trophy"></i>
                    <span>${task.points} pts</span>
                </div>
                ${actionBtn}
            </div>
        `;
        grid.appendChild(card);
    });
}

function startTask(taskId) {
    if (!startedTasks.includes(taskId)) {
        startedTasks.push(taskId);
        localStorage.setItem('startedTasks', JSON.stringify(startedTasks));
    }
    renderTasks(allTasks);
}

function openSubmissionModal(taskId) {
    document.getElementById('submitTaskId').value = taskId;
    document.getElementById('submissionModal').style.display = 'flex';
}

function closeSubmissionModal() {
    document.getElementById('submissionModal').style.display = 'none';
}

async function handleSubmission(event) {
    event.preventDefault();
    const taskId = document.getElementById('submitTaskId').value;
    const fileUrl = document.getElementById('submitFileUrl').value;
    const token = localStorage.getItem('access_token');

    try {
        const res = await fetch('/submissions/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ assignment_id: taskId, file_url: fileUrl })
        });

        if (res.ok) {
            alert("Submitted! 🎉");
            closeSubmissionModal();
            fetchAssignments();
        } else {
            const err = await res.json();
            alert("Error: " + (err.detail || "Submission failed"));
        }
    } catch (e) { alert("Network error"); }
}

function viewFeedback(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task || !task.submission) return;

    const sub = task.submission;
    document.getElementById('feedbackTitle').textContent = `Review: ${task.title}`;
    document.getElementById('submissionLink').href = sub.file_url;
    document.getElementById('feedbackGrade').textContent = sub.grade !== null ? sub.grade : 'Pending Grade';
    document.getElementById('feedbackTotalPoints').textContent = task.points;
    document.getElementById('feedbackText').textContent = sub.feedback || 'No feedback provided yet.';

    document.getElementById('feedbackModal').style.display = 'flex';
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
}

function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/';
}
