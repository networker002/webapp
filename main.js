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
      fetch("https://boost.rorosin.ru/group/" + userId)
        //fetch("http://127.0.0.1:8000/group/" + userId)
        .then((response) => {
          if (!response.ok) throw new Error("Error: " + response.status);
          return response.json();
        })
        .then((userGroup) => {
          var Group = userGroup.group_name;

          if (!Group || Group.toUpperCase() === "NULL") {
            document.getElementById("alerter").style.display = "block";
            Group = "Не указана";
            throw new Error("Group not found!");
          }
          if (localStorage.getItem("userGroup") !== Group) {
            localStorage.setItem("userGroup", Group);
          }
          document.getElementById("gr").innerHTML = Group;
          document.getElementById("group-name-menu").innerHTML = Group;

          return fetch("https://boost.rorosin.ru/schedule/" + Group);
          //return fetch("http://127.0.0.1:8000/schedule/" + Group);
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
        loader.style.display = "none";
        loaderContainer.style.display = "none";
        assistant.style.display = "block";
        var Group = localStorage.getItem("userGroup");
        teacherHide();
        dayParseOnline();

        if (Group) {
          document.getElementById("gr").innerHTML = Group;
          document.getElementById("group-name-menu").innerHTML = Group;
        } else if (!Group) {
          getSchedule1(true);
        }
      } else if (Date.now() - dataLastUpd >= ttl) {
        getSchedule1(true);
      }

      if (!cachedData && !reqNeed) {
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
                <h5 class="teacher">${l.teacher}</h5>
            </div>
        `;
  });

  dayElement.innerHTML = newHTML;

  teacherHide(dayElement);
}

function teacherHide(element = document) {
  var btnsList = element.querySelectorAll(".list-btn");
  btnsList.forEach((btnX) => {
    btnX.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="currentColor" d="M17 3.34A10 10 0 1 1 2 12l.005-.324A10 10 0 0 1 17 3.34m-4.293 5.953a1 1 0 0 0-1.414 0l-3 3A1 1 0 0 0 9 14h6c.217 0 .433-.07.613-.21l.094-.083a1 1 0 0 0 0-1.414z"/></svg>`;
    btnX.parentElement.querySelector(".teacher").style.display = "none";
    let shown = false;
    let added = false;
    btnX.addEventListener("click", function () {
      if (!shown) {
        btnX.parentElement.querySelector(".teacher").style.display = "block";

        if (!added) {
          var test = btnX.parentElement.querySelector(".room").innerHTML;
          if (test) {
            if (
              btnX.parentElement.querySelector(".room").style.color === "yellow"
            ) {
              if (!localStorage.getItem("roomShown")) {
                localStorage.setItem("roomShown", false);
              }
              if (localStorage.getItem("roomShown") === "false") {
                var message = document.getElementById("ctx-assistant-say");
                stopAll();
                message.style.display = "block";
                message.innerHTML = `<h4 style="font-weight: 500;">В промежутке между парами <span style="color: #fff41fed;">вам придётся менять корпуса!</span> <span style="font-weight:600;">Будьте внимательны</span></h4><div style="text-align: right;"><button onclick="hideRoomShown()" style="padding: 5px 10px; border-radius: 24px; border: none; background: var(--accent-bg); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);">ОК</button></div>`;
                setTimeout(function () {
                  message.style.display = "none";
                }, 10000);
              }
            }
            if (test.length < 7) {
              test = test.replace(/[()]/g, "");
              let corpus = Number(test[0]);
              let floor = Number(test[1]);
              let room = Number(test.slice(2, 4));
              btnX.parentElement.querySelector(".teacher").innerHTML +=
                `<h5 style="color: var(--room-green); padding-top: .3em; font-weight: 500;">Корпус: ${corpus} │ этаж: ${floor} │ аудитория: ${room}</h5>`;
              added = true;
            } else if (test.length > 6 && test[1] !== "Н") {
              tests = test.split("/", 2);
              tests.forEach((test) => {
                test = test.replace(/[()]/g, "");
                let corpus = Number(test[0]);
                let floor = Number(test[1]);
                let room = Number(test.slice(2, 4));
                btnX.parentElement.querySelector(".teacher").innerHTML +=
                  `<h5 style="color: var(--room-green); padding-top: .3em; font-weight: 500;">Корпус: ${corpus} │ этаж: ${floor} │ аудитория: ${room}</h5>`;
                added = true;
              });
            }
          }
          if (btnX.parentElement.querySelector(".time.now")) {
            btnX.parentElement
              .querySelector(".time.now")
              .parentElement.querySelector(".teacher").innerHTML +=
              `<h4 style="padding-top: .2em; color: #46ff15dd" class="isNow">Сейчас идет</h4>`;
          }
        }

        btnX.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="currentColor" d="M17 3.34A10 10 0 1 1 2 12l.005-.324A10 10 0 0 1 17 3.34M15 10H9a1 1 0 0 0-.708 1.707l3 3a1 1 0 0 0 1.415 0l3-3a1 1 0 0 0 0-1.414l-.094-.083A1 1 0 0 0 15 10"/></svg>`;
        shown = true;
      } else {
        btnX.parentElement.querySelector(".teacher").style.display = "none";

        btnX.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="currentColor" d="M17 3.34A10 10 0 1 1 2 12l.005-.324A10 10 0 0 1 17 3.34m-4.293 5.953a1 1 0 0 0-1.414 0l-3 3A1 1 0 0 0 9 14h6c.217 0 .433-.07.613-.21l.094-.083a1 1 0 0 0 0-1.414z"/></svg>`;
        shown = false;
      }
    });
  });
}

function hideRoomShown() {
  var message = document.getElementById("ctx-assistant-say");
  message.style.display = "none";
  var roomShown = true;
  localStorage.setItem("roomShown", roomShown);
}

let rr = true;
let clickedAi = false;

function upsSV() {
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

    if (dayName === btnMapping[nowBtn.innerHTML]) {
      de.style.display = "block";
      found = true;
      ch = false;
      lm.set(de, ch);
      document.getElementById("empty-container").style.display = "none";
      if (dayName === days[n]) {
        dayParseOnline();
      }

      if (dayName === days[tommorrow.getDay()] && rr) {
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
    getSchedule1(true);

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

function openGroupChangeModal() {
  document.getElementById("alerter").style.display = "block";
  document.getElementById("alerter").style.animation = "OpenObj .5s ease";
  document.getElementById("shocked-assistant").style.display = "block";
  document.getElementById("shocked-assistant").style.animation = "OpenObj .5s ease, opq1 1s ease-in";
  document.getElementById("alerter").innerHTML = `<h1>Смена группы</h1>
            <h3>Обновление данных</h3>
            <h6>Давайте сделаем это сейчас:</h6>
            <h6 id="errs-reg" style="min-height: 1.5em;"></h6>
            <input type="text" maxlength="16" minlength="4" placeholder="Группа: " name="group-set" id="group-set"><br>
            <button type="submit" id="set-group-btn" onclick="groupSet0()">Готово</button><br>
            <button style="background: rgba(255, 255, 255, 0.2); color: var(--text-color); border: none; padding: 10px 20px; border-radius: 3em; letter-spacing: 0.1em;" onclick="closeN('alerter', 'shocked-assistant')">Отмена</button>`;
  
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

function applyTheme(theme) {
  const root = document.documentElement;
  const themeNameDisplay = document.getElementById("d-s-t");
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

const darkRadio = document.getElementById("dark-theme");
const lightRadio = document.getElementById("light-theme");

darkRadio.addEventListener("change", function () {
  if (this.checked) {
    applyTheme("dark");
    haptic.notificationOccurred("success");
  }
});
lightRadio.addEventListener("change", function () {
  if (this.checked) {
    applyTheme("light");
    haptic.notificationOccurred("success");
  }
});

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
  23: "150%"
}
  const d2 = new Date();
  const hours = d2.getHours();
  const dayType = d2.getDay();
  if (dayType === 0 || dayType === 6 || dayType === 7) {
    document.querySelector(":root").style.setProperty("--star-background-day", dayPeriodMapping[hours] || "0");
  }
  console.log(dayPeriodMapping[hours]);
  

  try {
    if (tg.isFullscreen && tg.device.isDesktop) {
      tg.exitFullscreen();
    }
    if (tg.device.isMobile && !tg.isFullscreen) {
      tg.enterFullscreen();
      document.querySelector("header").style.paddingTop = "4em";
    }
  } catch {}
  const savedTheme = localStorage.getItem("theme") || "dark";
  if (savedTheme == "light") {
    lightRadio.checked = true;
    applyTheme("light");
  } else {
    darkRadio.checked = true;
    applyTheme("dark");
  }
  if (nowBtn) upsSV();
});

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
  console.log(D);
  var erDisplay = document.getElementById("errs-reg");
  erDisplay.style = "font-weight:600;color:red";
  if (D.length < 4 || D.length > 13) {
    erDisplay.innerHTML = "Имя группы должно быть другой длины";
    haptic.notificationOccurred("error");
    document.getElementById("shocked-assistant").innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      document.getElementById("shocked-assistant").innerHTML = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      fetch("https://boost.rorosin.ru/group/" + userId)
        .then((response) => {
          if (!response.ok) throw new Error("Error: " + response.status);
          return response.json();
        })
        .then((userGroup) => {
          var Group = userGroup.group_name;
          if (localStorage.getItem("userGroup")) {
            if (localStorage.getItem("userGroup") !== Group) {
              document.getElementById("alerter").style.display = "none";
              document.getElementById("shocked-assistant").style.display = "none";
                burgerBtn.classList.remove("opened-btn");
                burgerBtn.classList.add("closed-btn");
              closeN("user-menu-display");
              getSchedule1(true);
            } else {
              document.getElementById("alerter").style.display = "none";
              document.getElementById("shocked-assistant").style.display = "none";
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

var CloseChatButton = document.querySelector(".chat-header svg");
var Chat = document.querySelector(".chat");

CloseChatButton.addEventListener("click", function() {
    Chat.style.display = "none";
});


assistant.addEventListener("click", function() {
    Chat.style.display = "flex";
});

window.addEventListener("DOMContentLoaded", function() {
    Chat.style.display = "none";
});


const Header = document.querySelector("header");
window.addEventListener("scroll", function () {
  if (window.scrollY > 50) {
    setTimeout(function () {
      Header.classList.add("scrolling");
    }, 100);
  } else {
    setTimeout(function () {
      Header.classList.remove("scrolling");
    }, 100);
  }
});
