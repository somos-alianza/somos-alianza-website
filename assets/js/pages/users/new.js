import { requireChampion } from "../../shared.js";
import { apiFetch, getErrorMessage } from "../../api_helpers.js";

const apiUrl = document.body.dataset.apiUrl;
const baseurl = document.body.dataset.baseurl;
const form = document.getElementById("user-form");
const message = document.getElementById("message");
const params = new URLSearchParams(window.location.search);
const orgId = params.get("organization_id");
const championInput = document.getElementById("champion");

let canManageChampionStatus = false;

const submitCreate = async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const userPayload = { email };

  if (canManageChampionStatus && championInput) {
    userPayload.champion = championInput.checked;
  }

  try {
    const res = await apiFetch(`${apiUrl}/organizations/${orgId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: userPayload })
    });

    if (res.unauthorized) {
      window.location.href = `${baseurl}/login.html`;
      return;
    }

    if (res.ok) {
      message.textContent = res.message || "User created!";
    } else {
      message.textContent = getErrorMessage(res, "Something went wrong.");
    }
  } catch (error) {
    message.textContent = "There was a network error. Please try again.";
  }
};

const init = async () => {
  const currentUser = await requireChampion();
  if (!currentUser) return;

  canManageChampionStatus = currentUser.role === "superuser";
  if (!canManageChampionStatus && championInput) {
    championInput.disabled = true;
  }

  if (!orgId) {
    message.textContent = "Missing organization context.";
    return;
  }

  form.addEventListener("submit", submitCreate);
};

init();
