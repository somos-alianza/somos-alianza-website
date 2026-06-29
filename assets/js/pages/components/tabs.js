const tabs = () => {
  document.querySelectorAll("[data-tabs]").forEach((wrapper) => {
    const btns = Array.from(wrapper.querySelectorAll(".tabs__btn"));
    const panels = Array.from(wrapper.querySelectorAll(".tabs__panel"));
    const indicator = wrapper.querySelector(".tabs__indicator");

    if (!btns.length || !panels.length || !indicator) return;

    const moveIndicator = (btn) => {
      indicator.style.left = `${btn.offsetLeft}px`;
      indicator.style.width = `${btn.offsetWidth}px`;
    };

    const activate = (index) => {
      btns.forEach((btn) => {
        btn.setAttribute("aria-selected", "false");
      });

      panels.forEach((panel) => {
        panel.classList.remove("tabs__panel--visible");
        setTimeout(() => {
          if (!panel.classList.contains("tabs__panel--active")) return;
          panel.classList.remove("tabs__panel--active");
        }, 220);
      });

      btns[index].setAttribute("aria-selected", "true");
      moveIndicator(btns[index]);

      const panel = panels[index];
      panel.classList.add("tabs__panel--active");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          panel.classList.add("tabs__panel--visible");
        });
      });
    };

    btns.forEach((btn, i) => {
      btn.addEventListener("click", () => {
        activate(i);
      });
    });

    const activeBtn =
      btns.find((btn) => btn.getAttribute("aria-selected") === "true") ||
      btns[0];
    moveIndicator(activeBtn);
  });
};

tabs();
