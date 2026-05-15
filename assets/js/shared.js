const baseurl = document.body.dataset.baseurl;

const isAuthenticated = () =>
  localStorage.getItem("isAuthenticated") === "true";
const isSuperuser = () =>
  isAuthenticated() && localStorage.getItem("superuser") === "true";

export const updateAuthorizedVisibility = () => {
  document.querySelectorAll(".authorized-only").forEach((el) => {
    el.style.display = isAuthenticated() ? "" : "none";
  });
};

export const updateSuperuserVisibility = () => {
  document.querySelectorAll(".superuser-only").forEach((el) => {
    el.style.display = isSuperuser() ? "" : "none";
  });
};

export const redirectIfUnauthorized = () => {
  if (!isSuperuser() || !isAuthenticated()) {
    window.location.href = `${baseurl}/login.html`;
  }
};

document.addEventListener("DOMContentLoaded", updateSuperuserVisibility);
document.addEventListener("DOMContentLoaded", updateAuthorizedVisibility);
