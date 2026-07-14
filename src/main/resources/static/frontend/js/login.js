document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://simplelogin-t22x.onrender.com/api";
    const REMEMBER_KEY = "rememberedEmail";

    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const formStatus = document.getElementById("formStatus");
    const submitBtn = document.getElementById("submitBtn");
    const togglePassword = document.getElementById("togglePassword");
    const rememberMeInput = document.getElementById("rememberMe");

    // Show/hide password (does not clear the input)
    togglePassword.addEventListener("click", () => {
        const isHidden = passwordInput.type === "password";
        passwordInput.type = isHidden ? "text" : "password";
        togglePassword.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });

    // ---- Remember Me: prefill email on load ----
    const rememberedEmail = localStorage.getItem(REMEMBER_KEY);
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMeInput.checked = true;
    }

    // ---- Validation ----
    function setError(field, message) {
        const errorEl = document.getElementById(field + "-error");
        if (errorEl) errorEl.textContent = message;
        const inputEl = document.getElementById(field);
        if (inputEl) inputEl.classList.toggle("invalid", !!message);
    }

    // Returns "" (valid) or an error message for a single field
    function getFieldError(field) {
        switch (field) {
            case "email": {
                const email = emailInput.value.trim();
                if (!email) return "Email is required";
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailPattern.test(email) ? "" : "Enter a valid email address";
            }
            case "password":
                return passwordInput.value ? "" : "Password is required";
            default:
                return "";
        }
    }

    function validateField(field) {
        const message = getFieldError(field);
        setError(field, message);
        return message === "";
    }

    const allFields = ["email", "password"];

    function validateAll() {
        let isValid = true;
        allFields.forEach((field) => {
            if (!validateField(field)) isValid = false;
        });
        return isValid;
    }

    function isFormCurrentlyValid() {
        return allFields.every((field) => getFieldError(field) === "");
    }

    function updateSubmitState() {
        submitBtn.disabled = !isFormCurrentlyValid();
    }

    // Real-time validation: validate on blur, re-check submit state on every input
    allFields.forEach((field) => {
        const el = document.getElementById(field);
        el.addEventListener("blur", () => validateField(field));
        el.addEventListener("input", () => {
            // Clear a stale error as soon as the user starts fixing it
            if (el.classList.contains("invalid") && getFieldError(field) === "") {
                setError(field, "");
            }
            updateSubmitState();
        });
    });

    // Run once on load in case Remember Me prefilled a valid email
    updateSubmitState();

    function clearStatus() {
        formStatus.textContent = "";
        formStatus.className = "form-status";
    }

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading || !isFormCurrentlyValid();
        submitBtn.classList.toggle("loading", isLoading);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearStatus();

        if (!validateAll()) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        setLoading(true);

        // Render's free tier spins down after inactivity — if the request is still
        // pending after a few seconds, let the user know it's a cold start, not a hang.
        const wakeupTimer = setTimeout(() => {
            formStatus.textContent = "Waking up the server… this can take up to a minute on first use.";
            formStatus.className = "form-status";
        }, 3000);

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            clearTimeout(wakeupTimer);
            const data = await response.json();

            if (!response.ok) {
                // Backend returns a generic "Invalid email or password" message on purpose,
                // so it never reveals whether the email itself is registered.
                formStatus.textContent = "Invalid Email or Password.";
                formStatus.classList.add("error");
                return;
            }

            // ---- Remember Me: persist or clear the email ----
            if (rememberMeInput.checked) {
                localStorage.setItem(REMEMBER_KEY, email);
            } else {
                localStorage.removeItem(REMEMBER_KEY);
            }

            formStatus.textContent = "Login Successful! Welcome back.";
            formStatus.classList.add("success");

            sessionStorage.setItem("userId", data.userId);
            sessionStorage.setItem("userName", data.name);
            sessionStorage.setItem("userEmail", data.email);

            setTimeout(() => {
                window.location.href = "/pages/dashboard.html";
            }, 800);

        } catch (err) {
            clearTimeout(wakeupTimer);
            formStatus.textContent = "Could not reach the server. Please try again.";
            formStatus.classList.add("error");
        } finally {
            setLoading(false);
        }
    });
});