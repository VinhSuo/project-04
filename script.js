const gameArea = document.getElementById("gameArea");
const scoreElement = document.getElementById("score");
const timeElement = document.getElementById("time");
const cleanlinessText = document.getElementById("cleanlinessText");
const progressBar = document.getElementById("progressBar");
const realClockElement = document.getElementById("realClock");
const cstDateElement = document.getElementById("cstDate");
const feedback = document.getElementById("feedback");
const statusElement = document.getElementById("status");
const summary = document.getElementById("summary");
const summaryText = document.getElementById("summaryText");

const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const replayButton = document.getElementById("replayButton");
const soundButton = document.getElementById("soundButton");
const bgCycleButton = document.getElementById("bgCycleButton");
const difficultySelect = document.getElementById("difficultySelect");

let score = 0;
let cleanliness = 100;
let timeLeft = 30;
let running = false;
let paused = false;
let soundOn = true;
let gameTimer = null;
let litterTimer = null;
let movementTimer = null;
let litterItems = [];
let bestScore = Number(localStorage.getItem("changerBestScore") || 0);

const litterTypes = [
  { icon: "🥤", label: "plastic cup" },
  { icon: "🛍️", label: "plastic bag" },
  { icon: "🧴", label: "bottle" },
  { icon: "🧻", label: "waste" },
  { icon: "🥫", label: "can" }
];

const difficultySettings = {
  easy: {spawnInterval: 1800, minSpeed: 0.25, speedRange: 0.2},
  medium: {spawnInterval: 1200, minSpeed :0.4, speedRange: 0.35},
  hard: { spawnInterval: 700, minSpeed: 0.7, speedRange:0.35},
};
let activeDifficulty = difficultySettings[difficultySelect.value];

function updateDashboard() {
  scoreElement.textContent = score;
  timeElement.textContent = timeLeft;
  cleanlinessText.textContent = `${cleanliness}%`;
  progressBar.style.width = `${cleanliness}%`;

  if (cleanliness > 60) {
    progressBar.style.background = "var(--green)";
  } else if (cleanliness > 30) {
    progressBar.style.background = "var(--yellow)";
  } else {
    progressBar.style.background = "var(--red)";
  }
}

function updateCSTClock() {
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  realClockElement.textContent = timeFormatter.format(now);
  cstDateElement.textContent = dateFormatter.format(now);
}

function setFeedback(message, type = "") {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

function playBeep(frequency = 600) {
  if (!soundOn) return;

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.value = 0.04;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch {
    // Sound is optional, so the game continues if audio is unavailable.
  }
}

function clearLitter() {
  litterItems.forEach(item => item.element.remove());
  litterItems = [];
}

function createLitter() {
  if (!running || paused) return;

  const type = litterTypes[
    Math.floor(Math.random() * litterTypes.length)
  ];

  const element = document.createElement("button");
  element.className = "litter";
  element.type = "button";
  element.textContent = type.icon;
  element.setAttribute("aria-label", `Remove ${type.label}`);

  const topPosition = 42 + Math.random() * 25;
  const startPosition = 8 + Math.random() * 10;

  element.style.left = `${startPosition}%`;
  element.style.top = `${topPosition}%`;

  const item = {
    element,
    position: startPosition,
    speed: activeDifficulty.minSpeed + Math.random() * activeDifficulty.speedRange
  };

  element.addEventListener("click", () => collectLitter(item));

  gameArea.appendChild(element);
  litterItems.push(item);
}

function collectLitter(item) {
  if (!running || paused) return;

  item.element.remove();
  litterItems = litterItems.filter(current => current !== item);

  score += 10;
  cleanliness = Math.min(100, cleanliness + 3);

  setFeedback("Great job. You protected the water source.", "good");
  playBeep(760);
  updateDashboard();
}

function moveLitter() {
  if (!running || paused) return;

  litterItems.forEach(item => {
    item.position += item.speed;
    item.element.style.left = `${item.position}%`;

    if (item.position > 94) {
      item.element.remove();
      litterItems = litterItems.filter(current => current !== item);

      cleanliness = Math.max(0, cleanliness - 8);
      setFeedback("A piece of litter reached the water. Keep watching.", "bad");
      playBeep(220);
      updateDashboard();
    }
  });
}

function startGame() {
  clearLitter();

  activeDifficulty = difficultySettings[difficultySelect.value];
  score = 0;
  cleanliness = 100;
  timeLeft = 30;
  running = true;
  paused = false;

  summary.classList.remove("visible");
  startButton.disabled = true;
  difficultySelect.disabled = true;
  pauseButton.disabled = false;
  pauseButton.textContent = "Pause";
  statusElement.textContent = "Playing";

  setFeedback("The cleanup has started. Keep the river clear.");
  updateDashboard();

  gameTimer = setInterval(() => {
    if (!paused) {
      timeLeft -= 1;
      updateDashboard();

      if (timeLeft <= 0) {
        endGame();
      }
    }
  }, 1000);

  litterTimer = setInterval(createLitter, activeDifficulty.spawnInterval);
  movementTimer = setInterval(moveLitter, 100);
}

function togglePause() {
  if (!running) return;

  paused = !paused;
  pauseButton.textContent = paused ? "Resume" : "Pause";
  statusElement.textContent = paused ? "Paused" : "Playing";

  setFeedback(
    paused
      ? "Game paused. Resume when you are ready."
      : "The cleanup continues."
  );
}

function endGame() {
  running = false;
  paused = false;

  clearInterval(gameTimer);
  clearInterval(litterTimer);
  clearInterval(movementTimer);

  gameTimer = null;
  litterTimer = null;
  movementTimer = null;

  clearLitter();

  startButton.disabled = false;
  difficultySelect.disabled = false;
  pauseButton.disabled = true;
  pauseButton.textContent = "Pause";
  statusElement.textContent = "Finished";

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("changerBestScore", bestScore);
  }

  summaryText.textContent =
    `You earned ${score} points and finished with ${cleanliness}% water cleanliness. ` +
    `Preventing litter and protecting water sources helps communities access safer water. ` +
    `Your best score is ${bestScore}.`;

  summary.classList.add("visible");
  setFeedback("Round complete. Every cleanup action makes a difference.", "good");
}

function restartGame() {
  clearInterval(gameTimer);
  clearInterval(litterTimer);
  clearInterval(movementTimer);

  gameTimer = null;
  litterTimer = null;
  movementTimer = null;

  clearLitter();

  running = false;
  paused = false;
  score = 0;
  cleanliness = 100;
  timeLeft = 30;

  startButton.disabled = false;
  difficultySelect.disabled = false;
  pauseButton.disabled = true;
  pauseButton.textContent = "Pause";
  statusElement.textContent = "Ready";
  summary.classList.remove("visible");

  setFeedback("Press Start when you are ready to protect the water.");
  updateDashboard();
}

function toggleSound() {
  soundOn = !soundOn;
  soundButton.textContent = `Sound: ${soundOn ? "On" : "Off"}`;
  soundButton.setAttribute("aria-pressed", String(soundOn));
}

const presetBackgrounds = [
  { label: "Default", url: "" },
  { label: "London River", url: "storage/Boats-River-Thames-London-Tower-Bridge.webp" },
  { label: "Venice", url: "storage/venice2-ap-ml-230530_1685455543825_hpEmbed_3x2.avif" },
  { label: "Mekong River", url: "storage/images.jpg" }
];

let backgroundIndex = 0;

function applyBackgroundImage(url) {
  const overlay = "linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.18))";

  if (!url) {
    document.body.style.setProperty("--page-bg", "var(--soft-gray)");
    return;
  }

  document.body.style.setProperty(
    "--page-bg",
    `${overlay}, url('${url}') center/cover no-repeat fixed`
  );
}

function cycleBackground() {
  backgroundIndex = (backgroundIndex + 1) % presetBackgrounds.length;
  const current = presetBackgrounds[backgroundIndex];
  bgCycleButton.textContent = `Location: ${current.label}`;
  applyBackgroundImage(current.url);
}

bgCycleButton.addEventListener("click", cycleBackground);

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartGame);
replayButton.addEventListener("click", startGame);
soundButton.addEventListener("click", toggleSound);

updateDashboard();
updateCSTClock();
setInterval(updateCSTClock, 1000);
