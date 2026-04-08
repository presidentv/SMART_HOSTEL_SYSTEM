/**
 * Automatic Priority Detection Logic
 * Priority Levels: URGENT, HIGH, NORMAL, LOW
 */

const URGENT_KEYWORDS = [
  "short circuit", "spark", "fire", "burning smell", "electric shock",
  "smoke", "wire damage", "danger", "hazard", "gas leak", "explosion"
];

const HIGH_KEYWORDS = [
  "water leak", "pipe burst", "overflow", "sewage", "flood",
  "blocked drain", "toilet overflow"
];

const NORMAL_KEYWORDS = [
  "dust", "dirty", "clean room", "garbage", "trash", "routine cleaning"
];

const LOW_KEYWORDS = [
  "minor repair", "small issue", "adjustment", "non-urgent"
];

export function detectPriority(category: string, description: string, room: string): string {
  const desc = description.toLowerCase();
  const cat = category.toUpperCase();

  let priority = "NORMAL";

  // 1. Category-Based Defaults
  if (cat === "ELECTRICAL") {
    priority = "URGENT";
  } else if (cat === "WATER" || cat === "WASTE") {
    priority = "HIGH";
  } else if (cat === "CLEANING") {
    priority = "NORMAL";
  } else {
    priority = "LOW";
  }

  // 2. Keyword-Based Detection
  let keywordPriority: string | null = null;

  if (URGENT_KEYWORDS.some(k => desc.includes(k))) {
    keywordPriority = "URGENT";
  } else if (HIGH_KEYWORDS.some(k => desc.includes(k))) {
    keywordPriority = "HIGH";
  } else if (NORMAL_KEYWORDS.some(k => desc.includes(k))) {
    keywordPriority = "NORMAL";
  } else if (LOW_KEYWORDS.some(k => desc.includes(k))) {
    keywordPriority = "LOW";
  }

  // Description-based overrides category if keyword detected
  if (keywordPriority) {
    priority = keywordPriority;
  }

  // 3. Severity Boost Rules
  
  // Rule: Multiple URGENT keywords boost or force URGENT
  const urgentMatchCount = URGENT_KEYWORDS.filter(k => desc.includes(k)).length;
  if (urgentMatchCount >= 2) {
    priority = "URGENT";
  }

  // Rule: Common Areas increase priority by one level
  if (room.toLowerCase().includes("common area")) {
    const levels = ["LOW", "NORMAL", "HIGH", "URGENT"];
    const currentIndex = levels.indexOf(priority);
    if (currentIndex < levels.length - 1) {
      priority = levels[currentIndex + 1];
    }
  }

  return priority;
}
