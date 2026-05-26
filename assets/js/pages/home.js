import {
  clearCachedAuth,
  getAuthContext,
  updateVisibility
} from "../shared.js";
import { apiFetch, getErrorMessage } from "../api_helpers.js";
const apiUrl = document.body.dataset.apiUrl;

const confirmToken = async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const isSuperuser = params.get("superuser") === "true";

  if (!token) return;
  const banner = document.getElementById("banner");
  const endpoint = isSuperuser ? "superuser_logins" : "user_logins";

  try {
    const res = await apiFetch(`${apiUrl}/auth/${endpoint}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    banner.style.display = "block";

    if (res.ok) {
      banner.textContent = res.message || "You're signed in!";
      banner.style.color = "green";

      clearCachedAuth();
      await getAuthContext({ forceRefresh: true });
      await updateVisibility();
    } else {
      banner.textContent = getErrorMessage(
        res,
        "Login link expired or invalid. Please request a new one."
      );
      banner.style.color = "red";
    }
  } catch (err) {
    banner.style.display = "block";
    banner.textContent =
      "Login link expired or invalid. Please request a new one.";
    banner.style.color = "red";
  }
};

confirmToken();
