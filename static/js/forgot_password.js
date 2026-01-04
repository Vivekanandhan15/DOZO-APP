const form = document.querySelector("form");
const emailInput = document.querySelector("input[type='email']");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = emailInput.value.trim();

  if (!email) {
    alert("Please enter your email address");
    return;
  }

  const users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

  const userExists = users.some(user => user.email === email);

  if (!userExists) {
    alert("❌ Email not found. Please check and try again.");
    return;
  }

  alert(
    "✅ Password reset link has been sent to your email.\n\n(Check inbox or spam folder)"
  );

  form.reset();
});
