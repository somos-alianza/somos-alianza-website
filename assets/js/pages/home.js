const apiUrl = document.body.dataset.apiUrl;

const confirmToken = async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) return;
  const banner = document.getElementById("banner");

  try {
    const response = await fetch(`${apiUrl}/auth/user_logins/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token })
    });
    banner.style.display = "block";

    if (response.ok) {
      banner.textContent = "You're signed in!";
      banner.style.color = "green";
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
