document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://simplelogin-t22x.onrender.com/api";

    // --- Login form elements ---
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const formStatus = document.getElementById("formStatus");
    const submitBtn = document.getElementById("submitBtn");
    const togglePassword = document.getElementById("togglePassword");

    // --- Forgot password elements ---
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    const forgotPasswordPanel = document.getElementById("forgotPasswordPanel");
    const backToLoginLink = document.getElementById("backToLoginLink");
    const resetEmailInput = document.getElementById("resetEmail");
    const resetEmailError = document.getElementById("resetEmail-error");
    const resetStatus = document.getElementById("resetStatus");
    const sendResetBtn = document.getElementById("sendResetBtn");

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

    // --- Forgot password panel toggle ---
    forgotPasswordLink.addEventListener("click", (e) => {
        e.preventDefault();
        form.hidden = true;
        forgotPasswordPanel.hidden = false;
        resetStatus.textContent = "";
        resetStatus.className = "form-status";
        resetEmailError.textContent = "";
        resetEmailInput.value = emailInput.value.trim(); // prefill if they already typed it
    });

    backToLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        forgotPasswordPanel.hidden = true;
        form.hidden = false;
    });

    // --- Forgot password submit ---
    sendResetBtn.addEventListener("click", async () => {
        resetEmailError.textContent = "";
        resetStatus.textContent = "";
        resetStatus.className = "form-status";

        const email = resetEmailInput.value.trim();
        if (!email) {
            resetEmailError.textContent = "Email is required";
            resetEmailInput.classList.add("invalid");
            return;
        }
        resetEmailInput.classList.remove("invalid");

        sendResetBtn.disabled = true;
        sendResetBtn.classList.add("loading");

        try {
            const response = await fetch(`${API_BASE}/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                resetStatus.textContent = data.message || "Something went wrong. Please try again.";
                resetStatus.classList.add("error");
                return;
            }

            resetStatus.textContent = data.message || "Temporary password sent to your email.";
            resetStatus.classList.add("success");

        } catch (err) {
            resetStatus.textContent = "Could not reach the server. Please try again.";
            resetStatus.classList.add("error");
        } finally {
            sendResetBtn.disabled = false;
            sendResetBtn.classList.remove("loading");
        }
    });
});