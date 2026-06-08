import { requireChampion, showBannerAlert } from "../../shared.js";
import { apiFetch, handleApiResult } from "../../api_helpers.js";

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

    const shouldContinue = handleApiResult(res, {
      baseurl,
      fallback: "Something went wrong.",
      onError: (text) => {
        message.textContent = text;
      }
    });
    if (!shouldContinue) {
      return;
    }

    if (res.ok) {
      message.textContent = res.message || "User created!";
    }
  } catch (_error) {
    showBannerAlert("There was a network error. Please try again.");
  }
};

const init = async () => {
  try {
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
  } catch (_error) {
    showBannerAlert("An error occurred. Please try again later.");
  }
};

document.addEventListener("DOMContentLoaded", init);
