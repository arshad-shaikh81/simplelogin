document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://simplelogin-t22x.onrender.com/api";

    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const formStatus = document.getElementById("formStatus");
    const submitBtn = document.getElementById("submitBtn");
    const togglePassword = document.getElementById("togglePassword");

    // Show/hide password
    togglePassword.addEventListener("click", () => {
        const isHidden = passwordInput.type === "password";
        passwordInput.type = isHidden ? "text" : "password";
        togglePassword.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });

    function clearErrors() {
        emailError.textContent = "";
        passwordError.textContent = "";
        emailInput.classList.remove("invalid");
        passwordInput.classList.remove("invalid");
        formStatus.textContent = "";
        formStatus.className = "form-status";
    }

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.classList.toggle("loading", isLoading);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        let hasError = false;
        if (!email) {
            emailError.textContent = "Email is required";
            emailInput.classList.add("invalid");
            hasError = true;
        }
        if (!password) {
            passwordError.textContent = "Password is required";
            passwordInput.classList.add("invalid");
            hasError = true;
        }
        if (hasError) return;

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                formStatus.textContent = data.message || "Login failed. Please try again.";
                formStatus.classList.add("error");
                return;
            }

            formStatus.textContent = `Welcome back, ${data.name}!`;
            formStatus.classList.add("success");

            sessionStorage.setItem("userId", data.userId);
            sessionStorage.setItem("userName", data.name);
            sessionStorage.setItem("userEmail", data.email);

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 800);

        } catch (err) {
            formStatus.textContent = "Could not reach the server. Please try again.";
            formStatus.classList.add("error");
        } finally {
            setLoading(false);
        }
    });
});