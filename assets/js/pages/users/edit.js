import { redirectIfUnauthorized } from "../../shared.js";
redirectIfUnauthorized();

const apiUrl = document.body.dataset.apiUrl;
const params = new URLSearchParams(window.location.search);
const orgId = params.get("organization_id");
const userId = params.get("id");
const messageEl = document.getElementById("message");
const emailInput = document.getElementById("email");
const championCheckbox = document.getElementById("champion");

if (orgId && userId) {
  document.getElementById("user-id").value = userId;

  fetch(`${apiUrl}/organizations/${orgId}/users/${userId}`, {
    credentials: "include"
  })
    .then((response) => response.json())
    .then((data) => {
      const user = data.data ? data.data.attributes : null;
      if (user && user.email && user.champion !== undefined) {
        emailInput.value = user.email;
        championCheckbox.checked = user.champion;
      }
    })
    .catch((err) => {
      messageEl.textContent = `Failed to load organization details: ${err}`;
    });
}

const attachUpdateListener = () => {
  document.getElementById("user-form").addEventListener("submit", submitUpdate);
};

const submitUpdate = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch(
      `${apiUrl}/organizations/${orgId}/users/${userId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user: { email: emailInput.value, champion: championCheckbox.checked }
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

attachUpdateListener();
