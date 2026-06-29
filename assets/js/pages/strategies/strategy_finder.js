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
