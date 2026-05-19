import { redirectIfUnauthorized } from "../../shared.js";
redirectIfUnauthorized();

const apiUrl = document.body.dataset.apiUrl;
const form = document.getElementById("user-form");
const message = document.getElementById("message");
const params = new URLSearchParams(window.location.search);
const orgId = params.get("organization_id");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const admin = document.getElementById("admin").checked;

  try {
    const response = await fetch(`${apiUrl}/organizations/${orgId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user: { email, admin } })
    });

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
      message.textContent = (data && data.message) || text || "User created!";
    } else {
      message.textContent =
        (data && data.errors) || text || "Something went wrong.";
    }
  } catch (error) {
    message.textContent = "There was a network error. Please try again.";
  }
});
