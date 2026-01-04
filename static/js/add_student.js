const form = document.getElementById("addStudentForm");


document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.warn("No access token found. Redirecting to login.");
    window.location.href = "/";
    return;
  }

  // Populate Batches
  try {
    const res = await fetch('/batches/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const batches = await res.json();
      const select = document.getElementById('studentBatch');
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

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = document.getElementById("studentName").value.trim();
  const email = document.getElementById("studentEmail").value.trim();
  const batchId = document.getElementById("studentBatch").value;
  // Status logic if needed

  const token = localStorage.getItem('access_token');

  if (!name || !email || !batchId) {
    showToast("Please fill all required fields", 'error');
    return;
  }

  try {
    // 1. Create User Account (Generic Password)
    const userRes = await fetch('/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password: "student123", // Default password
        phone: "0000000000",
        role: "STUDENT"
      })
    });

    if (!userRes.ok) {
      const d = await userRes.json();
      throw new Error(d.detail || "User creation failed");
    }
    const user = await userRes.json();

    // 2. Create Student Profile
    const studentRes = await fetch('/students/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: user.user_id,
        roll_no: `DOZO${user.user_id}`,
        parent_contact: "N/A",
        admission_date: new Date().toISOString().split('T')[0]
      })
    });

    if (!studentRes.ok) throw new Error("Student profile creation failed");
    const student = await studentRes.json();

    // 3. Enroll in Batch
    const enrollRes = await fetch('/enrollment/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        student_id: student.student_id,
        batch_id: parseInt(batchId)
      })
    });

    if (!enrollRes.ok) throw new Error("Enrollment failed");

    // Show Success Modal
    document.getElementById("modalStudentName").textContent = name;
    document.getElementById("successModal").classList.add("active");

  } catch (error) {
    console.error(error);
    showToast(`Error: ${error.message}`, 'error');
  }
});
