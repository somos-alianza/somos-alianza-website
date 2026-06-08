import { requireSuperuser, showBannerAlert } from "../../shared.js";
import { apiFetch, handleApiResult } from "../../api_helpers.js";

const apiUrl = document.body.dataset.apiUrl;
const form = document.getElementById("organization-form");
const messageEl = document.getElementById("message");
const titleInput = document.getElementById("title");
const emailInput = document.getElementById("email");

const submitCreate = async (e) => {
  e.preventDefault();

  try {
    const res = await apiFetch(`${apiUrl}/organizations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization: {
          title: titleInput.value,
          email: emailInput.value
        }
      })
    });

    const shouldContinue = handleApiResult(res, {
      baseurl: document.body.dataset.baseurl,
      fallback: "Something went wrong.",
      onError: (text) => {
        messageEl.textContent = text;
      }
    });
    if (!shouldContinue) {
      return;
    }

    messageEl.textContent = res.message || "Organization created!";
    form.reset();
  } catch (_error) {
    showBannerAlert("There was a network error. Please try again.");
  }
};

const init = async () => {
  const currentUser = await requireSuperuser();
  if (!currentUser || !form) return;

  form.addEventListener("submit", submitCreate);
};

document.addEventListener("DOMContentLoaded", init);
