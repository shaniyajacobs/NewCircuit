// ============================================================
// SLUG UTILS — shared slug builder for event registration URLs
// Backend version (CommonJS). Keep in sync with src/utils/slugUtils.js
// ============================================================

function sanitizePart(value, fallback = "event") {
  if (value === undefined || value === null) return fallback;
  const str = String(value).trim().toLowerCase();
  if (!str) return fallback;
  const cleaned = str.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

function formatTimeForSlug(time) {
  if (!time) return "tbd";

  if (typeof time === "number") {
    const d = new Date(time);
    if (isNaN(d.getTime())) return "tbd";
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return `${h}${m > 0 ? "-" + String(m).padStart(2, "0") : ""}${ampm}`;
  }

  if (typeof time === "string") {
    const ampmMatch = time.match(/^(\d{1,2}):?(\d{0,2})\s*(am|pm)$/i);
    if (ampmMatch) {
      const h = ampmMatch[1];
      const m = ampmMatch[2];
      const period = ampmMatch[3].toLowerCase();
      return `${h}${m ? "-" + m : ""}${period}`;
    }
    const hhmmMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmmMatch) {
      let h = parseInt(hhmmMatch[1], 10);
      const m = hhmmMatch[2];
      const period = h >= 12 ? "pm" : "am";
      h = h % 12 || 12;
      return `${h}${m !== "00" ? "-" + m : ""}${period}`;
    }
  }

  return sanitizePart(time, "tbd");
}

function buildEventSlug(event, gender) {
  if (!event) return "event";

  const city = sanitizePart(event.location || event.city || event.title, "event");
  const ageRange = sanitizePart(event.ageRange || event.ageGroup, "all");

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

  let timeStr = "tbd";
  if (event.time) {
    timeStr = formatTimeForSlug(event.time);
  } else if (event.startTime) {
    timeStr = formatTimeForSlug(Number(event.startTime));
  }

  const genderSlug = sanitizePart(gender, "general");

  return `${city}_${ageRange}_${dateStr}_${timeStr}_${genderSlug}`;
}

module.exports = {
  buildEventSlug,
  sanitizePart,
  formatTimeForSlug,
};