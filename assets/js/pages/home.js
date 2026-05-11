const apiUrl = document.body.dataset.apiUrl;

const confirmToken = async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) return;

  const response = await fetch(
    `${apiUrl}/auth/user_logins/confirm?token=${token}`,
    {
      method: "GET",
      credentials: "include"
    }
  );

  const banner = document.getElementById("banner");
  banner.style.display = "block";

  if (response.ok) {
    banner.textContent = "You're signed in!";
    banner.style.color = "green";
  } else {
    banner.textContent =
      "Login link expired or invalid. Please request a new one.";
    banner.style.color = "red";
  }
};

confirmToken();
