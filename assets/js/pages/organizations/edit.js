import { requireSuperuser } from "../../shared.js";
import { apiFetch, getErrorMessage } from "../../api_helpers.js";

const apiUrl = document.body.dataset.apiUrl;
const baseurl = document.body.dataset.baseurl;
const form = document.getElementById("organization-form");
const params = new URLSearchParams(window.location.search);
const orgId = params.get("id");
const messageEl = document.getElementById("message");
const titleInput = document.getElementById("title");

const loadOrganizationDetails = async () => {
  if (!orgId) return;

  const res = await apiFetch(`${apiUrl}/organizations/${orgId}`);

  if (res.unauthorized) {
    window.location.href = `${baseurl}/login.html`;
    return;
  }

  if (!res.ok) {
    messageEl.textContent = getErrorMessage(
      res,
      "Failed to load organization details."
    );
    return;
  }

  if (res.item?.title) {
    titleInput.value = res.item.title;
  }
};

const attachUpdateListener = () => {
  form.addEventListener("submit", submitUpdate);
};

const submitUpdate = async (e) => {
  e.preventDefault();

  try {
    const res = await apiFetch(`${apiUrl}/organizations/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization: { title: titleInput.value } })
    });

    if (res.unauthorized) {
      window.location.href = `${baseurl}/login.html`;
      return;
    }

    if (!res.ok) {
      messageEl.textContent = getErrorMessage(res, "Something went wrong.");
      return;
    }

    messageEl.textContent = res.message || "Updated Organization.";
  } catch (_error) {
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
