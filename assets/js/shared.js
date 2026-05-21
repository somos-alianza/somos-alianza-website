const baseurl = document.body.dataset.baseurl;

const getAuthState = () => {
  const authenticated = localStorage.getItem("isAuthenticated") === "true";
  const superuser =
    authenticated && localStorage.getItem("superuser") === "true";
  const champion =
    authenticated && (superuser || localStorage.getItem("champion") === "true");

  return { authenticated, champion, superuser };
};

export const updateVisibility = () => {
  const { authenticated, champion, superuser } = getAuthState();

  document.querySelectorAll(".authorized-only").forEach((el) => {
    el.style.display = authenticated ? "" : "none";
  });

  document.querySelectorAll(".champion-only").forEach((el) => {
    el.style.display = champion ? "" : "none";
  });

  document.querySelectorAll(".superuser-only").forEach((el) => {
    el.style.display = superuser ? "" : "none";
  });
};

const redirectToLogin = () => {
  window.location.href = `${baseurl}/login.html`;
};

export const requireAuthenticated = () => {
  const { authenticated } = getAuthState();
  if (!authenticated) redirectToLogin();
};

export const requireChampion = () => {
  const { authenticated, champion } = getAuthState();
  if (!authenticated || !champion) redirectToLogin();
};

export const requireSuperuser = () => {
  const { authenticated, superuser } = getAuthState();
  if (!authenticated || !superuser) redirectToLogin();
};

const updateUsersLink = () => {
  const usersLink = document.getElementById("users-link");
  if (!usersLink) return;

  const organizationId = localStorage.getItem("organization");
  if (!organizationId) {
    usersLink.style.display = "none";
    return;
  }

  usersLink.href = `${baseurl}/users/index.html?organization_id=${encodeURIComponent(
    organizationId
  )}`;
};

document.addEventListener("DOMContentLoaded", updateVisibility);
document.addEventListener("DOMContentLoaded", updateUsersLink);
