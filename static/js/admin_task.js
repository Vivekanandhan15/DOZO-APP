// Logic for Task Page



const form = document.getElementById("taskForm"); // Correct ID from HTML

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn("No access token found. Redirecting to login.");
    window.location.href = "/";
    return;
  }

  try {
    const res = await fetch('/batches/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const batches = await res.json();
      const select = document.getElementById('assigned_to'); // Matches HTML ID
      // Keep option 0 if exists or clear
      select.innerHTML = '<option value="">Select Batch</option>';
      batches.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.batch_id;
        opt.textContent = b.name;
        select.appendChild(opt);
      });
    }
  } catch (err) {
    console.error("Failed to load batches", err);
  }
});

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("task_title").value.trim();
    const description = document.getElementById("task_description").value.trim();
    const dueDate = document.getElementById("due_date").value;
    const assignedTo = document.getElementById("assigned_to").value;
    const priority = document.getElementById("priority").value; // Not in backend Schema yet
    const token = localStorage.getItem('access_token');

    if (!title || !dueDate || !assignedTo) {
      showToast("Please fill all required fields", 'error');
      return;
    }

    // New Validation
    if (title.length < 3) {
      showToast("Title must be at least 3 characters", 'error');
      return;
    }

    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      showToast("Due date cannot be in the past", 'error');
      return;
    }

    try {
      const res = await fetch('/assignments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title,
          description: description,
          batch_id: parseInt(assignedTo),
          due_date: dueDate,
          points: 100 // Default points
        })
      });

      if (res.ok) {
        showToast("✅ Task created successfully!", 'success');
        window.location.href = "/admin";
      } else {
        const d = await res.json();
        showToast(`Failed: ${d.detail || 'Error creating task'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast("Network error", 'error');
    }
  });
}



function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function priorityColor(priority) {
  if (priority === "high") return "red";
  if (priority === "low") return "green";
  return "blue";
}

function formatDueIn(date) {
  const today = new Date();
  const due = new Date(date);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diff <= 0) return "Today";
  if (diff === 1) return "1 day";
  return `${diff} days`;
}
