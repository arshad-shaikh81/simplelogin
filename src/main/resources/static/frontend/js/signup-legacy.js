// ============================================================
// Create Account form — validation + submission
// ============================================================

const API_URL = "http://localhost:8080/api/signup";// adjust to match backend

const form = document.getElementById("signupForm");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");

const fields = {
  name: document.getElementById("name"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  terms: document.getElementById("terms"),
};

const genderGroup = document.getElementById("genderGroup");
const genderRadios = form.querySelectorAll('input[name="gender"]');

const errorEls = {
  name: document.getElementById("name-error"),
  email: document.getElementById("email-error"),
  password: document.getElementById("password-error"),
  terms: document.getElementById("terms-error"),
};

const ERROR_MESSAGES = {
  name: "Name is required",
  email: "Enter a valid email address",
  password: "Password must contain at least 8 characters",
  terms: "You must accept the Terms & Conditions",
};
// ------------------------------------------------------------
// Individual field validators — each returns true/false and
// updates its own error message + styling.
// ------------------------------------------------------------

function setFieldState(input, errorEl, isValid, message) {
  if (isValid) {
    input.classList.remove("invalid");
    input.classList.add("valid");
    errorEl.textContent = "";
  } else {
    input.classList.remove("valid");
    input.classList.add("invalid");
    errorEl.textContent = message || "";
  }
  return isValid;
}

function validateName() {
  const value = fields.name.value.trim();
  const isValid = value.length > 0;
  return setFieldState(fields.name, errorEls.name, isValid, ERROR_MESSAGES.name);
}

function validateEmail() {
  const value = fields.email.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(value);
  return setFieldState(fields.email, errorEls.email, isValid, ERROR_MESSAGES.email);
}

function validatePassword() {
  const value = fields.password.value;
  const isValid = value.length >= 8;
  return setFieldState(fields.password, errorEls.password, isValid, ERROR_MESSAGES.password);
}

function validateTerms() {
  const isValid = fields.terms.checked;
  errorEls.terms.textContent = isValid ? "" : ERROR_MESSAGES.terms;
  return isValid;
}

function validateAll() {
  const results = [
    validateName(),
    validateEmail(),
    validatePassword(),
    validateTerms(),
  ];
  return results.every(Boolean);
}

function updateSubmitState() {
  const nameOk = fields.name.value.trim().length > 0;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim());
  const passwordOk = fields.password.value.length >= 8;
  const termsOk = fields.terms.checked;

  const allOk = nameOk && emailOk && passwordOk && termsOk;
  submitBtn.disabled = !allOk;
}

// ------------------------------------------------------------
// Real-time validation wiring
// ------------------------------------------------------------

fields.name.addEventListener("input", () => { validateName(); updateSubmitState(); });
fields.email.addEventListener("input", () => { validateEmail(); updateSubmitState(); });
fields.password.addEventListener("input", () => { validatePassword(); updateSubmitState(); });
fields.terms.addEventListener("change", () => { validateTerms(); updateSubmitState(); });

// Password show/hide toggle
const togglePasswordBtn = document.getElementById("togglePassword");
togglePasswordBtn.addEventListener("click", () => {
  const isHidden = fields.password.type === "password";
  fields.password.type = isHidden ? "text" : "password";
  togglePasswordBtn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
});

// ------------------------------------------------------------
// Submission
// ------------------------------------------------------------

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const isValid = validateAll();
  updateSubmitState();

  if (!isValid) {
    formStatus.textContent = "Please fix the highlighted fields before continuing.";
    formStatus.className = "form-status error";
    return;
  }

  const selectedGender = form.querySelector('input[name="gender"]:checked').value;

  const payload = {
    name: fields.name.value.trim(),
    email: fields.email.value.trim(),
    password: fields.password.value,
    termsAccepted: fields.terms.checked,
  };

  submitBtn.disabled = true;
  submitBtn.classList.add("loading");
  formStatus.textContent = "";
  formStatus.className = "form-status";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong. Please try again.");
    }

    formStatus.textContent = "Account created successfully.";
    formStatus.className = "form-status success";
    form.reset();
    Object.values(fields).forEach((el) => el.classList.remove("valid", "invalid"));
  } catch (err) {
    formStatus.textContent = err.message || "Unable to reach the server. Please try again.";
    formStatus.className = "form-status error";
  } finally {
    submitBtn.classList.remove("loading");
    updateSubmitState();
  }
});

// Initial state
updateSubmitState();