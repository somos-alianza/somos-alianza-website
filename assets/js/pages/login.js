const apiUrl = document.body.dataset.apiUrl;

const attachLoginListener = () => {
  document.getElementById("login-form").addEventListener("submit", submitLogin);
};

const submitLogin = async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const message = document.getElementById("message");
  try {
    const response = await fetch(`${apiUrl}/auth/user_logins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email })
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
      message.textContent = (data && data.message) || text || "Success.";
    } else {
      message.textContent =
        (data && data.error) || text || "Something went wrong.";
    }
  } catch (error) {
    message.textContent = "There was a network error. Please try again.";
  }
};

attachLoginListener();
