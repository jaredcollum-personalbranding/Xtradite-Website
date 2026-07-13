const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function initDeckPlayer(player) {
  const slideCount = Number(player.dataset.slideCount || 0);
  const slidePattern = player.dataset.slideSrc;
  const interval = Math.max(Number(player.dataset.interval || 6000), 3000);
  const layers = [player.querySelector("[data-deck-slide-a]"), player.querySelector("[data-deck-slide-b]")];
  const toggle = player.querySelector("[data-deck-toggle]");
  const previous = player.querySelector("[data-deck-prev]");
  const next = player.querySelector("[data-deck-next]");
  const progress = player.querySelector("[data-deck-progress]");
  const currentLabel = player.querySelector("[data-deck-current]");
  const status = player.querySelector("[data-deck-status]");

  if (!slideCount || !slidePattern || layers.some((layer) => !layer)) return;

  let current = 0;
  let activeLayer = 0;
  let timer = null;
  let transitionToken = 0;
  let userPaused = prefersReducedMotion.matches;
  let interactionPaused = false;
  let inViewport = true;

  const slideUrl = (index) => slidePattern.replace("{n}", String(index + 1).padStart(2, "0"));
  const slideAlt = (index) => `Slide ${index + 1} of ${slideCount} from the Omnichannel D2C Operating System presentation`;

  progress.innerHTML = Array.from({ length: slideCount }, (_, index) =>
    `<button type="button" aria-label="Show slide ${index + 1}"${index === 0 ? ' class="is-active" aria-current="true"' : ""}></button>`
  ).join("");
  const progressButtons = [...progress.querySelectorAll("button")];

  function isPlaying() {
    return !userPaused && !interactionPaused && inViewport && !document.hidden;
  }

  function renderPlaybackState() {
    const playing = isPlaying();
    player.classList.toggle("is-paused", !playing);
    player.classList.toggle("is-user-paused", userPaused);
    toggle.setAttribute("aria-pressed", String(userPaused));
    toggle.setAttribute("aria-label", userPaused ? "Play presentation" : "Pause presentation");
    toggle.querySelector("span").textContent = userPaused ? "Play" : "Pause";
  }

  function scheduleNext() {
    window.clearTimeout(timer);
    timer = null;
    renderPlaybackState();
    if (!isPlaying()) return;
    timer = window.setTimeout(() => showSlide(current + 1, false), interval);
  }

  function updateControls(index, announce) {
    currentLabel.textContent = String(index + 1).padStart(2, "0");
    progressButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    status.setAttribute("aria-live", announce ? "polite" : "off");
    status.textContent = `Showing slide ${index + 1} of ${slideCount}`;
  }

  function preloadFollowing(index) {
    const image = new Image();
    image.src = slideUrl((index + 1) % slideCount);
  }

  function showSlide(requestedIndex, announce = true) {
    const index = (requestedIndex + slideCount) % slideCount;
    if (index === current && layers[activeLayer].classList.contains("is-active")) {
      scheduleNext();
      return;
    }

    const token = ++transitionToken;
    const incomingIndex = activeLayer === 0 ? 1 : 0;
    const incoming = layers[incomingIndex];
    const outgoing = layers[activeLayer];
    const image = new Image();

    image.onload = () => {
      if (token !== transitionToken) return;
      incoming.src = image.src;
      incoming.alt = slideAlt(index);
      incoming.removeAttribute("aria-hidden");
      incoming.classList.add("is-active");
      outgoing.classList.remove("is-active");
      outgoing.alt = "";
      outgoing.setAttribute("aria-hidden", "true");
      activeLayer = incomingIndex;
      current = index;
      updateControls(index, announce);
      preloadFollowing(index);
      scheduleNext();
    };
    image.src = slideUrl(index);
  }

  toggle.addEventListener("click", () => {
    userPaused = !userPaused;
    if (!userPaused) interactionPaused = false;
    scheduleNext();
  });
  previous.addEventListener("click", () => showSlide(current - 1));
  next.addEventListener("click", () => showSlide(current + 1));
  progressButtons.forEach((button, index) => button.addEventListener("click", () => showSlide(index)));

  player.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "touch") {
      interactionPaused = true;
      scheduleNext();
    }
  });
  player.addEventListener("pointerleave", () => {
    interactionPaused = false;
    scheduleNext();
  });
  player.addEventListener("focusin", () => {
    interactionPaused = true;
    scheduleNext();
  });
  player.addEventListener("focusout", () => {
    window.requestAnimationFrame(() => {
      interactionPaused = player.contains(document.activeElement);
      scheduleNext();
    });
  });

  document.addEventListener("visibilitychange", scheduleNext);
  prefersReducedMotion.addEventListener("change", (event) => {
    userPaused = event.matches;
    scheduleNext();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      scheduleNext();
    }, { threshold: 0.25 });
    observer.observe(player);
  }

  preloadFollowing(0);
  updateControls(0, false);
  scheduleNext();
}

document.querySelectorAll("[data-deck-player]").forEach(initDeckPlayer);
