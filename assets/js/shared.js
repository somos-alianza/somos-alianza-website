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

const hasRole = (role, minimumRole) =>
  (ROLE_LEVEL[role] || 0) >= (ROLE_LEVEL[minimumRole] || 0);

const storage = window.localStorage;

const PUBLIC_PATHS = new Set([
  "/",
  "/index.html",
  "/login.html",
  "/about.html",
  "/contact_us.html"
]);

const isPublicPage = () => {
  const normalizedPath = window.location.pathname.replace(baseurl, "") || "/";
  return PUBLIC_PATHS.has(normalizedPath);
};

const redirectToLogin = () => {
  if (isPublicPage()) return;
  window.location.href = `${baseurl}/login.html`;
};

const readCachedAuth = () => {
  try {
    const raw = storage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;

    const { data, expiresAt } = JSON.parse(raw);
    if (!expiresAt || Date.now() > expiresAt) {
      storage.removeItem(AUTH_CACHE_KEY);
      return null;
    }

    return data || null;
  } catch {
    return null;
  }
};

const writeCachedAuth = (data) => {
  storage.setItem(
    AUTH_CACHE_KEY,
    JSON.stringify({
      data,
      expiresAt: Date.now() + AUTH_TTL
    })
  );
};

export const clearCachedAuth = () => {
  storage.removeItem(AUTH_CACHE_KEY);
};

// TODO: Strictly for dev/manual testing, will be removed in production.
const clearAuthStorage = () => {
  clearCachedAuth();
};

const clearAuthCookies = () => {
  const authCookieNames = ["user_auth_token", "superuser_auth_token"];
  const paths = ["/"];
  if (baseurl && baseurl !== "/") {
    paths.push(baseurl);
  }

  authCookieNames.forEach((name) => {
    const encodedName = encodeURIComponent(name);
    paths.forEach((path) => {
      document.cookie = `${encodedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Lax`;
    });
  });
};

const logoutClientSide = async () => {
  try {
    await apiFetch(`${apiUrl}/auth/logout`, {
      method: "DELETE"
    });
  } catch (_error) {}
  clearAuthStorage();
  clearAuthCookies();
  window.location.reload();
};
// TODO end: Strictly for dev/manual testing, will be removed in production.

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
  const cached = !forceRefresh ? readCachedAuth() : null;
  if (cached) return cached;

  if (!inFlightAuthPromise) {
    inFlightAuthPromise = fetchAuthSession().finally(() => {
      inFlightAuthPromise = null;
    });
  }

  return inFlightAuthPromise;
};

const requireRole = async (minimumRole = "user") => {
  let currentUser = await getAuthContext();
  try {
    if (!currentUser?.authenticated) {
      currentUser = await getAuthContext({ forceRefresh: true });
    }

    if (
      !currentUser?.authenticated ||
      !hasRole(currentUser.role, minimumRole)
    ) {
      redirectToLogin();
      return null;
    }

    return currentUser;
  } catch (_error) {
    showBannerAlert(
      "An error occurred while verifying authentication. Please try again."
    );
    return null;
  }
};

export const requireAuthenticated = async () => requireRole("user");
export const requireChampion = async () => requireRole("champion");
export const requireSuperuser = async () => requireRole("superuser");

export const showBannerAlert = (text) => {
  const bannerEl = document.getElementById("banner-alert");
  if (!bannerEl) return;

  bannerEl.style.display = "block";
  bannerEl.style.color = "blue";
  bannerEl.textContent = text;
};

export const getEmbeddedStrategies = ({
  elementId = "strategies-data",
  onError,
  errorMessage = "Failed to load strategies data."
} = {}) => {
  try {
    const strategiesDataEl = document.getElementById(elementId);
    if (!strategiesDataEl?.textContent) {
      if (onError) onError(errorMessage);
      return [];
    }

    const parsed = JSON.parse(strategiesDataEl.textContent);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    if (onError) onError(errorMessage);
    return [];
  }
};

export const updateVisibility = async () => {
  const currentUser = await getAuthContext();
  if (!currentUser && !isPublicPage()) {
    redirectToLogin();
    return;
  }
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

  updateNavigation(currentUser);
};

const updateNavigation = (currentUser) => {
  const usersLink = document.getElementById("users-link");
  const strategyFinderLink = document.getElementById("strategy-finder-link");
  const ourStrategiesLink = document.getElementById("our-strategies-link");

  const setLink = (el, href, display = null) => {
    if (!el) return;
    if (display !== null) {
      el.style.display = display;
    }
    if (href) {
      el.href = href;
    } else {
      el.removeAttribute("href");
    }
  };

  if (!currentUser?.authenticated) {
    setLink(usersLink, `${baseurl}/login.html`);
    return;
  }

  setLink(strategyFinderLink, `${baseurl}/strategies/strategy_finder.html`);
  setLink(ourStrategiesLink, `${baseurl}/strategies/our_strategies.html`);

  if (currentUser.role === "champion") {
    const orgId = encodeURIComponent(currentUser.organization_id || "");
    setLink(
      usersLink,
      `${baseurl}/users/index.html?organization_id=${orgId}`,
      "initial"
    );
  } else {
    setLink(usersLink, null, "none");
  }
};

export const escHtml = (str) =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", logoutClientSide);
  }

  updateVisibility();
});
