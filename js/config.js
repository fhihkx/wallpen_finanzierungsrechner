// wallPen-Matrix: Leasingfaktoren in Prozent, unabhängig vom Anschaffungspreis.
// null entspricht „xxx“ in der freigegebenen Konditionstabelle.
export const LEASING_FACTORS = Object.freeze({
  10: Object.freeze({48: 2.27, 54: 2.05, 60: 1.87}),
  20: Object.freeze({48: 2.08, 54: null, 60: null}),
});

export const ALLOWED_DURATIONS = Object.freeze(["48", "54", "60"]);
export const ALLOWED_RESIDUALS = Object.freeze(["10", "20"]);
export const ALLOWED_FINANCING_TYPES = Object.freeze(["Leasing", "Mietkauf"]);
export const ALLOWED_SALUTATIONS = Object.freeze(["Frau", "Herr"]);

export const INPUT_LIMITS = Object.freeze({
  priceMin: 1,
  priceMax: 999999999.99,
  nameMaxLength: 50,
  companyMaxLength: 100,
  streetMaxLength: 150,
  postalCodeMaxLength: 10,
  cityMaxLength: 100,
  emailMaxLength: 120,
  phoneMaxLength: 40,
});

export const PDF_COMPANY = Object.freeze({
  name: "wallPen GmbH",
  street: "Werkstrasse 15",
  postalCity: "57537 Wissen",
  phone: "+49 2742 966 800",
  email: "info@wallpen.com",
  website: "wallpen.com",
});

export const SECURITY = Object.freeze({
  allowedEmbedOrigins: Object.freeze([
    "https://www.wallpen.com",
    "https://wallpen.com"
  ]),
});
