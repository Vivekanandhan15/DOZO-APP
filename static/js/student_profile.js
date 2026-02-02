// Student Profile - Dynamic Data Loading

document.addEventListener('DOMContentLoaded', async () => {
  const authToken = localStorage.getItem('access_token');
  if (!authToken) {
    window.location.href = '/';
    return;
  }

  await loadStudentProfile();
  initTabs();
});

async function loadStudentProfile() {
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch('/students/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch profile');

    const studentData = await response.json();
    populateProfile(studentData);
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

function populateProfile(data) {
  const userName = data.user?.name || 'Student';
  const userEmail = data.user?.email || '';
  const userPhone = data.user?.phone || '';
  const roll = data.roll_no || '';

  // Update Overview
  const profileName = document.getElementById('profile-name');
  if (profileName) profileName.textContent = userName;

  const profileEmail = document.getElementById('profile-email');
  if (profileEmail) profileEmail.textContent = userEmail;

  const profileIdSpan = document.getElementById('profile-id');
  if (profileIdSpan) profileIdSpan.textContent = 'ID: ' + roll;

  const navName = document.getElementById('student-name-nav');
  if (navName) navName.textContent = userName;

  const avatar = document.querySelector('.avatar-large');
  if (avatar) avatar.textContent = userName.charAt(0).toUpperCase();

  // General info form
  const fullNameInput = document.getElementById('fullName');
  if (fullNameInput) fullNameInput.value = userName;

  const phoneInput = document.getElementById('phone');
  if (phoneInput) phoneInput.value = userPhone;

  const emailInput = document.getElementById('email');
  if (emailInput) emailInput.value = userEmail;

  const addressInput = document.getElementById('address');
  if (addressInput) addressInput.value = data.user?.address || '';

  const guardianInput = document.getElementById('guardian');
  if (guardianInput) guardianInput.value = data.parent_contact || '';

  // Academic details
  const enrollDateStr = data.admission_date ? new Date(data.admission_date).toLocaleDateString() : 'N/A';
  const acadEnroll = document.getElementById('acad-enroll-date');
  if (acadEnroll) acadEnroll.textContent = enrollDateStr;

  const acadRoll = document.getElementById('acad-roll');
  if (acadRoll) acadRoll.textContent = roll || 'N/A';

  // Batch Display
  const acadBatch = document.getElementById('acad-batch');
  if (acadBatch) {
    if (data.enrollments && data.enrollments.length > 0) {
      const batchNames = data.enrollments.map(e => e.batch?.name).filter(n => n).join(', ');
      acadBatch.textContent = batchNames || "Assigned";
    } else {
      acadBatch.textContent = "Unassigned";
    }
  }
}

// Update profile
const profileForm = document.getElementById('profile-form');
if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    const name = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    const guardian = document.getElementById('guardian').value.trim();

    try {
      const response = await fetch('/students/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          phone: phone,
          email: email,
          address: address,
          parent_contact: guardian
        })
      });

      if (response.ok) {
        alert('✅ Profile updated successfully');
        loadStudentProfile();
      } else {
        const error = await response.json();
        alert('Failed to update profile: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Network error updating profile');
    }
  });
}

// Change password
const passwordForm = document.getElementById('password-form');
if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    const oldPass = document.getElementById('oldPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (newPass !== confirm) {
      alert('New passwords do not match');
      return;
    }

    if (newPass.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch('/users/me/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          old_password: oldPass,
          new_password: newPass,
          confirm_password: confirm
        })
      });

      if (response.ok) {
        alert('🔐 Password updated successfully');
        e.target.reset();
      } else {
        const error = await response.json();
        alert('Failed to update password: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Network error updating password');
    }
  });
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add('active');
    });
  });
}

function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('role');
  window.location.href = '/';
}
