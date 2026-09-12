/**
 * Boost Delight Layer (wave 2)
 * NEW only: go-widget · streaks · story deep-link · group board ·
 * deadline reminder sync · start_param deep links · premium presets
 * Does not reimplement Notes 2.0 / Share PNG / AI / overrides from boost-upgrade.js
 */
(function () {
  "use strict";

  const API_BASE = "https://boost.rorosin.ru";
  const STREAK_KEY = "boostStreak_v1";
  const BOARD_OPT_IN_KEY = "groupBoardOptIn_v1";
  const REMINDER_SYNC_KEY = "deadlineRemindersSyncedAt_v1";
  const PAYWALL_SHOWN_KEY = "softPaywallShown_v1";
  const SOFT_PREMIUM_KEY = "boostSoftPremium";
  const INSTALL_HINT_KEY = "homeScreenHintShown_v1";
  const BOT_USERNAME = "mietcbot";
  const WEBAPP_URL = "https://networker002.github.io/webapp/";

  function b64url(str) {
    return btoa(unescape(encodeURIComponent(str || "")))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  const PREMIUM_PRESETS = {
    focus: {
      label: "Focus ★",
      "--day-name-letter-sp": "0px",
      "--day-name-gap": "0.35em",
      "--lesson-number-padding": "10px",
      "--time-letter-sp": "0.5px",
      "--subject-f-size": "16px",
      "--room-letter-sp": "0.5px",
      "--room-f-size": "13px",
      "--tname-f-size": "12px",
    },
    oled: {
      label: "OLED ★",
      "--day-name-letter-sp": "1px",
      "--day-name-gap": "0.45em",
      "--lesson-number-padding": "7px",
      "--time-letter-sp": "0px",
      "--subject-f-size": "14px",
      "--room-letter-sp": "0px",
      "--room-f-size": "12px",
      "--tname-f-size": "11px",
    },
    exam: {
      label: "Exam ★",
      "--day-name-letter-sp": "2px",
      "--day-name-gap": "0.9em",
      "--lesson-number-padding": "14px",
      "--time-letter-sp": "2px",
      "--subject-f-size": "19px",
      "--room-letter-sp": "2px",
      "--room-f-size": "15px",
      "--tname-f-size": "14px",
    },
  };

  const tg = window.Telegram?.WebApp;

  function authHeaders(extra = {}) {
    return { Authorization: tg?.initData || "", ...extra };
  }

  async function api(path, options = {}) {
    if (!navigator.onLine) throw new Error("offline");
    const opts = { ...options };
    opts.headers = {
      ...authHeaders(
        opts.body instanceof FormData ? {} : { "Content-Type": "application/json" },
      ),
      ...(opts.headers || {}),
    };
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      signal: AbortSignal.timeout?.(8000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${path}: ${res.status} ${text}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res;
  }

  function toast(text, ms = 1900) {
    if (window.BoostUpgrade?.toast) return window.BoostUpgrade.toast(text, ms);
    const al = document.getElementById("fast-alert");
    if (!al) return;
    al.textContent = text;
    al.style.display = "flex";
    al.style.animation = "none";
    void al.offsetWidth;
    al.style.animation = "flyUP 2s normal";
    setTimeout(() => {
      al.style.display = "none";
    }, ms);
  }

  function safeHaptic(type = "success") {
    try {
      tg?.HapticFeedback?.notificationOccurred?.(type);
    } catch (_) {}
  }

  function safeImpact(style = "light") {
    try {
      tg?.HapticFeedback?.impactOccurred?.(style);
    } catch (_) {}
  }

  async function trackAttribution(param) {
    const value = String(param || "").slice(0, 128);
    if (!value) return;
    const source = value.startsWith("story_")
      ? "story"
      : value === "go" || value.startsWith("go")
        ? "go"
        : value.startsWith("day_")
          ? "day"
          : value.startsWith("note_")
            ? "note"
            : "direct";
    const key = `attribution:${source}:${value}`;
    if (sessionStorage.getItem(key)) return;
    try {
      await api("/attribution", {
        method: "POST",
        body: JSON.stringify({ source, param: value }),
      });
      sessionStorage.setItem(key, "1");
    } catch (err) {
      console.warn("attribution", err);
    }
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isPremium() {
    return Boolean(tg?.initDataUnsafe?.user?.is_premium);
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function yesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  /* ─── Streaks ─── */
  function readStreak() {
    try {
      return JSON.parse(localStorage.getItem(STREAK_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function writeStreak(data) {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  }

  function bumpStreak(reason = "open") {
    const data = readStreak();
    const today = todayKey();
    if (data.lastOpen === today && reason === "open") {
      renderStreakChip();
      return data;
    }
    if (data.lastOpen === today && reason === "done" && data.doneToday) {
      renderStreakChip();
      return data;
    }

    if (reason === "open") {
      if (data.lastOpen === yesterdayKey()) data.count = (data.count || 0) + 1;
      else if (data.lastOpen !== today) data.count = 1;
      data.lastOpen = today;
    }
    if (reason === "done") {
      data.doneToday = true;
      data.doneCount = (data.doneCount || 0) + 1;
      if (data.lastOpen !== today) {
        if (data.lastOpen === yesterdayKey()) data.count = (data.count || 0) + 1;
        else data.count = 1;
        data.lastOpen = today;
      }
    }
    data.best = Math.max(data.best || 0, data.count || 0);
    writeStreak(data);
    syncStreakRemote(data).catch(() => {});
    renderStreakChip();
    if ((data.count || 0) >= 3 && reason === "open") {
      toast(`Серия ${data.count} дней 🔥`);
      safeHaptic("success");
    }
    if ((data.count || 0) >= 7 && reason === "open") showSoftPaywall(data);
    return data;
  }

  function showSoftPaywall(data) {
    if (isPremium() || localStorage.getItem(PAYWALL_SHOWN_KEY) === todayKey()) return;
    localStorage.setItem(PAYWALL_SHOWN_KEY, todayKey());
    const modal = document.createElement("div");
    modal.className = "soft-paywall";
    modal.innerHTML = `
      <div class="soft-paywall-card" role="dialog" aria-modal="true" aria-labelledby="soft-paywall-title">
        <button type="button" class="soft-paywall-close" aria-label="Закрыть">×</button>
        <div class="soft-paywall-kicker">${data.count} дней подряд</div>
        <h3 id="soft-paywall-title">Ты уже вошёл в ритм</h3>
        <p>Premium открывает расширенную AI-квоту и дополнительные пресеты оформления.</p>
        <button type="button" class="soft-paywall-primary">Посмотреть Premium</button>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });
    modal.querySelector(".soft-paywall-close")?.addEventListener("click", close);
    modal.querySelector(".soft-paywall-primary")?.addEventListener("click", () => {
      try {
        tg?.openTelegramLink?.("https://t.me/premiumbot");
      } catch (_) {}
      close();
    });
  }

  async function syncStreakRemote(data) {
    await api("/streak", {
      method: "POST",
      body: JSON.stringify({
        count: data.count || 0,
        best: data.best || 0,
        lastOpen: data.lastOpen || null,
        doneCount: data.doneCount || 0,
      }),
    });
  }

  function renderStreakChip() {
    const data = readStreak();
    let chip = document.getElementById("streak-chip");
    const profile = document.querySelector(".cont-profile");
    if (!profile) return;
    if (!chip) {
      chip = document.createElement("button");
      chip.type = "button";
      chip.id = "streak-chip";
      chip.className = "streak-chip";
      profile.appendChild(chip);
      chip.addEventListener("click", () => {
        toast(`Серия: ${data.count || 0} · Рекорд: ${data.best || 0}`);
        safeImpact("soft");
      });
    }
    const fresh = readStreak();
    chip.innerHTML = `<span class="streak-fire" aria-hidden="true">🔥</span><strong>${fresh.count || 0}</strong><span>дней</span>`;
    chip.hidden = !(fresh.count > 0);
  }

  /* ─── Куда идти (go widget) ─── */
  function parseLessonTimes(timeText, baseDate = new Date()) {
    const match = timeText?.match(/(\d{1,2})\s*:\s*(\d{2})/g);
    if (!match || match.length < 2) return null;
    const toDate = (value) => {
      const [h, m] = value.split(":").map(Number);
      const r = new Date(baseDate);
      r.setHours(h, m, 0, 0);
      return r;
    };
    return { start: toDate(match[0]), end: toDate(match[1]) };
  }

  function getNextOrCurrentLesson() {
    const days = [
      "Воскресенье",
      "Понедельник",
      "Вторник",
      "Среда",
      "Четверг",
      "Пятница",
      "Суббота",
    ];
    const now = new Date();
    const todayName = days[now.getDay()];
    const today = Array.from(document.querySelectorAll(".day")).find(
      (d) => d.querySelector(".day-name")?.textContent?.trim() === todayName,
    );
    if (!today) return null;
    const lessons = Array.from(today.querySelectorAll(".lesson-row"))
      .filter((r) => r.style.display !== "none")
      .map((row) => ({
        row,
        time: parseLessonTimes(row.querySelector(".time")?.textContent),
        subject:
          row.dataset.subject ||
          row.querySelector(".subject")?.dataset.orig ||
          row.querySelector(".subject")?.textContent?.trim() ||
          "",
        room: (
          row.dataset.room ||
          row.querySelector(".room")?.dataset.orig ||
          row.querySelector(".room")?.textContent ||
          ""
        )
          .replace(/[()]/g, "")
          .trim(),
        teacher: row.dataset.teacher || row.querySelector(".tname")?.textContent?.trim() || "",
        code: row.dataset.lessonCode || row.querySelector(".lesson")?.textContent?.trim() || "",
      }))
      .filter((l) => l.time)
      .sort((a, b) => a.time.start - b.time.start);

    const current = lessons.find((l) => now >= l.time.start && now <= l.time.end);
    const next = lessons.find((l) => l.time.start > now);
    const target = current || next;
    if (!target) return { state: "done", lessons };
    return {
      state: current ? "now" : "next",
      lesson: target,
      minutes: Math.max(
        1,
        Math.ceil(
          ((current ? target.time.end : target.time.start) - now) / 60000,
        ),
      ),
    };
  }

  function renderGoWidget() {
    const summary = document.getElementById("summary-screen");
    if (!summary) return;
    let box = document.getElementById("go-widget");
    if (!box) {
      box = document.createElement("section");
      box.id = "go-widget";
      box.className = "go-widget";
      const path = summary.querySelector(".summary-path-next");
      if (path) summary.insertBefore(box, path);
      else summary.appendChild(box);
    }

    const info = getNextOrCurrentLesson();
    if (!info || info.state === "done") {
      box.className = "go-widget is-done";
      box.innerHTML = `
        <div class="go-label">Куда идти</div>
        <div class="go-room">Домой</div>
        <p class="go-hint">На сегодня пар больше нет</p>`;
      return;
    }

    const { lesson, state, minutes } = info;
    const room = lesson.room || "—";
    const big = room.replace(/\s+/g, "");
    box.className = `go-widget is-${state}`;
    box.innerHTML = `
      <div class="go-label">${state === "now" ? "Сейчас · аудитория" : "Следующая · иди в"}</div>
      <div class="go-room" data-room="${escapeHtml(room)}">${escapeHtml(big)}</div>
      <div class="go-meta">
        <span>${escapeHtml(lesson.subject || "Пара")}</span>
        <span class="go-timer">${state === "now" ? `ещё ${minutes} мин` : `через ${minutes} мин`}</span>
      </div>
      <button type="button" class="go-copy-btn" id="go-copy-room">Скопировать ауд.</button>`;

    box.querySelector("#go-copy-room")?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(room);
        toast("Аудитория скопирована");
        safeHaptic("success");
      } catch (_) {
        toast(room);
      }
    });

    // delight: pulse when < 5 min to start
    if (state === "next" && minutes <= 5) box.classList.add("is-urgent-go");
  }

  /* ─── Premium presets ─── */
  function injectPremiumPresets() {
    if (!isPremium()) return;
    const tools = document.getElementById("lesson-tools-1");
    if (!tools || tools.dataset.premium === "1") return;
    tools.dataset.premium = "1";
    const row = document.createElement("div");
    row.className = "lesson-presets lesson-presets-premium";
    row.innerHTML = Object.entries(PREMIUM_PRESETS)
      .map(
        ([id, p]) =>
          `<button type="button" class="lesson-preset-btn premium" data-preset-premium="${id}">${p.label}</button>`,
      )
      .join("");
    const tip = tools.querySelector(".lesson-editor-tip");
    if (tip) tools.insertBefore(row, tip.nextSibling);
    else tools.appendChild(row);

    row.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.presetPremium;
        const preset = PREMIUM_PRESETS[id];
        if (!preset) return;
        if (typeof window.BoostUpgrade?.applyCardPreset === "function") {
          // apply via same storage path as base presets
          const saved = {};
          Object.entries(preset).forEach(([prop, val]) => {
            if (prop === "label") return;
            document.documentElement.style.setProperty(prop, val);
            saved[prop] = val;
          });
          localStorage.setItem("customLessonCardSettings", JSON.stringify(saved));
          localStorage.setItem("lessonCardPreset", `premium:${id}`);
        } else {
          Object.entries(preset).forEach(([prop, val]) => {
            if (prop === "label") return;
            document.documentElement.style.setProperty(prop, val);
          });
        }
        row.querySelectorAll("button").forEach((b) =>
          b.classList.toggle("is-active", b === btn),
        );
        safeImpact("medium");
        toast(`Пресет Premium: ${preset.label}`);
      });
    });
  }

  /* ─── Story share with deep link ─── */
  function buildStoryWidgetLink() {
    const group = localStorage.getItem("userGroup") || "";
    const payload = encodeURIComponent(
      JSON.stringify({
        g: group,
        d: todayKey(),
        src: "story",
      }),
    );
    // Telegram Mini App startapp param (ASCII-safe)
    const startapp = `story_${btoa(unescape(encodeURIComponent(group || "boost")))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
      .slice(0, 64)}`;
    return {
      url: `https://t.me/${BOT_USERNAME}?startapp=${startapp}`,
      startapp,
      payload,
      webAppUrl: `${WEBAPP_URL}?tgWebAppStartParam=${startapp}`,
    };
  }

  async function shareSummaryToStory() {
    try {
      toast("Готовим сторис…");
      if (typeof window.shareSummaryCard !== "function") {
        toast("Шаринг ещё не готов");
        return;
      }
      // Draw via existing canvas pipeline by temporarily wrapping upload path
      const group = localStorage.getItem("userGroup") || "Группа";
      const weekIdx =
        window.scheduleWeekIndex ??
        (typeof window.getScheduleWeekIndex === "function"
          ? window.getScheduleWeekIndex()
          : 0);
      const days = [
        "Воскресенье",
        "Понедельник",
        "Вторник",
        "Среда",
        "Четверг",
        "Пятница",
        "Суббота",
      ];
      const todayName = days[new Date().getDay()];
      const today = Array.from(document.querySelectorAll(".day")).find(
        (d) => d.querySelector(".day-name")?.textContent?.trim() === todayName,
      );
      const lessons = today
        ? Array.from(today.querySelectorAll(".lesson-row"))
            .filter((r) => r.style.display !== "none")
            .map((row) => ({
              code: row.querySelector(".lesson")?.textContent?.trim() || "",
              time: row.querySelector(".time")?.textContent?.trim() || "",
              subject: row.querySelector(".subject")?.textContent?.trim() || "",
              room: (row.querySelector(".room")?.textContent || "")
                .replace(/[()]/g, "")
                .trim(),
              teacher: row.querySelector(".tname")?.textContent?.trim() || "",
            }))
        : [];

      // Prefer calling boost-upgrade share after upload for story
      const link = buildStoryWidgetLink();
      const canvas = document.createElement("canvas");
      // Reuse shareSummaryCard path: trigger share with story preference
      sessionStorage.setItem("preferShareToStory", "1");
      sessionStorage.setItem("storyWidgetLink", link.url);

      if (typeof tg?.shareToStory === "function") {
        // Build PNG then upload
        await window.shareSummaryCard();
        // If shareSummary already handled story via upload fallback — ok.
        // Extra: try explicit story with media area if we have last url
        const lastUrl = sessionStorage.getItem("lastSharePublicUrl");
        if (lastUrl) {
          try {
            tg.shareToStory(lastUrl, {
              text: `${group} · сегодня`,
              widget_link: { url: link.url, name: "Открыть расписание" },
            });
            safeHaptic("success");
            toast("Сторис с кнопкой");
            return;
          } catch (_) {
            try {
              tg.shareToStory(lastUrl);
            } catch (__) {}
          }
        }
      } else {
        await window.shareSummaryCard();
        toast("shareToStory недоступен — использован обычный шаринг");
      }
    } catch (err) {
      console.error(err);
      safeHaptic("error");
      toast("Не удалось открыть сторис");
    } finally {
      sessionStorage.removeItem("preferShareToStory");
    }
  }

  function injectStoryButton() {
    const header = document.querySelector(".summary-header");
    if (!header || document.getElementById("share-story-btn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "share-story-btn";
    btn.className = "share-btn share-story-btn";
    btn.textContent = typeof tg?.shareToStory === "function" ? "Сторис" : "Поделиться";
    btn.title = "Поделиться расписанием";
    header.appendChild(btn);
    btn.addEventListener("click", () => shareSummaryToStory());
  }

  /* ─── Group deadline board ─── */
  function collectPublicDeadlines() {
    let notes = [];
    try {
      notes = JSON.parse(localStorage.getItem("notes") || "[]");
    } catch (_) {
      notes = [];
    }
    if (!Array.isArray(notes)) return [];
    return notes
      .filter((n) => n && n.deadline && !n.done)
      .slice(0, 20)
      .map((n) => ({
        title: String(n.title || "").slice(0, 64),
        subject: String(n.subject || "").slice(0, 64),
        deadline: n.deadline,
        priority: ["low", "normal", "high", "urgent"].includes(n.priority)
          ? n.priority
          : "normal",
      }));
  }

  async function publishGroupBoard() {
    const items = collectPublicDeadlines();
    const data = await api("/group/board", {
      method: "POST",
      body: JSON.stringify({
        items,
        optIn: true,
        anonymous: true,
      }),
    });
    localStorage.setItem(BOARD_OPT_IN_KEY, "1");
    return data;
  }

  async function fetchGroupBoard() {
    return api("/group/board", { method: "GET" });
  }

  function renderGroupBoard(data) {
    const notesScreen = document.getElementById("notes-screen");
    if (!notesScreen) return;
    let panel = document.getElementById("group-board");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "group-board";
      panel.className = "group-board";
      const h1 = notesScreen.querySelector("h1");
      if (h1) h1.insertAdjacentElement("afterend", panel);
      else notesScreen.prepend(panel);
    }

    const items = Array.isArray(data?.items) ? data.items : [];
    const group = data?.group || localStorage.getItem("userGroup") || "Группа";
    const opted = localStorage.getItem(BOARD_OPT_IN_KEY) === "1";

    panel.innerHTML = `
      <div class="group-board-head">
        <div>
          <strong>Доска дедлайнов · ${escapeHtml(group)}</strong>
          <p>Анонимно от одногруппников</p>
        </div>
        <button type="button" id="group-board-sync">${opted ? "Обновить" : "Поделиться своими"}</button>
      </div>
      <div class="group-board-list">
        ${
          items.length
            ? items
                .slice(0, 12)
                .map(
                  (it) => `<article class="group-board-item prio-${escapeHtml(it.priority || "normal")}">
              <strong>${escapeHtml(it.title)}</strong>
              <span>${escapeHtml(it.subject || "")}</span>
              <time>${escapeHtml(
                it.deadline
                  ? new Date(it.deadline).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "",
              )}</time>
            </article>`,
                )
                .join("")
            : `<p class="group-board-empty">${opted ? "Пока пусто — будь первым" : "Включи обмен, чтобы видеть дедлайны группы"}</p>`
        }
      </div>`;

    panel.querySelector("#group-board-sync")?.addEventListener("click", async () => {
      try {
        toast("Синхронизация…");
        await publishGroupBoard();
        const fresh = await fetchGroupBoard();
        renderGroupBoard(fresh);
        safeHaptic("success");
        toast("Доска обновлена");
      } catch (err) {
        console.warn(err);
        safeHaptic("error");
        toast("Доска недоступна офлайн");
      }
    });
  }

  async function initGroupBoard() {
    try {
      if (localStorage.getItem(BOARD_OPT_IN_KEY) === "1") {
        await publishGroupBoard().catch(() => {});
      }
      const data = await fetchGroupBoard();
      renderGroupBoard(data);
    } catch (_) {
      renderGroupBoard({ items: [], group: localStorage.getItem("userGroup") });
    }
  }

  /* ─── Deadline reminder sync ─── */
  async function syncDeadlineReminders(force = false) {
    const last = Number(localStorage.getItem(REMINDER_SYNC_KEY) || 0);
    if (!force && Date.now() - last < 5 * 60 * 1000) return;

    let notes = [];
    try {
      notes = JSON.parse(localStorage.getItem("notes") || "[]");
    } catch (_) {
      return;
    }
    const reminders = (Array.isArray(notes) ? notes : [])
      .filter((n) => n?.deadline && !n.done)
      .map((n) => ({
        uuid: String(n.uuid || ""),
        title: String(n.title || "").slice(0, 96),
        deadline: n.deadline,
        priority: n.priority || "normal",
        subject: String(n.subject || "").slice(0, 64),
      }))
      .filter((r) => r.uuid && r.deadline)
      .slice(0, 50);

    try {
      await api("/reminders/sync", {
        method: "POST",
        body: JSON.stringify({
          reminders,
          leadMinutes: [60, 1440],
          enabled: true,
        }),
      });
      localStorage.setItem(REMINDER_SYNC_KEY, String(Date.now()));
    } catch (err) {
      console.warn("reminder sync", err);
    }
  }

  /* ─── Deep link / start_param ─── */
  function handleStartParam() {
    const param =
      tg?.initDataUnsafe?.start_param ||
      new URLSearchParams(location.search).get("tgWebAppStartParam") ||
      "";
    if (!param) return;
    trackAttribution(param);

    // story_<b64group> | day_<DD.MM> | note_<uuid> | go
    if (param === "go" || param.startsWith("go")) {
      document.getElementById("marks-show")?.click();
      setTimeout(renderGoWidget, 200);
      return;
    }
    if (param.startsWith("story_")) {
      document.getElementById("marks-show")?.click();
      toast("Открыто из сторис");
      return;
    }
    if (param.startsWith("day_")) {
      const datePart = param.slice(4);
      document.getElementById("schedule-show")?.click();
      // Best-effort: jump to matching calendar day if present
      setTimeout(() => {
        const btn = Array.from(document.querySelectorAll(".calendar-day-btn")).find(
          (b) => (b.dataset.date || "").endsWith(datePart.replace(".", "-")) ||
            (b.querySelector(".calendar-day-date")?.textContent || "").includes(datePart),
        );
        btn?.click();
      }, 600);
      return;
    }
    if (param.startsWith("note_")) {
      const id = param.slice(5);
      document.getElementById("notes-show")?.click();
      setTimeout(() => {
        document.getElementById(`note-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        document.getElementById(`note-${id}`)?.classList.add("pair-flash");
      }, 400);
    }
  }

  function injectHomeScreenHint() {
    if (!tg?.addToHomeScreen || localStorage.getItem(INSTALL_HINT_KEY)) return;
    const anchor = document.querySelector(".second-header") || document.querySelector("header");
    if (!anchor || document.getElementById("home-screen-hint")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "home-screen-hint";
    button.className = "home-screen-hint";
    button.textContent = "Добавить на экран";
    button.title = "Быстрый запуск расписания из Telegram";
    anchor.appendChild(button);
    button.addEventListener("click", () => {
      try {
        tg.addToHomeScreen();
        localStorage.setItem(INSTALL_HINT_KEY, "1");
        button.remove();
        toast("Ярлык добавлен в Telegram");
      } catch (_) {
        toast("Открой меню Telegram и выбери «Добавить на экран»");
      }
    });
  }

  /* ─── Patch share upload to remember public URL for stories ─── */
  function patchShareUploadHook() {
    const origFetch = window.fetch;
    if (origFetch.__boostDelightPatched) return;
    window.fetch = async function patchedFetch(input, init) {
      const res = await origFetch.apply(this, arguments);
      try {
        const url = typeof input === "string" ? input : input?.url || "";
        if (url.includes("/share/upload") && res.ok) {
          const clone = res.clone();
          const data = await clone.json().catch(() => null);
          if (data?.url) sessionStorage.setItem("lastSharePublicUrl", data.url);
        }
      } catch (_) {}
      return res;
    };
    window.fetch.__boostDelightPatched = true;
  }

  /* ─── Hook note done → streak ─── */
  function patchToggleNoteDone() {
    const orig = window.toggleNoteDone;
    if (typeof orig !== "function" || orig.__delightPatched) return;
    window.toggleNoteDone = async function toggleNoteDoneDelight(id) {
      const before = (() => {
        try {
          return JSON.parse(localStorage.getItem("notes") || "[]").find(
            (n) => String(n.uuid) === String(id),
          );
        } catch (_) {
          return null;
        }
      })();
      const ret = await orig.apply(this, arguments);
      try {
        if (before && !before.done) bumpStreak("done");
        syncDeadlineReminders(true);
        if (localStorage.getItem(BOARD_OPT_IN_KEY) === "1") {
          publishGroupBoard().catch(() => {});
        }
      } catch (_) {}
      return ret;
    };
    window.toggleNoteDone.__delightPatched = true;
  }

  function patchLoadSummary() {
    const orig = window.loadSummary;
    if (typeof orig !== "function" || orig.__delightGoPatched) return;
    window.loadSummary = function loadSummaryDelight() {
      orig.apply(this, arguments);
      try {
        renderGoWidget();
      } catch (err) {
        console.warn(err);
      }
    };
    window.loadSummary.__delightGoPatched = true;
  }

  function patchSaveNote() {
    ["saveNoteNew", "getEdinNoteData"].forEach((name) => {
      const orig = window[name];
      if (typeof orig !== "function" || orig.__delightRemPatched) return;
      window[name] = function patchedNoteSave() {
        const ret = orig.apply(this, arguments);
        Promise.resolve(ret).then(() => {
          syncDeadlineReminders(true);
          if (localStorage.getItem(BOARD_OPT_IN_KEY) === "1") {
            publishGroupBoard().catch(() => {});
          }
        });
        return ret;
      };
      window[name].__delightRemPatched = true;
    });
  }

  /* ─── Init ─── */
  function init() {
    patchShareUploadHook();
    patchLoadSummary();
    patchToggleNoteDone();
    patchSaveNote();
    bumpStreak("open");
    renderGoWidget();
    injectStoryButton();
    injectPremiumPresets();
    handleStartParam();
    injectHomeScreenHint();
    syncDeadlineReminders();
    initGroupBoard();

    document.getElementById("marks-show")?.addEventListener("click", () => {
      setTimeout(() => {
        renderGoWidget();
        injectStoryButton();
      }, 50);
    });
    document.getElementById("profile-show")?.addEventListener("click", () => {
      setTimeout(renderStreakChip, 80);
    });
    document.getElementById("notes-show")?.addEventListener("click", () => {
      setTimeout(() => {
        if (!document.getElementById("group-board")) initGroupBoard();
      }, 80);
    });

    // Re-apply premium presets row when appearance opens
    document.querySelector(".user-appear")?.addEventListener("click", () => {
      setTimeout(injectPremiumPresets, 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // boost-upgrade may still be parsing; slight delay keeps patch order stable
    setTimeout(init, 0);
  }

  window.BoostDelight = {
    renderGoWidget,
    bumpStreak,
    shareSummaryToStory,
    syncDeadlineReminders,
    publishGroupBoard,
  };
})();
