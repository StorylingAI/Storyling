import fs from "node:fs/promises";
import path from "node:path";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.length ? rest.join("=") : "true"];
  }),
);

const baseUrl = (args.get("base") || process.env.STORYLING_QA_BASE_URL || "http://localhost:3100").replace(/\/$/, "");
const email = process.env.STORYLING_QA_EMAIL;
const password = process.env.STORYLING_QA_PASSWORD;
const runLiveGeneration = args.get("live-generation") === "true";
const runFilmGeneration = args.get("film") === "true";
const pollMs = Number(args.get("poll-ms") || 15000);
const timeoutMs = Number(args.get("timeout-ms") || 20 * 60 * 1000);
const outFile =
  args.get("out") ||
  path.join(
    "qa-artifacts",
    `storyling-smoke-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );

if (!email || !password) {
  throw new Error("Set STORYLING_QA_EMAIL and STORYLING_QA_PASSWORD before running this script.");
}

const cookieJar = new Map();
const results = {
  meta: {
    baseUrl,
    startedAt: new Date().toISOString(),
    liveGeneration: runLiveGeneration,
    filmGeneration: runFilmGeneration,
  },
  checks: [],
  generatedContent: [],
};

function cookieHeader() {
  return [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function storeCookies(headers) {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return;

  for (const cookie of setCookie.split(/,(?=\s*[^;,]+=)/)) {
    const [pair] = cookie.trim().split(";");
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;
    cookieJar.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}

function summarize(value) {
  if (Array.isArray(value)) {
    return { type: "array", count: value.length };
  }

  if (!value || typeof value !== "object") return value;

  const object = value;
  if ("contentId" in object) return { contentId: object.contentId };
  if ("id" in object && "status" in object) {
    return {
      id: object.id,
      status: object.status,
      mode: object.mode,
      title: object.title || null,
      hasStoryText: Boolean(object.storyText),
      hasAudioUrl: Boolean(object.audioUrl),
      hasVideoUrl: Boolean(object.videoUrl),
      hasThumbnailUrl: Boolean(object.thumbnailUrl),
      failureReason: object.failureReason || null,
    };
  }
  if ("preview" in object) {
    return { previewLength: String(object.preview || "").length };
  }

  const copy = {};
  for (const [key, val] of Object.entries(object)) {
    if (/password|token|secret|hash|customer|subscriptionId/i.test(key)) continue;
    if (typeof val === "string" && val.length > 120) {
      copy[key] = `${val.slice(0, 120)}...`;
    } else {
      copy[key] = val;
    }
  }
  return copy;
}

function record(name, status, details = {}) {
  results.checks.push({
    name,
    status,
    at: new Date().toISOString(),
    ...details,
  });
  const marker = status === "passed" ? "PASS" : status === "warning" ? "WARN" : "FAIL";
  console.log(`${marker} ${name}`);
}

async function httpCheck(route) {
  const response = await fetch(`${baseUrl}${route}`, {
    headers: cookieJar.size ? { cookie: cookieHeader() } : undefined,
  });
  storeCookies(response.headers);
  const passed = response.status >= 200 && response.status < 400;
  record(`HTTP ${route}`, passed ? "passed" : "failed", {
    statusCode: response.status,
    contentType: response.headers.get("content-type"),
  });
  if (!passed) throw new Error(`HTTP ${route} returned ${response.status}`);
}

async function trpc(pathName, input, { method = "POST" } = {}) {
  const headers = { "content-type": "application/json" };
  if (cookieJar.size) headers.cookie = cookieHeader();

  let url = `${baseUrl}/api/trpc/${pathName}`;
  const init = { method, headers };
  if (method === "GET") {
    if (input !== undefined) {
      url += `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
    }
  } else {
    init.body = JSON.stringify({ json: input ?? null });
  }

  const response = await fetch(url, init);
  storeCookies(response.headers);
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok || payload?.error) {
    const message = payload?.error?.message || payload?.message || text || response.statusText;
    const error = new Error(`${pathName} failed: ${message}`);
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }

  return payload?.result?.data?.json ?? payload?.result?.data ?? payload?.json ?? payload;
}

async function trpcCheck(name, pathName, input, options = {}) {
  try {
    const data = await trpc(pathName, input, options);
    record(name, "passed", { summary: summarize(data) });
    return data;
  } catch (error) {
    record(name, "failed", {
      statusCode: error.statusCode,
      message: error.message,
    });
    throw error;
  }
}

function assertNoInternalUserFields(user, checkName) {
  const internalKeys = [
    "passwordHash",
    "verificationToken",
    "verificationTokenExpiry",
    "stripeCustomerId",
    "stripeSubscriptionId",
    "openId",
  ];
  const leaked = internalKeys.filter((key) => Object.prototype.hasOwnProperty.call(user || {}, key));
  if (leaked.length) {
    record(checkName, "failed", { leakedFields: leaked });
    throw new Error(`${checkName} exposed internal fields: ${leaked.join(", ")}`);
  }
  record(checkName, "passed");
}

async function waitForContent(contentId, label) {
  const started = Date.now();
  let latest;

  while (Date.now() - started < timeoutMs) {
    latest = await trpc("content.getById", { id: contentId }, { method: "GET" });
    const summary = summarize(latest);
    console.log(`WAIT ${label} ${contentId}: ${summary.status} ${summary.hasAudioUrl ? "audio" : ""} ${summary.hasVideoUrl ? "video" : ""}`.trim());

    if (latest.status === "completed" || latest.status === "failed") break;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  if (!latest) throw new Error(`${label} ${contentId} was not found`);
  results.generatedContent.push({ label, ...summarize(latest) });

  if (latest.status !== "completed") {
    record(`${label} generation completed`, "failed", summarize(latest));
    return latest;
  }

  record(`${label} generation completed`, "passed", summarize(latest));
  return latest;
}

async function runGeneration(mode) {
  const isFilm = mode === "film";
  const input = {
    targetLanguage: "Spanish",
    proficiencyLevel: "A2",
    vocabularyText: "hola, casa, perro, comida, escuela",
    theme: "Adventure",
    topicPrompt: `QA public readiness ${mode} smoke test`,
    translationLanguage: "English",
    timezone: "Europe/Paris",
    mode,
    storyLength: "short",
    voiceType: "Warm & Friendly",
    narratorGender: "female",
    backgroundMusic: "none",
    ...(isFilm
      ? {
          cinematicStyle: "Playful Animation",
          videoDuration: 30,
          addSubtitles: true,
          subtitleFontSize: "medium",
          subtitlePosition: "bottom",
          subtitleColor: "white",
        }
      : {}),
  };

  const response = await trpcCheck(`${mode} generation accepted`, "content.generate", input);
  return waitForContent(response.contentId, mode);
}

await httpCheck("/api/health");
for (const route of [
  "/",
  "/login",
  "/signup",
  "/pricing",
  "/contact",
  "/faq",
  "/about",
  "/privacy",
  "/terms",
  "/blog",
]) {
  await httpCheck(route);
}

await trpcCheck("email sign-in", "emailAuth.signIn", { email, password });
const me = await trpcCheck("authenticated user", "auth.me", undefined, { method: "GET" });
assertNoInternalUserFields(me, "auth.me redaction");

await trpcCheck("subscription details", "subscription.getMySubscription", undefined, { method: "GET" });
await trpcCheck("usage stats", "subscription.getUsageStats", { timezone: "Europe/Paris" }, { method: "GET" });

const library = await trpcCheck("library list", "content.getLibrary", undefined, { method: "GET" });
const completed = Array.isArray(library) ? library.find((item) => item.status === "completed") : null;
if (completed) {
  await trpcCheck("library story detail", "content.getById", { id: completed.id }, { method: "GET" });
} else {
  record("library story detail", "warning", { message: "No completed content available in the current account library." });
}
await trpcCheck("favorites list", "content.getFavorites", undefined, { method: "GET" });

const profile = await trpcCheck("public profile", "leaderboard.getUserProfile", { userId: me.id }, { method: "GET" });
if (profile?.user && Object.prototype.hasOwnProperty.call(profile.user, "email")) {
  record("profile email privacy", "failed", { message: "Public profile contains email." });
  throw new Error("Public profile contains email.");
}
record("profile email privacy", "passed");

await trpcCheck("settings preferred language", "auth.updatePreferredLanguage", { language: me.preferredLanguage || "en" });
await trpcCheck("settings translation language", "auth.updatePreferredTranslationLanguage", {
  language: me.preferredTranslationLanguage || "English",
});
await trpcCheck("settings profile update", "auth.updateProfile", { name: me.name || "Storyling User" });

const breadcrumbPrefs = await trpcCheck("breadcrumb preferences", "breadcrumb.getPreferences", undefined, { method: "GET" });
await trpcCheck("breadcrumb preferences save", "breadcrumb.updatePreferences", breadcrumbPrefs);
const weeklyGoal = await trpcCheck("weekly goal status", "weeklyGoal.getWeeklyGoalStatus", undefined, { method: "GET" });
await trpcCheck("weekly goal save", "weeklyGoal.updateWeeklyGoal", { weeklyGoal: weeklyGoal.weeklyGoal || 5 });

await trpcCheck("wordbank daily count", "wordbank.getTodayWordCount", undefined, { method: "GET" });
const wordsBefore = await trpcCheck("wordbank list", "wordbank.getMyWords", undefined, { method: "GET" });
const smokeWord = `qa-smoke-${Date.now()}`;
const savedWord = await trpcCheck("wordbank save word", "wordbank.saveWord", {
  word: smokeWord,
  translation: "QA smoke marker",
  targetLanguage: "Spanish",
  exampleSentences: ["Esta es una prueba de QA."],
});
await trpcCheck("wordbank check saved", "wordbank.checkWordExists", { word: smokeWord, targetLanguage: "Spanish" }, { method: "GET" });
await trpcCheck("wordbank remove word", "wordbank.removeWord", { wordId: savedWord.id });
record("wordbank rollback", "passed", {
  beforeCount: Array.isArray(wordsBefore) ? wordsBefore.length : null,
  removedWordId: savedWord.id,
});
await trpcCheck("wordbank due count", "wordbank.getDueCount", undefined, { method: "GET" });
await trpcCheck("wordbank review stats", "wordbank.getReviewStats", undefined, { method: "GET" });

await trpcCheck("story preview generation", "content.generatePreview", {
  targetLanguage: "Spanish",
  proficiencyLevel: "A2",
  vocabularyText: "hola, casa, perro, comida, escuela",
  theme: "Adventure",
  topicPrompt: "QA public readiness smoke preview",
});

if (runLiveGeneration) {
  await runGeneration("podcast");
  if (runFilmGeneration) {
    await runGeneration("film");
  }
}

results.meta.finishedAt = new Date().toISOString();
results.meta.status = results.checks.some((check) => check.status === "failed") ? "failed" : "passed";

await fs.mkdir(path.dirname(outFile), { recursive: true });
await fs.writeFile(outFile, `${JSON.stringify(results, null, 2)}\n`);
console.log(`RESULT ${results.meta.status} ${outFile}`);

if (results.meta.status !== "passed") {
  process.exitCode = 1;
}
