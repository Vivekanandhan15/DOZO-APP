document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("changePasswordForm");
    const newPasswordInput = document.getElementById("newPassword");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const strengthBar = document.getElementById("strengthBar");

    // Toggle Password Visibility
    document.querySelectorAll(".toggle-password").forEach(icon => {
        icon.addEventListener("click", () => {
            const input = icon.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
                icon.classList.replace("fa-eye", "fa-eye-slash");
            } else {
                input.type = "password";
                icon.classList.replace("fa-eye-slash", "fa-eye");
            }
        });
    });

    // Password Strength indicator
    newPasswordInput.addEventListener("input", (e) => {
        const val = e.target.value;
        let strength = 0;
        if (val.length > 5) strength += 25;
        if (val.match(/[A-Z]/)) strength += 25;
        if (val.match(/[0-9]/)) strength += 25;
        if (val.match(/[^a-zA-Z0-9]/)) strength += 25;

        strengthBar.style.width = strength + "%";
        if (strength <= 25) strengthBar.style.backgroundColor = "#ef4444";
        else if (strength <= 50) strengthBar.style.backgroundColor = "#fbbf24";
        else if (strength <= 75) strengthBar.style.backgroundColor = "#3b82f6";
        else strengthBar.style.backgroundColor = "#10b981";
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const oldPassword = document.getElementById("oldPassword").value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (newPassword !== confirmPassword) {
            showToast("Passwords do not match!", "error");
            return;
        }

        if (newPassword.length < 6) {
            showToast("Password must be at least 6 characters long", "error");
            return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            window.location.href = "/";
            return;
        }

        try {
            const response = await fetch("/users/me/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            if (response.ok) {
                showToast("Password updated successfully! ✅", "success");
                setTimeout(() => {
                    window.location.href = "/admin";
                }, 2000);
            } else {
                const data = await response.json();
                showToast(`Error: ${data.detail || "Failed to update password"}`, "error");
            }
        } catch (error) {
            console.error("Error:", error);
            showToast("Network error. Please try again.", "error");
        }
    });
});
