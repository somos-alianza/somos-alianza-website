import { redirectIfUnauthorized } from "../../shared.js";
redirectIfUnauthorized();

const apiUrl = document.body.dataset.apiUrl;
const form = document.getElementById("organization-form");
const message = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;

  try {
    const response = await fetch(`${apiUrl}/organizations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ organization: { title } })
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
      message.textContent =
        (data && data.message) || text || "Organization created!";
    } else {
      message.textContent =
        (data && data.errors) || text || "Something went wrong.";
    }
  } catch (error) {
    message.textContent = "There was a network error. Please try again.";
  }
});
