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
    const response = await fetch(`${apiUrl}/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email })
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    message.textContent = response.ok
      ? (isJson ? data.message : data) || "Success."
      : (isJson ? data.error : data) || "Something went wrong.";
  } catch {
    message.textContent = "There was a network error. Please try again.";
  }
}
