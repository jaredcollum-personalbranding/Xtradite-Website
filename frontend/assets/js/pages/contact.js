import { submitContactForm } from "../forms.js";

const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
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
      await submitContactForm(fields);
      status.className = "form-status success";
      status.textContent = "Thanks — we'll be in touch shortly.";
      form.reset();
    } catch (err) {
      console.error(err);
      status.className = "form-status error";
      status.textContent = "Something went wrong sending your message — please email us directly or try again in a moment.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}
