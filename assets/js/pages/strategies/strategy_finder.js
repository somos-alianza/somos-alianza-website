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

const toggleFavorite = async (strategyId, favoriteId, button) => {
  try {
    const auth = await getAuthContext();
    if (!auth?.authenticated) {
      window.location.href = `${baseurl}/login.html`;
      return;
    }

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
      const res = await apiFetch(
        `${apiUrl}/strategies/${strategyId}/favorites`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }
      );

      if (handleApiResult(res, { baseurl, onError: showBannerAlert })) {
        console.log(res);
        const newFavoriteId = res.item?.id;
        button.setAttribute("data-favorite-id", newFavoriteId);
        icon.className = "fa-solid fa-bookmark";
        showBannerAlert(res.message || "Strategy added to favorites.");
      }
    }
  } catch (error) {
    showBannerAlert("An error occurred while toggling favorite.");
  }
};

const fetchFavorites = async () => {
  const auth = await getAuthContext();
  if (!auth?.authenticated) return [];

  try {
    const res = await apiFetch(`${apiUrl}/favorites`);
    if (res.ok) {
      return res.items || [];
    }
  } catch (_error) {
    showBannerAlert("Failed to fetch favorites.");
    return [];
  }
};

const renderStrategies = (strategies, favorites = []) => {
  const container = document.getElementById("strategies-container");
  if (!container) return;

  if (strategies.length === 0) {
    container.innerHTML = "<p>No strategies found.</p>";
    return;
  }

  container.innerHTML = "";
  strategies.forEach((strategy) => {
    const orgFavorite = favorites.find(
      (f) => f.strategy_id === strategy.id || f.strategy?.id === strategy.id
    );

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
  try {
    const strategies = await fetchStrategies();
    const auth = await requireAuthenticated();
    if (!auth) return;

    let favorites = [];
    if (strategies.length > 0) {
      favorites = await fetchFavorites();
    }

    renderStrategies(strategies, favorites);
  } catch (_error) {
    showBannerAlert("An error occurred while loading strategies.");
  }
};

document.addEventListener("DOMContentLoaded", init);
