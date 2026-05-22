import { requireSuperuser } from "../../shared.js";

const apiUrl = document.body.dataset.apiUrl;
const params = new URLSearchParams(window.location.search);
const orgId = params.get("id");
const messageEl = document.getElementById("message");
const titleInput = document.getElementById("title");

const loadOrganizationDetails = async () => {
  if (!orgId) return;

  try {
    const response = await fetch(`${apiUrl}/organizations/${orgId}`, {
      credentials: "include"
    });
    const data = await response.json();
    const org = data.data ? data.data.attributes : null;

    if (org && org.title) {
      titleInput.value = org.title;
    }
  } catch (err) {
    messageEl.textContent = `Failed to load organization details: ${err}`;
  }
};

const attachUpdateListener = () => {
  document
    .getElementById("organization-form")
    .addEventListener("submit", submitUpdate);
};

const submitUpdate = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch(`${apiUrl}/organizations/${orgId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ organization: { title: titleInput.value } })
    });

    const contentType = response.headers.get("content-type") || "";
    const isJsonResponse = contentType.includes("application/json");
    let data = null;
    let text = "";

    if (isJsonResponse) {
      data = await response.json();
    } else {
      text = await response.text();
    }

    if (response.ok) {
      messageEl.textContent = (data && data.message) || text || "Success.";
    } else {
      messageEl.textContent =
        (data && data.errors) || text || "Something went wrong.";
    }
  } catch (error) {
    messageEl.textContent = "There was a network error. Please try again.";
  }
};

const init = async () => {
  const currentUser = await requireSuperuser();
  if (!currentUser) return;

  if (!orgId) {
    messageEl.textContent = "Missing organization context.";
    return;
  }

  document.getElementById("organization-id").value = orgId;
  await loadOrganizationDetails();
  attachUpdateListener();
};

init();
