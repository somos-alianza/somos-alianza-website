import { requireChampion } from "../../shared.js";
import { apiFetch, getErrorMessage } from "../../api_helpers.js";

const baseurl = document.body.dataset.baseurl;
const apiUrl = document.body.dataset.apiUrl;
const bannerEl = document.getElementById("banner-alert");
const orgTitle = document.getElementById("org-title");
const params = new URLSearchParams(window.location.search);
const orgId = params.get("organization_id");

const addUserButton = document.getElementById("add-user-button");

const setupAddUserButton = () => {
  if (!orgId) {
    bannerEl.textContent = "Missing organization context.";
    if (addUserButton) addUserButton.hidden = true;
    return;
  }

  if (addUserButton) {
    const url = new URL(addUserButton.href, window.location.origin);
    url.searchParams.set("organization_id", orgId);
    addUserButton.href = `${url.pathname}${url.search}`;
  }
};

const loadUsers = async () => {
  if (!orgId) return;

  const res = await apiFetch(`${apiUrl}/organizations/${orgId}/users`);

  if (res.unauthorized) {
    window.location.href = `${baseurl}/login.html`;
    return;
  }

  if (res.forbidden) {
    bannerEl.textContent = "Access denied.";
    return;
  }

  if (!res.ok) {
    bannerEl.textContent = getErrorMessage(
      res,
      "An error occurred. Please try again later."
    );
    return;
  }

  orgTitle.textContent = res.body?.organization?.title || "";
  const users = res.items;
  const userTable = document.getElementById("users-table");
  const tbody = document.getElementById("users-body");
  const template = document.getElementById("user-row-template");
  // clear out old rows
  tbody.innerHTML = "";

  if (users.length > 0) {
    userTable.style.display = "table";
    users.forEach((user) => {
      const row = template.content.cloneNode(true);
      row.querySelector(".user-email").textContent = user.email;
      row.querySelector(".user-champion").textContent = user.champion
        ? "Yes"
        : "No";
      row.querySelector(".user-edit").href =
        `edit.html?id=${user.id}&organization_id=${orgId}`;
      row.querySelector(".user-delete").addEventListener("click", (e) => {
        const confirmMsg = e.target.dataset.confirm;
        if (!confirm(confirmMsg)) return;
        deleteUser(user.id);
      });
      tbody.appendChild(row);
    });
  } else {
    userTable.style.display = "none";
  }
};

const deleteUser = async (id) => {
  const res = await apiFetch(`${apiUrl}/organizations/${orgId}/users/${id}`, {
    method: "DELETE"
  });

  if (res.unauthorized) {
    window.location.href = `${baseurl}/login.html`;
    return;
  }

  if (!res.ok) {
    bannerEl.textContent = getErrorMessage(res, "Failed to delete user.");
    return;
  }

  await loadUsers();
};

const init = async () => {
  const currentUser = await requireChampion();
  if (!currentUser) return;

  setupAddUserButton();
  await loadUsers();
};

init();
