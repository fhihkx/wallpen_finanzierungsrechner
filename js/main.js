import {
  calculateRate,
  formatPriceInputValue,
  getSafeDurationForPrice,
  getSafeResidual,
} from "./calculator.js?v=wallpen-vorlage-4";
import { buildOfferDownload } from "./pdf.js?v=wallpen-vorlage-4";
import { validateContactForm } from "./validation.js?v=wallpen-vorlage-4";

import {
  enforceEmbeddingPolicy,
} from "./security.js?v=wallpen-vorlage-4";
import {
  switchTab,
  initTabKeyboardNavigation,
  goToStep,
  renderCalculationResult,
  renderSummary,
  updateDurationOptions,
  updateResidualOptions,
  markFormErrors,
  clearFormErrors,
  setSubmitLoading,
} from "./ui.js?v=wallpen-vorlage-4";

const state = {
  calculation: null,
  submitting: false,
  offerUrl: null,
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  initApp();
}

function initApp() {
  if (!enforceEmbeddingPolicy()) return;

  bindTabs();
  bindCalculator();
  bindForm();
  updateFinancingSelections();
  initTabKeyboardNavigation();
  switchTab("calculator");
  document.getElementById("app-load-status")?.classList.add("hidden");
}

function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.dataset.tab;
      if (tabId) switchTab(tabId);
    });
  });
}

function bindCalculator() {
  const priceInput = document.getElementById("price");
  const durationInput = document.getElementById("duration");
  const residualInput = document.getElementById("residual");
  const calculateButton = document.getElementById("calculate-btn");
  const nextButton = document.getElementById("btn-next");
  const backButton = document.getElementById("back-btn");

  priceInput?.addEventListener("input", (event) => {
    event.target.value = formatPriceInputValue(event.target.value);
    updateFinancingSelections();
    resetCalculation();
  });

  durationInput?.addEventListener("change", () => {
    updateFinancingSelections();
    resetCalculation();
  });

  residualInput?.addEventListener("change", resetCalculation);

  calculateButton?.addEventListener("click", calculateAndRender);

  nextButton?.addEventListener("click", () => {
    if (!state.calculation?.valid) return;
    renderSummary(state.calculation);
    goToStep(2);
  });

  backButton?.addEventListener("click", () => {
    clearSubmissionMessage();
    goToStep(1);
  });
}

function calculateAndRender() {
  const calculation = calculateRate({
    price: getValue("price"),
    duration: getValue("duration"),
    residual: getValue("residual"),
  });

  state.calculation = calculation;
  renderCalculationResult(calculation);
  return calculation;
}

function bindForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      clearFormErrors();
      clearSubmissionMessage();
    });
    field.addEventListener("change", () => {
      clearFormErrors();
      clearSubmissionMessage();
    });
  });

  form.addEventListener("submit", handleFormSubmit);
}

async function handleFormSubmit(event) {
  event.preventDefault();

  if (state.submitting) return;

  if (!state.calculation?.valid) {
    showSubmissionMessage("Bitte berechnen Sie zuerst eine gültige Rate.", "error");
    return;
  }

  const form = event.currentTarget;

  // Honeypot: bei Bot-Eintrag still abbrechen.
  const honeypot = form.querySelector('[name="website"]')?.value?.trim();
  if (honeypot) return;

  const validation = validateContactForm({
    financingType: getValue("form-finanzierungsart"),
    salutation: getValue("form-anrede"),
    firstName: getValue("form-vorname"),
    lastName: getValue("form-nachname"),
    company: getValue("form-firma"),
    street: getValue("form-strasse"),
    postalCode: getValue("form-plz"),
    city: getValue("form-ort"),
    email: getValue("form-email"),
    phone: getValue("form-telefon"),
  });

  if (!validation.valid) {
    markFormErrors(validation.errors);
    showSubmissionMessage("Bitte prüfen Sie die markierten Pflichtfelder.", "error");
    return;
  }

  clearSubmissionMessage();
  state.submitting = true;
  setSubmitLoading(true);

  try {
    const { blob, filename } = buildOfferDownload({
      customer: validation.values,
      calculation: state.calculation,
    });
    const link = document.getElementById("offer-download");
    state.offerUrl = URL.createObjectURL(blob);
    link.href = state.offerUrl;
    link.download = filename;
    link.hidden = false;
    showSubmissionMessage("Das PDF ist bereit. Falls der Download nicht startet, klicken Sie auf den Download-Link.", "success");
    link.click();
  } catch (pdfError) {
    console.error("[PDF] Erstellung fehlgeschlagen:", pdfError);
    showSubmissionMessage(
      pdfError?.message?.includes("PDF-Bibliothek")
        ? "Die PDF-Bibliothek fehlt. Bitte laden Sie den vollständigen Ordner einschließlich vendor hoch und laden Sie die Seite neu."
        : "Das Angebot konnte nicht heruntergeladen werden. Bitte versuchen Sie es erneut und erlauben Sie Downloads im Browser.",
      "error"
    );
  } finally {
    state.submitting = false;
    setSubmitLoading(false);

  }
}

function updateFinancingSelections() {
  const price = getValue("price");
  const currentDuration = getValue("duration");
  const currentResidual = getValue("residual");

  const safeDuration = getSafeDurationForPrice(price, currentDuration);
  updateDurationOptions(price, safeDuration);

  const safeResidual = getSafeResidual(price, safeDuration, currentResidual);
  updateResidualOptions(price, safeDuration, safeResidual);
}

function resetCalculation() {
  state.calculation = null;

  const result = document.getElementById("result-display");
  const next = document.getElementById("btn-next");
  const errorBox = document.getElementById("error-msg");

  if (result) result.textContent = "0,00";
  if (next) next.disabled = true;
  if (errorBox) errorBox.classList.add("hidden");
}

function showSubmissionMessage(message, type = "error") {
  const box = document.getElementById("submit-security-msg");
  if (!box) {
    if (message) console.warn(`[Formular/${type}] ${message}`);
    return;
  }

  box.textContent = message;
  box.classList.toggle("hidden", !message);
  box.dataset.type = type;
}

function clearSubmissionMessage() {
  if (state.offerUrl) {
    URL.revokeObjectURL(state.offerUrl);
    state.offerUrl = null;
  }
  const link = document.getElementById("offer-download");
  if (link) {
    link.hidden = true;
    link.removeAttribute("href");
  }
  showSubmissionMessage("");
}

function getValue(id) {
  return document.getElementById(id)?.value?.trim() ?? "";
}
