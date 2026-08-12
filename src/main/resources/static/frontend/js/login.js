document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://simplelogin-t22x.onrender.com/api";
    const REMEMBER_KEY = "rememberedEmail";
    const TOKEN_KEY = "authToken";

    // ---- If a valid token already exists (remembered session), skip straight to dashboard ----
    const existingToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (existingToken && !isTokenExpired(existingToken)) {
        window.location.href = "/pages/dashboard.html";
        return;
    }

    // Reads the JWT's own expiry (exp claim) client-side, just to avoid bothering
    // the server with a request we already know will fail. The server still
    // re-validates the token on every real request — this is a UX shortcut only.
    function isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (!payload.exp) return false;
            return Date.now() >= payload.exp * 1000;
        } catch {
            return true; // malformed token, treat as expired/invalid
        }
    }

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
    function setPasswordToggleIcon(button, isVisible) {
        const eyeIcon = button.querySelector(".icon-eye");
        const eyeOffIcon = button.querySelector(".icon-eye-off");
        // Convention: open eye = "hidden, click to reveal", crossed eye = "visible, click to hide"
        eyeIcon.hidden = isVisible;
        eyeOffIcon.hidden = !isVisible;
    }

    togglePassword.addEventListener("click", () => {
        const willBeVisible = passwordInput.type === "password";
        passwordInput.type = willBeVisible ? "text" : "password";
        togglePassword.setAttribute("aria-label", willBeVisible ? "Hide password" : "Show password");
        setPasswordToggleIcon(togglePassword, willBeVisible);
    });

    // ---- Prefill email: prioritize a just-created signup account over an old "remembered" one ----
    const justSignedUpEmail = sessionStorage.getItem("justSignedUpEmail");
    if (justSignedUpEmail) {
        emailInput.value = justSignedUpEmail;
        sessionStorage.removeItem("justSignedUpEmail"); // only applies once
    } else {
        const rememberedEmail = localStorage.getItem(REMEMBER_KEY);
        if (rememberedEmail) {
            emailInput.value = rememberedEmail;
            rememberMeInput.checked = true;
        }
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
            const remember = rememberMeInput.checked;

            const response = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, rememberMe: remember }),
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

            // ---- Remember Me: persist (or clear) the email AND the auth token ----
            // Checked  -> localStorage: survives closing the browser, so the token
            //             on next visit lets us skip straight back to the dashboard.
            // Unchecked -> sessionStorage: cleared the moment the tab closes, same
            //             as before — a real "log in every time" session.
            if (remember) {
                localStorage.setItem(REMEMBER_KEY, email);
                localStorage.setItem(TOKEN_KEY, data.token);
                sessionStorage.removeItem(TOKEN_KEY);
            } else {
                localStorage.removeItem(REMEMBER_KEY);
                localStorage.removeItem(TOKEN_KEY);
                sessionStorage.setItem(TOKEN_KEY, data.token);
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