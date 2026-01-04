document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("setupForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            password: document.getElementById("password").value,
            role: "Admin" // Frontend hint, backend enforces it
        };

        try {
            const response = await fetch("/users/setup-admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                alert("Admin user created successfully! ✅\nYou can now log in at the main page.");
                window.location.href = "/";
            } else {
                alert("Error: " + (result.detail || "Failed to create admin user"));
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Network error. Please try again.");
        }
    });
});
