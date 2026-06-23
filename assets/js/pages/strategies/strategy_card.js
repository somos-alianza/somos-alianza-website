const { baseurl } = document.body.dataset;

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
