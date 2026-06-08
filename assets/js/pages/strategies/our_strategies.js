import { apiFetch, handleApiResult } from "../../api_helpers.js";
import {
  requireAuthenticated,
  getAuthContext,
  showBannerAlert,
  getEmbeddedStrategies
} from "../../shared.js";

const { baseurl, apiUrl } = document.body.dataset;

const fetchStrategies = async () => {
  return getEmbeddedStrategies({ onError: showBannerAlert });
};

const fetchFavorites = async () => {
  const auth = await getAuthContext();
  if (!auth?.authenticated) return [];

  const res = await apiFetch(`${apiUrl}/favorites`);
  if (res.ok) {
    return res.items || [];
  }
  return [];
};

const toggleFavorite = async (strategyId, favoriteId, button) => {
  const isFavorited = button.hasAttribute("data-favorite-id");
  const icon = button.querySelector("i");

  if (isFavorited) {
    const res = await apiFetch(`${apiUrl}/favorites/${favoriteId}`, {
      method: "DELETE"
    });

    if (handleApiResult(res, { baseurl, onError: showBannerAlert })) {
      button.removeAttribute("data-favorite-id");
      icon.className = "fa-regular fa-bookmark";
      showBannerAlert(res.message || "Strategy removed from favorites.");
    }
  } else {
    const res = await apiFetch(`${apiUrl}/strategies/${strategyId}/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (handleApiResult(res, { baseurl, onError: showBannerAlert })) {
      const newFavoriteId = res.item?.id || res.body?.item?.id;
      button.setAttribute("data-favorite-id", newFavoriteId);
      icon.className = "fa-solid fa-bookmark";
      showBannerAlert(res.message || "Strategy added to favorites.");
    }
  }
};

const renderOurStrategies = (allStrategies, favorites) => {
  const container = document.getElementById("strategies-container");
  if (!container) return;

  if (favorites.length === 0) {
    container.innerHTML =
      "<p>No strategies favorited by your organization yet.</p>";
    return;
  }

  container.innerHTML = "";

  const strategyFavorites = {};
  favorites.forEach((f) => {
    const sId = f.strategy_id || f.strategy?.id;
    if (!strategyFavorites[sId]) strategyFavorites[sId] = [];
    strategyFavorites[sId].push(f);
  });

  const uniqueStrategyIds = Object.keys(strategyFavorites);

  uniqueStrategyIds.forEach((sIdStr) => {
    const sId = parseInt(sIdStr);
    const strategy = allStrategies.find((s) => s.id === sId);
    if (!strategy) return;

    const favs = strategyFavorites[sId];
    const orgFavorite = favs[0];
    const isFavorited = !!orgFavorite;

    const card = document.createElement("div");

    const categoriesHtml = strategy.categories
      ? strategy.categories.map((cat) => `<span>${cat}</span>`).join("")
      : "";

    card.innerHTML = `
      <div>
        <h2>${strategy.title}</h2>
        <p>${strategy.short_description}</p>
        <div>${categoriesHtml}</div>
      </div>
      <div>
        <a href="${baseurl}/strategies/show.html?id=${strategy.id}">View Strategy</a>
        <button 
                data-id="${strategy.id}"
                ${isFavorited ? `data-favorite-id="${orgFavorite.id}"` : ""}>
          <i class="${isFavorited ? "fa-solid" : "fa-regular"} fa-bookmark"></i>
        </button>
      </div>
    `;

    const favoriteBtn = card.querySelector("button");
    favoriteBtn.addEventListener("click", () => {
      const favId = favoriteBtn.getAttribute("data-favorite-id");
      toggleFavorite(strategy.id, favId, favoriteBtn);
    });

    container.appendChild(card);
  });
};

const init = async () => {
  const auth = await requireAuthenticated();
  if (!auth) return;

  const allStrategies = await fetchStrategies();
  if (allStrategies.length === 0) {
    renderOurStrategies([], []);
    return;
  }

  const favoritesResults = await fetchFavorites();
  renderOurStrategies(allStrategies, favoritesResults);
};

document.addEventListener("DOMContentLoaded", init);
