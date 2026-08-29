// Google Maps links for the Lens Master store (Lal Kothi, Jaipur).

export const STORE_QUERY =
  "LENS MASTER BY The Swadesh, B-51 Lal Kothi Shopping Centre, Laxmi Colony, Lalkothi, Jaipur, Rajasthan 302015";

// Directions search the store by name so Maps opens with
// "LENS MASTER BY The Swadesh" already set as the destination.
export const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  STORE_QUERY,
)}&travelmode=driving`;

export const MAPS_PLACE_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  STORE_QUERY,
)}`;

// Official "Embed a map" iframe source from Google (safe to frame).
export const MAPS_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3558.6612118691983!2d75.7974784751439!3d26.882502861388712!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db556a3ee8345%3A0x13b84cb242512f90!2sLENS%20MASTER%20BY%20The%20Swadesh!5e0!3m2!1sen!2sin!4v1787390998396!5m2!1sen!2sin";
