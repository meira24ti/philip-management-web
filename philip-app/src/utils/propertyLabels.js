const OFFER_LABELS = {
  dijual: "Dijual",
  disewa: "Disewakan",
  dijual_dan_disewa: "Dijual & Disewakan",
};

const OFFER_BADGE_CLASSES = {
  dijual: "bg-red-100 text-red-800",
  disewa: "bg-blue-100 text-blue-800",
  dijual_dan_disewa: "bg-amber-100 text-amber-800",
};

export const getOfferLabel = (offer, fallback = "Penawaran belum ditentukan") =>
  OFFER_LABELS[offer] || fallback;

export const getOfferBadgeClass = (offer) =>
  OFFER_BADGE_CLASSES[offer] || "bg-gray-100 text-gray-700";

