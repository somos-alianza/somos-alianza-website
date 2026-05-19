import { redirectIfUnauthorized } from "../../shared.js";
redirectIfUnauthorized();

const baseurl = document.body.dataset.baseurl;
const apiUrl = document.body.dataset.apiUrl;
const bannerEl = document.getElementById("banner-alert");
const orgTitle = document.getElementById("org-title");
const params = new URLSearchParams(window.location.search);
const orgId = params.get("organization_id");

const addUserButton = document.getElementById("add-user-button");

if (!orgId) {
  bannerEl.textContent = "Missing organization context.";
  if (addUserButton) addUserButton.hidden = true;
} else if (addUserButton) {
  const url = new URL(addUserButton.href, window.location.origin);
  url.searchParams.set("organization_id", orgId);
  addUserButton.href = `${url.pathname}${url.search}`;
}

const loadUsers = async () => {
  if (!orgId) return;

  const response = await fetch(`${apiUrl}/organizations/${orgId}/users`, {
    credentials: "include"
  });

  switch (response.status) {
    case 401:
      window.location.href = `${baseurl}/login.html`;
      return;
    case 403:
      bannerEl.textContent = "Access denied.";
      return;
    default:
      if (!response.ok) {
        bannerEl.textContent = "An error occurred. Please try again later.";
        return;
      }
  }

  const data = await response.json();
  orgTitle.textContent = data.organization.attributes.title;
  const users = data.data;
  const userTable = document.getElementById("users-table");
  const tbody = document.getElementById("users-body");
  const template = document.getElementById("user-row-template");
  // clear out old rows
  tbody.innerHTML = "";

  if (users.length > 0) {
    userTable.style.display = "table";
    users.forEach((user) => {
      const row = template.content.cloneNode(true);
      row.querySelector(".user-email").textContent = user.attributes.email;
      row.querySelector(".user-champion").textContent = user.attributes.admin
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
  const response = await fetch(`${apiUrl}/organizations/${orgId}/users/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (response.ok) {
    loadUsers();
  } else {
    let message = await response.json();
    bannerEl.textContent = message.error;
  }
};

loadUsers();
