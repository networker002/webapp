//PERSONAL ASSISTANT INITIALISATION

const assistants = document.querySelector(".assistant");
let assistant = document.getElementById("default-assistant");

Array.from(assistants.children).forEach((assist) => {
  //console.log(assist);
  if (assist === assistant) {
    assist.style.display = "block";
  } else {
    assist.style.display = "none";
  }
});

const message = document.getElementById("ctx-assistant-say");
let msgS = [
  `                <h1>Привет!</h1>
                <p>Я твой напарник - Starry</p>`,
  `  
                <p>Теперь мы будем вместе</p>`,
  `
                <p>Моя главная задача - помогать тебе с учебой</p>`,
];

let timeouts = [];
let message_start = 5000;

message.style.display = "none";
const initialDelay = setTimeout(function () {
  message.style.display = "block";
  for (let m = 0; m < msgS.length; m++) {
    let t = setTimeout(function () {
      message.innerHTML = msgS[m];
    }, 5000 * m);
    timeouts.push(t);
  }
}, message_start);

timeouts.push(initialDelay);

function stopAll() {
  timeouts.forEach((t) => clearTimeout(t));
  message.style.display = "none";
  //console.log("Цикл остановлен");
}

setTimeout(
  () => {
    message.style.display = "none";
  },
  5000 * (msgS.length + 1),
);

const btnAI = document.getElementById("activate-ai-a");
const assistantBlock = document.querySelector(".assistant");
const assistantSay = document.querySelector(".assistant-say");

function initAI() {
  const storedState = localStorage.getItem("isActiveAI");
  const isActive = storedState === null ? true : storedState === "true";

  applyAIState(isActive);
}

function applyAIState(isActive) {
  const stateStr = isActive ? "true" : "false";
  localStorage.setItem("isActiveAI", stateStr);

  btnAI.innerHTML = isActive ? "<b>ВЫКЛ</b>" : "<b>ВКЛ</b>";

  if (isActive) {
    assistantBlock.style.display = "block";
    assistantSay.style.display = "block";
  } else {
    assistantBlock.style.display = "none";
    assistantSay.style.display = "none";
  }
}

btnAI.onclick = function () {
  const currentState = localStorage.getItem("isActiveAI") === "true";
  haptic.notificationOccurred("success");
  applyAIState(!currentState);
};

initAI();
const container = document.getElementById("schedule-container");

var loaderContainer = document.querySelector(".loader-container");
var loader = document.getElementById("loader");
loader.style.display = "flex";
loaderContainer.style.display = "block";
assistant.style.display = "none";

const tg = window.Telegram.WebApp;
tg.ready();
const haptic = tg.HapticFeedback;

var d = new Date();
let n = d.getDay();
let m = d.getMonth();
let dt = d.getDate();
((days = {
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
  7: "Воскресенье",
  0: "Воскресенье",
}),
  (months = {
    0: "января",
    1: "февраля",
    2: "марта",
    3: "апреля",
    4: "мая",
    5: "июня",
    6: "июля",
    7: "августа",
    8: "сентября",
    9: "октября",
    10: "ноября",
    11: "декабря",
  }),
  (dayCall = days[n] ?? "Воскресенье"),
  (full = dayCall + ", " + dt + " " + (months[m] ?? 0)));
document.getElementById("date-time").innerHTML = full;
daysShort = {
  1: "ПН",
  2: "ВТ",
  3: "СР",
  4: "ЧТ",
  5: "ПТ",
  6: "СБ",
  7: "ВС",
  0: "ВС",
};
let s = false;
let nowBtn;
let tommorrow = new Date();
tommorrow.setDate(dt + 1);

if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
  var userId = tg.initDataUnsafe.user.id;
}

function getSchedule1(reqNeed = false) {
  var ttl = 30 * 60 * 1000;
  var cachedData = localStorage.getItem("schedule");
  var dataLastUpd = localStorage.getItem("updated_at");

  if (userId) {
    const econt = document.getElementById("empty-container");
    if (econt) {
      econt.style.display = "none";
    }
    container.innerHTML = `
    <div id="sk"><h2 class="skeleton"></h2>
            <h3 class="skeleton"></h3>
            <h4 class="skeleton"></h4>
            <h6 class="skeleton"></h6>

            <h4 class="skeleton"></h4>
            <h6 class="skeleton"></h6>

            <h4 class="skeleton"></h4>
            <h6 class="skeleton"></h6>
            </div>`;
    m = "";
    for (let i = 0; i < userId.toString().length - 4; i++) {
      m += "●";
    }
    document.getElementById("tg-id-menu").innerHTML =
      userId.toString().slice(0, 4) + m;
    //found = false;
    if (reqNeed) {
      //let forMessageFrom = Date.now();
      const authHeaders = { Authorization: tg.initData };
      fetch("https://boost.rorosin.ru/group", { headers: authHeaders })
        //fetch("http://127.0.0.1:8000/group", {headers: authHeaders})
        .then((response) => {
          if (!response.ok) throw new Error("Error: " + response.status);
          return response.json();
        })
        .then((userGroup) => {
          if (userGroup !== null) {
            var Group = userGroup?.group_name;
            if (Group !== null) {
              if (localStorage.getItem("userGroup") !== Group) {
                localStorage.setItem("userGroup", Group);
              }
              document.getElementById("gr").innerHTML = Group;
              document.getElementById("group-name-menu").innerHTML = Group;

              return fetch("https://boost.rorosin.ru/schedule", {
                headers: authHeaders,
              });
              //return fetch("http://127.0.0.1:8000/schedule", {headers: authHeaders});
            }
          }

          console.log(userGroup);
          console.log(Group);
          document.getElementById("alerter").style.display = "block";

          document.getElementById("alerter").innerHTML =
            `<h1 style="color: var(--tg-theme-text-color);">Неизвестный пользователь</h1>
                <h3>Вы еще не зарегистрировались в нашей системе!</h3>
                <h6>Давайте сделаем это сейчас:</h6>
                <h6 id="errs-reg" style="min-height: 1.5em;"></h6>
                <input type="text" maxlength="16" minlength="4" placeholder="Группа: " name="group-set" id="group-set"><br>
                <button type="submit" id="set-group-btn" onclick="groupSet0()">Готово</button>`;
          //
          loader.style.display = "none";
          loaderContainer.style.display = "none";
          assistant.style.display = "block";
          throw new Error("Group not found!");
        })
        .then((resp) => {
          if (resp && resp.ok) {
            //let messageEnd = Date.now();
            loader.style.display = "none";
            loaderContainer.style.display = "none";
            assistant.style.display = "block";

            //message_start = message_start + (messageEnd - forMessageFrom - message_start);
            //console.log(messageEnd - forMessageFrom );

            return resp.json();
          }
        })
        .then((data) => {
          if (data) {
            container.innerHTML = data;
            if (nowBtn) upsSV();
            const dayss = document.querySelectorAll(".day");
            dayss.forEach((DAY) => {
              var dayNAMES = DAY.querySelectorAll(".day-name");
              dayNAMES.forEach((dn) => {
                dn.innerHTML += ` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M12 14q-.425 0-.712-.288T11 13t.288-.712T12 12t.713.288T13 13t-.288.713T12 14m-4.712-.288Q7 13.426 7 13t.288-.712T8 12t.713.288T9 13t-.288.713T8 14t-.712-.288M16 14q-.425 0-.712-.288T15 13t.288-.712T16 12t.713.288T17 13t-.288.713T16 14m-4 4q-.425 0-.712-.288T11 17t.288-.712T12 16t.713.288T13 17t-.288.713T12 18m-4.712-.288Q7 17.426 7 17t.288-.712T8 16t.713.288T9 17t-.288.713T8 18t-.712-.288M16 18q-.425 0-.712-.288T15 17t.288-.712T16 16t.713.288T17 17t-.288.713T16 18M5 22q-.825 0-1.412-.587T3 20V6q0-.825.588-1.412T5 4h1V2h2v2h8V2h2v2h1q.825 0 1.413.588T21 6v14q0 .825-.587 1.413T19 22zm0-2h14V10H5z"/></svg>`;
              });

              var rooms = DAY.querySelectorAll(".room");
              //rooms.forEach((r) => {console.log(r)});

              for (var i = 0; i < rooms.length; i++) {
                try {
                  if (
                    rooms[i].innerHTML.toString()[1] !==
                    rooms[i + 1].innerHTML.toString()[1]
                  ) {
                    //console.log(rooms[i].innerHTML.toString()[1]);
                    //console.log(rooms[i+1].innerHTML.toString()[1]);
                    //console.log(rooms[i].parentElement.parentElement.style.display);
                    rooms[i].style.color = "yellow";
                    rooms[i].classList.add("changing-rooms");
                    rooms[i + 1].classList.add("changing-rooms");
                    rooms[i + 1].style.color = "yellow";
                  }
                } catch {}
              }
            });

            dayParseOnline();
            cacheData(container.innerHTML);
            // if (!document.querySelectorAll(".day").length) {
            //   upsSV();
            // } else {
            //   hideEmptySchedule();
            // }
            teacherHide();
            if (nowBtn) upsSV();
            attachDaySwipeEvents();
          }
          
        })
        .catch((err) => {
          console.error("Ошибка:", err);
          loader.style.display = "none";
          loaderContainer.style.display = "none";
          assistant.style.display = "block";
        });

    } else if (!reqNeed) {
      if (cachedData && Date.now() - dataLastUpd < ttl) {
        container.innerHTML = cachedData;
        loader.style.display = "none";
        loaderContainer.style.display = "none";
        assistant.style.display = "block";
        if (nowBtn) upsSV();
        //console.log("cache!");
        var Group = localStorage.getItem("userGroup");
        if (Group) {
          const grElement = document.getElementById("gr");
          const menuElement = document.getElementById("group-name-menu");
          if (grElement) grElement.innerHTML = Group;
          if (menuElement) menuElement.innerHTML = Group;
        }
        teacherHide();
        dayParseOnline();
        if (nowBtn) upsSV();
        attachDaySwipeEvents();
        if (!document.querySelectorAll(".day").length) {
          upsSV();
        } else {
          hideEmptySchedule();
        }
      } else {
        console.log(311);
        getSchedule1(true);
      }
    }
  } else {
    //console.warn("userId не определен, запрос отменен.");
    document.getElementById("alerter").style.display = "block";

    document.getElementById("alerter").innerHTML =
      `<h1 style="color: #fff;">Неизвестный пользователь</h1>
        <h3>Вы еще не зарегистрировались в нашей системе!</h3>
        <h6>Давайте сделаем это сейчас:</h6>
        <h6 id="errs-reg" style="min-height: 1.5em;"></h6>
        <input type="text" maxlength="16" minlength="4" placeholder="Группа: " name="group-set" id="group-set"><br>
        <button type="submit" id="set-group-btn" onclick="groupSet0()">Готово</button>`;
    //
    loader.style.display = "none";
    loaderContainer.style.display = "none";
    assistant.style.display = "block";
  }
  
  
}
getSchedule1();

function cacheData(data) {
  const NOW = Date.now();
  try {
    localStorage.setItem("schedule", data.toString());
    localStorage.setItem("updated_at", NOW);
    return true;
  } catch {
    return false;
  }
}

function dayParseOnline() {
  const dayS = document.querySelectorAll(".day");
  dayS.forEach((D) => {
    if (
      D.querySelector(".day-name")
        .innerHTML.toString()
        .split("<")[0]
        .toString()
        .trim() === days[n]
    ) {
      const D1 = new Date();
      const D2 = new Date();
      const lessonH = D.querySelectorAll(".lesson-row");
      lessonH.forEach((ls) => {
        const times = ls.querySelectorAll(".time");
        times.forEach((timee) => {
          try {
            if (timee === undefined) {
              //console.log(1);
            } else {
              timeeText = timee.innerHTML.toString().trim();

              const timeNow = new Date();
              const nowH = timeNow.getHours();
              const nowM = timeNow.getMinutes();
              const HRSMINS = [
                timeeText.split("-")[0].split(":"),
                timeeText.split("-")[1].split(":"),
              ];

              D1.setHours(HRSMINS[0][0]);
              D1.setMinutes(HRSMINS[0][1]);

              D2.setHours(HRSMINS[1][0]);
              D2.setMinutes(HRSMINS[1][1]);

              if (timeNow >= D1 && timeNow <= D2) {
                timee.classList.add("now");
              } else {
                timee.classList.remove("now");
              }
            }
          } catch {}
        });
      });
    }
  });
}

function cleanDaySchedule(dayElement) {
  const lessonsData = {};
  const dayNameEl = dayElement.querySelector(".day-name");

  const lessonHeaders = dayElement.querySelectorAll(".lesson");

  lessonHeaders.forEach((header) => {
    //const Teacher = header.parentElement.parentElement.querySelector(".teacher");

    const lessonNum = header.textContent.trim();

    const timeEl = header.nextElementSibling;
    const timeText = timeEl?.classList.contains("time")
      ? timeEl.textContent.trim()
      : "";

    const subjectEl = timeEl?.nextElementSibling;
    const roomEl = subjectEl?.nextElementSibling;

    const subjectName = subjectEl?.classList.contains("subject")
      ? subjectEl.textContent.trim()
      : "";
    let roomText = roomEl?.classList.contains("room")
      ? roomEl.textContent.trim()
      : "";

    const Teacher = roomEl?.nextElementSibling;

    let teacherText = Teacher?.classList.contains("teacher")
      ? Teacher.textContent.trim()
      : "Не указано";

    roomText = roomText.replace(/[()]/g, "");

    const key = `${lessonNum}_${timeText}_${subjectName}`;

    if (!lessonsData[key]) {
      lessonsData[key] = {
        num: lessonNum,
        time: timeText,
        name: subjectName,
        rooms: roomText ? [roomText] : [],
        teacher: teacherText,
      };
    } else {
      if (roomText && !lessonsData[key].rooms.includes(roomText)) {
        lessonsData[key].rooms.push(roomText);
      }
    }
  });

  let newHTML = `<h3 class="day-name">${dayNameEl ? dayNameEl.innerHTML : ""}</h3>`;

  Object.values(lessonsData).forEach((l) => {
    const roomsDisplay =
      l.rooms.length > 0
        ? ` <span class="room">(${l.rooms.join(" / ")})</span>`
        : "";

    newHTML += `
            <div class="lesson-row">
                <h4 class="lesson">${l.num}</h4>
                <h6 class="time">${l.time}</h6>
                <button class="list-btn"></button>
                <span class="subject">${l.name}</span>${roomsDisplay}
                <div class="teacher"><h5 class="tname">${l.teacher}</h5></div>
            </div>
        `;
  });

  dayElement.innerHTML = newHTML;

  teacherHide(dayElement, false);
}

function teacherHide(element = document, del = true) {
  let notAdd = true;
  if (del) {
    localStorage.setItem("added-teacher", "false");
  }
  var btnsList = element.querySelectorAll(".list-btn");
  var eventsAll = document.querySelectorAll(".custom-events");
  if (eventsAll) {
    eventsAll.forEach((ev) => {
      if (ev) {
        ev.style.display = "none";
      }
    });
  }
  var cDataTeacher = container.querySelectorAll(".teacher svg");

  if (cDataTeacher.length === 0) {
    notAdd = false;
  }
  btnsList.forEach((btnX) => {
    btnX.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="currentColor" d="M17 3.34A10 10 0 1 1 2 12l.005-.324A10 10 0 0 1 17 3.34m-4.293 5.953a1 1 0 0 0-1.414 0l-3 3A1 1 0 0 0 9 14h6c.217 0 .433-.07.613-.21l.094-.083a1 1 0 0 0 0-1.414z"/></svg>`;

    btnX.parentElement.querySelector(".teacher").style.display = "none";

    var newUUID = SetUUID();
    btnX.parentElement.querySelector(".teacher").id = newUUID;
    let shown = false;
    let addedNotesBtn = false;
    //console.log("working...");
    if (localStorage.getItem("added-teacher") !== "true") {
      //console.log("not true! adding rooms");
      var test = btnX.parentElement.querySelector(".room").innerHTML;
      if (test) {
        if (test.length < 7) {
          test = test.replace(/[()]/g, "");
          let corpus = Number(test[0]);
          let floor = Number(test[1]);
          let room = Number(test.slice(2, 4));
          if (!notAdd) {
            btnX.parentElement.querySelector(".teacher").innerHTML +=
              `<h5 style="color: var(--room-green); padding-top: .3em; font-weight: 500;">Корпус: ${corpus} │ этаж: ${floor} │ аудитория: ${room}</h5>`;
          }
        } else if (test.length > 6 && test[1] !== "Н") {
          let tests = test.split("/", 2);
          tests.forEach((test) => {
            test = test.replace(/[()]/g, "").trim();
            let corpus = Number(test[0]);
            let floor = Number(test[1]);
            let room = Number(test.slice(2, 4));
            if (!notAdd) {
              btnX.parentElement.querySelector(".teacher").innerHTML +=
                `<h5 style="color: var(--room-green); padding-top: .3em; font-weight: 500;">Корпус: ${corpus} │ этаж: ${floor} │ аудитория: ${room}</h5>`;
            }
          });
        }
      }
      if (btnX.parentElement.querySelector(".time.now") && !notAdd) {
        btnX.parentElement
          .querySelector(".time.now")
          .parentElement.querySelector(".teacher").innerHTML +=
          `<h4 style="padding-top: .2em; color: #46ff15dd" class="isNow">Сейчас идет</h4>`;
      }
    }

    btnX.addEventListener("click", function () {
      var test = btnX.parentElement.querySelector(".room").innerHTML;
      if (test) {
        if (
          btnX.parentElement
            .querySelector(".room")
            .classList.contains("changing-rooms")
        ) {
          if (!localStorage.getItem("roomShown")) {
            localStorage.setItem("roomShown", false);
          }
          if (localStorage.getItem("roomShown") === "false") {
            var message = document.getElementById("ctx-assistant-say");
            stopAll();
            message.style.display = "block";
            message.innerHTML = `<h4 style="font-weight: 500;">В промежутке между парами <span style="color: #fff41fed;">вам придётся менять корпуса!</span> <span style="font-weight:600;">Будьте внимательны</span></h4><div style="text-align: right;"><button onclick="hideRoomShown()" class="ai-btn">ОК</button></div>`;
            setTimeout(function () {
              message.style.display = "none";
            }, 10000);
          }
        }
      }
      let events = btnX.parentElement.querySelectorAll(".custom-events");

      if (events) {
        events.forEach((e) => {
          //console.log(e);
          if (e) {
            e.style.display = "block";
          }
        });
      }

      if (!shown) {
        btnX.parentElement.querySelector(".teacher").style.display = "block";

        if (!addedNotesBtn) {
          if (
            btnX.parentElement
              .querySelector(".teacher")
              .querySelector(".input-svg")
          ) {
            btnX.parentElement
              .querySelector(".teacher")
              .querySelector(".input-svg")
              .remove();
          }
          btnX.parentElement.querySelector(".teacher").innerHTML +=
            `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" class="input-svg" onclick="ShowAdd('${newUUID}');" ><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M4 14v-2h7v2zm0-4V8h11v2zm0-4V4h11v2zm9 14v-3.075l5.525-5.5q.225-.225.5-.325t.55-.1q.3 0 .575.113t.5.337l.925.925q.2.225.313.5t.112.55t-.1.563t-.325.512l-5.5 5.5zm7.5-6.575l-.925-.925zm-6 5.075h.95l3.025-3.05l-.45-.475l-.475-.45l-3.05 3.025zm3.525-3.525l-.475-.45l.925.925z"/></svg>`;
          addedNotesBtn = true;
        }

        btnX.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="currentColor" d="M17 3.34A10 10 0 1 1 2 12l.005-.324A10 10 0 0 1 17 3.34M15 10H9a1 1 0 0 0-.708 1.707l3 3a1 1 0 0 0 1.415 0l3-3a1 1 0 0 0 0-1.414l-.094-.083A1 1 0 0 0 15 10"/></svg>`;
        shown = true;
      } else {
        btnX.parentElement.querySelector(".teacher").style.display = "none";
        if (events) {
          events.forEach((e) => {
            //console.log(e);
            if (e) {
              e.style.display = "none";
            }
          });
        }
        btnX.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="currentColor" d="M17 3.34A10 10 0 1 1 2 12l.005-.324A10 10 0 0 1 17 3.34m-4.293 5.953a1 1 0 0 0-1.414 0l-3 3A1 1 0 0 0 9 14h6c.217 0 .433-.07.613-.21l.094-.083a1 1 0 0 0 0-1.414z"/></svg>`;
        shown = false;
      }
    });
  });
  localStorage.setItem("added-teacher", "true");
}

function hideRoomShown() {
  var message = document.getElementById("ctx-assistant-say");
  message.style.display = "none";
  var roomShown = true;
  localStorage.setItem("roomShown", roomShown);
}

let rr = true;
let clickedAi = false;

function upsSV(from = false, n = 0) {
  let found = false;
  var ch = false;
  lm = new Map();
  var DAYS = document.querySelectorAll(".day");
  document.getElementById("empty-container").style.display = "none";
  DAYS.forEach((de) => {
    var dayName = de.querySelector(".day-name")?.textContent.trim();
    var dayLesson = de.querySelector(".lesson");
    var dayLessons = de.querySelectorAll(".lesson");

    btnMapping = {
      ПН: "Понедельник",
      ВТ: "Вторник",
      СР: "Среда",
      ЧТ: "Четверг",
      ПТ: "Пятница",
      СБ: "Суббота",
    };

    btnRevMapping = {
      Понедельник: "ПН",
      Вторник: "ВТ",
      Среда: "СР",
      Четверг: "ЧТ",
      Пятница: "ПТ",
      Суббота: "СБ",
    };

    btnMappingNext = {
      Понедельник: "Вторник",
      Вторник: "Среда",
      Среда: "Четверг",
      Четверг: "Пятница",
      Пятница: "Суббота",
      Суббота: "Понедельник",
    };

    btnMappingPrev = {
      Понедельник: "Суббота",
      Вторник: "Понедельник",
      Среда: "Вторник",
      Четверг: "Среда",
      Пятница: "Четверг",
      Суббота: "Пятница",
    };

    if (from && n) {
      if (from.id !== "empty-container") {
        var dnFrom = from.querySelector(".day-name").textContent.trim();
        document.getElementById("empty-container").style.display = "none";
      } else if (from.id === "empty-container") {
        //console.log(0);
        if (n < 0) {
          var targetKey1 = btnMappingNext[btnMapping[nowBtn.innerHTML]];
          //console.log(targetKey1);
          var nextBtn = Array.from(document.querySelectorAll(".btnD")).find(
            (btn) => btn.innerHTML.trim() === btnRevMapping[targetKey1],
          );

          if (nextBtn) {
            nowBtn?.classList.remove("selected");
            nextBtn.classList.add("selected");
            nowBtn = nextBtn;
            from.style.display = "none";
          }
        } else if (n > 0) {
          var targetKey1 = btnMappingPrev[btnMapping[nowBtn.innerHTML]];
          //console.log(targetKey1);
          var nextBtn = Array.from(document.querySelectorAll(".btnD")).find(
            (btn) => btn.innerHTML.trim() === btnRevMapping[targetKey1],
          );

          if (nextBtn) {
            nowBtn?.classList.remove("selected");
            nextBtn.classList.add("selected");
            nowBtn.click();
            return;
          }
        }

        upsSV();
      }
      var swipeTarget = n > 0 ? btnMappingNext[dnFrom] : btnMappingPrev[dnFrom];
      if (swipeTarget) {
        var targetKey = Object.keys(btnMapping).find(
          (key) => btnMapping[key] === swipeTarget,
        );
        if (targetKey) {
          var nextBtn = Array.from(document.querySelectorAll(".btnD")).find(
            (btn) => btn.innerHTML.trim() === targetKey,
          );
          if (nextBtn) {
            nowBtn?.classList.remove("selected");
            nextBtn.classList.add("selected");
            nowBtn = nextBtn;
          }
        }
      }
    }

    if (dayName === btnMapping[nowBtn.innerHTML]) {
      de.style.display = "block";
      document.getElementById("empty-container").style.display = "none";
      found = true;
      ch = false;
      lm.set(de, ch);
      document
        .querySelectorAll(".teacher")
        .forEach((t) => (t.style.display = "none"));
      if (dayName === days[n]) {
        dayParseOnline();
      }

      if (
        dayName === days[tommorrow.getDay()] &&
        rr &&
        new Date().getHours() > 7
      ) {
        stopAll();
        message.style.display = "block";
        assistant.style.transform = "translate(0%, -50%)";
        message.parentElement.style.transform = "translate(0%, -50%)";
        let kKo = "к ";
        if (dayLesson.textContent.startsWith("2")) {
          kKo = "ко ";
        }
        message.innerHTML = `<div><div><p>Завтра тебе <span style="color:yellow;">${kKo + dayLesson.textContent.replace("пара", "паре")}</span>!</p><p>Не пропусти ее, лучше подготовься заранее и прийди за <span style="color:rgb(0, 255, 100);">10-15</span> мин</p></div><div style="text-align:right"><button onclick="rr=false;  message.style.display = 'none';assistant.style.transform = 'translate(0)';message.parentElement.style.transform = 'translate(0)';" class="my-def-btns">Хорошо</button></div</div>`;
        clickedAi = true;
      } else if (clickedAi) {
        assistant.style.transform = "translate(0)";
        message.parentElement.style.transform = "translate(0)";
        message.innerHTML = "";
        message.style.display = "none";
      }
    } else {
      de.style.display = "none";
      ch = true;
    }

    if (!de.dataset.cleaned) {
      cleanDaySchedule(de);
      de.dataset.cleaned = "true";
    }

    //if (!ch[0]) {
    //}
  });

  if (!found && !document.querySelector(".skeleton")) {
    document.getElementById("empty-container").style.display = "flex";
    document.getElementById("empty-container").style.animation =
      "nothingFly 1s ease";
  } else {
    document.getElementById("empty-container").style.display = "none";
  }
}

function hideEmptySchedule() {
  const empty = document.getElementById("empty-container");
  if (!empty) return;
  empty.style.display = "none";
}

var btns = document.querySelectorAll(".btnD");
btns.forEach((btn) => {
  if (btn.innerHTML === daysShort[n]) {
    btn.classList.add("selected");
    nowBtn = btn;
    s = true;
  }
  btn.addEventListener("click", function () {
    if (s) {
      nowBtn.classList.remove("selected");
    }
    btn.classList.add("selected");
    nowBtn = btn;
    upsSV();
    //console.log(ch);
  });
});

let r = 0;
const burgerBtn = document.getElementById("burger-menu");
const updater = document.getElementById("upd-b");

burgerBtn.addEventListener("click", function () {
  burgerBtn.classList.remove("closed-btn");
  burgerBtn.classList.add("opened-btn");
});

let timeout = 0;
updater.addEventListener("click", function () {
  if (timeout === 0) {
    if (message.style.display === "block") {
      message.style.display = "none";
      setTimeout(function () {
        message.style.display = "block";
      }, 2000);
    }
    r += 360;
    updater.style.transform = `rotate(${r}deg)`;
    var al = document.getElementById("fast-alert");
    al.style.display = "flex";
    al.style.animation = "flyUP 2s normal";
    setTimeout(function () {
      al.style.display = "none";
    }, 1900);
    upsSV();
    
    document.querySelectorAll(".day, #empty-container").forEach((el) => {
      if (el) delete el.dataset.swipeAttached;
    });
    
    getSchedule1(true);
    //attachDaySwipeEvents();

    timeout = 5000;
    setTimeout(function () {
      timeout = 0;
    }, 5000);
  }
});

//var burger = document.getElementById("burger-menu");

//burger.addEventListener("click", function() {
//    let menu;
//});

function setOtherBtns() {
  var chatInput = document.querySelectorAll(".user-input-btn");
  fetch("ctx.json")
    .then((response) => response.json())
    .then((data) => {
      for (const key in data) {
        if (key !== "Привет!") {
          chatInput.forEach((btn) => {
            if (btn.innerHTML === key) {
              btn.style.display = "inline-block";
            }
          });
        }
      }
    });
}

function getDays() {
  var daYS = document.querySelectorAll(".day");
  let ans = {};
  let newWeek = `<div>`;
  daYS.forEach((day) => {
    let dn = day
      .querySelector(".day-name")
      .innerHTML.trim()
      .split("<")[0]
      .trim();
    //console.log(dn);
    //console.log(days[tommorrow.getDay()]);
    //console.log(dn === days[tommorrow.getDay()]);
    if (dn === dayCall) {
      //console.log("now");
      var lessons = day.querySelectorAll(".lesson-row");
      newDay = `<div><b>${day.querySelector(".day-name").innerHTML.split("<")[0]}</b>`;
      lessons.forEach((lesson) => {
        newDay += `<br>${lesson.innerHTML.replace("<button", '<button style="display:none;" ')}`;
      });
      newDay += "</div>";

      ans["now"] = newDay;
      //console.log(day);
    } else if (dn === days[tommorrow.getDay()]) {
      //console.log("tommorrow");
      var lessons = day.querySelectorAll(".lesson-row");
      newDay = `<div><b>${day.querySelector(".day-name").innerHTML.split("<")[0]}</b>`;
      lessons.forEach((lesson) => {
        newDay += `<br>${lesson.innerHTML.replace("<button", '<button style="display:none;" ')}`;
      });
      newDay += "</div>";
      ans["tommorrow"] = newDay;
      //console.log(day);
    }
    newWeek += `${day.innerHTML
      .trim()
      .replace(/<button/gi, '<button style="display:none;" ')
      .replace(/<h3 class="day-name"/gi, '<br><br><br><h3 class="day-name"')}`;
  });
  newWeek += "</div>";
  //newWeek = `<div>${daYS.innerHTML.replace('<button', '<button style="display:none;" ')}</div>`;
  //console.log(newWeek);
  ans["week"] = newWeek;
  return ans;
}

var btnUserIput = document.querySelectorAll(".user-input-btn");
let clickedToAI = false;

btnUserIput.forEach((btn) => {
  btn.addEventListener("click", function () {
    //console.log(btn.innerHTML);
    var btnCtx = btn.innerHTML;
    fetch("ctx.json")
      .then((response) => response.json())
      .then((data) => {
        if (data[btnCtx]) {
          var answerText = data[btnCtx];
          let keys = Object.keys(data);
          //console.log(btnCtx);

          var daysData = getDays();

          if (btnCtx === "Что сегодня?") {
            answerText = answerText.replace(
              "{today_schedule}",
              daysData["now"] ?? "На сегодня ничего нет!",
            );
          } else if (btnCtx === "Что завтра?") {
            answerText = answerText.replace(
              "{tomorrow_schedule}",
              daysData["tommorrow"] ?? "На завтра ничего нет!",
            );
          } else if (btnCtx === "Группа") {
            answerText = answerText.replace(
              "{current_group}",
              `<b>${document.getElementById("gr").innerHTML}</b>`,
            );
          } else if (btnCtx === "На неделю") {
            answerText = answerText.replace(
              "{week_schedule}",
              daysData["week"],
            );
          }

          var msg = document.getElementById("chat-messages");
          msg.innerHTML += `<div class="from-user"><p>${btnCtx}</p></div>`;
          setTimeout(
            () => {
              msg.innerHTML += `<div class="from-bot"><p>${answerText}</p></div>`;
            },
            500 * (Math.random() + 1),
          );

          btn.style.animation =
            "popupBtnText .5s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
          setTimeout(function () {
            btn.style.display = "none";
          }, 500);
          clickedToAI = true;
        }
        if (clickedToAI) {
          setTimeout(() => {
            setOtherBtns();
          }, 500);
        }
      });
  });
});

function openGroupChangeModal() {
  document.getElementById("alerter").style.display = "block";
  document.getElementById("alerter").style.animation = "OpenObj .5s ease";
  document.getElementById("shocked-assistant").style.display = "block";
  document.getElementById("shocked-assistant").style.animation =
    "OpenObj .5s ease, opq1 1s ease-in";
  document.getElementById("alerter").innerHTML = `<h1>Смена группы</h1>
            <h3>Обновление данных</h3>
            <h6>Давайте сделаем это сейчас:</h6>
            <h6 id="errs-reg" style="min-height: 1.5em;"></h6>
            <input type="text" maxlength="16" minlength="4" placeholder="Группа: " name="group-set" id="group-set"><br>
            <button type="submit" id="set-group-btn" onclick="groupSet0()">Готово</button><br>
            <button style="background: var(--tg-theme-bg-color); color: var(--tg-theme-button-text-color); border: none; padding: 10px 20px; border-radius: 3em; letter-spacing: 0.1em;" onclick="closeN('alerter', 'shocked-assistant')">Отмена</button>`;
}

function closeN(id, id2 = false) {
  var el = document.getElementById(id);
  if (id2) {
    var el2 = document.getElementById(id2);
    el2.style.animation = "CloseObj .5s ease";
    setTimeout(function () {
      el2.style.display = "none";
      el2.style.animation = "none";
    }, 400);
  }
  el.style.animation = "CloseObj .5s ease";
  setTimeout(function () {
    el.style.display = "none";
  }, 440);
}

function openn(id, displ) {
  var el = document.getElementById(id);
  el.style.display = displ;
  el.style.animation = "opening .5s normal";
}

function closee(id) {
  var el = document.getElementById(id);
  el.style.animation = "closing .5s normal";
  burgerBtn.classList.remove("opened-btn");
  burgerBtn.classList.add("closed-btn");
  setTimeout(function () {
    el.style.display = "none";
  }, 80);
}

// function applyTheme(theme) {
//   const root = document.documentElement;
//   const themeNameDisplay = document.getElementById("d-s-t");
//   document.body.setAttribute("data-theme", theme);
//   localStorage.setItem("theme", theme);
// }

// const darkRadio = document.getElementById("dark-theme");
// const lightRadio = document.getElementById("light-theme");

// darkRadio.addEventListener("change", function () {
//   if (this.checked) {
//     applyTheme("dark");
//     haptic.notificationOccurred("success");
//   }
// });
// lightRadio.addEventListener("change", function () {
//   if (this.checked) {
//     applyTheme("light");
//     haptic.notificationOccurred("success");
//   }
// });

window.addEventListener("DOMContentLoaded", () => {
  let dayPeriodMapping = {
    0: "0",
    1: "0",
    2: "10%",
    3: "20%",
    4: "30%",
    5: "40%",
    6: "45%",
    7: "50%",
    8: "55%",
    9: "60%",
    10: "65%",
    11: "65%",
    12: "70%",
    13: "75%",
    14: "80%",
    15: "85%",
    16: "90%",
    17: "95%",
    18: "115%",
    19: "125%",
    20: "130%",
    21: "140%",
    22: "145%",
    23: "150%",
  };
  const d2 = new Date();
  const hours = d2.getHours();
  const dayType = d2.getDay();
  if (dayType === 0 || dayType === 6 || dayType === 7) {
    document
      .querySelector(":root")
      .style.setProperty(
        "--star-background-day",
        dayPeriodMapping[hours] || "0",
      );
  }
  //console.log(dayPeriodMapping[hours]);

  if (hours <= 7 || hours > 20) {
    assistant.innerHTML = `<svg width="81" height="84" viewBox="0 0 81 84" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_i_35_3)">
<path d="M42.6161 28.4529C45.8169 24.2147 52.1831 24.2147 55.3839 28.4529L59.3814 33.7459C60.3386 35.0134 61.6514 35.9672 63.1527 36.4859L69.4218 38.6521C74.4417 40.3866 76.409 46.4412 73.3673 50.795L69.5687 56.2324C68.6591 57.5345 68.1576 59.0778 68.1282 60.6659L68.0053 67.2976C67.907 72.6078 62.7566 76.3497 57.6759 74.8023L51.3308 72.8699C49.8114 72.4071 48.1886 72.4071 46.6692 72.8699L40.3241 74.8023C35.2434 76.3497 30.093 72.6078 29.9947 67.2976L29.8718 60.6659C29.8424 59.0778 29.3409 57.5345 28.4313 56.2324L24.6327 50.795C21.591 46.4412 23.5583 40.3866 28.5782 38.6521L34.8473 36.4859C36.3486 35.9672 37.6614 35.0134 38.6186 33.7459L42.6161 28.4529Z" fill="url(#paint0_linear_35_3)"/>
</g>  
<circle cx="40" cy="48.5" r="5" fill="url(#paint1_linear_35_3)"/>
<circle cx="58" cy="48.5" r="5" fill="url(#paint2_linear_35_3)"/>
<circle cx="58" cy="48.5" r="4" fill="black"/>
<circle cx="56" cy="46.5" r="2" fill="white"/>
<circle cx="40" cy="48.5" r="4" fill="black"/>
<circle cx="38" cy="46.5" r="2" fill="white"/>
<rect width="37.5563" height="4.81491" rx="2.40745" transform="matrix(0.852534 -0.522673 0.649293 0.760539 21.6902 44.8112)" fill="white"/>
<g filter="url(#filter1_n_35_3)">
<path d="M21.5792 16.1147L54.0688 26.2557L22.7812 45.4376L21.5792 16.1147Z" fill="url(#paint3_linear_35_3)"/>
</g>
<path d="M24.8025 19.0703L26.0152 19.7688L27.3951 18.8664L26.7647 20.2006L27.9775 20.8992L26.3751 21.0252L25.7448 22.3594L25.3849 21.103L23.7825 21.229L25.1624 20.3266L24.8025 19.0703Z" fill="#FFFFA2" fill-opacity="0.82"/>
<path d="M34.054 33.6278L35.2667 34.3264L36.6466 33.4239L36.0162 34.7581L37.2289 35.4567L35.6266 35.5827L34.9962 36.9169L34.6363 35.6606L33.034 35.7866L34.4139 34.8841L34.054 33.6278Z" fill="#FFFFA2" fill-opacity="0.82"/>
<path d="M24.2541 34.6941L25.4668 35.3926L26.8467 34.4902L26.2163 35.8244L27.4291 36.523L25.8267 36.649L25.1964 37.9832L24.8365 36.7268L23.2341 36.8528L24.614 35.9504L24.2541 34.6941Z" fill="#FFFFA2" fill-opacity="0.82"/>
<path d="M30.57 25.2206L31.7828 25.9192L33.1626 25.0168L32.5323 26.351L33.745 27.0496L32.1427 27.1756L31.5123 28.5098L31.1524 27.2534L29.55 27.3794L30.9299 26.477L30.57 25.2206Z" fill="#FFFFA2" fill-opacity="0.82"/>
<path d="M43.1884 24.6008L44.4012 25.2994L45.7811 24.3969L45.1507 25.7311L46.3634 26.4297L44.7611 26.5557L44.1307 27.8899L43.7708 26.6336L42.1685 26.7596L43.5483 25.8571L43.1884 24.6008Z" fill="#FFFFA2" fill-opacity="0.82"/>
<g filter="url(#filter2_n_35_3)">
<line x1="22.2785" y1="16.6499" x2="18.6499" y2="25.7215" stroke="#002174" stroke-linecap="round"/>
</g>
<g filter="url(#filter3_d_35_3)">
<circle cx="18.5" cy="26.5" r="2.5" fill="white"/>
<circle cx="18.5" cy="26.5" r="2" stroke="white" stroke-opacity="0.37"/>
</g>
<defs>
<filter id="filter0_i_35_3" x="23.1871" y="25.2743" width="55.6259" height="58.8802" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dx="4" dy="9"/>
<feGaussianBlur stdDeviation="6.1"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.53 0"/>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_35_3"/>
</filter>
<filter id="filter1_n_35_3" x="21.5792" y="16.1147" width="32.4896" height="29.3229" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feTurbulence type="fractalNoise" baseFrequency="3.3333332538604736 3.3333332538604736" stitchTiles="stitch" numOctaves="3" result="noise" seed="7494" />
<feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
<feComponentTransfer in="alphaNoise" result="coloredNoise1">
<feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
</feComponentTransfer>
<feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
<feFlood flood-color="rgba(0, 0, 0, 0.2)" result="color1Flood" />
<feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
<feMerge result="effect1_noise_35_3">
<feMergeNode in="shape" />
<feMergeNode in="color1" />
</feMerge>
</filter>
<filter id="filter2_n_35_3" x="18.1498" y="16.1498" width="4.62891" height="10.0718" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feTurbulence type="fractalNoise" baseFrequency="2 2" stitchTiles="stitch" numOctaves="3" result="noise" seed="6685" />
<feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
<feComponentTransfer in="alphaNoise" result="coloredNoise1">
<feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
</feComponentTransfer>
<feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
<feFlood flood-color="rgba(0, 0, 0, 0.25)" result="color1Flood" />
<feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
<feMerge result="effect1_noise_35_3">
<feMergeNode in="shape" />
<feMergeNode in="color1" />
</feMerge>
</filter>
<filter id="filter3_d_35_3" x="14.1" y="22.1" width="8.8" height="8.8" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset/>
<feGaussianBlur stdDeviation="0.95"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_35_3"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_35_3" result="shape"/>
</filter>
<linearGradient id="paint0_linear_35_3" x1="49" y1="20" x2="49" y2="84" gradientUnits="userSpaceOnUse">
<stop stop-color="#FFC404"/>
<stop offset="1" stop-color="#996402"/>
</linearGradient>
<linearGradient id="paint1_linear_35_3" x1="40" y1="43.5" x2="40" y2="53.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#D8C3BD"/>
<stop offset="1" stop-color="#DBDBDB"/>
</linearGradient>
<linearGradient id="paint2_linear_35_3" x1="58" y1="43.5" x2="58" y2="53.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#D8C3BD"/>
<stop offset="1" stop-color="#DBDBDB"/>
</linearGradient>
<linearGradient id="paint3_linear_35_3" x1="21.5792" y1="16.1147" x2="39.4386" y2="45.2452" gradientUnits="userSpaceOnUse">
<stop stop-color="#002174"/>
<stop offset="1" stop-color="#001DDA"/>
</linearGradient>
</defs>
</svg>
`;
  } else {
    assistant.innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_i_18_41)">
                        <path
                            d="M25.6161 8.45295C28.8169 4.21475 35.1831 4.21474 38.3839 8.45294L42.3813 13.7459C43.3386 15.0134 44.6514 15.9672 46.1527 16.4859L52.4218 18.6521C57.4417 20.3866 59.409 26.4412 56.3673 30.795L52.5687 36.2324C51.6591 37.5345 51.1576 39.0778 51.1282 40.6659L51.0053 47.2976C50.907 52.6078 45.7566 56.3497 40.6759 54.8023L34.3308 52.8699C32.8114 52.4071 31.1886 52.4071 29.6692 52.8699L23.3241 54.8023C18.2434 56.3497 13.093 52.6078 12.9947 47.2976L12.8718 40.6659C12.8424 39.0778 12.3409 37.5345 11.4313 36.2324L7.63268 30.795C4.59102 26.4412 6.55828 20.3866 11.5782 18.6521L17.8473 16.4859C19.3486 15.9672 20.6614 15.0134 21.6186 13.7459L25.6161 8.45295Z"
                            fill="url(#paint0_linear_18_41)" />
                    </g>
                    <circle cx="23" cy="28.5" r="5" fill="url(#paint1_linear_18_41)" />
                    <circle cx="41" cy="28.5" r="5" fill="url(#paint2_linear_18_41)" />
                    <circle cx="41" cy="28.5" r="4" fill="black" />
                    <circle cx="39" cy="26.5" r="2" fill="white" />
                    <circle cx="23" cy="28.5" r="4" fill="black" />
                    <circle cx="21" cy="26.5" r="2" fill="white" />
                    <defs>
                        <filter id="filter0_i_18_41" x="6.18707" y="5.27429" width="55.6259" height="58.8802"
                            filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                            <feFlood flood-opacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feColorMatrix in="SourceAlpha" type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                            <feOffset dx="4" dy="9" />
                            <feGaussianBlur stdDeviation="6.1" />
                            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.53 0" />
                            <feBlend mode="normal" in2="shape" result="effect1_innerShadow_18_41" />
                        </filter>
                        <linearGradient id="paint0_linear_18_41" x1="32" y1="0" x2="32" y2="64"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#FFC404" />
                            <stop offset="1" stop-color="#996402" />
                        </linearGradient>
                        <linearGradient id="paint1_linear_18_41" x1="23" y1="23.5" x2="23" y2="33.5"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#D8C3BD" />
                            <stop offset="1" stop-color="#DBDBDB" />
                        </linearGradient>
                        <linearGradient id="paint2_linear_18_41" x1="41" y1="23.5" x2="41" y2="33.5"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#D8C3BD" />
                            <stop offset="1" stop-color="#DBDBDB" />
                        </linearGradient>
                    </defs>
                </svg>`;
  }
  try {
    tg.setBackgroundColor(
      document.body.computedStyleMap().get("--tg-theme-bg-color")[0],
    );
    tg.setHeaderColor(
      document.body.computedStyleMap().get("--header-bg-color")[0],
    );

    if (tg.platform === "tdesktop") {
      tg.exitFullscreen();
    } else {
      tg.requestFullscreen();
    }
  } catch {}
  // const savedTheme = localStorage.getItem("theme") || "dark";
  // if (savedTheme == "light") {
  //   lightRadio.checked = true;
  //   applyTheme("light");
  // } else {
  //   darkRadio.checked = true;
  //   applyTheme("dark");
  // }
  if (nowBtn) upsSV();
});

function ShowAdd(id) {
  console.log("showing popup");
  document.getElementById("black-bg").style.animation = "none";
  document.getElementById("black-bg").style.animation = "opq1 1s ease";
  document.getElementById("black-bg").style.display = "block";
  openn("event-input", "flex");
  document.getElementById("event-input").setAttribute("data-uuid", id);
}

function CloseBG() {
  document.getElementById("black-bg").style.animation =
    "popupBtnText 1s ease forwards";
  document.getElementById("event-input").style.animation =
    "popupBtnText2 1s ease forwards";
  document.getElementById("event-input").style.animation =
    "popupBtnText2 1s ease forwards";
  setTimeout(() => {
    document.getElementById("black-bg").style.display = "none";
    document.getElementById("event-input").style.display = "none";
    document.getElementById("event-input").removeAttribute("data-uuid");
  }, 900);
}

function CloseBG2() {
  document.getElementById("black-bg").style.animation =
    "popupBtnText 1s ease forwards";
  setTimeout(() => {
    document.getElementById("black-bg").style.display = "none";
    document.getElementById("black-bg").style.zIndex = "1999";
  }, 900);
}
function SetUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0;
    var v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function DelEvent(el) {
  const eventElement = el.parentElement;

  setTimeout(function () {
    eventElement.remove();

    //console.log("cleaned");
    //console.log(container.querySelector(el));

    localStorage.setItem("schedule", container.innerHTML);
  }, 100);

  haptic.notificationOccurred("success");
}

function saveTeacherData() {
  //console.log("saving data");
  var errR = false;
  var allTeachers = document.querySelectorAll(".teacher");
  var myElement = document.getElementById("event-input");
  var TitleEvent = document.getElementById("name-event").value ?? "Безымянный";
  var TimePeriodEvent = document.getElementById("time-event").value;
  var ExtraEvent = document.getElementById("extra-event").value;
  var UUID = myElement.getAttribute("data-uuid");
  var UTeacher = document.getElementById(UUID);

  function escapeX(string) {
    var htmlEscapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
    };

    return string.replace(/[&<>"']/g, function (match) {
      return htmlEscapes[match];
    });
  }
  function testLetters(str) {
    return /[a-zA-Zа-яА-ЯёЁ]/.test(str);
  }

  TitleEvent = escapeX(TitleEvent);
  ExtraEvent = escapeX(ExtraEvent);
  TimePeriodEvent = escapeX(TimePeriodEvent);

  if (!TimePeriodEvent || testLetters(TimePeriodEvent)) {
    document.getElementById("save-event-btn").innerHTML =
      "<b>Неверный ввод!</b>";
    document.getElementById("save-event-btn").style.pointerEvents = "none";
    document.getElementById("save-event-btn").style.background =
      "var(--tg-theme-destructive-text-color)";
    document.getElementById("save-event-btn").style.boxShadow = "none";
    haptic.notificationOccurred("error");
    errR = true;
    setTimeout(() => {
      document.getElementById("save-event-btn").innerHTML = "Сохранить";
      document.getElementById("save-event-btn").style.pointerEvents = "all";
      document.getElementById("save-event-btn").style.background =
        "var(--tg-theme-button-color)";

      document.getElementById("save-event-btn").style.color =
        "var(--tg-theme-button-text-color)";
      document.getElementById("save-event-btn").style.boxShadow = "none";
    }, 2000);
  } else {
    CloseBG();
  }
  if (!errR) {
    if (ExtraEvent) {
      UTeacher.innerHTML += `<div class="custom-events"><h4 style="letter-spacing: 1px; font-weight: 600;">${TitleEvent}</h4><span class="time1">${TimePeriodEvent}</span><h6 style="font-weight: 200; white-space: normal; overflow-wrap: anywhere; word-break: break-word; max-width: 80%;">${ExtraEvent}</h6><svg class="del-event" onclick="DelEvent(this);" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" d="M2.75 6.167c0-.46.345-.834.771-.834h2.665c.529-.015.996-.378 1.176-.916l.03-.095l.115-.372c.07-.228.131-.427.217-.605c.338-.702.964-1.189 1.687-1.314c.184-.031.377-.031.6-.031h3.478c.223 0 .417 0 .6.031c.723.125 1.35.612 1.687 1.314c.086.178.147.377.217.605l.115.372l.03.095c.18.538.74.902 1.27.916h2.57c.427 0 .772.373.772.834S20.405 7 19.979 7H3.52c-.426 0-.771-.373-.771-.833M11.607 22h.787c2.707 0 4.06 0 4.941-.863c.88-.864.97-2.28 1.15-5.111l.26-4.081c.098-1.537.147-2.305-.295-2.792s-1.187-.487-2.679-.487H8.23c-1.491 0-2.237 0-2.679.487s-.392 1.255-.295 2.792l.26 4.08c.18 2.833.27 4.248 1.15 5.112S8.9 22 11.607 22"/></svg></div>`;
    } else {
      UTeacher.innerHTML += `<div class="custom-events"><h4 style="letter-spacing: 1px; font-weight: 600;">${TitleEvent}</h4><span class="time1">${TimePeriodEvent}</span><svg class="del-event" onclick="DelEvent(this);" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" d="M2.75 6.167c0-.46.345-.834.771-.834h2.665c.529-.015.996-.378 1.176-.916l.03-.095l.115-.372c.07-.228.131-.427.217-.605c.338-.702.964-1.189 1.687-1.314c.184-.031.377-.031.6-.031h3.478c.223 0 .417 0 .6.031c.723.125 1.35.612 1.687 1.314c.086.178.147.377.217.605l.115.372l.03.095c.18.538.74.902 1.27.916h2.57c.427 0 .772.373.772.834S20.405 7 19.979 7H3.52c-.426 0-.771-.373-.771-.833M11.607 22h.787c2.707 0 4.06 0 4.941-.863c.88-.864.97-2.28 1.15-5.111l.26-4.081c.098-1.537.147-2.305-.295-2.792s-1.187-.487-2.679-.487H8.23c-1.491 0-2.237 0-2.679.487s-.392 1.255-.295 2.792l.26 4.08c.18 2.833.27 4.248 1.15 5.112S8.9 22 11.607 22"/></svg></div>`;
    }

    document.getElementById("event-input").removeAttribute("data-uuid");
    localStorage.setItem("schedule", container.innerHTML);
    // allTeachers.forEach((teacher) => {
    //   if (teacher.style.display === "block") {
    //     if (ExtraEvent) {
    //     teacher.innerHTML += `<div class="custom-events"><h4 style="letter-spacing: 1px; font-weight: 600;">${TitleEvent}</h4><span class="time">${TimePeriodEvent}</span><h6 style="font-weight: 200; white-space: normal; overflow-wrap: anywhere; word-break: break-word; max-width: 80%;">${ExtraEvent}</h6><svg class="del-event" onclick="this.parentElement.style.display = 'none';" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" d="M2.75 6.167c0-.46.345-.834.771-.834h2.665c.529-.015.996-.378 1.176-.916l.03-.095l.115-.372c.07-.228.131-.427.217-.605c.338-.702.964-1.189 1.687-1.314c.184-.031.377-.031.6-.031h3.478c.223 0 .417 0 .6.031c.723.125 1.35.612 1.687 1.314c.086.178.147.377.217.605l.115.372l.03.095c.18.538.74.902 1.27.916h2.57c.427 0 .772.373.772.834S20.405 7 19.979 7H3.52c-.426 0-.771-.373-.771-.833M11.607 22h.787c2.707 0 4.06 0 4.941-.863c.88-.864.97-2.28 1.15-5.111l.26-4.081c.098-1.537.147-2.305-.295-2.792s-1.187-.487-2.679-.487H8.23c-1.491 0-2.237 0-2.679.487s-.392 1.255-.295 2.792l.26 4.08c.18 2.833.27 4.248 1.15 5.112S8.9 22 11.607 22"/></svg></div>`
    //     } else {
    //       teacher.innerHTML += `<div class="custom-events"><h4 style="letter-spacing: 1px; font-weight: 600;">${TitleEvent}</h4><span class="time">${TimePeriodEvent}</span><svg class="del-event" onclick="this.parentElement.style.display = 'none';" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" d="M2.75 6.167c0-.46.345-.834.771-.834h2.665c.529-.015.996-.378 1.176-.916l.03-.095l.115-.372c.07-.228.131-.427.217-.605c.338-.702.964-1.189 1.687-1.314c.184-.031.377-.031.6-.031h3.478c.223 0 .417 0 .6.031c.723.125 1.35.612 1.687 1.314c.086.178.147.377.217.605l.115.372l.03.095c.18.538.74.902 1.27.916h2.57c.427 0 .772.373.772.834S20.405 7 19.979 7H3.52c-.426 0-.771-.373-.771-.833M11.607 22h.787c2.707 0 4.06 0 4.941-.863c.88-.864.97-2.28 1.15-5.111l.26-4.081c.098-1.537.147-2.305-.295-2.792s-1.187-.487-2.679-.487H8.23c-1.491 0-2.237 0-2.679.487s-.392 1.255-.295 2.792l.26 4.08c.18 2.833.27 4.248 1.15 5.112S8.9 22 11.607 22"/></svg></div>`
    //     }
    //   }
    // });
    // if (TeacherOnly.style.display === "block") {
    //        if (ExtraEvent) {
    //        TeacherOnly.innerHTML += `<div class="custom-events"><h4 style="letter-spacing: 1px; font-weight: 600;">${TitleEvent}</h4><span class="time">${TimePeriodEvent}</span><h6 style="font-weight: 200; white-space: normal; overflow-wrap: anywhere; word-break: break-word; max-width: 80%;">${ExtraEvent}</h6><svg class="del-event" onclick="this.parentElement.style.display = 'none';" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" d="M2.75 6.167c0-.46.345-.834.771-.834h2.665c.529-.015.996-.378 1.176-.916l.03-.095l.115-.372c.07-.228.131-.427.217-.605c.338-.702.964-1.189 1.687-1.314c.184-.031.377-.031.6-.031h3.478c.223 0 .417 0 .6.031c.723.125 1.35.612 1.687 1.314c.086.178.147.377.217.605l.115.372l.03.095c.18.538.74.902 1.27.916h2.57c.427 0 .772.373.772.834S20.405 7 19.979 7H3.52c-.426 0-.771-.373-.771-.833M11.607 22h.787c2.707 0 4.06 0 4.941-.863c.88-.864.97-2.28 1.15-5.111l.26-4.081c.098-1.537.147-2.305-.295-2.792s-1.187-.487-2.679-.487H8.23c-1.491 0-2.237 0-2.679.487s-.392 1.255-.295 2.792l.26 4.08c.18 2.833.27 4.248 1.15 5.112S8.9 22 11.607 22"/></svg></div>`
    //        } else {
    //         TeacherOnly.innerHTML += `<div class="custom-events"><h4 style="letter-spacing: 1px; font-weight: 600;">${TitleEvent}</h4><span class="time">${TimePeriodEvent}</span><svg class="del-event" onclick="this.parentElement.style.display = 'none';" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" d="M2.75 6.167c0-.46.345-.834.771-.834h2.665c.529-.015.996-.378 1.176-.916l.03-.095l.115-.372c.07-.228.131-.427.217-.605c.338-.702.964-1.189 1.687-1.314c.184-.031.377-.031.6-.031h3.478c.223 0 .417 0 .6.031c.723.125 1.35.612 1.687 1.314c.086.178.147.377.217.605l.115.372l.03.095c.18.538.74.902 1.27.916h2.57c.427 0 .772.373.772.834S20.405 7 19.979 7H3.52c-.426 0-.771-.373-.771-.833M11.607 22h.787c2.707 0 4.06 0 4.941-.863c.88-.864.97-2.28 1.15-5.111l.26-4.081c.098-1.537.147-2.305-.295-2.792s-1.187-.487-2.679-.487H8.23c-1.491 0-2.237 0-2.679.487s-.392 1.255-.295 2.792l.26 4.08c.18 2.833.27 4.248 1.15 5.112S8.9 22 11.607 22"/></svg></div>`
    //        }
    //      }
  }
}

function toBtoa(str) {
  const utf8Bytes = encodeURIComponent(str).replace(
    /%([0-9A-F]{2})/g,
    (match, p1) => {
      return String.fromCharCode("0x" + p1);
    },
  );

  const b64 = btoa(utf8Bytes);

  return b64.replace(/\//g, "_").replace(/\+/g, "-").replace(/=+$/, "");
}

function groupSet0() {
  var D = document.getElementById("group-set").value.trim();
  //console.log(D);
  var erDisplay = document.getElementById("errs-reg");
  erDisplay.style = "font-weight:600;color:red";
  if (D.length < 4 || D.length > 13) {
    erDisplay.innerHTML = "Имя группы должно быть другой длины";
    haptic.notificationOccurred("error");
    document.getElementById("shocked-assistant").innerHTML =
      `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_i_28_16)">
<path d="M25.6161 8.45295C28.8169 4.21475 35.1831 4.21474 38.3839 8.45294L42.3813 13.7459C43.3386 15.0134 44.6514 15.9672 46.1527 16.4859L52.4218 18.6521C57.4417 20.3866 59.409 26.4412 56.3673 30.795L52.5687 36.2324C51.6591 37.5345 51.1576 39.0778 51.1282 40.6659L51.0053 47.2976C50.907 52.6078 45.7566 56.3497 40.6759 54.8023L34.3308 52.8699C32.8114 52.4071 31.1886 52.4071 29.6692 52.8699L23.3241 54.8023C18.2434 56.3497 13.093 52.6078 12.9947 47.2976L12.8718 40.6659C12.8424 39.0778 12.3409 37.5345 11.4313 36.2324L7.63268 30.795C4.59102 26.4412 6.55828 20.3866 11.5782 18.6521L17.8473 16.4859C19.3486 15.9672 20.6614 15.0134 21.6186 13.7459L25.6161 8.45295Z" fill="url(#paint0_linear_28_16)"/>
</g>
<rect x="24" y="40" width="16" height="2" rx="1" fill="#FFC404"/>
<rect x="24.5" y="40.5" width="15" height="1" rx="0.5" stroke="#996402" stroke-opacity="0.79"/>
<circle cx="23" cy="28.5" r="5" fill="url(#paint1_linear_28_16)"/>
<circle cx="41" cy="28.5" r="5" fill="url(#paint2_linear_28_16)"/>
<circle cx="41" cy="28.5" r="4" fill="black"/>
<circle cx="39" cy="26.5" r="2" fill="white"/>
<circle cx="23" cy="28.5" r="4" fill="black"/>
<circle cx="21" cy="26.5" r="2" fill="white"/>
<defs>
<filter id="filter0_i_28_16" x="6.18713" y="5.27429" width="55.6257" height="58.8802" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dx="4" dy="9"/>
<feGaussianBlur stdDeviation="6.1"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.53 0"/>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_28_16"/>
</filter>
<linearGradient id="paint0_linear_28_16" x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
<stop stop-color="#FFC404"/>
<stop offset="1" stop-color="#996402"/>
</linearGradient>
<linearGradient id="paint1_linear_28_16" x1="23" y1="23.5" x2="23" y2="33.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#D8C3BD"/>
<stop offset="1" stop-color="#DBDBDB"/>
</linearGradient>
<linearGradient id="paint2_linear_28_16" x1="41" y1="23.5" x2="41" y2="33.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#D8C3BD"/>
<stop offset="1" stop-color="#DBDBDB"/>
</linearGradient>
</defs>
</svg>

`;
    setTimeout(function () {
      erDisplay.innerHTML = "";
      document.getElementById("shocked-assistant").innerHTML =
        `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_i_18_72)">
                        <path
                            d="M25.6161 8.45295C28.8169 4.21475 35.1831 4.21474 38.3839 8.45294L42.3814 13.7459C43.3386 15.0134 44.6514 15.9672 46.1527 16.4859L52.4218 18.6521C57.4417 20.3866 59.409 26.4412 56.3673 30.795L52.5687 36.2324C51.6591 37.5345 51.1576 39.0778 51.1282 40.6659L51.0053 47.2976C50.907 52.6078 45.7566 56.3497 40.6759 54.8023L34.3308 52.8699C32.8114 52.4071 31.1886 52.4071 29.6692 52.8699L23.3241 54.8023C18.2434 56.3497 13.093 52.6078 12.9947 47.2976L12.8718 40.6659C12.8424 39.0778 12.3409 37.5345 11.4313 36.2324L7.63268 30.795C4.59102 26.4412 6.55828 20.3866 11.5782 18.6521L17.8473 16.4859C19.3486 15.9672 20.6614 15.0134 21.6186 13.7459L25.6161 8.45295Z"
                            fill="url(#paint0_linear_18_72)" />
                    </g>
                    <circle cx="23" cy="28.5" r="5" fill="url(#paint1_linear_18_72)" />
                    <circle cx="41" cy="28.5" r="5" fill="url(#paint2_linear_18_72)" />
                    <circle cx="41" cy="28.5" r="4" fill="black" />
                    <circle cx="39" cy="28.5" r="2" fill="white" />
                    <circle cx="23" cy="28.5" r="4" fill="black" />
                    <circle cx="25" cy="28.5" r="2" fill="white" />
                    <g filter="url(#filter1_i_18_72)">
                        <path
                            d="M28 39.5C28 37.0147 30.0147 35 32.5 35C34.9853 35 37 37.0147 37 39.5V40.85C37 42.5897 35.5897 44 33.85 44H31.15C29.4103 44 28 42.5897 28 40.85V39.5Z"
                            fill="#6C0A0A" />
                    </g>
                    <defs>
                        <filter id="filter0_i_18_72" x="6.18713" y="5.27429" width="55.6257" height="58.8802"
                            filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                            <feFlood flood-opacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feColorMatrix in="SourceAlpha" type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                            <feOffset dx="4" dy="9" />
                            <feGaussianBlur stdDeviation="6.1" />
                            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                            <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.53 0" />
                            <feBlend mode="normal" in2="shape" result="effect1_innerShadow_18_72" />
                        </filter>
                        <filter id="filter1_i_18_72" x="28" y="35" width="13" height="13" filterUnits="userSpaceOnUse"
                            color-interpolation-filters="sRGB">
                            <feFlood flood-opacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feColorMatrix in="SourceAlpha" type="matrix"
                                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                            <feOffset dx="7" dy="4" />
                            <feGaussianBlur stdDeviation="2" />
                            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.34 0" />
                            <feBlend mode="normal" in2="shape" result="effect1_innerShadow_18_72" />
                        </filter>
                        <linearGradient id="paint0_linear_18_72" x1="32" y1="0" x2="32" y2="64"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#FFC404" />
                            <stop offset="1" stop-color="#996402" />
                        </linearGradient>
                        <linearGradient id="paint1_linear_18_72" x1="23" y1="23.5" x2="23" y2="33.5"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#D8C3BD" />
                            <stop offset="1" stop-color="#DBDBDB" />
                        </linearGradient>
                        <linearGradient id="paint2_linear_18_72" x1="41" y1="23.5" x2="41" y2="33.5"
                            gradientUnits="userSpaceOnUse">
                            <stop stop-color="#D8C3BD" />
                            <stop offset="1" stop-color="#DBDBDB" />
                        </linearGradient>
                    </defs>
                </svg>`;
    }, 3000);
  } else {
    const url = "https://t.me/mietcbot?start=" + "group_" + toBtoa(D);
    tg.openTelegramLink(url);

    setTimeout(function () {
      const authHeaders = { Authorization: tg.initData };
      fetch("https://boost.rorosin.ru/group", { headers: authHeaders })
        .then((response) => {
          if (!response.ok) throw new Error("Error: " + response.status);
          return response.json();
        })
        .then((userGroup) => {
          var Group = userGroup.group_name;
          if (localStorage.getItem("userGroup")) {
            if (localStorage.getItem("userGroup") !== Group) {
              document.getElementById("alerter").style.display = "none";
              document.getElementById("shocked-assistant").style.display =
                "none";
              burgerBtn.classList.remove("opened-btn");
              burgerBtn.classList.add("closed-btn");
              closeN("user-menu-display");
              getSchedule1(true);
            } else {
              document.getElementById("alerter").style.display = "none";
              document.getElementById("shocked-assistant").style.display =
                "none";
              burgerBtn.classList.remove("opened-btn");
              burgerBtn.classList.add("closed-btn");
              localStorage.setItem("userGroup", userGroup);
              closeN("user-menu-display");
              getSchedule1(true);
            }
          }
        });
    }, 5000);
  }
}

var Chat = document.querySelector(".chat");

assistant.addEventListener("click", function () {
  Chat.style.display = "flex";
  tg.BackButton.show();
  tg.BackButton.onClick(() => {
    Chat.style.display = "none";
    tg.BackButton.hide();
  });
});

window.addEventListener("DOMContentLoaded", function () {
  if (nowBtn) upsSV();
  Chat.style.display = "none";
  document.querySelector(".menu-display img").src =
    tg.initDataUnsafe.user.photo_url;
});

const Header = document.querySelector("header");
window.addEventListener("scroll", function () {
  if (tg.platform !== "tdesktop") {
    if (window.scrollY > 50) {
      setTimeout(function () {
        Header.classList.add("scrolling");
      }, 100);
    } else {
      setTimeout(function () {
        Header.classList.remove("scrolling");
      }, 100);
    }
  }
});

//beta
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function draw() {
  ctx.fillStyle = "rgba(250, 252, 255, 0.1)";
  ctx.beginPath();

  var numPoints = 400;

  for (var i = 0; i < numPoints; i++) {
    ctx.fillStyle = "rgba(250, 252, 255, " + Math.random() + ")";
    var x = Math.random() * canvas.width;
    var y = Math.random() * canvas.height;
    ctx.moveTo(x, y);
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
  }

  ctx.fill();
}
if (new Date().getHours() <= 7 || new Date().getHours() >= 20) {
  draw();
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

const savedTheme = localStorage.getItem("theme") || "standard";

if (savedTheme === "standard") {
  document.documentElement.setAttribute("data-theme", "standard");
}

if (savedTheme) {
  setTheme(savedTheme);
}

document.getElementById("themes-btn").addEventListener("click", function () {
  document.getElementById("black-bg").style.animation = "none";
  document.getElementById("black-bg").style.animation = "opq1 1s ease";
  document.getElementById("black-bg").style.display = "block";
  document.getElementById("black-bg").style.zIndex = "2002";
  openn("themes", "block");
});

document
  .querySelectorAll("#theme-container input[name='theme']")
  .forEach((radio) => {
    if (radio.id === savedTheme) {
      radio.checked = true;
    }
    radio.addEventListener("change", function () {
      console.log(this.id);
      if (this.checked) {
        setTheme(this.id);
        localStorage.setItem("theme", this.id);
      }
      setTimeout(() => {
        closee("themes");
        CloseBG2();
      }, 50);
    });
  });

const swipeDistance = 50;

function swipe(obj, rotation) {
  console.log("-"*25);
  console.log(obj);
  if (Math.abs(rotation) >= swipeDistance) {
    if (rotation < 0) {
      obj.style.transform = `translateX(-${window.innerWidth}px)`;
    } else {
      obj.style.transform = `translateX(${window.innerWidth}px)`;
    }
    setTimeout(function () {
      obj.style.display = "none";
      upsSV(obj, rotation < 0 ? 1 : -1);
      obj.style.transform = "";
    }, 300);
  } else {
    obj.style.transform = "";
  }
}
function attachDaySwipeEvents() {
  var e = document.getElementById("empty-container");
  if (!e) return;
  if (e.dataset.swipeAttached === "true") return;
  e.dataset.swipeAttached = "true";
  let sX = 0;

  e.addEventListener(
    "touchstart",
    (ev) => {
      sX = ev.touches[0].clientX;
    },
    { passive: true },
  );

  e.addEventListener(
    "touchend",
    (ev) => {
      const eX = ev.changedTouches[0].clientX;
      swipe(e, eX - sX);
    },
    { passive: true },
  );

  document.querySelectorAll(".day").forEach((day) => {
    if (day.dataset.swipeAttached === "true") return;
    day.dataset.swipeAttached = "true";

    let startX = 0;

    day.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true },
    );

    day.addEventListener(
      "touchend",
      (e) => {
        const endX = e.changedTouches[0].clientX;
        swipe(day, endX - startX);
      },
      { passive: true },
    );
  });
}

attachDaySwipeEvents();
