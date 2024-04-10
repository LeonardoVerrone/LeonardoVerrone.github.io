// sessione Pomodoro corrente, ha uno stato, i minuti di studio e di pausa, i secondi del
// timer corrente (di studio o di pausa), il numero di sessioni (studio + pausa) fatte fin'ora,
// e quelle che devono essere fatte
let session;

// input che ho selezionato, viene aggiornato quando ci clicco sopra
let selectedInput;

const padZero = (value) => value < 10? '0' + value : value; 

// crea una nuova sessione
const createNewSession = function(studyMinutes = 25, breakMinutes = 5, totalSessions = 3) {
  if (session?.timerId) {
    clearInterval(session.timerId);
  }
  session = {
    status: "idle",
    studyMinutes: studyMinutes,
    breakMinutes: breakMinutes,
    totalSessions: totalSessions,
    timerDuration: studyMinutes * 60,
    currentSession: 0
  };
  update();
};

/*
 * Funzione che fa progredire lo stato della sessione pomodoro
 * ("idle" -> "studying" -> "break" -> "studying" -> "break" -> ...)
 */
const sessionProgress = () => {

  // calcolo lo stato successivo in base all'attuale
  switch(session.status) {
    case "idle":
      if (session.totalSessions < 1) {  // per partire devo avere almeno una sessione
        createNewSession();
        break;
      }

      session.status = "studying";
      session.currentSession = 1;
      session.timerDuration = session.studyMinutes * 60;
      session.timerId = createInterval();
      break;
    case "studying":
      session.status = "break";
      session.timerDuration = session.breakMinutes * 60;
      session.timerId = createInterval();
      break;
    case "break":
      if ((++session.currentSession) > session.totalSessions) { // vero se ho completato le sessioni
        createNewSession();
        break;
      }

      session.status = "studying";
      session.timerDuration = session.studyMinutes * 60;
      session.timerId = createInterval();
      break;
  }


  addAnimationRules();
  resetAnimations();
  update();
};

/*
 * Creo un nuovo "timer" per lo stato corrente della sessione (timer di quanto ancora devo studiare, 
 * o di quanto ancora devo fare pausa)
 */
const createInterval = () => {
  if (session?.timerId) 
    clearInterval(session.timerId);
  return setInterval(() => {
    if ((--session.timerDuration) <= 0) {
      sessionProgress();
      return;
    }
    update();
  }, 1000);
};

/*
 * Update della view in base allo stato della sessione pomodoro
 */
const update = () => {
  updateInputs();
  updateSessionsCounter();
  updateMotivator();
  updateBlobStatus();
  updateClock();
  updateBtnText();
};

/*
 * Aggiorna i valori degli input di "Study time", "Break time", e "Pomodoro sessions"
 */
const updateInputs = () => {
  document.querySelectorAll("[data-timer-input]").forEach((item) => {
    switch(item.dataset.timerInput) {
      case "sessions":
        item.innerText = padZero(session.totalSessions);
        break;
      case "study":
        item.innerText = padZero(session.studyMinutes) + ":00";
        break;
      case "break":
        item.innerText = padZero(session.breakMinutes) + ":00";
        break;
    }
  });
};

/*
 * Aggiorna il counter delle sessioni
 */
const updateSessionsCounter = () => {
  if (session.status === "idle" || selectedInput?.dataset.timerInput === "sessions")
    document.querySelector("[data-timer-input='sessions']").innerText = padZero(session.totalSessions);
  else
    document.querySelector("[data-timer-input='sessions']").innerText = `${session.currentSession} / ${session.totalSessions}`;
};

/*
 * Aggiorna il testo visulizzata dal "motivatore"
 */
const updateMotivator = () => {
  let elem = document.getElementById("motivator");
  switch(session.status) {
  case "idle":
    elem.innerText = "Be productive with Pomodoro!";
    break;
  case "studying":
    elem.innerText = "Keep going, you're doing great!";
    break;
  case "break":
    elem.innerText = "You worked hard, take a break now :)";
    break;
  }
};

/*
 * Aggiorna lo stato del blob, non tocca direttamente le animazioni, ma i colori 
 * dei due "sottoblob"
 */
const updateBlobStatus = () => {
  document.querySelectorAll("[data-pom-status]").forEach((item) =>
    item.dataset.pomStatus = session.status
  );
};

/*
 * Aggiorna i minuti e secondi dell'orologio
 */
const updateClock = () => {
  let minutes = Math.floor(session.timerDuration / 60);
  let seconds = session.timerDuration - minutes * 60;
  document.getElementById("clock").innerText = padZero(minutes) + ":" + padZero(seconds); 
};

/*
 * Aggiorna il testo del pulsante "azione" 
 */
const updateBtnText = () => {
  let actionBtn = document.getElementById("action");
  if (session.status === "studying") 
    actionBtn.innerText = "Take a break";
  else 
    actionBtn.innerText = "Study";
};

/*
 * Aggiungo le regole per le animazioni sui ::before e ::after,
 * devo far così per impostare la durata della animazioni uguale a quella del timer
 */
const addAnimationRules = () => {
  // se presenti, rimuovo le animazioni precedenti
  document.querySelectorAll("style").forEach((item) => {
    item.parentNode.removeChild(item);
  });

  let style = document.createElement("style");
  style.innerHTML = `
    .blob[data-pom-status='${session.status}']::before {
      animation: rotate_fast ${session.timerDuration}s linear;
    }
  
    .blob[data-pom-status='${session.status}']::after {
      animation: rotate_slow ${session.timerDuration}s linear;
    }
  `;
  document.head.appendChild(style);
};

/*
 * Resetta le animazioni quando avviene un cambio di stato
 */
const resetAnimations = () => {
  let animations = document.querySelector(".blob").getAnimations({ subtree: true });
  if (animations.length == 0)
    addAnimationRules();

  // cancello le animazioni, aggiungo le nuove regole e poi le rifaccio partire
  animations.forEach((a) => a.cancel());
  addAnimationRules();
  animations.forEach((a) => a.play());
};


// creo una nuova sessione
createNewSession();

// eventi per l'input da tastiera su "Study time", "Break time", e "Pomodoro sessions"
document.addEventListener("keydown", (event) => {
  if (!selectedInput) 
    return;
  const keyName = event.key;
  if (keyName >= '0' && keyName <= '9') {
    minutes = selectedInput.innerText.trim().substring(0, 2);
    minutes = minutes * 10 + keyName % 10;
    minutes %= 100;
    switch(selectedInput.dataset.timerInput) {
    case "sessions":
      session.totalSessions = minutes;
      break;
    case "study":
      session.studyMinutes = minutes; 
      break;
    case "break":
      session.breakMinutes = minutes; 
      break;
    }
  } else if (keyName === "Enter" || keyName === "Escape") {
    selectedInput.blur();
    selectedInput = null;
  }
  createNewSession(session.studyMinutes, session.breakMinutes, session.totalSessions);
  update();
});

// Aggiungo gli eventi onclick agli input per capire su quale devo scrivere
document.querySelectorAll("*[data-timer-input]").forEach((item) => {
  item.setAttribute("tabindex", "0");
  item.addEventListener("click", () => {
    selectedInput = item;
    selectedInput.focus();
    if (item.getAttribute("data-timer-input") === "sessions") {
      item.addEventListener("blur", (e) => {
        item.innerText = padZero(session.totalSessions);
      });
    }
  });
  item.addEventListener("blur", (event) => selectedInput = null);
});

// con il click sul pulsante azione la sessione progredisce di stato
document.getElementById("action").addEventListener("click", () => {
  sessionProgress();
});
