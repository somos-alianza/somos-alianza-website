import { requireSuperuser, showBannerAlert } from "../../shared.js";
import { apiFetch, handleApiResult } from "../../api_helpers.js";

const baseurl = document.body.dataset.baseurl;
const apiUrl = document.body.dataset.apiUrl;

const loadOrganizations = async () => {
  try {
    const res = await apiFetch(`${apiUrl}/organizations`);

    const shouldContinue = handleApiResult(res, {
      baseurl,
      fallback: "An error occurred. Please try again later.",
      onError: showBannerAlert
    });
    if (!shouldContinue) {
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
  } catch (_error) {
    showBannerAlert("There was a network error. Please try again.");
  }
};

const deleteOrganization = async (id) => {
  try {
    const res = await apiFetch(`${apiUrl}/organizations/${id}`, {
      method: "DELETE"
    });

    const shouldContinue = handleApiResult(res, {
      baseurl,
      fallback: "Failed to delete organization.",
      onError: showBannerAlert
    });
    if (!shouldContinue) {
      return;
    }

    await loadOrganizations();
  } catch (_error) {
    showBannerAlert("There was a network error. Please try again.");
  }
};

const init = async () => {
  const currentUser = await requireSuperuser();
  if (!currentUser) return;

  await loadOrganizations();
};

init();
