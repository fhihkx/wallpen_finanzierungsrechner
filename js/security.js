import { SECURITY } from "./config.js?v=wallpen-vorlage-4";

export function checkEmbeddingPolicy() {
  if (window.self === window.top) return { allowed: true, reason: null };
  if (!document.referrer) return { allowed: true, reason: "missing_referrer" };
  try {
    const origin = new URL(document.referrer).origin;
    return SECURITY.allowedEmbedOrigins.includes(origin)
      ? { allowed: true, reason: null }
      : { allowed: false, reason: "unauthorized_parent" };
  } catch {
    return { allowed: false, reason: "invalid_referrer" };
  }
}

export function enforceEmbeddingPolicy() {
  const result = checkEmbeddingPolicy();
  if (result.allowed) return true;
  document.body.innerHTML = '<main style="font-family:Arial,sans-serif;padding:24px;color:#222"><h1 style="font-size:20px">Einbettung nicht erlaubt</h1><p>Dieses interne Tool darf nur über die freigegebene wallPen-Website geladen werden.</p></main>';
  return false;
}

