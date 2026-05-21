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
  const response = await fetch(`${apiUrl}/auth/session`, {
    credentials: "include"
  });

  if (!response.ok) {
    clearCachedAuth();
    return null;
  }

  const data = await response.json();
  writeCachedAuth(data);
  return data;
};

export const getAuthContext = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh) {
    const cached = readCachedAuth();
    if (cached) return cached;
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

  const organizationId = currentUser?.organization_id;
  if (!organizationId) {
    usersLink.style.display = "none";
    usersLink.removeAttribute("href");
    return;
  }

  usersLink.href = `${baseurl}/users/index.html?organization_id=${organizationId}`;
};

document.addEventListener("DOMContentLoaded", () => {
  updateVisibility();
});
