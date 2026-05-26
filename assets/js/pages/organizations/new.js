import { requireSuperuser } from "../../shared.js";
import { apiFetch, getErrorMessage } from "../../api_helpers.js";

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

    if (!res.ok) {
      messageEl.textContent = getErrorMessage(res, "Something went wrong.");
      return;
    }

    messageEl.textContent = res.message || "Organization created!";
    form.reset();
  } catch (_error) {
    messageEl.textContent = "There was a network error. Please try again.";
  }
};

const init = async () => {
  const currentUser = await requireSuperuser();
  if (!currentUser || !form) return;

  form.addEventListener("submit", submitCreate);
};

init();
