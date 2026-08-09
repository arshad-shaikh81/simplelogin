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

    const userId = sessionStorage.getItem("userId");

    if (!userId) {
        // No session — bounce back to login
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
        const response = await fetch(`${API_BASE}/user/${userId}`);
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
        sessionStorage.clear();
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
            });

            if (!response.ok) {
                alert("Failed to delete account. Please try again.");
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = "Yes, delete";
                return;
            }

            sessionStorage.clear();
            window.location.href = "/pages/index.html";

        } catch (err) {
            alert("Could not reach the server. Please try again.");
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = "Yes, delete";
        }
    });
});