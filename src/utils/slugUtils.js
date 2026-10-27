// ============================================================
// SLUG UTILS — shared slug builder for event registration URLs
// Used by EventsPage (frontend) and Cloud Functions (backend)
// to guarantee identical URLs across the app and SMS/email links.
//
// Format:  {city}_{ageRange}_{yyyy-mm-dd}_{h:mma}_{gender}
// Example: boston_25-34_2026-09-25_7-30pm_women
// ============================================================

/**
 * Sanitize a single part of the slug — lowercase, alphanumeric only,
 * spaces/dots/slashes replaced with dashes.
 */
function sanitizePart(value, fallback = "event") {
  if (value === undefined || value === null) return fallback;
  const str = String(value).trim().toLowerCase();
  if (!str) return fallback;
  // Replace non-alphanumeric runs with a dash
  const cleaned = str.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

/**
 * Format the time portion of the slug from various inputs.
 * Accepts:
 *   - "7:30 PM"  → "7-30pm"
 *   - "19:30"    → "7-30pm"
 *   - timestamps → converted
 * Returns "tbd" if it can't parse.
 */
function formatTimeForSlug(time) {
  if (!time) return "tbd";

  // If it's a number (timestamp)
  if (typeof time === "number") {
    const d = new Date(time);
    if (isNaN(d.getTime())) return "tbd";
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return `${h}${m > 0 ? "-" + String(m).padStart(2, "0") : ""}${ampm}`;
  }

  // If it's a string, try a few formats
  if (typeof time === "string") {
    // Already has am/pm?
    const ampmMatch = time.match(/^(\d{1,2}):?(\d{0,2})\s*(am|pm)$/i);
    if (ampmMatch) {
      const h = ampmMatch[1];
      const m = ampmMatch[2];
      const period = ampmMatch[3].toLowerCase();
      return `${h}${m ? "-" + m : ""}${period}`;
    }
    // 24-hour format?
    const hhmmMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmmMatch) {
      let h = parseInt(hhmmMatch[1], 10);
      const m = hhmmMatch[2];
      const period = h >= 12 ? "pm" : "am";
      h = h % 12 || 12;
      return `${h}${m !== "00" ? "-" + m : ""}${period}`;
    }
  }

  // Fallback — sanitize whatever it is
  return sanitizePart(time, "tbd");
}

/**
 * Build the slug from an event object and gender.
 * @param {Object} event - Firestore event document data (must include title/location/date/etc.)
 * @param {string} gender - "Women" | "Men" | "Female" | "Male"
 * @returns {string} slug like "boston_25-34_2026-09-25_7-30pm_women"
 */
function buildEventSlug(event, gender) {
  if (!event) return "event";

  // City (fallback to title)
  const city = sanitizePart(event.location || event.city || event.title, "event");

  // Age range — prefer ageRange, then ageGroup
  const ageRange = sanitizePart(event.ageRange || event.ageGroup, "all");

  // Date — from date string or startTime timestamp
  let dateStr = "tbd";
  if (event.date) {
    dateStr = sanitizePart(event.date, "tbd");
  } else if (event.startTime) {
    const d = new Date(Number(event.startTime));
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      dateStr = `${yyyy}-${mm}-${dd}`;
    }
  }

  // Time — from time string or startTime timestamp
  let timeStr = "tbd";
  if (event.time) {
    timeStr = formatTimeForSlug(event.time);
  } else if (event.startTime) {
    timeStr = formatTimeForSlug(Number(event.startTime));
  }

  // Gender
  const genderSlug = sanitizePart(gender, "general");

  return `${city}_${ageRange}_${dateStr}_${timeStr}_${genderSlug}`;
}

module.exports = {
  buildEventSlug,
  sanitizePart,
  formatTimeForSlug,
};