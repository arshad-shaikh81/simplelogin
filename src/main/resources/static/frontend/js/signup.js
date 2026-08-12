document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://simplelogin-t22x.onrender.com/api";

    const form = document.getElementById("signupForm");
    const submitBtn = document.getElementById("submitBtn");
    const formStatus = document.getElementById("formStatus");
    const togglePassword = document.getElementById("togglePassword");
    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const passwordStrength = document.getElementById("passwordStrength");
    const passwordStrengthLabel = document.getElementById("passwordStrengthLabel");
    const termsInput = document.getElementById("termsAccepted");

    // Show/hide password
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

    // Show/hide confirm password
    toggleConfirmPassword.addEventListener("click", () => {
        const willBeVisible = confirmPasswordInput.type === "password";
        confirmPasswordInput.type = willBeVisible ? "text" : "password";
        toggleConfirmPassword.setAttribute("aria-label", willBeVisible ? "Hide password" : "Show password");
        setPasswordToggleIcon(toggleConfirmPassword, willBeVisible);
    });

    // Password strength: length + character variety
    function getPasswordStrength(password) {
        if (!password) return { level: "", label: "" };

        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return { level: "weak", label: "Weak" };
        if (score <= 4) return { level: "medium", label: "Medium" };
        return { level: "strong", label: "Strong" };
    }

    function updatePasswordStrength() {
        const { level, label } = getPasswordStrength(passwordInput.value);
        passwordStrength.dataset.level = level;
        passwordStrengthLabel.textContent = label;
    }

    passwordInput.addEventListener("input", () => {
        updatePasswordStrength();
        // Re-check confirm password whenever the password itself changes
        if (confirmPasswordInput.value) validateField("confirmPassword");
        updateSubmitState();
    });

    function setError(field, message) {
        const errorEl = document.getElementById(field + "-error");
        if (errorEl) errorEl.textContent = message;

        const inputEl = document.getElementById(field);
        if (inputEl) inputEl.classList.toggle("invalid", !!message);
    }

    // Returns "" (valid) or an error message for a single field
    function getFieldError(field) {
        switch (field) {
            case "name":
                return nameInput.value.trim() ? "" : "Name is required";

            case "email": {
                const email = emailInput.value.trim();
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailPattern.test(email) ? "" : "Enter a valid email address";
            }

            case "password":
                return passwordInput.value.length >= 8
                    ? ""
                    : "Password must contain at least 8 characters";

            case "confirmPassword":
                if (!confirmPasswordInput.value) return "Please confirm your password";
                return confirmPasswordInput.value === passwordInput.value
                    ? ""
                    : "Passwords do not match";

            case "termsAccepted":
                return termsInput.checked ? "" : "You must accept the Terms & Conditions";

            default:
                return "";
        }
    }

    function validateField(field) {
        const message = getFieldError(field);
        setError(field, message);
        return message === "";
    }

    const allFields = ["name", "email", "password", "confirmPassword", "termsAccepted"];

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

    // Real-time validation: validate on blur/change, re-check submit state on every input
    ["name", "email", "password", "confirmPassword"].forEach((field) => {
        const el = document.getElementById(field);
        el.addEventListener("blur", () => validateField(field));
        el.addEventListener("input", updateSubmitState);
        el.addEventListener("change", updateSubmitState);
    });

    termsInput.addEventListener("change", () => {
        validateField("termsAccepted");
        updateSubmitState();
    });

    // Fully reset the form: native fields, custom validity states, and the strength meter
    function resetSignupForm() {
        form.reset();

        allFields.forEach((field) => setError(field, ""));

        [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach((el) => {
            el.classList.remove("invalid", "valid");
        });

        passwordStrength.dataset.level = "";
        passwordStrengthLabel.textContent = "";

        passwordInput.type = "password";
        togglePassword.setAttribute("aria-label", "Show password");
        setPasswordToggleIcon(togglePassword, false);
        confirmPasswordInput.type = "password";
        toggleConfirmPassword.setAttribute("aria-label", "Show password");
        setPasswordToggleIcon(toggleConfirmPassword, false);

        updateSubmitState();
    }

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading || !isFormCurrentlyValid();
        submitBtn.classList.toggle("loading", isLoading);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!validateAll()) return;

        formStatus.textContent = "";
        formStatus.className = "form-status";
        setLoading(true);

        // Render's free tier spins down after inactivity — if the request is still
        // pending after a few seconds, let the user know it's a cold start, not a hang.
        const wakeupTimer = setTimeout(() => {
            formStatus.textContent = "Waking up the server… this can take up to a minute on first use.";
            formStatus.className = "form-status";
        }, 3000);

        const payload = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            termsAccepted: termsInput.checked,
        };

        try {
            const response = await fetch(`${API_BASE}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            clearTimeout(wakeupTimer);
            const data = await response.json();

            if (!response.ok) {
                // Backend sends { "message": "..." } on 400 (e.g. duplicate email),
                // or a map of per-field errors from bean validation.
                formStatus.textContent = data.message || Object.values(data)[0] || "Sign up failed. Please try again.";
                formStatus.classList.add("error");
                return;
            }

            // Success: backend returns { message, userId, name, email }
            sessionStorage.setItem("userId", data.userId);
            sessionStorage.setItem("justSignedUpEmail", payload.email);
            resetSignupForm();

            formStatus.textContent = `Account created successfully! Welcome, ${data.name}. Redirecting to login...`;
            formStatus.classList.add("success");

            setTimeout(() => {
                window.location.href = "/pages/index.html";
            }, 1800);

        } catch (err) {
            clearTimeout(wakeupTimer);
            formStatus.textContent = "Could not reach the server. Please try again.";
            formStatus.classList.add("error");
        } finally {
            setLoading(false);
        }
    });
});