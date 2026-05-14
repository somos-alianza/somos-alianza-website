const baseurl = document.body.dataset.baseurl;

const isSuperuser = () => localStorage.getItem("superuser") === "true";
const isAuthenticated = () =>
  localStorage.getItem("isAuthenticated") === "true";

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
  if (!isSuperuser()) {
    window.location.href = `${baseurl}/login.html`;
  }
};

document.addEventListener("DOMContentLoaded", updateSuperuserVisibility);
document.addEventListener("DOMContentLoaded", updateAuthorizedVisibility);
