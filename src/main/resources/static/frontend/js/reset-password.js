document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://simplelogin-t22x.onrender.com/api";

    const form = document.getElementById("resetForm");
    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("email-error");
    const formStatus = document.getElementById("formStatus");
    const submitBtn = document.getElementById("submitBtn");

    // ---- Validation ----
    function setError(message) {
        emailError.textContent = message;
        emailInput.classList.toggle("invalid", !!message);
    }

    function getFieldError() {
        const email = emailInput.value.trim();
        if (!email) return "Email is required";
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email) ? "" : "Enter a valid email address";
    }

    function validateField() {
        const message = getFieldError();
        setError(message);
        return message === "";
    }

    function updateSubmitState() {
        submitBtn.disabled = getFieldError() !== "";
    }

    emailInput.addEventListener("blur", validateField);
    emailInput.addEventListener("input", () => {
        if (emailInput.classList.contains("invalid") && getFieldError() === "") {
            setError("");
        }
        updateSubmitState();
    });

    function clearStatus() {
        formStatus.textContent = "";
        formStatus.className = "form-status";
    }

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading || getFieldError() !== "";
        submitBtn.classList.toggle("loading", isLoading);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearStatus();

        if (!validateField()) return;

        const email = emailInput.value.trim();
        setLoading(true);

        // Render's free tier spins down after inactivity — if the request is still
        // pending after a few seconds, let the user know it's a cold start, not a hang.
        const wakeupTimer = setTimeout(() => {
            formStatus.textContent = "Waking up the server… this can take up to a minute on first use.";
            formStatus.className = "form-status";
        }, 3000);

        try {
            const response = await fetch(`${API_BASE}/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            clearTimeout(wakeupTimer);

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                formStatus.textContent = data.message || "Something went wrong.";
                formStatus.classList.add("error");
                return;
            }

            formStatus.textContent = "Password reset link has been sent.";
            formStatus.classList.add("success");
            form.reset();
            submitBtn.disabled = true;

        } catch (err) {
            clearTimeout(wakeupTimer);
            formStatus.textContent = "Could not reach the server. Please try again.";
            formStatus.classList.add("error");
        } finally {
            setLoading(false);
        }
    });
});