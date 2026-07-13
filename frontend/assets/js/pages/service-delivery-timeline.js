function initialiseDeliveryTimeline() {
  const timeline = document.querySelector('.service-delivery-timeline');
  if (!timeline || timeline.dataset.timelineReady === 'true') return;

  timeline.dataset.timelineReady = 'true';
  const phases = Array.from(timeline.querySelectorAll('[data-delivery-phase]'));
  if (!phases.length) return;

  const setCurrentPhase = () => {
    const targetY = window.innerHeight * 0.48;
    let current = phases[0];
    let closest = Infinity;

    phases.forEach((phase) => {
      const rect = phase.getBoundingClientRect();
      const centre = rect.top + Math.min(rect.height, 140) / 2;
      const distance = Math.abs(centre - targetY);
      if (distance < closest) {
        closest = distance;
        current = phase;
      }
    });

    phases.forEach((phase) => phase.classList.toggle('is-current', phase === current));

    const timelineRect = timeline.getBoundingClientRect();
    const start = window.innerHeight * 0.55;
    const end = window.innerHeight * 0.45 - timelineRect.height;
    const progress = Math.max(0, Math.min(1, (start - timelineRect.top) / (start - end)));
    timeline.style.setProperty('--delivery-progress', `${progress * 100}%`);
  };

  let ticking = false;
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      setCurrentPhase();
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.18 });

  phases.forEach((phase) => observer.observe(phase));
  setCurrentPhase();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
}

export function watchDeliveryTimeline() {
  initialiseDeliveryTimeline();

  if (document.querySelector('.service-delivery-timeline')) return;

  const observer = new MutationObserver(() => {
    if (!document.querySelector('.service-delivery-timeline')) return;
    initialiseDeliveryTimeline();
    observer.disconnect();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
