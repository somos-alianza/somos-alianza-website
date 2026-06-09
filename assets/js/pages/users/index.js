import { requireChampion, showBannerAlert } from "../../shared.js";
import { apiFetch, handleApiResult } from "../../api_helpers.js";

const baseurl = document.body.dataset.baseurl;
const apiUrl = document.body.dataset.apiUrl;
const orgTitle = document.getElementById("org-title");
const params = new URLSearchParams(window.location.search);
const orgId = params.get("organization_id");

const addUserButton = document.getElementById("add-user-button");

const setupAddUserButton = () => {
  if (!orgId) {
    showBannerAlert("Missing organization context.");
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

  try {
    const res = await apiFetch(`${apiUrl}/organizations/${orgId}/users`);

    const shouldContinue = handleApiResult(res, {
      baseurl,
      fallback: "An error occurred. Please try again later.",
      onError: showBannerAlert
    });
    if (!shouldContinue) {
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
  } catch (_error) {
    showBannerAlert("An error occurred. Please try again later.");
  }
};

const deleteUser = async (id) => {
  try {
    const res = await apiFetch(`${apiUrl}/organizations/${orgId}/users/${id}`, {
      method: "DELETE"
    });

    const shouldContinue = handleApiResult(res, {
      baseurl,
      fallback: "Failed to delete user.",
      onError: showBannerAlert
    });
    if (!shouldContinue) {
      return;
    }

    await loadUsers();
  } catch (_error) {
    showBannerAlert("An error occurred. Please try again later.");
  }
};

const init = async () => {
  const currentUser = await requireChampion();
  if (!currentUser) return;

  setupAddUserButton();
  await loadUsers();
};

document.addEventListener("DOMContentLoaded", init);
