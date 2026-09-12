/**
 * Boost Mini App Upgrade Layer
 * Notes 2.0 · Share PNG · Lesson card presets · Local overrides · AI chat
 * Loads after main.js; patches globals safely for older Telegram WebApps.
 */
(function () {
  "use strict";

  const API_BASE = "https://boost.rorosin.ru";
  const BOT_USERNAME = (window.BoostDelightBotUsername) || "mietcbot";
  const WEEK_EPOCH = new Date(2026, 7, 2); // align with backend get_weeks.py
  const OVERRIDES_KEY = "lessonOverrides_v1";
  const NOTES_FILTER_KEY = "notesFilter_v1";
  const MAX_NOTE_DESC = 2000;
  const MAX_NOTE_TITLE = 96;

  const WEEK_TITLES = [
    "1 числитель",
    "1 знаменатель",
    "2 числитель",
    "2 знаменатель",
  ];

  const PRIORITY_META = {
    low: { label: "Низкий", className: "prio-low" },
    normal: { label: "Обычный", className: "prio-normal" },
    high: { label: "Высокий", className: "prio-high" },
    urgent: { label: "Срочно", className: "prio-urgent" },
  };

  const CARD_PRESETS = {
    compact: {
      label: "Компакт",
      "--day-name-letter-sp": "0px",
      "--day-name-gap": "0.2em",
      "--lesson-number-padding": "4px",
      "--time-letter-sp": "0px",
      "--subject-f-size": "13px",
      "--room-letter-sp": "0px",
      "--room-f-size": "11px",
      "--tname-f-size": "11px",
    },
    comfort: {
      label: "Комфорт",
      "--day-name-letter-sp": "1px",
      "--day-name-gap": "0.5em",
      "--lesson-number-padding": "8px",
      "--time-letter-sp": "1px",
      "--subject-f-size": "15px",
      "--room-letter-sp": "1px",
      "--room-f-size": "12px",
      "--tname-f-size": "12px",
    },
    large: {
      label: "Крупный",
      "--day-name-letter-sp": "2px",
      "--day-name-gap": "0.8em",
      "--lesson-number-padding": "12px",
      "--time-letter-sp": "2px",
      "--subject-f-size": "18px",
      "--room-letter-sp": "2px",
      "--room-f-size": "14px",
      "--tname-f-size": "14px",
    },
  };

  const tg = window.Telegram?.WebApp;
  const haptic = () => tg?.HapticFeedback;

  function authHeaders(extra = {}) {
    const initData = tg?.initData || "";
    return {
      Authorization: initData,
      ...extra,
    };
  }

  async function api(path, options = {}) {
    const opts = { ...options };
    opts.headers = {
      ...authHeaders(opts.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(opts.headers || {}),
    };
    const res = await fetch(`${API_BASE}${path}`, opts);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${path}: ${res.status} ${text}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/\n/g, " ");
  }

  function toast(text, ms = 1900) {
    const al = document.getElementById("fast-alert");
    if (!al) return;
    const prev = al.textContent;
    al.textContent = text;
    al.style.display = "flex";
    al.style.animation = "none";
    void al.offsetWidth;
    al.style.animation = "flyUP 2s normal";
    setTimeout(() => {
      al.style.display = "none";
      al.textContent = prev || "Обновляем данные";
    }, ms);
  }

  function safeHaptic(type = "success") {
    try {
      haptic()?.notificationOccurred?.(type);
    } catch (_) {}
  }

  function safeImpact(style = "light") {
    try {
      haptic()?.impactOccurred?.(style);
    } catch (_) {}
  }

  const PREF_KEY = {
    tips: "prefTips",
    highlights: "prefHighlights",
    breaks: "prefBreaks",
    compactNotes: "prefCompactNotes",
    largeNotes: "prefLargeNotes",
    hideDone: "prefHideDone",
    noteBadges: "prefNoteBadges",
  };

  function applyPref(key, checked) {
    const storageKey = PREF_KEY[key] || `pref${key[0].toUpperCase()}${key.slice(1)}`;
    localStorage.setItem(storageKey, checked ? "on" : "off");
    document.body.classList.toggle(`pref-${key}-off`, !checked);
    document.body.classList.toggle(`pref-${key}-on`, checked);
    if (key === "breaks") renderBreakChips();
    if (key === "hideDone" || key === "noteBadges") {
      if (typeof window.getNotes === "function") window.getNotes();
    }
  }

  function initAppearanceExtras() {
    // Тумблеры живут прямо в под-экранах «Подсказки» и «Заметки студента»
    document.querySelectorAll("input[data-pref]").forEach((input) => {
      if (input.__prefBound) return;
      input.__prefBound = true;
      const key = input.dataset.pref;
      const storageKey = PREF_KEY[key] || `pref${key[0].toUpperCase()}${key.slice(1)}`;
      input.checked = (localStorage.getItem(storageKey) ?? (key === "tips" || key === "highlights" || key === "breaks" || key === "noteBadges" ? "on" : "off")) === "on";
      applyPref(key, input.checked);
      input.addEventListener("change", () => applyPref(key, input.checked));
    });
    // Ряд «Заметки студента» открывает свой под-экран
    const notesSwipe = document.getElementById("notes-swipe-1");
    const notesScreen = document.getElementById("set-app4");
    if (notesSwipe && notesScreen && !notesSwipe.__prefBound) {
      notesSwipe.__prefBound = true;
      notesSwipe.addEventListener("click", () => {
        const appearanceSettings = document.querySelector(".popuper-appearance > .a-settings-area");
        if (!appearanceSettings) return;
        if (tg?.BackButton) { tg.BackButton.show(); tg.BackButton.onClick(() => window.__showAppearanceRoot?.()); }
        appearanceSettings.style.animation = "ending .3s forwards";
        setTimeout(() => {
          appearanceSettings.style.display = "none";
          appearanceSettings.style.animation = "";
          notesScreen.style.display = "flex";
          notesScreen.style.animation = "starting .5s forwards";
        }, 330);
      });
    }
  }

  /* ─── Перемены между парами ─── */
  function parseRowTimes(text) {
    const m = (text || "").match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const s = Number(m[1]) * 60 + Number(m[2]);
    const e = Number(m[3]) * 60 + Number(m[4]);
    return { start: s, end: e };
  }

  function renderBreakChips() {
    const days = document.querySelectorAll(".day");
    days.forEach((day) => {
      const rows = Array.from(day.querySelectorAll(".lesson-row")).filter(
        (r) => r.style.display !== "none",
      );
      const desired = [];
      for (let i = 0; i < rows.length - 1; i++) {
        const a = parseRowTimes(rows[i].querySelector(".time")?.textContent);
        const b = parseRowTimes(rows[i + 1].querySelector(".time")?.textContent);
        if (!a || !b) continue;
        const gap = b.start - a.end;
        if (gap < 10) continue;
        desired.push({ after: rows[i], text: `☕ перемена · ${gap} мин` });
      }
      const existing = Array.from(day.querySelectorAll(".break-chip"));
      const same =
        existing.length === desired.length &&
        existing.every(
          (chip, i) =>
            chip.textContent === desired[i].text &&
            chip.nextElementSibling === desired[i].after.nextElementSibling,
        );
      if (same) return;
      existing.forEach((chip) => chip.remove());
      desired.forEach(({ after, text }) => {
        const chip = document.createElement("div");
        chip.className = "break-chip";
        chip.textContent = text;
        after.parentElement.insertBefore(chip, after.nextSibling);
      });
    });
  }

  /* ─── Week epoch fix (backend-aligned) ─── */
  function getScheduleWeekIndexFixed() {
    const elapsedWeeks = Math.floor(
      (Date.now() - WEEK_EPOCH.getTime()) / (1000 * 60 * 60 * 24 * 7),
    );
    return ((elapsedWeeks % 4) + 4) % 4;
  }

  function getScheduleWeekMondayFixed(weekIndex) {
    const idx =
      weekIndex ??
      window.scheduleWeekIndex ??
      getScheduleWeekIndexFixed();
    const monday = new Date(WEEK_EPOCH.getTime());
    monday.setDate(WEEK_EPOCH.getDate() + Number(idx) * 7);
    return monday;
  }

  window.getScheduleWeekIndex = getScheduleWeekIndexFixed;
  window.getScheduleWeekMonday = getScheduleWeekMondayFixed;

  /* ─── Local lesson overrides ─── */
  function readOverrides() {
    try {
      return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function writeOverrides(map) {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map));
  }

  function lessonKey(row) {
    const week = row.dataset.week ?? window.scheduleWeekIndex ?? 0;
    const day =
      row.closest(".day")?.querySelector(".day-name")?.textContent?.trim() || "";
    const code = row.dataset.lessonCode || row.querySelector(".lesson")?.textContent?.trim() || "";
    const subject = row.dataset.subject || row.querySelector(".subject")?.textContent?.trim() || "";
    return `${week}|${day}|${code}|${subject}`;
  }

  function applyOverridesToDom() {
    const map = readOverrides();
    document.querySelectorAll(".lesson-row").forEach((row) => {
      if (row.closest("#demo-lesson")) return;
      const key = lessonKey(row);
      const ov = map[key];
      row.classList.remove("is-overridden", "is-hidden-override");
      row.querySelector(".override-badge")?.remove();
      row.style.display = "";

      if (!ov) return;

      if (ov.hidden) {
        row.classList.add("is-hidden-override");
        row.style.display = "none";
        return;
      }

      row.classList.add("is-overridden");
      const subj = row.querySelector(".subject");
      const room = row.querySelector(".room");
      if (ov.alias && subj) {
        if (!subj.dataset.orig) subj.dataset.orig = subj.textContent;
        subj.textContent = ov.alias;
      } else if (subj?.dataset.orig) {
        subj.textContent = subj.dataset.orig;
      }
      if (ov.roomOverride && room) {
        if (!room.dataset.orig) room.dataset.orig = room.textContent;
        room.textContent = `(${ov.roomOverride})`;
      } else if (room?.dataset.orig) {
        room.textContent = room.dataset.orig;
      }

      const badge = document.createElement("button");
      badge.type = "button";
      badge.className = "override-badge";
      badge.title = "Личная правка";
      badge.textContent = "✦";
      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        openOverrideEditor(row);
      });
      row.appendChild(badge);
    });
  }

  function openOverrideEditor(row) {
    const key = lessonKey(row);
    const map = readOverrides();
    const current = map[key] || {};
    const subject =
      row.dataset.subject ||
      row.querySelector(".subject")?.dataset.orig ||
      row.querySelector(".subject")?.textContent?.trim() ||
      "";
    const roomOrig =
      row.dataset.room ||
      row.querySelector(".room")?.dataset.orig ||
      (row.querySelector(".room")?.textContent || "").replace(/[()]/g, "").trim() ||
      "";

    document.getElementById("override-editor-modal")?.remove();
    const modal = document.createElement("div");
    modal.id = "override-editor-modal";
    modal.className = "override-modal";
    modal.innerHTML = `
      <div class="override-sheet" role="dialog" aria-modal="true" aria-labelledby="override-title">
        <header>
          <h3 id="override-title">Личная правка</h3>
          <p>Официальное расписание не меняется — только у тебя</p>
        </header>
        <label class="override-field">
          <span>Название</span>
          <input type="text" id="ov-alias" maxlength="96" placeholder="${escapeAttr(subject)}" value="${escapeAttr(current.alias || "")}">
        </label>
        <label class="override-field">
          <span>Аудитория</span>
          <input type="text" id="ov-room" maxlength="32" placeholder="${escapeAttr(roomOrig)}" value="${escapeAttr(current.roomOverride || "")}">
        </label>
        <label class="override-check">
          <input type="checkbox" id="ov-hide" ${current.hidden ? "checked" : ""}>
          <span>Скрыть пару локально</span>
        </label>
        <div class="override-actions">
          <button type="button" class="ov-ghost" id="ov-reset">Сбросить</button>
          <button type="button" class="ov-ghost" id="ov-cancel">Отмена</button>
          <button type="button" class="ov-primary" id="ov-save">Сохранить</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    safeImpact("light");
    requestAnimationFrame(() => modal.classList.add("is-open"));

    const close = () => {
      modal.classList.remove("is-open");
      setTimeout(() => modal.remove(), 180);
    };
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
    modal.querySelector("#ov-cancel").addEventListener("click", close);
    modal.querySelector("#ov-reset").addEventListener("click", () => {
      delete map[key];
      writeOverrides(map);
      applyOverridesToDom();
      safeHaptic("success");
      toast("Правка сброшена");
      close();
    });
    modal.querySelector("#ov-save").addEventListener("click", () => {
      const alias = (modal.querySelector("#ov-alias").value || "").trim();
      const room = (modal.querySelector("#ov-room").value || "").trim();
      const hide = Boolean(modal.querySelector("#ov-hide").checked);
      if (!alias && !room && !hide) delete map[key];
      else {
        map[key] = {
          alias: alias || null,
          roomOverride: room || null,
          hidden: hide,
          updatedAt: new Date().toISOString(),
        };
      }
      writeOverrides(map);
      applyOverridesToDom();
      safeHaptic("success");
      toast(hide ? "Пара скрыта локально" : "Правка сохранена");
      close();
    });
  }

  /* ─── Enrich lesson rows with data-* ─── */
  function enrichLessonRows() {
    const week = window.scheduleWeekIndex ?? getScheduleWeekIndexFixed();
    document.querySelectorAll(".lesson-row").forEach((row) => {
      if (row.closest("#demo-lesson")) return;
      const subjEl = row.querySelector(".subject");
      const roomEl = row.querySelector(".room");
      if (subjEl && !subjEl.dataset.orig) {
        subjEl.dataset.orig = subjEl.textContent?.trim() || "";
      }
      if (roomEl && !roomEl.dataset.orig) {
        roomEl.dataset.orig = (roomEl.textContent || "").replace(/[()]/g, "").trim();
      }

      const subject = subjEl?.dataset.orig || subjEl?.textContent?.trim() || "";
      const room = roomEl?.dataset.orig || (roomEl?.textContent || "").replace(/[()]/g, "").trim();
      const code = row.querySelector(".lesson")?.textContent?.trim() || "";
      const time = row.querySelector(".time")?.textContent?.trim() || "";
      const teacher = row.querySelector(".tname")?.textContent?.trim() || "";
      const day =
        row.closest(".day")?.querySelector(".day-name")?.textContent?.trim() || "";

      row.dataset.week = String(week);
      row.dataset.lessonCode = code;
      row.dataset.subject = subject;
      row.dataset.room = room;
      row.dataset.time = time;
      row.dataset.teacher = teacher;
      row.dataset.day = day;
      row.dataset.pairId = `${week}|${day}|${code}|${subject}`
        .toLowerCase()
        .replace(/[^a-z0-9а-яё]+/gi, "-");
      row.id = `pair-${row.dataset.pairId}`;

      if (!row.dataset.boostBound) {
        row.dataset.boostBound = "1";
        let pressTimer = null;
        let pressX = 0;
        let pressY = 0;
        row.addEventListener("pointerdown", (e) => {
          pressX = e.clientX;
          pressY = e.clientY;
          pressTimer = setTimeout(() => {
            safeImpact("medium");
            openQuickNoteFromLesson(row);
          }, 550);
        });
        const clearPress = (e) => {
          if (
            e &&
            (Math.abs((e.clientX || 0) - pressX) > 12 ||
              Math.abs((e.clientY || 0) - pressY) > 12)
          ) {
            clearTimeout(pressTimer);
          }
          clearTimeout(pressTimer);
        };
        row.addEventListener("pointerup", clearPress);
        row.addEventListener("pointerleave", () => clearTimeout(pressTimer));
        row.addEventListener("pointercancel", () => clearTimeout(pressTimer));
        row.addEventListener("pointermove", (e) => {
          if (
            Math.abs(e.clientX - pressX) > 12 ||
            Math.abs(e.clientY - pressY) > 12
          ) {
            clearTimeout(pressTimer);
          }
        });

        // Tap pair number → local rename/hide (official schedule stays intact)
        row.querySelector(".lesson")?.addEventListener("click", (e) => {
          e.stopPropagation();
          openOverrideEditor(row);
        });
      }
    });
    applyOverridesToDom();
    paintNoteBadgesOnLessons();
    renderBreakChips();
  }

  function openQuickNoteFromLesson(row) {
    const pairLink = {
      weekIndex: Number(row.dataset.week),
      dayOfWeek: row.dataset.day,
      lessonCode: row.dataset.lessonCode,
      subject: row.dataset.subject,
      room: row.dataset.room,
      teacher: row.dataset.teacher,
      timeRange: row.dataset.time,
      pairId: row.dataset.pairId,
    };
    sessionStorage.setItem("pendingPairLink", JSON.stringify(pairLink));
    document.getElementById("notes-show")?.click();
    setTimeout(() => {
      const addBtn = document.getElementById("note-add-btn");
      if (addBtn && !addBtn.classList.contains("opened")) addBtn.click();
      const attach = document.getElementById("attach-event");
      if (attach) attach.value = pairLink.subject || "";
      const pairField = document.getElementById("pair-link-summary");
      if (pairField) {
        pairField.textContent = `${pairLink.dayOfWeek} · ${pairLink.timeRange} · ${pairLink.subject}`;
        pairField.dataset.linked = "1";
      }
      toast("Пара привязана к заметке");
    }, 120);
  }

  /* ─── Notes 2.0 ─── */
  function normalizeNote(raw) {
    if (!raw || typeof raw !== "object") return null;
    const uuid =
      raw.uuid ||
      (typeof window.SetUUID === "function"
        ? window.SetUUID()
        : `legacy-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const priority = PRIORITY_META[raw.priority] ? raw.priority : "normal";
    return {
      title: String(raw.title || "Без названия").slice(0, MAX_NOTE_TITLE),
      subject: String(raw.subject || "Общий").slice(0, 128),
      description: String(raw.description || "").slice(0, MAX_NOTE_DESC),
      time: String(raw.time || ""),
      uuid: String(uuid),
      pin: Boolean(raw.pin),
      pairLink: raw.pairLink && typeof raw.pairLink === "object" ? raw.pairLink : null,
      deadline: raw.deadline || null,
      priority,
      done: Boolean(raw.done),
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  function readNotes() {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem("notes") || "[]");
    } catch (_) {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    const normalized = list.map(normalizeNote).filter(Boolean);
    const changed = JSON.stringify(list) !== JSON.stringify(normalized);
    if (changed) localStorage.setItem("notes", JSON.stringify(normalized));
    return normalized;
  }

  function writeNotes(list) {
    localStorage.setItem("notes", JSON.stringify(list.map(normalizeNote).filter(Boolean)));
  }

  function deadlineUrgency(deadline) {
    if (!deadline) return null;
    const end = new Date(deadline);
    if (Number.isNaN(end.getTime())) return null;
    const now = new Date();
    const diffH = (end - now) / 3600000;
    if (diffH < 0) return "overdue";
    if (diffH <= 24) return "soon";
    if (diffH <= 72) return "near";
    return "ok";
  }

  function formatDeadline(deadline) {
    if (!deadline) return "";
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function collectPairLinkFromForm() {
    const pending = sessionStorage.getItem("pendingPairLink");
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        sessionStorage.removeItem("pendingPairLink");
        return parsed;
      } catch (_) {}
    }
    const summary = document.getElementById("pair-link-summary");
    if (summary?.dataset.linked === "1" && summary.dataset.payload) {
      try {
        return JSON.parse(summary.dataset.payload);
      } catch (_) {}
    }
    return null;
  }

  function sanitizeAiHtml(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    const allowed = new Set(["B", "STRONG", "I", "EM", "U", "S", "BR", "P", "UL", "OL", "LI", "A"]);
    template.content.querySelectorAll("*").forEach((node) => {
      if (!allowed.has(node.tagName)) {
        node.replaceWith(...node.childNodes);
        return;
      }
      [...node.attributes].forEach((attr) => {
        if (node.tagName === "A" && attr.name === "href" && /^(https?:|tg:)/i.test(attr.value)) {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
        } else node.removeAttribute(attr.name);
      });
    });
    return template.content;
  }

  function fillNoteForm(note) {
    const title = document.getElementById("name-event");
    const time = document.getElementById("time-event");
    const subject = document.getElementById("attach-event");
    const description = document.getElementById("extra-event");
    const deadline = document.getElementById("deadline-event");
    const priority = document.getElementById("priority-event");
    const pairSummary = document.getElementById("pair-link-summary");

    if (title) title.value = note?.title || "";
    if (time) time.value = note?.time || "";
    if (subject) subject.value = note?.subject || "";
    if (description) description.value = note?.description || "";
    if (deadline) {
      if (note?.deadline) {
        const d = new Date(note.deadline);
        deadline.value = Number.isNaN(d.getTime())
          ? ""
          : new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
      } else deadline.value = "";
    }
    if (priority) priority.value = note?.priority || "normal";
    if (pairSummary) {
      if (note?.pairLink) {
        pairSummary.dataset.linked = "1";
        pairSummary.dataset.payload = JSON.stringify(note.pairLink);
        pairSummary.textContent = `${note.pairLink.dayOfWeek || ""} · ${note.pairLink.timeRange || ""} · ${note.pairLink.subject || ""}`.trim();
      } else {
        pairSummary.dataset.linked = "0";
        delete pairSummary.dataset.payload;
        pairSummary.textContent = "Не привязана — удержите пару в расписании";
      }
    }
  }

  function readNoteForm(base = {}) {
    const titleEl = document.getElementById("name-event");
    const timeEl = document.getElementById("time-event");
    const subjectEl = document.getElementById("attach-event");
    const descEl = document.getElementById("extra-event");
    const deadlineEl = document.getElementById("deadline-event");
    const priorityEl = document.getElementById("priority-event");

    const title = (titleEl?.value || "").trim();
    if (!title) return { error: "title" };

    let time = (timeEl?.value || "").trim();
    if (!time) {
      const n = new Date();
      time = `${n.getDate()}.${String(n.getMonth() + 1).padStart(2, "0")}.${n.getFullYear()} ${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
    }

    let deadline = deadlineEl?.value ? new Date(deadlineEl.value).toISOString() : null;
    if (deadlineEl?.value && Number.isNaN(new Date(deadlineEl.value).getTime())) {
      deadline = null;
    }

    const pairLink = collectPairLinkFromForm() || base.pairLink || null;
    const subject = (subjectEl?.value || "").trim() || pairLink?.subject || "Общий";

    return {
      note: normalizeNote({
        ...base,
        title,
        time,
        subject,
        description: (descEl?.value || "").slice(0, MAX_NOTE_DESC),
        deadline,
        priority: priorityEl?.value || "normal",
        pairLink,
        updatedAt: new Date().toISOString(),
        uuid: base.uuid || (typeof window.SetUUID === "function" ? window.SetUUID() : undefined),
        createdAt: base.createdAt || new Date().toISOString(),
      }),
    };
  }

  async function persistNotesAndSync() {
    if (typeof window.sendExtra === "function") {
      await window.sendExtra();
    }
    try {
      await api("/extra/notes", {
        method: "POST",
        body: JSON.stringify({ notes: readNotes() }),
      });
    } catch (err) {
      console.warn("notes sync endpoint unavailable, extra/theme used", err);
    }
  }

  window.saveNoteNew = function saveNoteNewV2() {
    const result = readNoteForm();
    if (result.error) {
      safeHaptic("error");
      const name = document.getElementById("name-event");
      if (name) name.style.outline = "2px solid var(--tg-theme-destructive-text-color)";
      setTimeout(() => {
        if (name) name.style.outline = "none";
      }, 2500);
      return;
    }
    const notes = readNotes();
    notes.push(result.note);
    writeNotes(notes);
    persistNotesAndSync().then(() => {
      window.getNotes();
      safeHaptic("success");
    });
    document.getElementById("note-add-btn")?.click();
  };

  window.getEdinNoteData = async function getEdinNoteDataV2(id) {
    const notes = readNotes();
    const idx = notes.findIndex((n) => String(n.uuid) === String(id));
    if (idx < 0) return;
    const result = readNoteForm(notes[idx]);
    if (result.error) {
      safeHaptic("error");
      return;
    }
    notes[idx] = result.note;
    writeNotes(notes);
    const eventInput = document.getElementById("event-input");
    if (eventInput?.querySelector(".event-header h4")) {
      eventInput.querySelector(".event-header h4").textContent = "Добавление события";
    }
    if (typeof window.CloseBG === "function") window.CloseBG();
    const addBtn = document.getElementById("note-add-btn");
    if (addBtn) addBtn.style.display = "flex";
    const saveBtn = document.getElementById("save-event-btn");
    if (saveBtn) saveBtn.onclick = window.saveNoteNew;
    await persistNotesAndSync();
    window.getNotes();
    safeHaptic("success");
  };

  window.editNote = function editNoteV2(id) {
    const addBtn = document.getElementById("note-add-btn");
    if (addBtn) addBtn.style.display = "none";
    if (typeof window.ShowAdd === "function") window.ShowAdd();
    const eventInput = document.getElementById("event-input");
    if (eventInput?.querySelector(".event-header h4")) {
      eventInput.querySelector(".event-header h4").textContent = "Редактирование";
    }
    const notes = readNotes();
    const note = notes.find((n) => String(n.uuid) === String(id));
    if (!note) return;
    fillNoteForm(note);
    const saveBtn = document.getElementById("save-event-btn");
    if (saveBtn) saveBtn.onclick = () => window.getEdinNoteData(id);
  };

  window.toggleNoteDone = async function toggleNoteDone(id) {
    const notes = readNotes();
    const note = notes.find((n) => String(n.uuid) === String(id));
    if (!note) return;
    note.done = !note.done;
    note.updatedAt = new Date().toISOString();
    writeNotes(notes);
    await persistNotesAndSync();
    window.getNotes();
    safeImpact("soft");
  };

  window.jumpToPairLink = function jumpToPairLink(id) {
    const note = readNotes().find((n) => String(n.uuid) === String(id));
    if (!note?.pairLink) {
      toast("Нет привязки к паре");
      return;
    }
    const { weekIndex, dayOfWeek } = note.pairLink;
    if (typeof weekIndex === "number") {
      window.scheduleWeekIndex = weekIndex;
      if (typeof window.getSchedule1 === "function") {
        window.getSchedule1(true, weekIndex);
      }
    }
    document.getElementById("schedule-show")?.click();
    setTimeout(() => {
      const dayIdx = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"].indexOf(dayOfWeek);
      if (dayIdx >= 0) {
        document.querySelector(".swiper")?.swiper?.slideToLoop?.(dayIdx);
        document.querySelectorAll(".btnD")[dayIdx]?.click?.();
      }
      setTimeout(() => {
        document.querySelectorAll(".lesson-row").forEach((row) => {
          row.classList.remove("pair-flash");
          const samePair = note.pairLink.pairId
            ? row.dataset.pairId === note.pairLink.pairId
            : row.dataset.subject === note.pairLink.subject && String(row.dataset.lessonCode) === String(note.pairLink.lessonCode || "");
          if (samePair) {
            row.classList.add("pair-flash");
            row.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => row.classList.remove("pair-flash"), 3000);
          }
        });
      }, 400);
    }, 500);
    safeHaptic("success");
  };

  window.getNotes = function getNotesV2() {
    const notesArea = document.querySelector(".notes-area");
    if (!notesArea) return;
    const filter = localStorage.getItem(NOTES_FILTER_KEY) || "all";
    let notes = readNotes();

    notes = notes.slice().sort((a, b) => {
      if (a.pin !== b.pin) return a.pin ? -1 : 1;
      if (a.done !== b.done) return a.done ? 1 : -1;
      const pa = { urgent: 0, high: 1, normal: 2, low: 3 }[a.priority] ?? 2;
      const pb = { urgent: 0, high: 1, normal: 2, low: 3 }[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return da - db;
    });

    if (filter === "open") notes = notes.filter((n) => !n.done);
    if (filter === "done") notes = notes.filter((n) => n.done);
    if (filter === "deadlines") notes = notes.filter((n) => n.deadline && !n.done);
    if (filter === "linked") notes = notes.filter((n) => n.pairLink);

    notesArea.innerHTML = "";

    const toolbar = document.createElement("div");
    toolbar.className = "notes-toolbar";
    toolbar.innerHTML = ["all", "open", "deadlines", "linked", "done"]
      .map((f) => {
        const labels = {
          all: "Все",
          open: "Активные",
          deadlines: "Дедлайны",
          linked: "К парам",
          done: "Готово",
        };
        return `<button type="button" class="notes-filter-btn${filter === f ? " is-active" : ""}" data-filter="${f}">${labels[f]}</button>`;
      })
      .join("");
    notesArea.appendChild(toolbar);
    toolbar.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem(NOTES_FILTER_KEY, btn.dataset.filter);
        window.getNotes();
        safeImpact("light");
      });
    });

    if (!notes.length) {
      notesArea.insertAdjacentHTML(
        "beforeend",
        `<div class="note empty-note-v2">
          <h2>Пока пусто</h2>
          <p>Удержите пару в расписании — заметка привяжется автоматически. Добавьте дедлайн, чтобы не пропустить сдачу.</p>
        </div>`,
      );
      paintNoteBadgesOnLessons();
      renderDeadlinesStrip();
      return;
    }

    notes.forEach((note) => {
      const urgency = deadlineUrgency(note.deadline);
      const prio = PRIORITY_META[note.priority] || PRIORITY_META.normal;
      let clasS = `note note-v2 ${prio.className}`;
      if (note.pin || localStorage.getItem("pin-note") === String(note.uuid)) clasS += " pinned";
      if (note.done) clasS += " is-done";
      if (urgency) clasS += ` deadline-${urgency}`;

      const pairBtn = note.pairLink
        ? `<button type="button" class="note-btn-jump" onclick="jumpToPairLink('${note.uuid}')" title="К паре">↗</button>`
        : "";

      notesArea.insertAdjacentHTML(
        "beforeend",
        `<article id="note-${escapeAttr(note.uuid)}" class="${clasS}">
          <div class="note-top">
            <button type="button" class="note-check" onclick="toggleNoteDone('${escapeAttr(note.uuid)}')" aria-label="Готово">${note.done ? "✓" : ""}</button>
            <h2>${escapeHtml(note.title)}</h2>
            <span class="note-prio-chip">${prio.label}</span>
          </div>
          <div class="note-meta">
            <time>${escapeHtml(note.time)}</time>
            <span class="note-subject">${escapeHtml(note.subject)}</span>
            ${note.deadline ? `<span class="note-deadline" data-urgency="${urgency || ""}">⏳ ${escapeHtml(formatDeadline(note.deadline))}</span>` : ""}
          </div>
          ${note.pairLink ? `<button type="button" class="note-pair-chip" onclick="jumpToPairLink('${escapeAttr(note.uuid)}')">📎 ${escapeHtml(note.pairLink.dayOfWeek || "")} · ${escapeHtml(note.pairLink.subject || "")}</button>` : ""}
          ${note.description ? `<p>${escapeHtml(note.description)}</p>` : ""}
          <div class="note-btn-container">
            <button class="note-btn-edit" onclick="editNote('${escapeAttr(note.uuid)}')" aria-label="Редактировать">✎</button>
            <button class="note-btn-pin" onclick="pinNote('${escapeAttr(note.uuid)}')" aria-label="Закрепить">📌</button>
            ${pairBtn}
            <button class="note-btn-del" onclick="delNote('${escapeAttr(note.uuid)}')" aria-label="Удалить">🗑</button>
          </div>
        </article>`,
      );
    });

    paintNoteBadgesOnLessons();
    renderDeadlinesStrip();
  };

  function paintNoteBadgesOnLessons() {
    document.querySelectorAll(".lesson-note-dot").forEach((el) => el.remove());
    if (document.body.classList.contains("pref-noteBadges-off")) return;
    const openLinked = readNotes().filter((n) => n.pairLink && !n.done);
    document.querySelectorAll(".lesson-row").forEach((row) => {
      if (row.closest("#demo-lesson")) return;
      const hits = openLinked.filter(
        (n) =>
          n.pairLink.subject === row.dataset.subject &&
          String(n.pairLink.lessonCode || "") === String(row.dataset.lessonCode || ""),
      );
      if (!hits.length) return;
      const dot = document.createElement("span");
      dot.className = "lesson-note-dot";
      const urgent = hits.some((h) => h.priority === "urgent" || deadlineUrgency(h.deadline) === "soon" || deadlineUrgency(h.deadline) === "overdue");
      if (urgent) dot.classList.add("is-urgent");
      dot.textContent = String(hits.length);
      dot.title = hits.map((h) => h.title).join(", ");
      row.appendChild(dot);
    });
  }

  function renderDeadlinesStrip() {
    let strip = document.getElementById("deadlines-strip");
    const summary = document.getElementById("summary-screen");
    if (!summary) return;
    if (!strip) {
      strip = document.createElement("div");
      strip.id = "deadlines-strip";
      summary.insertBefore(strip, summary.querySelector(".now-lesson-summary-container"));
    }
    const upcoming = readNotes()
      .filter((n) => n.deadline && !n.done)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 4);
    if (!upcoming.length) {
      strip.innerHTML = "";
      strip.hidden = true;
      return;
    }
    strip.hidden = false;
    strip.innerHTML =
      `<div class="deadlines-strip-head">Дедлайны</div>` +
      upcoming
        .map((n) => {
          const u = deadlineUrgency(n.deadline);
          return `<button type="button" class="deadline-pill deadline-${u}" onclick="document.getElementById('notes-show').click()">
            <strong>${escapeHtml(n.title)}</strong>
            <span>${escapeHtml(formatDeadline(n.deadline))}</span>
          </button>`;
        })
        .join("");
  }

  /* ─── Share schedule as PNG ─── */
  function collectDayLessonsFromDom(dayEl) {
    if (!dayEl) return [];
    return Array.from(dayEl.querySelectorAll(".lesson-row"))
      .filter((r) => r.style.display !== "none")
      .map((row) => ({
        code: row.querySelector(".lesson")?.textContent?.trim() || "",
        time: row.querySelector(".time")?.textContent?.trim() || "",
        subject: row.querySelector(".subject")?.textContent?.trim() || "",
        room: (row.querySelector(".room")?.textContent || "").replace(/[()]/g, "").trim(),
        teacher: row.querySelector(".tname")?.textContent?.trim() || "",
      }));
  }

  function getActiveDayElement() {
    const swiper = document.querySelector(".swiper")?.swiper;
    const idx = swiper?.realIndex ?? 0;
    return document.querySelectorAll(".swiper-slide .day")[idx] || document.querySelector(".day");
  }

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function drawScheduleCard({ title, subtitle, weekLabel, lessons, mode }) {
    const W = 1080;
    const pad = 48;
    const rowH = 150;
    const headerH = 280;
    const H = Math.max(720, headerH + Math.max(lessons.length, 1) * rowH + 160);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const bg = cssVar("--tg-theme-bg-color", "#171F30");
    const card = cssVar("--tg-theme-secondary-bg-color", "#242F43");
    const accent = cssVar("--tg-theme-button-color", "#3390ec");
    const text = cssVar("--tg-theme-text-color", "#ffffff");
    const hint = cssVar("--tg-theme-hint-color", "#8b9bb4");

    // background atmosphere
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bg);
    grad.addColorStop(1, card);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(W - 80, 80, 220, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = text;
    ctx.font = "700 54px system-ui, -apple-system, sans-serif";
    ctx.fillText(title.slice(0, 28), pad, 90);

    ctx.fillStyle = hint;
    ctx.font = "400 32px system-ui, -apple-system, sans-serif";
    ctx.fillText(subtitle.slice(0, 48), pad, 140);

    // week chip
    ctx.fillStyle = accent;
    roundRect(ctx, pad, 170, 420, 56, 16);
    ctx.fill();
    ctx.fillStyle = cssVar("--tg-theme-button-text-color", "#fff");
    ctx.font = "600 28px system-ui, -apple-system, sans-serif";
    ctx.fillText(weekLabel.slice(0, 24), pad + 22, 208);

    let y = headerH;
    if (!lessons.length) {
      ctx.fillStyle = card;
      roundRect(ctx, pad, y, W - pad * 2, 140, 24);
      ctx.fill();
      ctx.fillStyle = text;
      ctx.font = "600 36px system-ui, -apple-system, sans-serif";
      ctx.fillText(mode === "summary" ? "Сегодня пар нет" : "Пар нет — можно отдыхать", pad + 36, y + 82);
    } else {
      lessons.forEach((lesson, i) => {
        ctx.fillStyle = i % 2 === 0 ? card : mixColor(card, bg, 0.35);
        roundRect(ctx, pad, y, W - pad * 2, rowH - 18, 22);
        ctx.fill();

        ctx.fillStyle = accent;
        roundRect(ctx, pad + 18, y + 28, 64, 64, 16);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "700 30px system-ui, -apple-system, sans-serif";
        ctx.fillText(String(lesson.code || i + 1).slice(0, 2), pad + 36, y + 70);

        ctx.fillStyle = hint;
        ctx.font = "600 26px system-ui, -apple-system, sans-serif";
        ctx.fillText((lesson.time || "").slice(0, 20), pad + 110, y + 42);

        ctx.fillStyle = text;
        ctx.font = "700 34px system-ui, -apple-system, sans-serif";
        ctx.fillText((lesson.subject || "—").slice(0, 36), pad + 110, y + 88);

        ctx.fillStyle = hint;
        ctx.font = "400 24px system-ui, -apple-system, sans-serif";
        const meta = [lesson.room && `ауд. ${lesson.room}`, lesson.teacher]
          .filter(Boolean)
          .join(" · ");
        ctx.fillText(meta.slice(0, 52), pad + 110, y + 122);

        y += rowH;
      });
    }

    ctx.fillStyle = accent;
    roundRect(ctx, pad, H - 110, W - pad * 2, 70, 18);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "700 28px system-ui, -apple-system, sans-serif";
    ctx.fillText("BoostBot · t.me/mietcbot", pad + 28, H - 64);

    return canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function mixColor(a, b, t) {
    // simple fallback — return a if parse fails
    try {
      const pa = parseHex(a);
      const pb = parseHex(b);
      if (!pa || !pb) return a;
      const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
      return `rgb(${m[0]},${m[1]},${m[2]})`;
    } catch (_) {
      return a;
    }
  }

  function parseHex(c) {
    if (!c) return null;
    let s = c.trim();
    if (s.startsWith("#") && (s.length === 7 || s.length === 4)) {
      if (s.length === 4) s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
      return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
    }
    const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (m) return [+m[1], +m[2], +m[3]];
    return null;
  }

  async function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("toBlob failed"));
      }, "image/png");
    });
  }

  async function uploadShareBlob(blob) {
    const form = new FormData();
    form.append("file", blob, "schedule.png");
    form.append(
      "meta",
      JSON.stringify({
        group: localStorage.getItem("userGroup") || "",
        week: window.scheduleWeekIndex ?? getScheduleWeekIndexFixed(),
      }),
    );
    const res = await fetch(`${API_BASE}/share/upload`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) throw new Error("upload failed");
    const data = await res.json();
    if (!data?.url) throw new Error("no url");
    try {
      sessionStorage.setItem("lastSharePublicUrl", data.url);
    } catch (_) {}
    return data.url;
  }

  function botSharePayloadLink() {
    // Deep link с payload группы: получатель получает карточку и атрибуцию
    const group = localStorage.getItem("userGroup") || "";
    const b64 = btoa(unescape(encodeURIComponent(group || "boost")))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return `https://t.me/${BOT_USERNAME}?start=share_${b64}`;
  }

  function openChatChooser(publicUrl) {
    // Шаринг через Telegram: отправитель выбирает чат (в т.ч. чат с ботом)
    const text = encodeURIComponent(
      `Расписание ${localStorage.getItem("userGroup") || ""} · ${botSharePayloadLink()}`,
    );
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${text}`;
    if (typeof tg?.openTelegramLink === "function") {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
    safeHaptic("success");
    toast("Выбери чат для отправки");
  }

  async function shareBlobWithFallbacks(blob, filename = "schedule.png") {
    const file = new File([blob], filename, { type: "image/png" });
    const inTelegram = Boolean(tg?.platform && tg.platform !== "unknown");

    // 0) В Telegram — самый надёжный и универсальный путь: рендер уходит на
    //    бэкенд (/share/upload), открывается выбор чата с публичной ссылкой.
    //    Работает на Android, iPhone и десктопе независимо от webview.
    if (inTelegram) {
      try {
        const publicUrl = await uploadShareBlob(blob);
        openChatChooser(publicUrl);
        return "telegram-share";
      } catch (err) {
        console.warn("telegram chat share failed", err);
      }
    }

    // 1) navigator.share with file (браузер вне Telegram / Android)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Расписание",
          text: localStorage.getItem("userGroup") || "Расписание",
        });
        safeHaptic("success");
        toast("Отправлено");
        return "share";
      } catch (err) {
        if (err?.name === "AbortError") return "aborted";
      }
    }

    // 2) сохранить файл на устройство (Android / десктоп; iOS через «Файлы»)
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      safeHaptic("success");
      toast("Скачивание…");
      return "download";
    } catch (_) {}

    // 3) iOS без navigator.share: открываем загруженную картинку —
    //    в Safari её можно удержать и «Сохранить в фото»
    try {
      const publicUrl = await uploadShareBlob(blob);
      if (typeof tg?.openLink === "function") {
        tg.openLink(publicUrl, { try_instant_view: false });
      } else {
        window.open(publicUrl, "_blank", "noopener,noreferrer");
      }
      toast("Удерживай картинку, чтобы сохранить");
      return "open-image";
    } catch (err) {
      console.warn("open image fallback", err);
    }

    // 3.5) буфер обмена (десктоп)
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        safeHaptic("success");
        toast("Картинка в буфере");
        return "clipboard";
      }
    } catch (_) {}

    // 4) upload + выбор чата в Telegram (в т.ч. чат с ботом)
    try {
      const publicUrl = await uploadShareBlob(blob);
      openChatChooser(publicUrl);
      return "telegram-share";
    } catch (err) {
      console.warn("share upload fallback", err);
    }

    return "download";
  }

  window.shareCurrentDayCard = async function shareCurrentDayCard() {
    try {
      toast("Рисуем карточку…");
      const dayEl = getActiveDayElement();
      const dayName = dayEl?.querySelector(".day-name")?.textContent?.trim() || "День";
      const group = localStorage.getItem("userGroup") || "Группа";
      const weekIdx = window.scheduleWeekIndex ?? getScheduleWeekIndexFixed();
      const lessons = collectDayLessonsFromDom(dayEl);
      const canvas = drawScheduleCard({
        title: group,
        subtitle: dayName,
        weekLabel: WEEK_TITLES[weekIdx] || `Неделя ${weekIdx + 1}`,
        lessons,
        mode: "day",
      });
      const blob = await canvasToPngBlob(canvas);
      await shareBlobWithFallbacks(blob, `${group}-${dayName}.png`);
    } catch (err) {
      console.error(err);
      safeHaptic("error");
      toast(`Не удалось поделиться: ${err?.message || "ошибка отрисовки"}`);
    }
  };

  window.shareSummaryCard = async function shareSummaryCard() {
    try {
      toast("Рисуем карточку…");
      const group = localStorage.getItem("userGroup") || "Группа";
      const weekIdx = window.scheduleWeekIndex ?? getScheduleWeekIndexFixed();
      const todayName = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"][
        new Date().getDay()
      ];
      const today = Array.from(document.querySelectorAll(".day")).find(
        (d) => d.querySelector(".day-name")?.textContent?.trim() === todayName,
      );
      const lessons = collectDayLessonsFromDom(today);
      const status =
        document.querySelector(".summary-status strong")?.textContent?.trim() || "Мой день";
      const canvas = drawScheduleCard({
        title: group,
        subtitle: `${todayName} · ${status}`,
        weekLabel: WEEK_TITLES[weekIdx] || "Неделя",
        lessons,
        mode: "summary",
      });
      const blob = await canvasToPngBlob(canvas);
      await shareBlobWithFallbacks(blob, `${group}-today.png`);
    } catch (err) {
      console.error(err);
      safeHaptic("error");
      toast("Не удалось поделиться");
    }
  };

  /* ─── Lesson card editor redesign ─── */
  function applyCardPreset(name) {
    const preset = CARD_PRESETS[name];
    if (!preset) return;
    const key = "customLessonCardSettings";
    const saved = {};
    Object.entries(preset).forEach(([prop, val]) => {
      if (prop === "label") return;
      document.documentElement.style.setProperty(prop, val);
      saved[prop] = val;
    });
    localStorage.setItem(key, JSON.stringify(saved));
    localStorage.setItem("lessonCardPreset", name);
    document.querySelectorAll(".lesson-preset-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.preset === name);
    });
    const resetBtn = document.querySelector(".reset-lesson-settings-c-btn");
    if (resetBtn) resetBtn.classList.remove("disabled");
    safeImpact("light");
    toast(`Пресет: ${preset.label}`);
  }

  function enhanceLessonEditor() {
    const tools = document.getElementById("lesson-tools-1");
    if (!tools || tools.dataset.enhanced === "1") return;
    tools.dataset.enhanced = "1";

    const presets = document.createElement("div");
    presets.className = "lesson-presets";
    presets.innerHTML = Object.entries(CARD_PRESETS)
      .map(
        ([id, p]) =>
          `<button type="button" class="lesson-preset-btn" data-preset="${id}">${p.label}</button>`,
      )
      .join("");
    tools.insertBefore(presets, tools.firstChild);
    presets.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => applyCardPreset(btn.dataset.preset));
    });

    const active = localStorage.getItem("lessonCardPreset");
    if (active) {
      presets.querySelector(`[data-preset="${active}"]`)?.classList.add("is-active");
    }

    const tip = document.createElement("p");
    tip.className = "lesson-editor-tip";
    tip.textContent = "Тап по элементу превью → тонкая настройка. Пресеты — для быстрого утра.";
    tools.insertBefore(tip, presets.nextSibling);

    const demo = document.getElementById("demo-lesson");
    if (demo) demo.classList.add("demo-lesson-v2");
  }

  /* ─── AI schedule chat ─── */
  const AI_QUOTA_KEY = "aiChatQuota_v1";
  const AI_FREE_DAILY = 5;
  const AI_PREMIUM_DAILY = 30;
  const AI_CHIPS = [
    "Когда следующая пара?",
    "Куда идти сейчас?",
    "Сколько пар сегодня?",
    "Что завтра?",
  ];

  function aiQuotaState() {
    const today = new Date().toISOString().slice(0, 10);
    let raw = {};
    try {
      raw = JSON.parse(localStorage.getItem(AI_QUOTA_KEY) || "{}") || {};
    } catch (_) {
      raw = {};
    }
    if (raw.day !== today) raw = { day: today, used: 0 };
    const premium =
      Boolean(tg?.initDataUnsafe?.user?.is_premium) ||
      localStorage.getItem("boostSoftPremium") === "1";
    const limit = premium ? AI_PREMIUM_DAILY : AI_FREE_DAILY;
    return { ...raw, premium, limit, left: Math.max(0, limit - (raw.used || 0)) };
  }

  function consumeAiQuota() {
    const st = aiQuotaState();
    if (st.left <= 0) return false;
    st.used = (st.used || 0) + 1;
    localStorage.setItem(AI_QUOTA_KEY, JSON.stringify({ day: st.day, used: st.used }));
    return true;
  }

  function initAiChat() {
    if (document.getElementById("ai-chat-panel")) return;

    const fab = document.createElement("button");
    fab.id = "ai-chat-fab";
    fab.type = "button";
    fab.hidden = true; // по умолчанию открыт экран расписания — там ассистент
    fab.setAttribute("aria-label", "Спросить про расписание");
    fab.innerHTML = "✦";
    document.body.appendChild(fab);

    const panel = document.createElement("div");
    panel.id = "ai-chat-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="ai-chat-head">
        <strong>Спросить расписание</strong>
        <span id="ai-quota-label" class="ai-quota-label"></span>
        <button type="button" id="ai-chat-close" aria-label="Закрыть">×</button>
      </div>
      <div id="ai-chips" class="ai-chips"></div>
      <div id="ai-chat-log" class="ai-chat-log"></div>
      <form id="ai-chat-form" class="ai-chat-form">
        <input id="ai-chat-input" maxlength="200" placeholder="Когда следующая пара? Куда идти?" autocomplete="off" />
        <button type="submit" id="ai-chat-send" aria-label="Отправить">
          <svg class="neuron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
              <circle class="n-core" cx="12" cy="12" r="2.1" fill="currentColor" stroke="none"/>
              <path d="M12 9.9V5.4"/><circle class="n-node" cx="12" cy="3.9" r="1.4"/>
              <path d="M13.8 13.05l3.9 2.25"/><circle class="n-node" cx="19.1" cy="16" r="1.4"/>
              <path d="M10.2 13.05l-3.9 2.25"/><circle class="n-node" cx="4.9" cy="16" r="1.4"/>
              <path d="M10.7 10.6L6.9 8"/><circle class="n-node" cx="5.4" cy="7.2" r="1.4"/>
              <path d="M13.3 10.6l3.8-2.6"/><circle class="n-node" cx="18.6" cy="7.2" r="1.4"/>
            </g>
          </svg>
        </button>
      </form>
    `;
    document.body.appendChild(panel);

    const log = panel.querySelector("#ai-chat-log");
    const form = panel.querySelector("#ai-chat-form");
    const input = panel.querySelector("#ai-chat-input");
    const chips = panel.querySelector("#ai-chips");
    const quotaLabel = panel.querySelector("#ai-quota-label");
    const openChat = () => {
      panel.hidden = false;
      refreshQuotaLabel();
      input.focus();
      safeImpact("light");
    };

    function refreshQuotaLabel() {
      const st = aiQuotaState();
      quotaLabel.textContent = st.premium
        ? `${st.left}/${st.limit} ★`
        : `${st.left}/${st.limit}`;
    }

    chips.innerHTML = AI_CHIPS.map(
      (q) => `<button type="button" class="ai-chip" data-q="${escapeAttr(q)}">${escapeHtml(q)}</button>`,
    ).join("");
    chips.querySelectorAll(".ai-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        input.value = btn.dataset.q || "";
        form.requestSubmit();
      });
    });

    function appendMsg(role, text) {
      const div = document.createElement("div");
      div.className = `ai-msg ai-${role}`;
      if (role === "bot" && /<[^>]+>/.test(String(text))) {
        div.appendChild(sanitizeAiHtml(text));
      } else div.textContent = text;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    }

    fab.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) {
        refreshQuotaLabel();
        input.focus();
        safeImpact("light");
      }
    });
    // Ассистент «звёздочка» открывает чат только если он включён в настройках
    const aiEnabled = () => localStorage.getItem("isActiveAI") !== "false";
    const openChatFromStarry = () => {
      if (!aiEnabled()) return;
      openChat();
    };
    document.getElementById("default-assistant")?.addEventListener("click", openChatFromStarry);
    document.getElementById("gloomy-asistant")?.addEventListener("click", openChatFromStarry);
    window.__openScheduleAi = openChatFromStarry;
    panel.querySelector("#ai-chat-close").addEventListener("click", () => {
      panel.hidden = true;
    });

    const sendBtn = panel.querySelector("#ai-chat-send");
    function setSendBusy(busy) {
      if (!sendBtn) return;
      sendBtn.disabled = busy;
      sendBtn.classList.toggle("is-thinking", busy);
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sendBtn?.disabled) return;
      const q = (input.value || "").trim();
      if (!q) return;
      const st = aiQuotaState();
      if (st.left <= 0) {
        appendMsg(
          "bot",
          st.premium
            ? "Дневной лимит AI исчерпан. Завтра снова будет доступен."
            : "Лимит на сегодня закончился. Telegram Premium или серия 7 дней дают расширенную квоту.",
        );
        safeHaptic("error");
        refreshQuotaLabel();
        return;
      }
      if (!consumeAiQuota()) return;
      refreshQuotaLabel();
      input.value = "";
      setSendBusy(true);
      appendMsg("user", q);
      appendMsg("bot", "Думаю");
      const pending = log.lastChild;
      pending.classList.add("ai-thinking");
      try {
        const data = await api("/ai/chat", {
          method: "POST",
          body: JSON.stringify({ message: q }),
        });
        pending.classList.remove("ai-thinking");
        pending.replaceChildren();
        const reply = data?.reply ||
          (data?.status === "rejected"
            ? "Могу помочь только с вопросами по расписанию."
            : "Не получилось ответить. Попробуй иначе.");
        pending.appendChild(/<[^>]+>/.test(reply) ? sanitizeAiHtml(reply) : document.createTextNode(reply));
        safeHaptic("success");
      } catch (err) {
        pending.classList.remove("ai-thinking");
        pending.textContent = err?.message?.includes("429")
          ? "Дневная квота AI исчерпана. Завтра лимит обновится."
          : "Сеть или сервер недоступны. Проверь интернет.";
        safeHaptic("error");
      } finally {
        setSendBusy(false);
      }
    });

    refreshQuotaLabel();
  }

  /* ─── Share UI injection ─── */
  function injectShareButtons() {
    // calendar week headers — share inside week-type selector (per week block)
    const cal = document.getElementById("calendarContainer");
    if (cal) {
      cal.querySelectorAll(".calendar-week-header").forEach((header) => {
        if (header.querySelector(".share-week-type-btn")) return;
        const weekBlock = header.closest(".calendar-week-block");
        const weekId = calendarWeeksIndexFromTitle(
          header.querySelector(".calendar-week-title")?.textContent,
        );
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "share-btn share-week-type-btn";
        btn.title = "Поделиться этой неделей";
        btn.textContent = "↗";
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          shareWeekTypeCard(weekId);
        });
        header.appendChild(btn);
        if (weekBlock) weekBlock.dataset.weekId = String(weekId);
      });

      if (!document.getElementById("share-week-btn")) {
        const bar = document.createElement("div");
        bar.className = "share-week-bar";
        bar.innerHTML = `<button type="button" id="share-week-btn" class="share-btn">Поделиться днём</button>`;
        const modal = document.querySelector(".calendar-card");
        modal?.querySelector(".calendar-header")?.appendChild(bar);
        bar.querySelector("button").addEventListener("click", () => {
          window.shareCurrentDayCard();
        });
      }
    }

    const summaryHeader = document.querySelector(".summary-header");
    if (summaryHeader && !document.getElementById("share-summary-btn")) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.id = "share-summary-btn";
      btn.className = "share-btn";
      btn.textContent = "Поделиться";
      summaryHeader.appendChild(btn);
      btn.addEventListener("click", () => window.shareSummaryCard());
    }
  }

  function calendarWeeksIndexFromTitle(title) {
    const idx = WEEK_TITLES.indexOf((title || "").trim());
    return idx >= 0 ? idx : window.scheduleWeekIndex ?? getScheduleWeekIndexFixed();
  }

  async function shareWeekTypeCard(weekId) {
    try {
      toast("Рисуем неделю…");
      const prev = window.scheduleWeekIndex;
      const target = Number(weekId);
      if (typeof window.getSchedule1 === "function" && prev !== target) {
        window.scheduleWeekIndex = target;
        await Promise.resolve(window.getSchedule1(true, target));
        await new Promise((r) => setTimeout(r, 700));
      }
      const group = localStorage.getItem("userGroup") || "Группа";
      const days = Array.from(document.querySelectorAll(".day"));
      const lessons = [];
      days.forEach((dayEl) => {
        const dayName = dayEl.querySelector(".day-name")?.textContent?.trim() || "";
        collectDayLessonsFromDom(dayEl).forEach((l) => {
          lessons.push({ ...l, subject: `${dayName.slice(0, 2)} · ${l.subject}` });
        });
      });
      const canvas = drawScheduleCard({
        title: group,
        subtitle: WEEK_TITLES[target] || `Неделя ${target + 1}`,
        weekLabel: WEEK_TITLES[target] || "",
        lessons: lessons.slice(0, 12),
        mode: "week",
      });
      const blob = await canvasToPngBlob(canvas);
      await shareBlobWithFallbacks(blob, `${group}-week-${target + 1}.png`);
      if (typeof prev === "number" && prev !== target && typeof window.getSchedule1 === "function") {
        window.scheduleWeekIndex = prev;
        window.getSchedule1(true, prev);
      }
    } catch (err) {
      console.error(err);
      safeHaptic("error");
      toast("Не удалось поделиться неделей");
    }
  }

  /* ─── Patch schedule render completion ─── */
  function patchCacheData() {
    const original = window.cacheData;
    if (typeof original !== "function" || original.__boostPatched) return;
    window.cacheData = function cacheDataPatched(data) {
      const result = original.apply(this, arguments);
      try {
        // also keep raw JSON if available via last fetch — stored separately when we hook fetch
        enrichLessonRows();
      } catch (err) {
        console.warn(err);
      }
      return result;
    };
    window.cacheData.__boostPatched = true;
  }

  function patchGetSchedule() {
    const original = window.getSchedule1;
    if (typeof original !== "function" || original.__boostPatched) return;
    window.getSchedule1 = function getSchedule1Patched() {
      const ret = original.apply(this, arguments);
      // schedule renders async; observe DOM
      setTimeout(enrichLessonRows, 800);
      setTimeout(enrichLessonRows, 2000);
      return ret;
    };
    window.getSchedule1.__boostPatched = true;
  }

  function watchScheduleMutations() {
    const wrap = document.getElementById("schedule-wrapper");
    if (!wrap || wrap.__boostObserved) return;
    wrap.__boostObserved = true;
    const mo = new MutationObserver((mutations) => {
      // Ignore class/style-only churn from loadSummary / overrides
      const meaningful = mutations.some(
        (m) =>
          m.type === "childList" &&
          (m.addedNodes.length > 0 || m.removedNodes.length > 0),
      );
      if (!meaningful) return;
      clearTimeout(wrap.__boostEnrichTimer);
      wrap.__boostEnrichTimer = setTimeout(enrichLessonRows, 120);
    });
    mo.observe(wrap, { childList: true, subtree: true });
  }

  /* ─── Deadline pulse on summary interval ─── */
  const originalLoadSummary = window.loadSummary;
  if (typeof originalLoadSummary === "function") {
    window.loadSummary = function loadSummaryPatched() {
      originalLoadSummary.apply(this, arguments);
      renderDeadlinesStrip();
    };
  }

  /* ─── Init ─── */
  function init() {
    patchCacheData();
    patchGetSchedule();
    watchScheduleMutations();
    enhanceLessonEditor();
    injectShareButtons();
    initAiChat();
    initAppearanceExtras();
    document.querySelectorAll("#schedule-show, #marks-show, #notes-show, #profile-show").forEach((button) => {
      button.addEventListener("click", () => {
        const scheduleScreen = button.id === "schedule-show";
        const fab = document.getElementById("ai-chat-fab");
        // На расписании работает ассистент «звёздочка», FAB — на остальных экранах
        if (fab) fab.hidden = scheduleScreen;
        if (scheduleScreen) document.getElementById("ai-chat-panel")?.setAttribute("hidden", "");
      });
    });
    enrichLessonRows();
    if (typeof window.getNotes === "function") window.getNotes();
    renderDeadlinesStrip();

    // re-inject share into calendar when opened
    document.getElementById("calendar-btn")?.addEventListener("click", () => {
      setTimeout(injectShareButtons, 50);
    });

    // clear pair link UI when opening fresh note
    document.getElementById("note-add-btn")?.addEventListener("click", () => {
      const btn = document.getElementById("note-add-btn");
      if (btn?.classList.contains("opened")) return;
      setTimeout(() => {
        const editing =
          document.querySelector("#event-input .event-header h4")?.textContent || "";
        if (editing.includes("Редактирование")) return;
        if (!sessionStorage.getItem("pendingPairLink")) {
          const pairSummary = document.getElementById("pair-link-summary");
          if (pairSummary && pairSummary.dataset.linked !== "1") {
            pairSummary.textContent = "Не привязана — удержите пару в расписании";
            pairSummary.dataset.linked = "0";
          }
        }
      }, 0);
    });

    document.getElementById("clear-pair-link")?.addEventListener("click", () => {
      sessionStorage.removeItem("pendingPairLink");
      const pairSummary = document.getElementById("pair-link-summary");
      if (pairSummary) {
        pairSummary.dataset.linked = "0";
        delete pairSummary.dataset.payload;
        pairSummary.textContent = "Не привязана — удержите пару в расписании";
      }
      safeImpact("light");
    });

    // preset deadline chips
    document.querySelectorAll("[data-deadline-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const hours = Number(btn.dataset.deadlinePreset);
        const d = new Date(Date.now() + hours * 3600000);
        const input = document.getElementById("deadline-event");
        if (!input) return;
        input.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        safeImpact("light");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // expose for debugging
  window.BoostUpgrade = {
    applyOverridesToDom,
    enrichLessonRows,
    readNotes,
    api,
    applyCardPreset,
    toast,
    shareWeekTypeCard,
  };
})();
