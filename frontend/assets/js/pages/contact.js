import { submitContactForm } from "../forms.js";

const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");

const topic = new URLSearchParams(window.location.search).get("topic");
if (form && topic) {
  form.message.value = `I'm interested in ${topic}.`;
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = form.querySelector("button[type=submit]");
    const fields = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      company: form.company.value.trim(),
      message: form.message.value.trim(),
    };
    status.className = "form-status loading";
    status.textContent = "Sending…";
    submitBtn.disabled = true;
    try {
      const result = await submitContactForm(fields);
      status.className = "form-status success";
      status.textContent = "Thanks — we'll be in touch shortly.";
      window.dispatchEvent(new CustomEvent("xtradite:form-submitted", {
        detail: {
          placement: "contact_form",
          destination: "backend_confirmed",
          submissionId: result?.id || result?.submissionId || undefined
        }
      }));
      form.reset();
    } catch (error) {
      console.error(error);
      status.className = "form-status error";
      status.textContent = "Something went wrong sending your message — please email us directly or try again in a moment.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}
