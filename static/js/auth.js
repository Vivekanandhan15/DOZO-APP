const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

const signInForm = document.getElementById('signInForm');

if (window.location.protocol === 'file:') {
  const container = document.getElementById('container') || document.body;
  const warning = document.createElement('div');
  warning.style.cssText = "background:red; color:white; padding:20px; position:fixed; top:0; left:0; width:100%; z-index:9999; text-align:center; font-weight:bold;";
  warning.innerHTML = "CRITICAL ERROR: DO NOT OPEN FILES DIRECTLY! <br> Please visit <a href='http://127.0.0.1:8000' style='color:yellow'>http://127.0.0.1:8000</a> in your browser.";
  document.body.prepend(warning);
  alert("You are opening the file directly from disk. This will BREAK the application. Please use http://127.0.0.1:8000 instead!");
}

// Redirect localhost to 127.0.0.1 for consistent localStorage
if (window.location.hostname === 'localhost') {
  console.warn("Redirecting from localhost to 127.0.0.1 for session consistency.");
  window.location.hostname = '127.0.0.1';
}

// Global Auth Helpers
window.getAuthToken = function () {
  const token = localStorage.getItem('access_token');
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
};

window.logout = function () {
  localStorage.removeItem('access_token');
  localStorage.removeItem('role');
  localStorage.removeItem('user_id');
  window.location.href = '/';
};

window.parseJwt = function (token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

window.getCurrentUserId = function () {
  let id = localStorage.getItem('user_id');
  if (id && id !== 'undefined' && id !== 'null') return id;

  const token = window.getAuthToken();
  if (token) {
    const decoded = window.parseJwt(token);
    if (decoded && decoded.user_id) {
      localStorage.setItem('user_id', decoded.user_id);
      return decoded.user_id;
    }
  }
  return null;
};

window.getCurrentRole = function () {
  let role = localStorage.getItem('role');
  if (role && role !== 'undefined' && role !== 'null') return role.toUpperCase();

  const token = window.getAuthToken();
  if (token) {
    const decoded = window.parseJwt(token);
    if (decoded && decoded.role) {
      const upperRole = decoded.role.toUpperCase();
      localStorage.setItem('role', upperRole);
      return upperRole;
    }
  }
  return null;
};

window.handleAuthError = function (response) {
  if (response.status === 401) {
    console.error("Auth failed (401). Redirecting to login.");
    window.logout();
    return true;
  }
  return false;
};


// Toast Notification Helper
window.showToast = function (message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};


// Handle Sign In
if (signInForm) {
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;

    try {
      console.log("Attempting login for:", email);
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      console.log("Login Status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("LOGIN SUCCESS! Response Data:", data);

        if (!data.access_token) {
          showToast("Error: No access token received", 'error');
          return;
        }

        localStorage.setItem('access_token', data.access_token);

        const role = data.role ? data.role.toUpperCase() : "STUDENT"; // Default to STUDENT
        localStorage.setItem('role', role);
        localStorage.setItem('user_id', data.user_id);

        showToast("Login Successful! Redirecting...", 'success');
        console.log("Redirecting for role:", role);

        setTimeout(() => {
          if (role === 'ADMIN') {
            console.log("Going to /admin");
            window.location.href = '/admin';
          } else if (role === 'TEACHER') {
            console.log("Going to /teacher");
            window.location.href = '/teacher';
          } else {
            console.log("Going to /student");
            window.location.href = '/student';
          }
        }, 1000);

      } else {
        const data = await response.json();
        console.error("LOGIN FAILED:", data);
        showToast(`Login failed: ${data.detail || 'Invalid credentials'}`, 'error');
      }
    } catch (error) {
      console.error('CRITICAL JS ERROR:', error);
      showToast('An error occurred. Please check the browser console.', 'error');
    }
  });
}

// Handle Demo Buttons
document.addEventListener('DOMContentLoaded', () => {
  const adminDemoBtn = document.getElementById('adminDemo');
  const teacherDemoBtn = document.getElementById('teacherDemo');
  const studentDemoBtn = document.getElementById('studentDemo');
  const emailInput = document.getElementById('signinEmail');
  const passwordInput = document.getElementById('signinPassword');
  const signInForm = document.getElementById('signInForm');

  if (adminDemoBtn && teacherDemoBtn && studentDemoBtn && emailInput && passwordInput && signInForm) {
    const handleDemoLogin = (email, password) => {
      emailInput.value = email;
      passwordInput.value = password;
      // Trigger the form submission
      signInForm.dispatchEvent(new Event('submit', { cancelable: true }));
    };

    adminDemoBtn.addEventListener('click', () => handleDemoLogin('admin_demo@dozo.com', 'demo123'));
    teacherDemoBtn.addEventListener('click', () => handleDemoLogin('teacher_demo@dozo.com', 'demo123'));
    studentDemoBtn.addEventListener('click', () => handleDemoLogin('student_demo@dozo.com', 'demo123'));
  }
});
