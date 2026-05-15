import { updateAuthorizedVisibility } from "../shared.js";
const apiUrl = document.body.dataset.apiUrl;

const confirmToken = async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const isSuperuser = params.get("superuser") === "true";

  if (!token) return;
  const banner = document.getElementById("banner");
  const endpoint = isSuperuser ? "superuser_logins" : "user_logins";

  try {
    const response = await fetch(`${apiUrl}/auth/${endpoint}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token })
    });
    banner.style.display = "block";

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("superuser", data.superuser);
      banner.textContent = "You're signed in!";
      banner.style.color = "green";
      updateAuthorizedVisibility();
    } else {
      banner.textContent =
        "Login link expired or invalid. Please request a new one.";
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
