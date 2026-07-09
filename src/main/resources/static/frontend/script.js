// ============================================================
// Create Account form — validation + submission
// ============================================================

const API_URL = "http://localhost:8080/api/users/signup"; // adjust to match backend

const form = document.getElementById("signupForm");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");

const fields = {
  name: document.getElementById("name"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  dob: document.getElementById("dob"),
  phone: document.getElementById("phone"),
  country: document.getElementById("country"),
  terms: document.getElementById("terms"),
};

const genderGroup = document.getElementById("genderGroup");
const genderRadios = form.querySelectorAll('input[name="gender"]');

const errorEls = {
  name: document.getElementById("name-error"),
  email: document.getElementById("email-error"),
  password: document.getElementById("password-error"),
  dob: document.getElementById("dob-error"),
  phone: document.getElementById("phone-error"),
  gender: document.getElementById("gender-error"),
  country: document.getElementById("country-error"),
  terms: document.getElementById("terms-error"),
};

const dobHint = document.getElementById("dob-hint");

const ERROR_MESSAGES = {
  name: "Name is required",
  email: "Enter a valid email address",
  password: "Password must contain at least 8 characters",
  dob: "You must be at least 18 years old",
  dobRequired: "Date of birth is required",
  phone: "Enter a valid 10-digit phone number",
  gender: "Please select your gender",
  country: "Please select your country",
  terms: "You must accept the Terms & Conditions",
};

// Restrict DOB picker: no future dates
fields.dob.max = new Date().toISOString().split("T")[0];

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

function validateDob() {
  const value = fields.dob.value;

  if (!value) {
    dobHint.textContent = "";
    return setFieldState(fields.dob, errorEls.dob, false, ERROR_MESSAGES.dobRequired);
  }

  const selected = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selected > today) {
    dobHint.textContent = "";
    return setFieldState(fields.dob, errorEls.dob, false, "Future dates are not allowed");
  }

  const age = calculateAge(value);
  const isValid = age >= 18;

  dobHint.textContent = isValid
    ? `${selected.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Age ${age}`
    : "";

  return setFieldState(fields.dob, errorEls.dob, isValid, ERROR_MESSAGES.dob);
}

function validatePhone() {
  const value = fields.phone.value.trim();
  const isValid = /^\d{10}$/.test(value);
  return setFieldState(fields.phone, errorEls.phone, isValid, ERROR_MESSAGES.phone);
}

function validateGender() {
  const isValid = Array.from(genderRadios).some((r) => r.checked);
  genderGroup.classList.toggle("invalid", !isValid);
  errorEls.gender.textContent = isValid ? "" : ERROR_MESSAGES.gender;
  return isValid;
}

function validateCountry() {
  const value = fields.country.value;
  const isValid = value !== "";
  return setFieldState(fields.country, errorEls.country, isValid, ERROR_MESSAGES.country);
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
    validateDob(),
    validatePhone(),
    validateGender(),
    validateCountry(),
    validateTerms(),
  ];
  return results.every(Boolean);
}

function updateSubmitState() {
  const nameOk = fields.name.value.trim().length > 0;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim());
  const passwordOk = fields.password.value.length >= 8;
  const dobOk = fields.dob.value && calculateAge(fields.dob.value) >= 18 && new Date(fields.dob.value) <= new Date();
  const phoneOk = /^\d{10}$/.test(fields.phone.value.trim());
  const genderOk = Array.from(genderRadios).some((r) => r.checked);
  const countryOk = fields.country.value !== "";
  const termsOk = fields.terms.checked;

  const allOk = nameOk && emailOk && passwordOk && dobOk && phoneOk && genderOk && countryOk && termsOk;
  submitBtn.disabled = !allOk;
}

// ------------------------------------------------------------
// Real-time validation wiring
// ------------------------------------------------------------

fields.name.addEventListener("input", () => { validateName(); updateSubmitState(); });
fields.email.addEventListener("input", () => { validateEmail(); updateSubmitState(); });
fields.password.addEventListener("input", () => { validatePassword(); updateSubmitState(); });
fields.dob.addEventListener("change", () => { validateDob(); updateSubmitState(); });
fields.country.addEventListener("change", () => { validateCountry(); updateSubmitState(); });
fields.terms.addEventListener("change", () => { validateTerms(); updateSubmitState(); });

genderRadios.forEach((radio) => {
  radio.addEventListener("change", () => { validateGender(); updateSubmitState(); });
});

// Phone: strip non-digits as the user types, cap at 10
fields.phone.addEventListener("input", () => {
  fields.phone.value = fields.phone.value.replace(/\D/g, "").slice(0, 10);
  validatePhone();
  updateSubmitState();
});

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
    dob: fields.dob.value,
    phone: fields.phone.value.trim(),
    gender: selectedGender,
    country: fields.country.value,
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