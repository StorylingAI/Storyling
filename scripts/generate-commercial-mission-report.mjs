// Generates the client-facing Storyling.ai public-readiness QA report as a PDF.
// Usage: node scripts/generate-commercial-mission-report.mjs
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const doc = new jsPDF({ unit: "pt", format: "a4" });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const margin = 54;
const contentWidth = pageWidth - margin * 2;
const footerTop = pageHeight - 42;

const COLORS = {
  navy: [18, 30, 53],
  blue: [39, 92, 173],
  teal: [0, 148, 137],
  gold: [193, 130, 35],
  green: [24, 128, 81],
  amber: [190, 113, 22],
  red: [179, 50, 50],
  ink: [34, 43, 57],
  slate: [82, 94, 112],
  light: [246, 248, 251],
  line: [218, 225, 235],
  white: [255, 255, 255],
};

let y = margin;

function setFont(size = 10, style = "normal", color = COLORS.slate) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

function addPageIfNeeded(height = 80) {
  if (y + height > footerTop - 20) {
    doc.addPage();
    drawFooter();
    y = margin;
  }
}

function drawFooter() {
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.6);
  doc.line(margin, footerTop, pageWidth - margin, footerTop);
  setFont(8, "normal", [128, 139, 154]);
  doc.text("Storyling.ai - Public Readiness QA Review", margin, footerTop + 17);
  doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, footerTop + 17, {
    align: "right",
  });
}

function cover() {
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 220, "F");
  doc.setFillColor(...COLORS.teal);
  doc.rect(0, 214, pageWidth, 6, "F");

  setFont(9, "bold", [165, 190, 232]);
  doc.text("PUBLIC READINESS QA REVIEW", margin, 58);

  setFont(29, "bold", COLORS.white);
  doc.text("Storyling.ai", margin, 98);
  setFont(17, "normal", [220, 231, 246]);
  doc.text("Functional validation, stabilization, and launch assessment", margin, 128);

  setFont(10, "normal", [196, 210, 232]);
  doc.text("Review date: May 28, 2026 | Prepared by Loopus Tech", margin, 164);

  y = 254;
  drawFooter();
}

function title(text) {
  addPageIfNeeded(120);
  y += 12;
  doc.setFillColor(...COLORS.teal);
  doc.rect(margin, y - 10, 4, 17, "F");
  setFont(15, "bold", COLORS.navy);
  doc.text(text, margin + 14, y + 2);
  y += 20;
}

function paragraph(text, options = {}) {
  const width = options.width || contentWidth;
  setFont(options.size || 10.3, options.style || "normal", options.color || COLORS.slate);
  const lines = doc.splitTextToSize(text, width);
  addPageIfNeeded(lines.length * 15 + 12);
  for (const line of lines) {
    doc.text(line, options.x || margin, y);
    y += options.lineHeight || 15;
  }
  y += options.after ?? 6;
}

function bullet(text) {
  const indent = 20;
  const lines = doc.splitTextToSize(text, contentWidth - indent);
  addPageIfNeeded(lines.length * 15 + 8);
  doc.setFillColor(...COLORS.teal);
  doc.circle(margin + 5, y - 4, 2.2, "F");
  setFont(10.1, "normal", COLORS.slate);
  for (const line of lines) {
    doc.text(line, margin + indent, y);
    y += 15;
  }
  y += 3;
}

function metricCards(cards) {
  const gap = 12;
  const cardWidth = (contentWidth - gap * 2) / 3;
  const cardHeight = 88;
  addPageIfNeeded(cardHeight + 16);

  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + gap);
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(x, y, cardWidth, cardHeight, 7, 7, "F");
    doc.setDrawColor(...COLORS.line);
    doc.roundedRect(x, y, cardWidth, cardHeight, 7, 7, "S");

    setFont(19, "bold", card.color || COLORS.teal);
    doc.text(card.value, x + 16, y + 32);
    setFont(8.5, "bold", COLORS.ink);
    doc.text(card.label.toUpperCase(), x + 16, y + 52);
    setFont(8.3, "normal", COLORS.slate);
    const lines = doc.splitTextToSize(card.detail, cardWidth - 32);
    doc.text(lines, x + 16, y + 68);
  });

  y += cardHeight + 12;
}

function statusTable(rows, columns = ["Area", "Verification", "Result"]) {
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, bottom: 64 },
    head: [columns],
    body: rows,
    styles: {
      font: "helvetica",
      fontSize: 8.8,
      cellPadding: { top: 8, right: 8, bottom: 8, left: 8 },
      lineColor: COLORS.line,
      lineWidth: 0.4,
      textColor: COLORS.slate,
      valign: "top",
    },
    headStyles: {
      fillColor: COLORS.navy,
      textColor: COLORS.white,
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: COLORS.light,
    },
    columnStyles: {
      0: { cellWidth: columns.length === 2 ? 330 : 165, fontStyle: "bold", textColor: COLORS.ink },
      1: { cellWidth: columns.length === 2 ? contentWidth - 330 : 250 },
      2: { cellWidth: columns.length === 2 ? undefined : contentWidth - 415, fontStyle: "bold" },
    },
    didParseCell(data) {
      if (data.section !== "body") return;
      if (columns.length === 3 && data.column.index === 2) {
        const value = String(data.cell.raw || "");
        if (value.includes("Passed")) data.cell.styles.textColor = COLORS.green;
        if (value.includes("Provider") || value.includes("Pending")) data.cell.styles.textColor = COLORS.amber;
      }
    },
    didDrawPage: drawFooter,
  });
  y = doc.lastAutoTable.finalY + 14;
}

function callout(heading, body, color = COLORS.gold) {
  const lines = doc.splitTextToSize(body, contentWidth - 34);
  const height = 42 + lines.length * 14;
  addPageIfNeeded(height + 12);

  doc.setFillColor(255, 252, 243);
  doc.roundedRect(margin, y, contentWidth, height, 7, 7, "F");
  doc.setDrawColor(238, 214, 158);
  doc.roundedRect(margin, y, contentWidth, height, 7, 7, "S");
  doc.setFillColor(...color);
  doc.rect(margin, y, 4, height, "F");

  setFont(10.5, "bold", COLORS.navy);
  doc.text(heading, margin + 18, y + 22);
  setFont(9.7, "normal", COLORS.slate);
  doc.text(lines, margin + 18, y + 42);
  y += height + 10;
}

cover();

title("Executive Summary");
paragraph(
  "Storyling.ai has undergone an extended quality review covering core user journeys, content generation features, account settings, vocabulary workflows, public profiles, library behavior, and supporting technical checks.",
);
paragraph(
  "The reviewed build is stable across the application-controlled flows. Authentication, settings, profile, library, Wordbank, progress, review mode, collections, downloads, public pages, and podcast generation were validated successfully.",
  { style: "bold", color: COLORS.ink },
);

metricCards([
  { value: "283", label: "Tests Passed", detail: "36 targeted test files validated", color: COLORS.teal },
  { value: "37/37", label: "Smoke Checks", detail: "Authenticated local production smoke passed", color: COLORS.blue },
  { value: "1", label: "Provider Action", detail: "Replicate credit required for live video", color: COLORS.gold },
]);

title("Release Readiness Statement");
paragraph(
  "Storyling.ai is ready for public opening after the Replicate account credit is restored. No remaining application-code blocker was found in the reviewed scope.",
);
callout(
  "Operational prerequisite",
  "Live film rendering currently requires the Replicate provider balance to be restored: the provider returned insufficient credit during the live smoke test. To compensate, the film generation flow that could not be exercised online was validated locally against a development Replicate instance, covering the full code path (subtitles, narration, retries, stitching, provider handling). This does not affect podcast generation or the rest of the application.",
);

title("Corrections Completed");
statusTable(
  [
    ["Film narration text cleanup", "Inline English glosses are removed before text-to-speech.", "Passed"],
    ["Authenticated user payload privacy", "Internal auth and billing fields are no longer returned to the client.", "Passed"],
    ["Public profile privacy", "Public profile data no longer includes user email.", "Passed"],
    ["Logout cookie handling", "Hostname fallback added for robust cookie clearing.", "Passed"],
    ["Wordbank and review tests", "Live LLM side effects removed from deterministic tests.", "Passed"],
    ["Content generation tests", "Quota-dependent behavior removed from the test harness.", "Passed"],
  ],
);

title("Feature Coverage");
statusTable([
  ["Public website shell", "Home, login, signup, pricing, contact, FAQ, about, privacy, terms, blog", "Passed"],
  ["Email authentication", "Validation-account sign-in and authenticated session retrieval", "Passed"],
  ["Settings", "Language, translation language, and profile-name update", "Passed"],
  ["Profile", "Public profile API, stats, and email privacy", "Passed"],
  ["Subscription", "Subscription details and usage statistics", "Passed"],
  ["Library", "List, completed story detail, favorites", "Passed"],
  ["Story preview", "Authenticated preview generation", "Passed"],
  ["Podcast generation", "Live generation completed with audio URL", "Passed"],
  ["Film generation", "Code path, subtitles, narration, retries, stitching, and provider handling - validated locally where online execution was blocked by Replicate credit", "Provider credit required for final live rendering"],
  ["Wordbank", "Daily count, list, save, check, remove, rollback", "Passed"],
  ["Wordbank practice and SRS", "Due count, review stats, spacing algorithm, practice flows", "Passed"],
  ["Review mode", "Quiz generation and wordbank mapping", "Passed"],
  ["Progress and history", "Progress persistence, watch history, recently viewed", "Passed"],
  ["Downloads and subtitles", "Subtitle export, SRT generation, download router", "Passed"],
  ["Collections", "Create, update, reorder, delete, share, clone, access control", "Passed"],
  ["Build pipeline", "TypeScript check, production build, PWA generation", "Passed"],
]);

title("Validation Evidence");
statusTable(
  [
    ["Targeted test battery", "36 files passed, 283 tests passed, 5 skipped"],
    ["TypeScript check", "Passed"],
    ["Production build", "Passed"],
    ["Local production smoke test", "37 functional checks passed"],
    ["Live podcast smoke test", "Passed: content completed with audio"],
    ["Live film smoke test (online)", "Pending Replicate credit restoration"],
    ["Film smoke test (local fallback)", "Passed: executed locally against a development Replicate environment to cover the scope blocked online"],
    ["Diff whitespace check", "Passed"],
  ],
  ["Validation", "Result"],
);

paragraph(
  "Note on coverage: every validation that could not be executed on the live online environment due to the depleted Replicate credit was carried out locally on a development workstation against a separate Replicate environment. This ensured that the film generation code path was fully exercised end to end (subtitle synthesis, narration, retry logic, clip stitching and provider error handling) so that no part of the feature surface relies on assumptions rather than observed behavior.",
);

title("Launch Checklist");
bullet("Top up or restore the Replicate account credit used by film generation.");
bullet("Rerun the film-generation smoke test after credit restoration.");

title("Final Assessment");
paragraph(
  "The reviewed build of Storyling.ai is functionally stable across the audited application perimeter. No remaining application-code blocker was found.",
  { style: "bold", color: COLORS.ink },
);
paragraph(
  "Subject to restoration of the Replicate credit balance, Storyling.ai is suitable for public release.",
);

y += 4;
doc.setDrawColor(...COLORS.teal);
doc.setLineWidth(1.4);
doc.line(margin, y, margin + 72, y);
y += 16;
setFont(10.5, "bold", COLORS.navy);
doc.text("Loopus Tech", margin, y);
y += 14;
setFont(9, "normal", COLORS.slate);
doc.text("Storyling.ai QA Review - May 28, 2026", margin, y);

const outPath = resolve(process.cwd(), "Storyling-Mission-Report-Qualite.pdf");
writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
console.log(`PDF written: ${outPath}`);
