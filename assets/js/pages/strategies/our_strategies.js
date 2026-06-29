import { apiFetch } from "../../api_helpers.js";
import {
  requireAuthenticated,
  getAuthContext,
  showBannerAlert,
  getEmbeddedStrategies
} from "../../shared.js";
import { buildStrategyCard } from "./strategy_card.js";

const { apiUrl } = document.body.dataset;

const fetchStrategies = async () => {
  return getEmbeddedStrategies({ onError: showBannerAlert });
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

const renderOurStrategies = (allStrategies, favorites) => {
  const container = document.getElementById("strategies-container");
  if (!container) return;

  if (favorites.length === 0) {
    container.replaceChildren();
    const empty = document.createElement("p");
    empty.textContent = "No strategies favorited by your organization yet.";
    container.appendChild(empty);
    return;
  }

  container.replaceChildren();

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
    container.appendChild(buildStrategyCard(strategy, orgFavorite));
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
