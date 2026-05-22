import { requireChampion } from "../../shared.js";

const apiUrl = document.body.dataset.apiUrl;
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
    const response = await fetch(`${apiUrl}/organizations/${orgId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user: userPayload })
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
