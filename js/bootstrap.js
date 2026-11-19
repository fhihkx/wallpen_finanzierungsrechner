// Report missing or mismatched uploads instead of leaving inactive controls.
import("./main.js?v=wallpen-angebot-20261119").catch((error) => {
  console.error("[wallPen] Rechner konnte nicht gestartet werden:", error);
  const status = document.getElementById("app-load-status") || document.body.prepend(document.createElement("p")) || document.body.firstElementChild;
  if (status) {
    status.textContent = "Der Rechner konnte nicht geladen werden. Bitte laden Sie den vollständigen ZIP-Inhalt hoch und laden Sie die Seite anschließend neu.";
    status.classList.remove("hidden");
    status.setAttribute("role", "alert");
  }
});
