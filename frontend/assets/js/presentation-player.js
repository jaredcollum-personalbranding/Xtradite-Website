const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function initDeckPlayer(player) {
  const slideCount = Number(player.dataset.slideCount || 0);
  const slidePattern = player.dataset.slideSrc;
  const interval = Math.max(Number(player.dataset.interval || 1600), 1200);
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
  let focusPaused = false;
  let interactionPauseUntil = 0;
  let inViewport = false;

  const slideUrl = (index) => slidePattern.replace("{n}", String(index + 1).padStart(2, "0"));
  const slideAlt = (index) => `Slide ${index + 1} of ${slideCount} from the case-study presentation`;

  progress.innerHTML = Array.from({ length: slideCount }, (_, index) =>
    `<button type="button" aria-label="Show slide ${index + 1}"${index === 0 ? ' class="is-active" aria-current="true"' : ""}></button>`
  ).join("");
  const progressButtons = Array.from(progress.querySelectorAll("button"));

  function isPlaying() {
    return !userPaused && !focusPaused && Date.now() >= interactionPauseUntil && inViewport && !document.hidden && !prefersReducedMotion.matches;
  }

  function renderPlaybackState() {
    const playing = isPlaying();
    player.classList.toggle("is-paused", !playing);
    player.classList.toggle("is-user-paused", userPaused);
    toggle?.setAttribute("aria-pressed", String(userPaused));
    toggle?.setAttribute("aria-label", userPaused ? "Play presentation" : "Pause presentation");
    const text = toggle?.querySelector("span");
    if (text) text.textContent = userPaused ? "Play" : "Pause";
  }

  function scheduleNext() {
    window.clearTimeout(timer);
    timer = null;
    renderPlaybackState();
    if (!isPlaying()) return;
    timer = window.setTimeout(() => showSlide(current + 1, false), interval);
  }

  function updateControls(index, announce) {
    if (currentLabel) currentLabel.textContent = String(index + 1).padStart(2, "0");
    progressButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === index;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    if (status) {
      status.setAttribute("aria-live", announce ? "polite" : "off");
      status.textContent = `Showing slide ${index + 1} of ${slideCount}`;
    }
  }

  function preloadFollowing(index) {
    const image = new Image();
    image.src = slideUrl((index + 1) % slideCount);
  }

  function showSlide(requestedIndex, announce = true, userInitiated = false) {
    const index = (requestedIndex + slideCount) % slideCount;
    if (userInitiated) interactionPauseUntil = Date.now() + 6500;
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

  toggle?.addEventListener("click", () => {
    userPaused = !userPaused;
    interactionPauseUntil = 0;
    scheduleNext();
  });
  previous?.addEventListener("click", () => showSlide(current - 1, true, true));
  next?.addEventListener("click", () => showSlide(current + 1, true, true));
  progressButtons.forEach((button, index) => button.addEventListener("click", () => showSlide(index, true, true)));

  player.addEventListener("focusin", () => { focusPaused = true; scheduleNext(); });
  player.addEventListener("focusout", () => requestAnimationFrame(() => {
    focusPaused = player.contains(document.activeElement);
    scheduleNext();
  }));

  document.addEventListener("visibilitychange", scheduleNext);
  prefersReducedMotion.addEventListener?.("change", (event) => {
    if (event.matches) userPaused = true;
    scheduleNext();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      scheduleNext();
    }, { threshold: 0.25 }).observe(player);
  } else inViewport = true;

  preloadFollowing(0);
  updateControls(0, false);
  scheduleNext();
}

document.querySelectorAll("[data-deck-player]").forEach(initDeckPlayer);
