import { requireSuperuser } from "../../shared.js";

const baseurl = document.body.dataset.baseurl;
const apiUrl = document.body.dataset.apiUrl;
const bannerEl = document.getElementById("banner-alert");

const loadOrganizations = async () => {
  const response = await fetch(`${apiUrl}/organizations`, {
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
  const organizations = data.data;
  const orgTable = document.getElementById("organizations-table");
  const tbody = document.getElementById("organizations-body");
  const template = document.getElementById("org-row-template");
  // clear out old rows
  tbody.innerHTML = "";

  if (organizations.length > 0) {
    orgTable.style.display = "table";
    organizations.forEach((org) => {
      const row = template.content.cloneNode(true);
      row.querySelector(".org-title").textContent = org.attributes.title;
      row.querySelector(".org-edit").href = `edit.html?id=${org.id}`;
      row.querySelector(".org-delete").addEventListener("click", (e) => {
        const confirmMsg = e.target.dataset.confirm;
        if (!confirm(confirmMsg)) return;
        deleteOrganization(org.id);
      });
      row.querySelector(".org-users").href =
        `${baseurl}/users/index.html?organization_id=${org.id}`;
      tbody.appendChild(row);
    });
  } else {
    orgTable.style.display = "none";
  }
};

const deleteOrganization = async (id) => {
  const response = await fetch(`${apiUrl}/organizations/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (response.ok) {
    loadOrganizations();
  } else {
    let message = await response.json();
    bannerEl.textContent = message.error;
  }
};

const init = async () => {
  const currentUser = await requireSuperuser();
  if (!currentUser) return;

  loadOrganizations();
};

init();
