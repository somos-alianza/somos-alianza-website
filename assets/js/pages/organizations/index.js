import { updateSuperuserVisibility } from "../../shared.js";
const baseurl = document.body.dataset.baseurl;
const apiUrl = document.body.dataset.apiUrl;

const loadOrganizations = async () => {
  const response = await fetch(`${apiUrl}/organizations`, {
    credentials: "include"
  });

  if (!response.ok) {
    window.location.href = `${baseurl}/login.html`;
    return;
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
      row
        .querySelector(".org-delete")
        .addEventListener("click", () => deleteOrganization(org.id));
      tbody.appendChild(row);
    });
  } else {
    orgTable.style.display = "none";
  }
  updateSuperuserVisibility();
};

const deleteOrganization = async (id) => {
  const apiUrl = document.body.dataset.apiUrl;
  const response = await fetch(`${apiUrl}/organizations/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (response.ok) {
    loadOrganizations();
  }
};

loadOrganizations();
