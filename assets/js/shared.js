const isSuperuser = localStorage.getItem("superuser") === "true";

export const updateSuperuserVisibility = () => {
  document.querySelectorAll(".superuser-only").forEach((el) => {
    el.style.display = isSuperuser ? "" : "none";
  });
};

export const redirectIfUnauthorized = () => {
  if (!isSuperuser) {
    const root = window.location.pathname.split("/").slice(0, 2).join("/");
    window.location = `${root}/login.html`;
  }
};

document.addEventListener("DOMContentLoaded", updateSuperuserVisibility);
