document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://simplelogin-t22x.onrender.com/api";
    const MIN_AGE = 18;

    const form = document.getElementById("signupForm");
    const submitBtn = document.getElementById("submitBtn");
    const formStatus = document.getElementById("formStatus");
    const togglePassword = document.getElementById("togglePassword");

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const dobInput = document.getElementById("dob");
    const phoneInput = document.getElementById("phone");
    const countryInput = document.getElementById("country");
    const termsInput = document.getElementById("termsAccepted");
    const genderGroup = document.getElementById("genderGroup");
    const genderRadios = Array.from(document.querySelectorAll('input[name="gender"]'));

    // Block future dates in the native date picker
    dobInput.max = new Date().toISOString().split("T")[0];

    // Show/hide password
    togglePassword.addEventListener("click", () => {
        const isHidden = passwordInput.type === "password";
        passwordInput.type = isHidden ? "text" : "password";
        togglePassword.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });

    // Phone: strip anything non-numeric as the user types, cap at 10 digits
    phoneInput.addEventListener("input", () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
        validateField("phone");
        updateSubmitState();
    });

    function getGenderValue() {
        const checked = genderRadios.find((r) => r.checked);
        return checked ? checked.value : "";
    }

    function calculateAge(dobString) {
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    }

    function setError(field, message) {
        const errorEl = document.getElementById(field + "-error");
        if (errorEl) errorEl.textContent = message;

        if (field === "gender") {
            genderGroup.classList.toggle("invalid", !!message);
        } else {
            const inputEl = document.getElementById(field);
            if (inputEl) inputEl.classList.toggle("invalid", !!message);
        }
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

            case "dob": {
                const value = dobInput.value;
                if (!value) return "Date of birth is required";
                if (new Date(value) > new Date()) return "Date of birth cannot be in the future";
                return calculateAge(value) >= MIN_AGE ? "" : "You must be at least 18 years old";
            }

            case "phone":
                return /^[0-9]{10}$/.test(phoneInput.value)
                    ? ""
                    : "Enter a valid 10-digit phone number";

            case "gender":
                return getGenderValue() ? "" : "Please select your gender";

            case "country":
                return countryInput.value ? "" : "Please select your country";

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

    const allFields = ["name", "email", "password", "dob", "phone", "gender", "country", "termsAccepted"];

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
    ["name", "email", "password", "dob", "country"].forEach((field) => {
        const el = document.getElementById(field);
        el.addEventListener("blur", () => validateField(field));
        el.addEventListener("input", updateSubmitState);
        el.addEventListener("change", updateSubmitState);
    });

    genderRadios.forEach((radio) => {
        radio.addEventListener("change", () => {
            validateField("gender");
            updateSubmitState();
        });
    });

    termsInput.addEventListener("change", () => {
        validateField("termsAccepted");
        updateSubmitState();
    });

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

        const payload = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            dob: dobInput.value,
            phone: phoneInput.value,
            gender: getGenderValue(),
            country: countryInput.value,
            termsAccepted: termsInput.checked,
        };

        try {
            const response = await fetch(`${API_BASE}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                // Backend sends { "message": "..." } on 400 (e.g. duplicate email, under-18)
                formStatus.textContent = data.message || "Sign up failed. Please try again.";
                formStatus.classList.add("error");
                return;
            }

            // Success: backend returns { message, userId, name, email }
            formStatus.textContent = `Welcome, ${data.name}! Redirecting to login...`;
            formStatus.classList.add("success");

            sessionStorage.setItem("userId", data.userId);

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);

        } catch (err) {
            formStatus.textContent = "Could not reach the server. Please try again.";
            formStatus.classList.add("error");
        } finally {
            setLoading(false);
        }
    });
});