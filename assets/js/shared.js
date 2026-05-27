import { apiFetch } from "./api_helpers.js";

const { baseurl, apiUrl } = document.body.dataset;

const AUTH_CACHE_KEY = "auth_context_v1";
const AUTH_TTL = 15 * 60 * 1000; // 15 minutes

const ROLE_LEVEL = {
  user: 1,
  champion: 2,
  superuser: 3
};

let inFlightAuthPromise = null;

const redirectToLogin = () => {
  window.location.href = `${baseurl}/login.html`;
};

const hasRole = (role, minimumRole) =>
  (ROLE_LEVEL[role] || 0) >= (ROLE_LEVEL[minimumRole] || 0);

const readCachedAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;

    const { data, expiresAt } = JSON.parse(raw);
    if (!expiresAt || Date.now() > expiresAt) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }

    return data || null;
  } catch {
    return null;
  }
};

const writeCachedAuth = (data) => {
  localStorage.setItem(
    AUTH_CACHE_KEY,
    JSON.stringify({
      data,
      expiresAt: Date.now() + AUTH_TTL
    })
  );
};

export const clearCachedAuth = () => {
  localStorage.removeItem(AUTH_CACHE_KEY);
};

const fetchAuthSession = async () => {
  let res;
  try {
    res = await apiFetch(`${apiUrl}/auth/session`);
  } catch (_error) {
    clearCachedAuth();
    return null;
  }

  if (!res.ok) {
    clearCachedAuth();
    return null;
  }

  writeCachedAuth(res.body);
  return res.body;
};

export const getAuthContext = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh) {
    return readCachedAuth();
  }

  if (!inFlightAuthPromise) {
    inFlightAuthPromise = fetchAuthSession().finally(() => {
      inFlightAuthPromise = null;
    });
  }

  return inFlightAuthPromise;
};

const requireRole = async (minimumRole = "user") => {
  const currentUser = await getAuthContext();
  if (!currentUser?.authenticated || !hasRole(currentUser.role, minimumRole)) {
    redirectToLogin();
    return null;
  }
  return currentUser;
};

export const requireAuthenticated = async () => requireRole("user");
export const requireChampion = async () => requireRole("champion");
export const requireSuperuser = async () => requireRole("superuser");

export const showBannerAlert = (text) => {
  const bannerEl = document.getElementById("banner-alert");
  if (!bannerEl) return;

  bannerEl.style.display = "block";
  bannerEl.style.color = "red";
  bannerEl.textContent = text;
};

export const updateVisibility = async () => {
  const currentUser = await getAuthContext();
  const authenticated = Boolean(currentUser?.authenticated);
  const role = authenticated ? currentUser.role : null;
  const visibilityRules = [
    [".authorized-only", authenticated],
    [".champion-only", hasRole(role, "champion")],
    [".superuser-only", hasRole(role, "superuser")]
  ];

  visibilityRules.forEach(([selector, allowed]) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.display = allowed ? "initial" : "none";
    });
  });
  updateUsersLink(currentUser);
};

const updateUsersLink = (currentUser) => {
  const usersLink = document.getElementById("users-link");
  if (!usersLink) return;

  if (!currentUser?.authenticated) {
    usersLink.style.display = "";
    usersLink.href = `${baseurl}/login.html`;
    return;
  }

  if (currentUser.role === "champion") {
    usersLink.style.display = "";
    const organizationId = encodeURIComponent(
      currentUser.organization_id || ""
    );
    usersLink.href = `${baseurl}/users/index.html?organization_id=${organizationId}`;
    return;
  }

  if (currentUser.role === "superuser" || currentUser.role === "user") {
    usersLink.style.display = "none";
    usersLink.removeAttribute("href");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  updateVisibility();
});
