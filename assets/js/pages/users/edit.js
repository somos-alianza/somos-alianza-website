import { requireChampion } from "../../shared.js";
import { apiFetch, getErrorMessage } from "../../api_helpers.js";

const apiUrl = document.body.dataset.apiUrl;
const baseurl = document.body.dataset.baseurl;
const params = new URLSearchParams(window.location.search);
const orgId = params.get("organization_id");
const userId = params.get("id");
const messageEl = document.getElementById("message");
const emailInput = document.getElementById("email");
const championCheckbox = document.getElementById("champion");
let canManageChampionStatus = false;

const loadUserDetails = async () => {
  if (!orgId || !userId) return;

  const res = await apiFetch(
    `${apiUrl}/organizations/${orgId}/users/${userId}`
  );

  if (res.unauthorized) {
    window.location.href = `${baseurl}/login.html`;
    return;
  }

  if (!res.ok) {
    messageEl.textContent = getErrorMessage(
      res,
      "Failed to load user details."
    );
    return;
  }

  const user = res.item;
  if (user?.email) {
    emailInput.value = user.email;
    if (canManageChampionStatus && user.champion !== undefined) {
      championCheckbox.checked = user.champion;
    }
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
    const res = await apiFetch(
      `${apiUrl}/organizations/${orgId}/users/${userId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: userPayload })
      }
    );

    if (res.unauthorized) {
      window.location.href = `${baseurl}/login.html`;
      return;
    }

    if (res.ok) {
      messageEl.textContent = res.message || "Success.";
    } else {
      messageEl.textContent = getErrorMessage(res, "Something went wrong.");
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
    championCheckbox.disabled = true;
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
