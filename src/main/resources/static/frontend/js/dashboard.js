document.addEventListener("DOMContentLoaded", async () => {

    const API_BASE = "https://simplelogin-t22x.onrender.com/api";

    const loadingEl = document.getElementById("dashLoading");
    const contentEl = document.getElementById("dashContent");
    const errorEl = document.getElementById("dashError");
    const logoutBtn = document.getElementById("logoutBtn");

    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    const deleteModal = document.getElementById("deleteModal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    const TOKEN_KEY = "authToken";

    // Token may live in localStorage (Remember me was checked) or
    // sessionStorage (a plain, tab-only session) — check both.
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

    function getUserIdFromToken(t) {
        try {
            const payload = JSON.parse(atob(t.split(".")[1]));
            return payload.sub || null;
        } catch {
            return null;
        }
    }

    function isTokenExpired(t) {
        try {
            const payload = JSON.parse(atob(t.split(".")[1]));
            if (!payload.exp) return false;
            return Date.now() >= payload.exp * 1000;
        } catch {
            return true;
        }
    }

    const userId = token ? getUserIdFromToken(token) : null;

    if (!token || !userId || isTokenExpired(token)) {
        // No valid session — clear any stale bits and bounce back to login
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        window.location.href = "/pages/index.html";
        return;
    }

    function showError() {
        loadingEl.hidden = true;
        contentEl.hidden = true;
        errorEl.hidden = false;
    }

    function initials(name) {
        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0].toUpperCase())
            .join("");
    }

    try {
        const response = await fetch(`${API_BASE}/user/${userId}`, {
            headers: { "Authorization": `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
            // Token rejected by the server (expired/invalid/not-yours) — force re-login
            localStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(TOKEN_KEY);
            window.location.href = "/pages/index.html";
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            showError();
            return;
        }

        document.getElementById("avatar").textContent = initials(data.name || "?");
        document.getElementById("dashName").textContent = data.name;
        document.getElementById("dashEmail").textContent = data.email;

        loadingEl.hidden = true;
        contentEl.hidden = false;

    } catch (err) {
        showError();
    }

    logoutBtn.addEventListener("click", () => {
        // Logout always ends the session fully, regardless of Remember me —
        // Remember me persists login across browser restarts, not past an explicit logout.
        sessionStorage.clear();
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "/pages/index.html";
    });

    // --- Delete account flow ---
    deleteAccountBtn.addEventListener("click", () => {
        deleteModal.hidden = false;
    });

    cancelDeleteBtn.addEventListener("click", () => {
        deleteModal.hidden = true;
    });

    confirmDeleteBtn.addEventListener("click", async () => {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = "Deleting...";

        try {
            const response = await fetch(`${API_BASE}/user/${userId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` },
            });

            if (!response.ok) {
                alert("Failed to delete account. Please try again.");
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = "Yes, delete";
                return;
            }

            sessionStorage.clear();
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem("rememberedEmail");
            window.location.href = "/pages/index.html";

        } catch (err) {
            alert("Could not reach the server. Please try again.");
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = "Yes, delete";
        }
    });
});