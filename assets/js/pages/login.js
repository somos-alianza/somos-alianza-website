import { apiFetch, getErrorMessage } from "../api_helpers.js";

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

    message.textContent = res.ok
      ? res.message || "Success."
      : getErrorMessage(res, "Something went wrong.");
  } catch {
    message.textContent = "There was a network error. Please try again.";
  }
}
