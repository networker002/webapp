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

const btnMapping = {
  ПН: "Понедельник",
  ВТ: "Вторник",
  СР: "Среда",
  ЧТ: "Четверг",
  ПТ: "Пятница",
  СБ: "Суббота",
  ВС: "Воскресенье",
};

const btnRevMapping = {
  Понедельник: "ПН",
  Вторник: "ВТ",
  Среда: "СР",
  Четверг: "ЧТ",
  Пятница: "ПТ",
  Суббота: "СБ",
  Воскресенье: "ВС",
};

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

  btnAI.innerHTML = isActive ? "<b>ВКЛ</b>" : "<b>ВЫКЛ</b>";

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
const container = document.getElementById("schedule-wrapper");

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

              return fetch("https://boost.rorosin.ru/schedulejson", {
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
            loader.style.display = "none";
            loaderContainer.style.display = "none";
            assistant.style.display = "block";

            return resp.json();
          }
        })
        .then((data) => {
          if (data) {
            let newHTML = "";
            let dayType = data[0];
            for (const day of [
              "Понедельник",
              "Вторник",
              "Среда",
              "Четверг",
              "Пятница",
              "Суббота",
            ]) {
              const items = data[1][day];
              if (!items || items?.length === 0) {
                newHTML += `
                <div class="swiper-slide">
                  <div class="day" data-cleaned="true">
                    <h3 class="day-name">${day}</h3>
                    <div id="empty-container">
                      <div id="e-c">
                        <div class="empty-starry">
                          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                            <g filter="url(#filter0_i_1237_1706)">
                              <path d="M19.429 8.45209C22.6298 4.21389 28.996 4.21388 32.1968 8.45208L36.1942 13.745C37.1515 15.0125 38.4643 15.9663 39.9656 16.485L46.2347 18.6512C51.2546 20.3857 53.2219 26.4403 50.1802 30.7941L46.3816 36.2315C45.472 37.5336 44.9705 39.0769 44.9411 40.665L44.8182 47.2967C44.7199 52.6069 39.5695 56.3488 34.4888 54.8014L28.1437 52.869C26.6243 52.4062 25.0015 52.4062 23.4821 52.869L17.137 54.8014C12.0563 56.3488 6.9059 52.6069 6.8076 47.2967L6.6847 40.665C6.6553 39.0769 6.1538 37.5336 5.2442 36.2315L1.44558 30.7941C-1.59608 26.4403 0.371182 20.3857 5.3911 18.6512L11.6602 16.485C13.1615 15.9663 14.4743 15.0125 15.4315 13.745L19.429 8.45209Z" fill="url(#paint0_linear_1237_1706)"/>
                            </g>
                            <path d="M16.8125 33.5C19.5739 33.5 21.8125 31.2614 21.8125 28.5C21.8125 25.7386 19.5739 23.5 16.8125 23.5C14.0511 23.5 11.8125 25.7386 11.8125 28.5C11.8125 31.2614 14.0511 33.5 16.8125 33.5Z" fill="url(#paint1_linear_1237_1706)"/>
                            <path d="M34.8125 33.5C37.5739 33.5 39.8125 31.2614 39.8125 28.5C39.8125 25.7386 37.5739 23.5 34.8125 23.5C32.0511 23.5 29.8125 25.7386 29.8125 28.5C29.8125 31.2614 32.0511 33.5 34.8125 33.5Z" fill="url(#paint2_linear_1237_1706)"/>
                            <path d="M34.8125 32.5C37.0216 32.5 38.8125 30.7091 38.8125 28.5C38.8125 26.2909 37.0216 24.5 34.8125 24.5C32.6034 24.5 30.8125 26.2909 30.8125 28.5C30.8125 30.7091 32.6034 32.5 34.8125 32.5Z" fill="black"/>
                            <path d="M32.8125 28.5C33.9171 28.5 34.8125 27.6046 34.8125 26.5C34.8125 25.3954 33.9171 24.5 32.8125 24.5C31.7079 24.5 30.8125 25.3954 30.8125 26.5C30.8125 27.6046 31.7079 28.5 32.8125 28.5Z" fill="white"/>
                            <path d="M16.8125 32.5C19.0216 32.5 20.8125 30.7091 20.8125 28.5C20.8125 26.2909 19.0216 24.5 16.8125 24.5C14.6034 24.5 12.8125 26.2909 12.8125 28.5C12.8125 30.7091 14.6034 32.5 16.8125 32.5Z" fill="black"/>
                            <path d="M14.8125 28.5C15.9171 28.5 16.8125 27.6046 16.8125 26.5C16.8125 25.3954 15.9171 24.5 14.8125 24.5C13.7079 24.5 12.8125 25.3954 12.8125 26.5C12.8125 27.6046 13.7079 28.5 14.8125 28.5Z" fill="white"/>
                            <g filter="url(#filter1_i_1237_1706)">
                              <path d="M25.7753 43.7363H26.0194C27.3801 43.7363 28.6171 43.5963 29.7304 43.3163C30.8502 43.0299 31.83 42.6523 32.6698 42.1835C33.5162 41.7083 34.2193 41.1842 34.7792 40.6113C35.5464 39.8262 35.9467 39.044 36.166 37.9967C35.8368 38.4433 35.3902 38.8782 34.8261 39.3013C34.2697 39.7165 33.5802 40.0966 32.7575 40.4413C31.9347 40.7783 30.9709 41.0486 29.8662 41.2524C28.7613 41.4482 27.4959 41.5462 26.0698 41.5462H25.729C24.3029 41.5462 23.0374 41.4482 21.9327 41.2524C20.8278 41.0486 19.864 40.7783 19.0413 40.4413C18.2185 40.0966 17.5252 39.7165 16.961 39.3013C16.389 38.8782 15.9384 38.4433 15.6094 37.9967C15.8505 39.0386 16.2594 39.8275 17.0253 40.6113C17.5787 41.1842 18.2786 41.7083 19.1249 42.1835C19.9648 42.6523 20.9413 43.0299 22.0546 43.3163C23.1744 43.5963 24.4146 43.7363 25.7753 43.7363Z" fill="#996402" fill-opacity="0.49"/>
                            </g>
                            <path d="M33 61H61V33H33V61Z" fill="url(#pattern0_1237_1706)"/>
                            <defs>
                              <filter id="filter0_i_1237_1706" x="0" y="5.27344" width="55.625" height="58.8809" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dx="4" dy="9"/>
                                <feGaussianBlur stdDeviation="6.1"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.53 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1237_1706"/>
                              </filter>
                              <filter id="filter1_i_1237_1706" x="15.6094" y="37.9961" width="20.5547" height="6.44023" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                                <feOffset dy="1"/>
                                <feGaussianBlur stdDeviation="0.35"/>
                                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1237_1706"/>
                              </filter>
                                <pattern id="pattern0_1237_1706" patternContentUnits="objectBoundingBox" width="1" height="1">
                                <use xlink:href="#image0_1237_1706" transform="scale(0.00625)"/>
                              </pattern>
                              <linearGradient id="paint0_linear_1237_1706" x1="25.8129" y1="-0.000857353" x2="25.8129" y2="63.9991" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#FFC404"/>
                                <stop offset="1" stop-color="#996402"/>
                              </linearGradient>
                              <linearGradient id="paint1_linear_1237_1706" x1="16.8125" y1="23.5" x2="16.8125" y2="33.5" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#D8C3BD"/>
                                <stop offset="1" stop-color="#DBDBDB"/>
                              </linearGradient>
                              <linearGradient id="paint2_linear_1237_1706" x1="34.8125" y1="23.5" x2="34.8125" y2="33.5" gradientUnits="userSpaceOnUse">
                                <stop stop-color="#D8C3BD"/>
                                <stop offset="1" stop-color="#DBDBDB"/>
                              </linearGradient>
                              <image id="image0_1237_1706" width="160" height="160" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/>
                            </defs>
                            </svg>
                        </div>
                        <h1>Пусто</h1>
                      </div>
                    </div>
                  </div>
                </div>`;
              } else {
                newHTML += `<div class="swiper-slide"><div class="day"><h3 class="day-name">${day}</h3>`;

                items.forEach((item) => {
                  newHTML += `
                    <div class="lesson-row">
                      <h4 class="lesson">${item.time}</h4>
                      <h6 class="time">${data[2][item.time_code].toString().replace(",", " - ")}</h6>
                      <span class="subject">${item.subject}</span>
                      <span class="room">(${item.room})</span>
                      <div class="teacher"><h5 class="tname">${item.teacher}</h5></div>
                    </div>`;
                });

                newHTML += "</div></div>";
              }
            }
            container.innerHTML = newHTML;

            if (nowBtn) upsSV();
            const dayss = document.querySelectorAll(".day");
            dayss.forEach((DAY) => {
              var dayNAMES = DAY.querySelectorAll(".day-name");
              dayNAMES.forEach((dn) => {
                dn.innerHTML += ` <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE --><path fill="currentColor" d="M12 14q-.425 0-.712-.288T11 13t.288-.712T12 12t.713.288T13 13t-.288.713T12 14m-4.712-.288Q7 13.426 7 13t.288-.712T8 12t.713.288T9 13t-.288.713T8 14t-.712-.288M16 14q-.425 0-.712-.288T15 13t.288-.712T16 12t.713.288T17 13t-.288.713T16 14m-4 4q-.425 0-.712-.288T11 17t.288-.712T12 16t.713.288T13 17t-.288.713T12 18m-4.712-.288Q7 17.426 7 17t.288-.712T8 16t.713.288T9 17t-.288.713T8 18t-.712-.288M16 18q-.425 0-.712-.288T15 17t.288-.712T16 16t.713.288T17 17t-.288.713T16 18M5 22q-.825 0-1.412-.587T3 20V6q0-.825.588-1.412T5 4h1V2h2v2h8V2h2v2h1q.825 0 1.413.588T21 6v14q0 .825-.587 1.413T19 22zm0-2h14V10H5z"/></svg>`;
              });

              var rooms = DAY.querySelectorAll(".room");

              for (var i = 0; i < rooms.length; i++) {
                try {
                  if (
                    rooms[i].innerHTML.toString()[1] !==
                    rooms[i + 1].innerHTML.toString()[1]
                  ) {
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
            teacherHide();
            if (nowBtn) upsSV();
            initSwiper();
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
        initSwiper();
        if (!document.querySelectorAll(".day").length) {
          upsSV();
        }
      } else {
        getSchedule1(true);
      }
    }
  } else {
    document.getElementById("alerter").style.display = "block";

    document.getElementById("alerter").innerHTML =
      `<h1 style="color: #fff;">Неизвестный пользователь</h1>
      <h3>Вы еще не зарегистрировались в нашей системе!</h3>
      <h6>Давайте сделаем это сейчас:</h6>
      <h6 id="errs-reg" style="min-height: 1.5em;"></h6>
      <input type="text" maxlength="16" minlength="4" placeholder="Группа: " name="group-set" id="group-set"><br>
      <button type="submit" id="set-group-btn" onclick="groupSet0()">Готово</button>`;

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
  if (dayElement.classList.contains("empty")) {
    return;
  }

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

function upsSV() {
  if (!nowBtn) return;
  let found = false;
  var ch = false;
  lm = new Map();
  var DAYS = document.querySelectorAll(".day");
  DAYS.forEach((de) => {
    try {
      var dayName = de.querySelector(".day-name")?.textContent.trim();
    } catch {
      var dayName = de.querySelector(".day-name").textContent.trim();
    }
    var dayLesson = de.querySelector(".lesson");
    var dayLessons = de.querySelectorAll(".lesson");

    const currentDay = nowBtn?.innerHTML ? btnMapping[nowBtn.innerHTML] : null;
    if (!currentDay) return;

    if (dayName === currentDay) {
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
      ch = true;
    }

    if (!de.dataset.cleaned && !de.classList.contains("empty")) {
      cleanDaySchedule(de);
      de.dataset.cleaned = "true";
    }
  });
}

var btns = document.querySelectorAll(".btnD");
btns.forEach((btn, index) => {
  if (btn.innerHTML.startsWith(daysShort[n])) {
    btn.classList.add("selected");
    nowBtn = btn;
    s = true;
  }
  btn.addEventListener("click", function () {
    if (s) {
      nowBtn.classList.remove("selected");
    }
    btn.classList.add("selected");
    document.querySelector(".swiper").swiper.slideToLoop(index);
    nowBtn = btn;
    upsSV();
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
      
      if (message.style.display !== "none") {
        message.style.display = "none";
        setTimeout(function () {
          message.style.display = "block";
        }, 2000);
      }

      r += 360;
      if (updater) updater.style.transform = `rotate(${r}deg)`;
      
      var al = document.getElementById("fast-alert");
      if (al) {
        al.style.display = "flex";
        al.style.animation = "flyUP 2s normal";
        setTimeout(function () {
          al.style.display = "none";
        }, 1900);
      }

      document.body.style.pointerEvents = "none";
        getSchedule1(true);
    
      setTimeout(() => {
        document.body.style.pointerEvents = "all";
        upsSV();
      }, 2000);
      
      // try {
      //     initSwiper();
      // } catch (e) {
      //     console.warn(e);
      // }

      timeout = 5000;
      setTimeout(function () {
        timeout = 0;
      }, 5000);
   }
});


  //var burger = document.getElementById("burger-menu");
  // if (timeout === 0) {
  //   if (message.style.display === "block") {
    //     message.style.display = "none";
    //     setTimeout(function () {
      //       message.style.display = "block";
      //     }, 2000);
      //   }
  //   r += 360;
  //   updater.style.transform = `rotate(${r}deg)`;
  //   var al = document.getElementById("fast-alert");
  //   al.style.display = "flex";
  //   al.style.animation = "flyUP 2s normal";
  //   setTimeout(function () {
  //     al.style.display = "none";
  //   }, 1900);
  //   upsSV();


  //   document.querySelector(".swiper").swiper.realIndex = 0;

  //   timeout = 5000;
  //   setTimeout(function () {
  //     timeout = 0;
  //   }, 5000);
  // }

//burger.addEventListener("click", function() {
//    let menu;
//});

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
            <button style="background: var(--tg-theme-bg-color); color: var(--tg-theme-button-text-color); border: none; padding: 10px 20px; border-radius: 3em; letter-spacing: 0.1em; outline: none;" onclick="closeN('alerter', 'shocked-assistant')">Отмена</button>`;
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

function DelEvent(el, infoExtra={}) {
  const eventElement = el.parentElement;

  setTimeout(function () {
    eventElement.remove();

    //console.log("cleaned");
    //console.log(container.querySelector(el));

    try {
      var ls = localStorage.getItem("notes");
      if (ls && infoExtra) {
        try {
          var parsed = JSON.parse(ls);
          if (Array.isArray(parsed)) {
            var filtered = parsed.filter(function (n) {
              if (!n) return false;
              var match = true;
              if (infoExtra.title !== undefined) match = match && (n.title === infoExtra.title);
              if (infoExtra.time !== undefined) match = match && (n.time === infoExtra.time);
              if (infoExtra.description !== undefined) match = match && (n.description === infoExtra.description);
              return !match;
            });
            localStorage.setItem("notes", JSON.stringify(filtered));
          } else {
            if (typeof parsed === 'object' && parsed !== null) {
              var shouldRemove = true;
              if (infoExtra.title !== undefined) shouldRemove = shouldRemove && (parsed.title === infoExtra.title);
              if (infoExtra.time !== undefined) shouldRemove = shouldRemove && (parsed.time === infoExtra.time);
              if (infoExtra.description !== undefined) shouldRemove = shouldRemove && (parsed.description === infoExtra.description);
              if (shouldRemove) localStorage.removeItem("notes");
            }
          }
        } catch (e) {
          try {
            var parts = ls.split("<sep>").map(function (s) { return s.trim(); }).filter(Boolean);
            var newParts = parts.filter(function (item) {
              try {
                var obj = JSON.parse(item);
                var match = true;
                if (infoExtra.title !== undefined) match = match && (obj.title === infoExtra.title);
                if (infoExtra.time !== undefined) match = match && (obj.time === infoExtra.time);
                if (infoExtra.description !== undefined) match = match && (obj.description === infoExtra.description);
                return !match;
              } catch (_err) {
                return true;
              }
            });
            if (newParts.length === 0) localStorage.removeItem("notes");
            else localStorage.setItem("notes", newParts.join("<sep> "));
          } catch (_e) {}
        }
      }
    } catch {}

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
  

    var notesEx = localStorage.getItem("notes");
    var notes = [];
    if (notesEx) {
      try {
        var parsed = JSON.parse(notesEx);
        if (Array.isArray(parsed)) {
          notes = parsed;
        } else if (typeof parsed === "object" && parsed !== null && parsed.title) {
          notes = [parsed];
        }
      } catch (err) {
        notes = notesEx
          .split("<sep>")
          .map((item) => item.trim())
          .filter((item) => item)
          .map((item) => {
            try {
              return JSON.parse(item);
            } catch (_err) {
              return null;
            }
          })
          .filter((item) => item);
      }
    }

    let infoExtra = {
      title: TitleEvent,
      time: TimePeriodEvent,
      description: ExtraEvent,
    };

    notes.push(infoExtra);
    localStorage.setItem("notes", JSON.stringify(notes));

    sendExtra();

    if (!errR) {
    if (ExtraEvent) {
      UTeacher.innerHTML += `<div class="custom-events"><h4 style="letter-spacing: 1px; font-weight: 600;">${TitleEvent}</h4><span class="time1">${TimePeriodEvent}</span><h6 style="font-weight: 200; white-space: normal; overflow-wrap: anywhere; word-break: break-word; max-width: 80%;">${ExtraEvent}</h6><svg class="del-event" onclick='DelEvent(this, ${JSON.stringify(infoExtra)});' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" d="M2.75 6.167c0-.46.345-.834.771-.834h2.665c.529-.015.996-.378 1.176-.916l.03-.095l.115-.372c.07-.228.131-.427.217-.605c.338-.702.964-1.189 1.687-1.314c.184-.031.377-.031.6-.031h3.478c.223 0 .417 0 .6.031c.723.125 1.35.612 1.687 1.314c.086.178.147.377.217.605l.115.372l.03.095c.18.538.74.902 1.27.916h2.57c.427 0 .772.373.772.834S20.405 7 19.979 7H3.52c-.426 0-.771-.373-.771-.833M11.607 22h.787c2.707 0 4.06 0 4.941-.863c.88-.864.97-2.28 1.15-5.111l.26-4.081c.098-1.537.147-2.305-.295-2.792s-1.187-.487-2.679-.487H8.23c-1.491 0-2.237 0-2.679.487s-.392 1.255-.295 2.792l.26 4.08c.18 2.833.27 4.248 1.15 5.112S8.9 22 11.607 22"/></svg></div>`;
    } else {
      UTeacher.innerHTML += `<div class="custom-events"><h4 style="letter-spacing: 1px; font-weight: 600;">${TitleEvent}</h4><span class="time1">${TimePeriodEvent}</span><svg class="del-event" onclick='DelEvent(this, ${JSON.stringify(infoExtra)});' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" d="M2.75 6.167c0-.46.345-.834.771-.834h2.665c.529-.015.996-.378 1.176-.916l.03-.095l.115-.372c.07-.228.131-.427.217-.605c.338-.702.964-1.189 1.687-1.314c.184-.031.377-.031.6-.031h3.478c.223 0 .417 0 .6.031c.723.125 1.35.612 1.687 1.314c.086.178.147.377.217.605l.115.372l.03.095c.18.538.74.902 1.27.916h2.57c.427 0 .772.373.772.834S20.405 7 19.979 7H3.52c-.426 0-.771-.373-.771-.833M11.607 22h.787c2.707 0 4.06 0 4.941-.863c.88-.864.97-2.28 1.15-5.111l.26-4.081c.098-1.537.147-2.305-.295-2.792s-1.187-.487-2.679-.487H8.23c-1.491 0-2.237 0-2.679.487s-.392 1.255-.295 2.792l.26 4.08c.18 2.833.27 4.248 1.15 5.112S8.9 22 11.607 22"/></svg></div>`;
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
      </svg>`;

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

window.addEventListener("DOMContentLoaded", function () {
  upsSV();
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
  tg.BackButton.show(); tg.BackButton.onClick(function(){closee('themes');  tg.BackButton.hide()}); // + CloseBG2();
  // document.getElementById("black-bg").style.animation = "none";
  // document.getElementById("black-bg").style.animation = "opq1 1s ease";
  // document.getElementById("black-bg").style.display = "block";
  // document.getElementById("black-bg").style.zIndex = "2002";
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

function initSwiper() {

  const swiperContainer = document.querySelector(".swiper");

  if (swiperContainer && swiperContainer.swiper) {
    swiperContainer.swiper.destroy(true, true);
  }

  const swiper = new Swiper(".swiper", {
    direction: "horizontal",
    loop: true,
  });

  swiper.slideToLoop(n > 0 ? n - 1 : 0);
  swiper.on("slideChange", (e) => {
    btns.forEach((b) => {
      if (b.innerText.startsWith(btnRevMapping[days[swiper.realIndex + 1]])) {
      //if (b.innerText == btnRevMapping[days[swiper.realIndex + 1]]) {
        b.classList.add("selected");
      } else {
        b.classList.remove("selected");
      }
      nowBtn = b;
    });
  });
}

const ICON_ON_D = "M5 19q-.425 0-.712-.288T4 18t.288-.712T5 17h1v-7q0-2.075 1.25-3.687T10.5 4.2v-.7q0-.625.438-1.062T12 2t1.063.438T13.5 3.5v.7q2 .5 3.25 2.113T18 10v7h1q.425 0 .713.288T20 18t-.288.713T19 19zm7 3q-.825 0-1.412-.587T10 20h4q0 .825-.587 1.413T12 22M3 10q-.425 0-.712-.325t-.238-.75q.2-1.875 1.05-3.488t2.175-2.812q.325-.275.738-.25t.662.375t.2.75t-.375.7q-.975.925-1.6 2.15T4.075 9q-.05.425-.35.713T3 10m18 0q-.425 0-.725-.288T19.925 9q-.2-1.425-.825-2.65T17.5 4.2q-.325-.3-.375-.7t.2-.75t.663-.375t.737.25q1.325 1.2 2.175 2.812t1.05 3.488q.05.425-.237.75T21 10";
const ICON_OFF_D = "M16.15 19H5q-.425 0-.712-.288T4 18t.288-.712T5 17h1v-7q0-.825.213-1.625T6.85 6.85L10 10H7.2L2.1 4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l17 17q.275.275.288.688t-.288.712q-.275.275-.7.275t-.7-.275zM18 12.725q0 .3-.175.55t-.45.375t-.575.063t-.5-.263L9.175 6.325Q9 6.15 8.925 5.95t-.075-.425q0-.275.138-.537t.387-.388q.275-.125.55-.225T10.5 4.2v-.7q0-.625.438-1.062T12 2t1.063.438T13.5 3.5v.7q2 .5 3.25 2.125T18 10zM12 22q-.75 0-1.338-.413t-.587-1.112q0-.2.163-.337T10.6 20h2.8q.2 0 .363.138t.162.337q0 .7-.587 1.113T12 22";

function updateNotificationIcon(status) {
  const r = document.getElementById("notify-btn");
  const isActive = status === true || status === "TRUE";
  if (!r) return;
  const path = r.querySelector("path");
  if (!path) {
    const newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newPath.setAttribute("fill", "currentColor");
    r.appendChild(newPath);
  }
  const finalPath = r.querySelector("path");
  finalPath.setAttribute("d", isActive ? ICON_ON_D : ICON_OFF_D);
  r.style.color = isActive ? "#32CD32" : "#8B0000";
  r.style.width = "32px";
  r.style.height = "32px";
  r.style.transition = "color 0.15s ease";
}

function noti() {
  const authHeaders = { Authorization: tg.initData };

  fetch("https://boost.rorosin.ru/extra", { headers: authHeaders })
    .then((response) => {
      if (!response.ok) throw new Error("Error: " + response.status);
      return response.json();
    })
    .then((extraData) => {
      if (extraData) {
        updateNotificationIcon(extraData.notifications);
        if (extraData.theme_colors) applyTheme(extraData.theme_colors);
        if (extraData.notes.length > 0 && !localStorage.getItem("notes")) localStorage.setItem("notes", extraData.notes);
      }
    })
    .catch((error) => console.error("Error loading notifications:", error));
}

function toggleNotifications() {
  const authHeaders = { Authorization: tg.initData };

  fetch("https://boost.rorosin.ru/extra", { headers: authHeaders })
    .then((response) => {
      if (!response.ok) throw new Error("Error: " + response.status);
      return response.json();
    })
    .then((data) => {
      const currentStatus = data.notifications === true || data.notifications === "TRUE";
      const newStatus = !currentStatus;

      const formData = new URLSearchParams();
      formData.append("notifications", newStatus ? true : false);

      return fetch("https://boost.rorosin.ru/extra/notifications", {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
    })
    .then((response) => {
      if (!response.ok) throw new Error("Error: " + response.status);
      return response.json();
    })
    .then((result) => {
      updateNotificationIcon(result.notifications);
      haptic.notificationOccurred("success");
    })
    .catch((error) => {
      console.error("Error toggling notifications:", error);
      haptic.notificationOccurred("error");
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const notifyBtn = document.getElementById("notify-btn");
  if (notifyBtn) {
    notifyBtn.addEventListener("click", function () {
      haptic.notificationOccurred("success");
      toggleNotifications();
    });
  }
  noti();
});

// document.addEventListener("DOMContentLoaded", function() {
//   noti();
// });

document.getElementById("user-menu-display");

// window.addEventListener("DOMContentLoaded", initSwiper());

function sendExtra() {
  let notes = [];
  const notesRaw = localStorage.getItem("notes");
  if (notesRaw) {
    try {
      const parsedNotes = JSON.parse(notesRaw);
      if (Array.isArray(parsedNotes)) {
        notes = parsedNotes;
      } else if (parsedNotes && typeof parsedNotes === "object") {
        notes = [parsedNotes];
      }
    } catch (err) {
      notes = notesRaw
        .split("<sep>")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => {
          try {
            return JSON.parse(item);
          } catch (_err) {
            return null;
          }
        })
        .filter((item) => item !== null);
    }
  }

  let theme = [];
  try {
    theme = JSON.parse(localStorage.getItem("customThemeColors") || "[]") || [];
  } catch (err) {
    console.error("Failed to parse customThemeColors:", err);
    theme = [];
  }

  fetch("https://boost.rorosin.ru/extra/theme", {
    method: "POST",
    headers: {
      "Authorization": tg.initData,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notes,
      theme,
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Error: " + response.status);
      return response.json();
    })
    .then((status) => {
      if (status && status.status === true) {
        var al = document.getElementById("fast-alert");
        if (al) {
          al.outerHTML = `<div id="fast-alert"><h2>Обновлено!</h2></div>`;
          al.style.display = "flex";
          al.style.animation = "flyUP 2s normal";
          setTimeout(function () {
            al.style.display = "none";
            al.outerHTML = `<div id="fast-alert"><h2>Обновляем данные</h2></div>`;
          }, 1900);
        }
      }
    })

  .catch((error) => {
      console.error("Error toggling notifications:", error);
      haptic.notificationOccurred("error");
    });
}


// function showFastAlert0(text) {
//   var al = document.getElementById("fast-alert");
//         if (al) {
//           al.outerHTML = `<div id="fast-alert"><h2>${text}</h2></div>`;
//           al.style.display = "flex";
//           al.style.animation = "flyUP 2s normal";
//           setTimeout(function () {
//             al.style.display = "none";
//             al.outerHTML = `<div id="fast-alert"><h2>Обновляем данные</h2></div>`;
//           }, 1900);
//         }
// }

window.addEventListener("DOMContentLoaded", function() {
  if (localStorage.getItem("notes")) {
    stopAll();
    message.style.display = "block";
    message.innerHTML = `<h2 style='color: yellow;'>Напоминаю!</h2><p>У тебя есть заметки на предметы</p><div class="msg-btn12"><button class="my-def-btns" style="background: var(--tg-theme-destructive-text-color) !important" onclick="message.style.display = 'none';assistant.style.transform = 'translate(0)';message.parentElement.style.transform = 'translate(0)'; localStorage.removeItem('notes'); sendExtra(); updater.click();">Очистить все</button><button onclick="message.style.display = 'none';assistant.style.transform = 'translate(0)';message.parentElement.style.transform = 'translate(0)';" class="my-def-btns">Закрыть</button></div>`

    setTimeout(() => {
      message.parentElement.style.transform = "translate(0)";
      message.innerHTML = "";
      message.style.display = "none";
    }, 7500);
  }
});

function applyTheme(colors) {
        document.body.setAttribute('data-theme', 'custom');
        const root = document.documentElement.style;
        
        root.setProperty('--tg-theme-bg-color', colors[0]);
        root.setProperty('--tg-theme-header-bg-color', colors[0]);
        root.setProperty('--tg-theme-secondary-bg-color', colors[1]);
        root.setProperty('--tg-theme-accent-text-color', colors[2]);
        root.setProperty('--tg-theme-button-color', colors[2]);

        root.setProperty('--main-bg-color', colors[0]);
        root.setProperty('--header-bg-color', colors[0]);
        root.setProperty('--header-glass', colors[0] + '80');
        root.setProperty('--accent-bg', colors[1]);
        root.setProperty('--days-bg', colors[1]);
        root.setProperty('--day-card-bg', colors[1]);
        root.setProperty('--accent', colors[2]);
        root.setProperty('--alert-bg', colors[2]);
        root.setProperty('--room-green', colors[2]);
        root.setProperty('--lst-btn-color', colors[2]);
        root.setProperty('--days-selected-bg', colors[2]);
    }

document.addEventListener('DOMContentLoaded', () => {
    const slots = document.querySelectorAll('.color-slot');
    const colorValue = document.getElementById('colorValue');
    const colorLabel = document.getElementById('colorLabel');
    const resetBtn = document.querySelector('.buttons-cont1 button:first-child');
    const saveBtn = document.getElementById('saveColorsBtn');

    const tg = window.Telegram?.WebApp;
    const tgTheme = tg?.themeParams || {};

    const defaultColors = [
        tgTheme.bg_color || '#171F30',
        tgTheme.secondary_bg_color || '#242F43',
        tgTheme.button_color || '#3390ec'
    ];

    let colorsData = JSON.parse(localStorage.getItem('customThemeColors')) || [...defaultColors];
    let activeIndex = 0;
    const typeNames = ["Основной цвет", "Вторичный цвет", "Акцентный цвет"];

    const colorPicker = new iro.ColorPicker("#colorPicker", {
        width: 260,
        color: colorsData[activeIndex],
        borderWidth: 1,
        borderColor: "#fff",
        handleSvg: '#handle',
        handleProps: { x: -8, y: -20 },
        layout: [
            { component: iro.ui.Wheel },
            { component: iro.ui.Slider, options: { sliderType: 'value' } }
        ]
    });


    

    function initSlots() {
        slots.forEach((slot, index) => {
            slot.style.backgroundColor = colorsData[index];
        });
        colorValue.value = colorsData[activeIndex];
    }

    colorPicker.on(['color:init', 'color:change'], function(color) {
        const hex = color.hexString.toUpperCase();
        colorsData[activeIndex] = hex;
        slots[activeIndex].style.backgroundColor = hex;
        colorValue.value = hex;
    });

    saveBtn.addEventListener('click', () => {
        applyTheme(colorsData);
        localStorage.setItem('customThemeColors', JSON.stringify(colorsData));
        if (typeof closee === 'function') closee('themes');
        //if (typeof CloseBG2 === 'function') CloseBG2();
        tg.BackButton.hide();
        sendExtra();
    });

    resetBtn.textContent = "Сбросить";
    resetBtn.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem('customThemeColors');
        colorsData = [...defaultColors];

        document.body.removeAttribute('data-theme');
        const root = document.documentElement.style;
        
        root.removeProperty('--tg-theme-bg-color');
        root.removeProperty('--tg-theme-header-bg-color');
        root.removeProperty('--tg-theme-secondary-bg-color');
        root.removeProperty('--tg-theme-accent-text-color');
        root.removeProperty('--tg-theme-button-color');

        root.removeProperty('--main-bg-color');
        root.removeProperty('--header-bg-color');
        root.removeProperty('--header-glass');
        root.removeProperty('--accent-bg');
        root.removeProperty('--days-bg');
        root.removeProperty('--day-card-bg');
        root.removeProperty('--accent');
        root.removeProperty('--alert-bg');
        root.removeProperty('--room-green');
        root.removeProperty('--lst-btn-color');
        root.removeProperty('--days-selected-bg');

        colorPicker.color.set(colorsData[activeIndex]);
        initSlots();
        applyTheme(colorsData);
        if (typeof closee === 'function') closee('themes');
        if (typeof CloseBG2 === 'function') CloseBG2();
    };

    slots.forEach(slot => {
        slot.addEventListener('click', () => {
            slots.forEach(s => s.classList.remove('active'));
            slot.classList.add('active');
            activeIndex = parseInt(slot.dataset.index);
            colorLabel.textContent = typeNames[activeIndex];
            colorPicker.color.set(colorsData[activeIndex]);
        });
    });

    if (localStorage.getItem('customThemeColors')) {
        applyTheme(colorsData);
    }

    if (tg) tg.expand();
    initSlots();
});
