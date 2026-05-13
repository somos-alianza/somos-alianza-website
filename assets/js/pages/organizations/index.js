import { updateSuperuserVisibility } from "../../shared.js";

const loadOrganizations = async () => {
  const apiUrl = document.body.dataset.apiUrl;
  const response = await fetch(`${apiUrl}/organizations`, {
    credentials: "include"
  });

  if (!response.ok) {
    window.location.href = "{{ '/login.html' | relative_url }}";
    return;
  }

  const data = await response.json();
  const organizations = data.data;
  const tbody = document.getElementById("organizations-body");
  const template = document.getElementById("org-row-template");
  if (organizations.length > 0) {
    document.getElementById("organizations-table").style.display = "table";
    organizations.forEach((org) => {
      const row = template.content.cloneNode(true);
      row.querySelector(".org-title").textContent = org.attributes.title;
      row.querySelector(".org-edit").href = `edit.html?id=${org.id}`;
      row
        .querySelector(".org-delete")
        .addEventListener("click", () => deleteOrganization(org.id));
      tbody.appendChild(row);
    });
  }
  // updateSuperuserVisibility();
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
