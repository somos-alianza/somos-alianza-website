import { requireSuperuser } from "../../shared.js";
import { apiFetch, getErrorMessage } from "../../api_helpers.js";

const baseurl = document.body.dataset.baseurl;
const apiUrl = document.body.dataset.apiUrl;
const bannerEl = document.getElementById("banner-alert");

const loadOrganizations = async () => {
  const res = await apiFetch(`${apiUrl}/organizations`);

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

  const organizations = res.items;
  const orgTable = document.getElementById("organizations-table");
  const tbody = document.getElementById("organizations-body");
  const template = document.getElementById("org-row-template");
  // clear out old rows
  tbody.innerHTML = "";

  if (organizations.length > 0) {
    orgTable.style.display = "table";
    organizations.forEach((org) => {
      const row = template.content.cloneNode(true);
      row.querySelector(".org-title").textContent = org.title;
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
  const res = await apiFetch(`${apiUrl}/organizations/${id}`, {
    method: "DELETE"
  });

  if (res.unauthorized) {
    window.location.href = `${baseurl}/login.html`;
    return;
  }

  if (!res.ok) {
    bannerEl.textContent = getErrorMessage(
      res,
      "Failed to delete organization."
    );
    return;
  }

  await loadOrganizations();
};

const init = async () => {
  const currentUser = await requireSuperuser();
  if (!currentUser) return;

  await loadOrganizations();
};

init();
