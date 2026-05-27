import { apiFetch, getErrorMessage } from "../api_helpers.js";
import { showBannerAlert } from "../shared.js";

const apiUrl = document.body.dataset.apiUrl;

document.getElementById("user-login-form").addEventListener("submit", (e) => {
  submitLogin(e, "user_logins");
});

document
  .getElementById("superuser-login-form")
  .addEventListener("submit", (e) => {
    submitLogin(e, "superuser_logins");
  });

async function submitLogin(e, endpoint) {
  e.preventDefault();
  const email = new FormData(e.target).get("email");
  const message = document.getElementById("message");

  try {
    const res = await apiFetch(`${apiUrl}/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (res.unauthorized) {
      message.textContent = getErrorMessage(res, "Unauthorized.");
      return;
    }

    if (res.forbidden) {
      message.textContent = getErrorMessage(res, "Access denied.");
      return;
    }

    if (!res.ok) {
      message.textContent = getErrorMessage(res, "Something went wrong.");
      return;
    }

    message.textContent = res.message || "Success.";
  } catch {
    showBannerAlert("There was a network error. Please try again.");
  }
}
