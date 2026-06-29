const accordion = () => {
  const accordions = Array.from(document.querySelectorAll(".accordion"));

  const open = (item) => {
    item.classList.add("accordion__item--open");
    item
      .querySelector(".accordion__trigger")
      .setAttribute("aria-expanded", "true");
  };

  const close = (item) => {
    item.classList.remove("accordion__item--open");
    item
      .querySelector(".accordion__trigger")
      .setAttribute("aria-expanded", "false");
  };

  accordions.forEach((accordion) => {
    const items = Array.from(accordion.querySelectorAll(".accordion__item"));

    items.forEach((item) => {
      item
        .querySelector(".accordion__trigger")
        ?.addEventListener("click", () => {
          const isOpen = item.classList.contains("accordion__item--open");

          // Keep one-open-at-a-time behavior per accordion.
          items.forEach((other) => {
            if (other !== item) close(other);
          });

          isOpen ? close(item) : open(item);
        });
    });
  });
};

accordion();
