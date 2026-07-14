const currentScript = document.currentScript;
const assetBase = currentScript?.src
  ? new URL(".", currentScript.src)
  : new URL("/assets/js/", window.location.origin);

const formsModuleUrl = new URL("forms.js", assetBase).href;
const isContactPage = window.location.pathname.replace(/\/$/, "") === "/contact";

if (!isContactPage) {
  const markup = `
    <button class="enquiry-trigger-edge" type="button" data-enquiry-open="drawer" aria-label="Open enquiry form">Start an enquiry</button>
    <button class="enquiry-trigger-mobile" type="button" data-enquiry-open="modal">Start an enquiry</button>

    <div class="enquiry-overlay" id="enquiry-modal" aria-hidden="true" inert>
      <section class="enquiry-panel" role="dialog" aria-modal="true" aria-labelledby="enquiry-modal-title">
        <button class="enquiry-close" type="button" data-enquiry-close aria-label="Close enquiry form">×</button>
        <p class="enquiry-kicker">Get in touch</p>
        <h2 class="enquiry-title" id="enquiry-modal-title">Tell us what you need.</h2>
        <p class="enquiry-intro">Share a little context and we’ll come back to you with a practical next step.</p>
        ${buildForm("modal")}
      </section>
    </div>

    <div class="enquiry-drawer" id="enquiry-drawer" aria-hidden="true" inert>
      <div class="enquiry-drawer__backdrop" data-enquiry-close></div>
      <aside class="enquiry-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="enquiry-drawer-title">
        <button class="enquiry-close" type="button" data-enquiry-close aria-label="Close enquiry form">×</button>
        <p class="enquiry-kicker">Start a conversation</p>
        <h2 class="enquiry-title" id="enquiry-drawer-title">How can we help?</h2>
        <p class="enquiry-intro">Describe the challenge, project or opportunity you want to discuss.</p>
        ${buildForm("drawer")}
      </aside>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", markup);
  initialiseEnquiryUi();
}

function buildForm(instance) {
  return `
    <form class="enquiry-form" data-enquiry-form="${instance}" novalidate>
      <div class="form-field">
        <label for="enquiry-${instance}-name">Name</label>
        <input type="text" id="enquiry-${instance}-name" name="name" required autocomplete="name">
      </div>
      <div class="form-field">
        <label for="enquiry-${instance}-email">Email</label>
        <input type="email" id="enquiry-${instance}-email" name="email" required autocomplete="email">
      </div>
      <div class="form-field">
        <label for="enquiry-${instance}-company">Company <span class="optional-tag">(optional)</span></label>
        <input type="text" id="enquiry-${instance}-company" name="company" autocomplete="organization">
      </div>
      <div class="form-field">
        <label for="enquiry-${instance}-message">What would you like help with?</label>
        <textarea id="enquiry-${instance}-message" name="message" required></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Send enquiry</button>
      <div class="form-status" role="status" aria-live="polite"></div>
    </form>`;
}

function initialiseEnquiryUi() {
  const modal = document.getElementById("enquiry-modal");
  const drawer = document.getElementById("enquiry-drawer");
  let activeContainer = null;
  let returnFocus = null;

  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-enquiry-open]");
    if (opener) {
      event.preventDefault();
      open(opener.dataset.enquiryOpen, opener);
      return;
    }

    const contactLink = event.target.closest('a[href="/contact"], a[href^="/contact?"]');
    if (contactLink && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault();
      open("modal", contactLink);
      return;
    }

    if (event.target.closest("[data-enquiry-close]")) {
      close();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!activeContainer) return;
    if (event.key === "Escape") close();
    if (event.key === "Tab") trapFocus(event, activeContainer);
  });

  document.querySelectorAll("[data-enquiry-form]").forEach((form) => {
    form.addEventListener("submit", submitForm);
  });

  function open(type, trigger) {
    close(false);
    returnFocus = trigger || document.activeElement;
    activeContainer = type === "drawer" && window.innerWidth > 767 ? drawer : modal;
    activeContainer.removeAttribute("inert");
    activeContainer.classList.add("is-open");
    activeContainer.setAttribute("aria-hidden", "false");
    document.body.classList.add("enquiry-open");
    window.setTimeout(() => {
      activeContainer.querySelector("input, textarea, button")?.focus();
    }, 40);
  }

  function close(restoreFocus = true) {
    [modal, drawer].forEach((container) => {
      container?.classList.remove("is-open");
      container?.setAttribute("aria-hidden", "true");
      container?.setAttribute("inert", "");
    });
    document.body.classList.remove("enquiry-open");
    activeContainer = null;
    if (restoreFocus) returnFocus?.focus?.();
  }

  async function submitForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector(".form-status");
    const button = form.querySelector('button[type="submit"]');

    if (!form.reportValidity()) return;

    status.className = "form-status loading";
    status.textContent = "Sending…";
    button.disabled = true;

    try {
      const { submitContactForm } = await import(formsModuleUrl);
      await submitContactForm({
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        company: form.company.value.trim(),
        message: `${form.message.value.trim()}\n\nPage: ${window.location.href}`,
      });
      status.className = "form-status success";
      status.textContent = "Thanks — we’ll be in touch shortly.";
      form.reset();
      if (typeof window.gtag === "function") {
        window.gtag("event", "generate_lead", {
          form_location: form.dataset.enquiryForm,
          page_path: window.location.pathname,
        });
      }
    } catch (error) {
      console.error(error);
      status.className = "form-status error";
      status.textContent = "Something went wrong. Please try again or use the contact page.";
    } finally {
      button.disabled = false;
    }
  }
}

function trapFocus(event, container) {
  const focusable = Array.from(
    container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
  ).filter((element) => element.offsetParent !== null);

  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
