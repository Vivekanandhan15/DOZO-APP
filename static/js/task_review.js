const API_BASE = '';
let authToken = localStorage.getItem('access_token');
let allSubmissions = [];

document.addEventListener('DOMContentLoaded', () => {
    const token = window.getAuthToken();
    if (!token) {
        window.location.href = '/';
        return;
    }

    setupListeners();
    loadBatches();
    loadSubmissions();
});

function setupListeners() {
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('batchFilter').addEventListener('change', applyFilters);
}

async function loadBatches() {
    const token = window.getAuthToken();
    const select = document.getElementById('batchFilter');

    try {
        const response = await fetch('/teacher/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            // Keep "All Batches"
            select.innerHTML = '<option value="all">All Batches</option>';
            data.batches.forEach(batch => {
                const opt = document.createElement('option');
                opt.value = batch.name;
                opt.textContent = batch.name;
                select.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Error loading batches:', error);
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const batchFilter = document.getElementById('batchFilter').value;

    const filtered = allSubmissions.filter(sub => {
        const studentName = (sub.student_name || '').toLowerCase();
        const assignmentTitle = (sub.assignment_title || '').toLowerCase();
        const batchName = (sub.batch_name || '').toLowerCase();

        const searchMatch = studentName.includes(searchTerm) || assignmentTitle.includes(searchTerm);
        const batchMatch = batchFilter === 'all' || sub.batch_name === batchFilter;

        return searchMatch && batchMatch;
    });

    renderSubmissions(filtered);
}

async function loadSubmissions() {
    const listContainer = document.getElementById('submissionsList');
    try {
        const response = await fetch(`${API_BASE}/submissions/all`, {
            headers: { 'Authorization': `Bearer ${window.getAuthToken()}` }
        });

        if (!response.ok) {
            if (window.handleAuthError(response)) return;
            throw new Error('Failed to fetch submissions');
        }

        const submissions = await response.json();
        allSubmissions = submissions;
        renderSubmissions(submissions);

    } catch (error) {
        console.error('Error:', error);
        listContainer.innerHTML = '<p style="text-align: center; color: red;">Error loading submissions.</p>';
    }
}

function renderSubmissions(submissions) {
    const listContainer = document.getElementById('submissionsList');
    listContainer.innerHTML = '';

    if (submissions.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #888;">No submissions found.</p>';
        return;
    }

    submissions.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'submission-card';

        const hasGrade = sub.grade !== null;
        const statusColor = hasGrade ? '#2ecc71' : '#f1c40f';
        const statusText = hasGrade ? `Graded: ${sub.grade}` : 'Pending Review';

        card.innerHTML = `
            <div class="submission-info">
                <h3>${sub.assignment_title || 'Assignment #' + sub.assignment_id}</h3>
                <p><strong>Student:</strong> ${sub.student_name || 'ID: ' + sub.student_id} (${sub.batch_name || 'N/A'})</p>
                <p><strong>File:</strong> <a href="${sub.file_url}" target="_blank" class="file-link">View Submission</a></p>
                <p><strong>Submitted:</strong> ${new Date(sub.submitted_at).toLocaleString()}</p>
                <p style="color: ${statusColor}; font-weight: bold; margin-top: 5px;">${statusText}</p>
            </div>
            <div class="grading-section">
                <input type="number" class="grade-input" placeholder="0-100" value="${sub.grade || ''}" ${hasGrade ? 'disabled' : ''}>
                <input type="text" class="feedback-input" placeholder="Feedback..." value="${sub.feedback || ''}" ${hasGrade ? 'disabled' : ''}>
                ${hasGrade ? '' : `<button class="btn-grade" onclick="submitGrade(${sub.submission_id}, this)">Submit Grade</button>`}
            </div>
        `;
        listContainer.appendChild(card);
    });
}

async function submitGrade(submissionId, btnElement) {
    const card = btnElement.parentElement;
    const grade = card.querySelector('.grade-input').value;
    const feedback = card.querySelector('.feedback-input').value;

    if (!grade) {
        alert('Please enter a grade');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/submissions/${submissionId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${window.getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ grade: parseInt(grade), feedback: feedback })
        });

        if (!response.ok) {
            if (window.handleAuthError(response)) return;
            throw new Error('Failed to submit grade');
        }

        alert('Grade submitted successfully! ✅');
        loadSubmissions(); // Reload list

    } catch (error) {
        console.error('Error grading:', error);
        alert('Failed to submit grade ❌');
    }
}
