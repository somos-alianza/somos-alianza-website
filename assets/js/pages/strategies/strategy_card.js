import { apiFetch, handleApiResult } from "../../api_helpers.js";
import { getAuthContext, showBannerAlert } from "../../shared.js";
import {
  mountBookmarkIcons,
  setBookmarkVisualState
} from "../../icons/bookmark.js";

const { baseurl, apiUrl } = document.body.dataset;

const toggleFavorite = async (strategyId, favoriteId, button) => {
  try {
    const auth = await getAuthContext();
    if (!auth?.authenticated) {
      window.location.href = `${baseurl}/login.html`;
      return;
    }

    const isFavorited = button.hasAttribute("data-favorite-id");
    if (isFavorited) {
      const res = await apiFetch(`${apiUrl}/favorites/${favoriteId}`, {
        method: "DELETE"
      });

      if (handleApiResult(res, { baseurl, onError: showBannerAlert })) {
        button.removeAttribute("data-favorite-id");
        button.setAttribute("aria-label", "Add to favorites");
        setBookmarkVisualState(button, false);
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
        if (newFavoriteId != null) {
          button.setAttribute("data-favorite-id", String(newFavoriteId));
        }
        button.setAttribute("aria-label", "Remove from favorites");
        setBookmarkVisualState(button, true);
        showBannerAlert(res.message || "Strategy added to favorites.");
      }
    }
  } catch (_error) {
    showBannerAlert("An error occurred while toggling favorite.");
  }
};

export const buildStrategyCard = (strategy, orgFavorite) => {
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
  const viewLinkWrapper = document.createElement("a");
  viewLinkWrapper.href = `${baseurl}/strategies/show.html?id=${strategy.id}`;
  viewLinkWrapper.setAttribute("role", "button");
  viewLinkWrapper.classList.add("outline");
  viewLinkWrapper.textContent = "View Strategy";

  const favoriteBtn = document.createElement("button");
  favoriteBtn.classList.add("favorite-btn");
  favoriteBtn.setAttribute("data-id", String(strategy.id));
  favoriteBtn.setAttribute(
    "aria-label",
    isFavorited ? "Remove from favorites" : "Add to favorites"
  );
  if (isFavorited && orgFavorite?.id != null) {
    favoriteBtn.setAttribute("data-favorite-id", String(orgFavorite.id));
  }

  mountBookmarkIcons(favoriteBtn);
  setBookmarkVisualState(favoriteBtn, isFavorited);

  right.appendChild(viewLinkWrapper);
  right.appendChild(favoriteBtn);

  card.appendChild(left);
  card.appendChild(right);

  favoriteBtn.addEventListener("click", () => {
    const favId = favoriteBtn.getAttribute("data-favorite-id");
    toggleFavorite(strategy.id, favId, favoriteBtn);
  });

  return card;
};
