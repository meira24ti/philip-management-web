const OFFER_LABELS = {
  dijual: "Dijual",
  disewa: "Disewakan",
  dijual_dan_disewa: "Dijual & Disewakan",
};

const OFFER_BADGE_CLASSES = {
  dijual: "border-0 bg-red-600 text-white shadow-sm",
  disewa: "border-0 bg-blue-600 text-white shadow-sm",
  dijual_dan_disewa: "border-0 bg-yellow-400 text-yellow-950 shadow-sm",
};

export const getOfferLabel = (offer, fallback = "Penawaran belum ditentukan") =>
  OFFER_LABELS[offer] || fallback;

export const getOfferBadgeClass = (offer) =>
  OFFER_BADGE_CLASSES[offer] || "border-0 bg-slate-600 text-white shadow-sm";
