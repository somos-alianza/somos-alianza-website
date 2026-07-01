const { baseurl = "" } = document.body.dataset;
const OUTLINE_SRC = `${baseurl}/assets/icons/bookmark-outline.svg`;
const FILLED_SRC = `${baseurl}/assets/icons/bookmark-filled.svg`;

export const mountBookmarkIcons = (button) => {
  if (!button || button.querySelector(".bookmark-icon")) return;

  const icon = document.createElement("img");
  icon.className = "bookmark-icon";
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");
  icon.width = 25;
  icon.height = 31;
  button.appendChild(icon);
};

export const setBookmarkVisualState = (button, isFavorited) => {
  if (!button) return;
  const favorited = Boolean(isFavorited);
  button.classList.toggle("is-favorited", favorited);

  const icon = button.querySelector(".bookmark-icon");
  if (!icon) return;

  icon.src = favorited ? FILLED_SRC : OUTLINE_SRC;
  icon.width = 25;
  icon.height = favorited ? 33 : 31;
};
