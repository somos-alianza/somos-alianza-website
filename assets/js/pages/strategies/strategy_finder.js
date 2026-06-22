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

const buildStrategyCard = (strategy, orgFavorite) => {
  const isFavorited = !!orgFavorite;
  const card = document.createElement("div");

  const left = document.createElement("div");
  const title = document.createElement("h2");
  title.textContent = strategy.title || "";
  const description = document.createElement("p");
  description.textContent = strategy.short_description || "";
  const categories = document.createElement("div");
  (strategy.categories || []).forEach((cat) => {
    const chip = document.createElement("span");
    chip.textContent = String(cat);
    categories.appendChild(chip);
  });
  left.appendChild(title);
  left.appendChild(description);
  left.appendChild(categories);

  const right = document.createElement("div");
  const viewLink = document.createElement("a");
  viewLink.href = `${baseurl}/strategies/show.html?id=${strategy.id}`;
  viewLink.textContent = "View Strategy";

  const favoriteBtn = document.createElement("button");
  favoriteBtn.setAttribute("data-id", String(strategy.id));
  favoriteBtn.setAttribute(
    "aria-label",
    isFavorited ? "Remove from favorites" : "Add to favorites"
  );
  if (isFavorited && orgFavorite?.id != null) {
    favoriteBtn.setAttribute("data-favorite-id", String(orgFavorite.id));
  }

  const icon = document.createElement("i");
  icon.className = `${isFavorited ? "fa-solid" : "fa-regular"} fa-bookmark`;
  favoriteBtn.appendChild(icon);

  right.appendChild(viewLink);
  right.appendChild(favoriteBtn);

  card.appendChild(left);
  card.appendChild(right);

  favoriteBtn.addEventListener("click", () => {
    const favId = favoriteBtn.getAttribute("data-favorite-id");
    toggleFavorite(strategy.id, favId, favoriteBtn);
  });

  return card;
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
