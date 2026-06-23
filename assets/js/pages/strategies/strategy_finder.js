import { apiFetch, handleApiResult } from "../../api_helpers.js";
import {
  requireAuthenticated,
  getAuthContext,
  showBannerAlert,
  getEmbeddedStrategies
} from "../../shared.js";
import { buildStrategyCard } from "./strategy_card.js";

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
    return [];
  } catch (_error) {
    showBannerAlert("Failed to fetch favorites.");
    return [];
  }
};

const renderStrategies = (strategies, favorites = []) => {
  const container = document.getElementById("strategies-container");
  if (!container) return;

  if (strategies.length === 0) {
    container.replaceChildren();
    const empty = document.createElement("p");
    empty.textContent = "No strategies found.";
    container.appendChild(empty);
    return;
  }

  container.replaceChildren();
  strategies.forEach((strategy) => {
    const orgFavorite = favorites.find(
      (f) => f.strategy_id === strategy.id || f.strategy?.id === strategy.id
    );
    container.appendChild(buildStrategyCard(strategy, orgFavorite));
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
