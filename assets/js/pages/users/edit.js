import { requireChampion } from "../../shared.js";

const apiUrl = document.body.dataset.apiUrl;
const params = new URLSearchParams(window.location.search);
const orgId = params.get("organization_id");
const userId = params.get("id");
const messageEl = document.getElementById("message");
const emailInput = document.getElementById("email");
const championCheckbox = document.getElementById("champion");
let canManageChampionStatus = false;

const loadUserDetails = async () => {
  if (!orgId || !userId) return;

  try {
    const response = await fetch(
      `${apiUrl}/organizations/${orgId}/users/${userId}`,
      {
        credentials: "include"
      }
    );
    const data = await response.json();
    const user = data.data ? data.data.attributes : null;

    if (user && user.email) {
      emailInput.value = user.email;
      if (canManageChampionStatus && user.champion !== undefined) {
        championCheckbox.checked = user.champion;
      }
    }
  } catch (err) {
    messageEl.textContent = `Failed to load user details: ${err}`;
  }
};

const attachUpdateListener = () => {
  if (orgId && userId) {
    document
      .getElementById("user-form")
      .addEventListener("submit", submitUpdate);
  }
};

const submitUpdate = async (e) => {
  e.preventDefault();
  const userPayload = { email: emailInput.value };
  if (canManageChampionStatus) userPayload.champion = championCheckbox.checked;

  try {
    const response = await fetch(
      `${apiUrl}/organizations/${orgId}/users/${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user: userPayload
        })
      }
    );

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
  const currentUser = await requireChampion();
  if (!currentUser) return;

  canManageChampionStatus = currentUser.role === "superuser";
  if (!canManageChampionStatus && championCheckbox) {
    championCheckbox.checked = false;
  }

  if (!orgId || !userId) {
    messageEl.textContent = "Missing user or organization context.";
    return;
  }

  document.getElementById("user-id").value = userId;
  await loadUserDetails();
  attachUpdateListener();
};

init();
