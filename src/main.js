const DATA_URL = "data/escape-room.json";
const STORAGE_KEY = "verborgenRepubliekProgress";

const state = {
  game: null,
  currentRoom: 0,
  completedCodes: [],
  won: false,
};

const ui = {};

document.addEventListener("DOMContentLoaded", initGame);

async function initGame() {
  bindElements();
  bindEvents();

  try {
    state.game = await fetchJson(DATA_URL);
    restoreProgress();
    renderShell();
    renderStartScreen();
    if (window.location.hash === "#docent") openTeacherSheet();
  } catch (error) {
    ui.gameView.textContent = "De game kon niet worden geladen: " + error.message;
  }
}

function bindElements() {
  ui.gameTitle = document.querySelector("#gameTitle");
  ui.metaText = document.querySelector("#metaText");
  ui.subtitle = document.querySelector("#subtitle");
  ui.missionText = document.querySelector("#missionText");
  ui.progressTrack = document.querySelector("#progressTrack");
  ui.progressFill = document.querySelector("#progressFill");
  ui.progressText = document.querySelector("#progressText");
  ui.energyFill = document.querySelector("#energyFill");
  ui.roomList = document.querySelector("#roomList");
  ui.inventoryText = document.querySelector("#inventoryText");
  ui.codeFragments = document.querySelector("#codeFragments");
  ui.gameView = document.querySelector("#gameView");
  ui.glossaryButton = document.querySelector("#glossaryButton");
  ui.teacherButton = document.querySelector("#teacherButton");
  ui.resetButton = document.querySelector("#resetButton");
  ui.modal = document.querySelector("#modal");
  ui.modalTitle = document.querySelector("#modalTitle");
  ui.modalContent = document.querySelector("#modalContent");
  ui.modalClose = document.querySelector("#modalClose");
}

function bindEvents() {
  ui.glossaryButton.addEventListener("click", openGlossary);
  ui.teacherButton.addEventListener("click", openTeacherSheet);
  ui.resetButton.addEventListener("click", resetProgress);
  ui.modalClose.addEventListener("click", closeModal);
  ui.modal.addEventListener("click", (event) => {
    if (event.target === ui.modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });
  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#docent") openTeacherSheet();
  });
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Kan ${url} niet laden.`);
  return response.json();
}

function restoreProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const validCodes = state.game.rooms.map((room) => room.code);
    state.completedCodes = Array.isArray(saved.completedCodes)
      ? saved.completedCodes.filter((code) => validCodes.includes(code))
      : [];
    state.currentRoom = Math.max(clamp(saved.currentRoom, 0, state.game.rooms.length), firstOpenRoomIndex());
  } catch {
    state.currentRoom = 0;
    state.completedCodes = [];
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    currentRoom: state.currentRoom,
    completedCodes: state.completedCodes,
  }));
}

function resetProgress() {
  if (!window.confirm("Weet je zeker dat je de voortgang wilt wissen?")) return;
  state.currentRoom = 0;
  state.completedCodes = [];
  state.won = false;
  saveProgress();
  renderShell();
  renderStartScreen();
}

function renderShell() {
  const game = state.game;
  document.title = game.title;
  ui.gameTitle.textContent = game.title;
  ui.metaText.textContent = `${game.subject} - ${game.audience}`;
  ui.subtitle.textContent = `${game.subtitle} ${game.chapter}.`;
  ui.missionText.textContent = game.mission;
  renderProgress();
  renderRoomList();
  renderCodes();
}

function renderProgress() {
  const total = state.game.rooms.length;
  const completed = state.completedCodes.length;
  const percentage = Math.round((completed / total) * 100);
  ui.progressFill.style.width = `${percentage}%`;
  ui.progressText.textContent = `${completed} van ${total} kamers opgelost.`;
  ui.progressTrack.setAttribute("aria-valuemax", String(total));
  ui.progressTrack.setAttribute("aria-valuenow", String(completed));
  ui.energyFill.style.width = state.won ? "100%" : `${Math.max(70, 100 - completed * 6)}%`;
}

function renderRoomList() {
  ui.roomList.innerHTML = "";
  state.game.rooms.forEach((room, index) => {
    const status = roomStatus(room, index);
    const item = el("li", `room-step ${status}`);
    const label = document.createElement("span");
    label.append(
      el("strong", "", `${roomIcon(index)} ${room.name}`),
      el("span", "step-topic", room.subject),
      el("span", `status-pill ${status}`, statusLabel(status, room.code))
    );
    item.append(el("span", "step-number", hasCode(room.code) ? "✓" : String(index + 1)), label);
    ui.roomList.append(item);
  });
}

function renderCodes() {
  ui.codeFragments.innerHTML = "";
  ui.inventoryText.textContent = state.completedCodes.length
    ? `${state.completedCodes.length} code${state.completedCodes.length === 1 ? "" : "s"} in je inventaris.`
    : "Nog geen codes verzameld.";
  state.game.rooms.forEach((room, index) => {
    const slot = el("span", `fragment${hasCode(room.code) ? "" : " locked"}`);
    slot.append(el("span", "", `K${index + 1}`), el("strong", "", hasCode(room.code) ? room.code : "?"));
    ui.codeFragments.append(slot);
  });
}

function renderStartScreen() {
  ui.gameView.innerHTML = "";
  const intro = el("section", "start-intro");
  const copy = el("div");
  copy.append(
    el("p", "eyebrow", "Geheim dossier"),
    el("h2", "", "De poort naar de zestiende eeuw"),
    el("p", "", "Volg de sporen van ontdekkers, hervormers en opstandelingen. Elke kamer levert een code op voor de kluis van de Republiek.")
  );
  intro.append(copy, el("div", "intro-seal", "1588"));

  const cards = el("section", "start-card-grid");
  state.game.rooms.forEach((room, index) => {
    const status = roomStatus(room, index);
    const card = el("article", `start-room-card ${status}`);
    card.append(el("span", "room-card-icon", roomIcon(index)), el("h3", "", room.name), el("p", "", room.subject), el("span", "room-card-status", statusLabel(status, room.code)));
    cards.append(card);
  });

  ui.gameView.append(intro, cards, button(startButtonText(), "primary-button", renderCurrentScreen));
}

function startButtonText() {
  if (state.currentRoom >= state.game.rooms.length) return "Naar de finale";
  return state.completedCodes.length ? "Ga verder" : "Start de escape room";
}

function renderCurrentScreen() {
  if (state.won) return renderWinScreen();
  if (state.currentRoom >= state.game.rooms.length) return renderFinale();
  return renderRoom(state.game.rooms[state.currentRoom], state.currentRoom);
}

function renderRoom(room, index) {
  ui.gameView.innerHTML = "";
  const hero = el("header", "room-hero");
  const title = el("div");
  title.append(el("p", "eyebrow", `Kamer ${index + 1} van ${state.game.rooms.length}`), el("h2", "", room.name), el("p", "step-topic", room.subject));
  hero.append(el("div", "room-symbol", roomIcon(index)), title, el("div", "room-badge", hasCode(room.code) ? room.code : "?"));

  const goal = el("section", "learning-goal");
  goal.append(el("strong", "", "Leerdoel"), el("p", "", room.learningGoal));
  ui.gameView.append(hero, textBox("story-box", room.story), goal, puzzleSection(room));
}

function puzzleSection(room) {
  const section = el("section", "challenge");
  const feedback = el("div", "feedback-box hidden");
  const hint = el("div", "hint-box hidden", room.hint);
  const header = el("div", "challenge-header");
  header.append(el("h3", "", `${puzzleIcon(room.type)} ${labelFor(room.type)}`), button("Hint", "hint-button", () => hint.classList.toggle("hidden")));
  section.append(header, el("p", "challenge-question", room.question), conceptHelpBox(room.conceptHelp), hint, puzzleFor(room, feedback), feedback);
  return section;
}

function puzzleFor(room, feedback) {
  if (room.type === "multiple_choice") return multipleChoice(room, feedback);
  if (room.type === "matching") return matching(room, feedback);
  if (room.type === "true_false") return trueFalse(room, feedback);
  if (room.type === "multi_select") return multiSelect(room, feedback);
  return textInput(room, feedback);
}

function multipleChoice(room, feedback) {
  const grid = el("div", "answer-grid");
  room.answers.forEach((answer) => {
    const option = button(answer.text, "answer-option", () => {
      disableControls(grid);
      option.classList.add(answer.id === room.correct ? "selected-correct" : "selected-wrong");
      roomFeedback(room, feedback, answer.id === room.correct);
    });
    grid.append(option);
  });
  return grid;
}

function matching(room, feedback) {
  const form = el("form", "answer-form");
  room.pairs.forEach((pair) => {
    const row = el("label", "match-row");
    const select = document.createElement("select");
    select.name = pair.id;
    select.required = true;
    select.append(selectOption("", "Kies het juiste antwoord"));
    room.answers.forEach((answer) => select.append(selectOption(answer.id, answer.text)));
    row.append(el("span", "", pair.left), select);
    form.append(row);
  });
  form.append(submitButton("Controleer koppels"));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const correct = room.pairs.every((pair) => data.get(pair.id) === room.correct[pair.id]);
    roomFeedback(room, feedback, correct);
  });
  return form;
}

function trueFalse(room, feedback) {
  const form = el("form", "answer-form");
  room.statements.forEach((statement) => {
    const row = el("fieldset", "statement-row");
    row.append(el("legend", "", statement.text), radio(statement.id, "true", "Waar"), radio(statement.id, "false", "Niet waar"));
    form.append(row);
  });
  form.append(submitButton("Controleer uitspraken"));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const correct = room.statements.every((statement) => (data.get(statement.id) === "true") === Boolean(room.correct[statement.id]));
    roomFeedback(room, feedback, correct);
  });
  return form;
}

function multiSelect(room, feedback) {
  const form = el("form", "answer-form");
  room.answers.forEach((answer) => {
    const label = el("label", "check-row");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "answers";
    checkbox.value = answer.id;
    label.append(checkbox, el("span", "", answer.text));
    form.append(label);
  });
  form.append(submitButton("Controleer antwoorden"));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = new FormData(form).getAll("answers").sort();
    const correct = [...room.correct].sort();
    roomFeedback(room, feedback, selected.length === correct.length && selected.every((value, index) => value === correct[index]));
  });
  return form;
}

function textInput(room, feedback) {
  const form = el("form", "answer-form");
  const label = el("label", "text-answer");
  const input = document.createElement("input");
  input.type = "text";
  input.name = "answer";
  input.required = true;
  input.autocomplete = "off";
  label.append(el("span", "", room.textPrompt || "Vul je antwoord in."), input);
  form.append(label);

  if (room.followUp) form.append(followUpFieldset(room.followUp));
  form.append(submitButton("Controleer antwoord"));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const textCorrect = textMatches(data.get("answer"), room.correct);
    const followUpCorrect = !room.followUp || data.get("followUp") === room.followUp.correct;
    roomFeedback(room, feedback, textCorrect && followUpCorrect);
  });
  return form;
}

function followUpFieldset(followUp) {
  const fieldset = el("fieldset", "follow-up-fieldset");
  fieldset.append(el("legend", "", followUp.question));
  followUp.answers.forEach((answer) => fieldset.append(radio("followUp", answer.id, answer.text)));
  return fieldset;
}

function roomFeedback(room, feedback, correct) {
  feedback.className = `feedback-box ${correct ? "success" : "error"}`;
  feedback.innerHTML = "";
  if (!correct) {
    feedback.append(textLine("Nog niet.", room.feedbackWrong), button("Opnieuw proberen", "secondary-button", renderCurrentScreen));
    return;
  }
  completeRoom(room);
  renderShell();
  feedback.append(textLine("Goed!", room.feedbackCorrect), storyBridge(room.interlude), codeReveal(room.code), button(nextText(room), "primary-button", renderCurrentScreen));
}

function completeRoom(room) {
  const index = state.game.rooms.findIndex((item) => item.id === room.id);
  if (!hasCode(room.code)) state.completedCodes.push(room.code);
  if (index >= 0) state.currentRoom = Math.max(state.currentRoom, index + 1);
  saveProgress();
}

function renderFinale() {
  const finale = state.game.finale;
  ui.gameView.innerHTML = "";
  const header = el("header", "room-hero");
  header.append(el("div", "room-symbol", "⚜"), el("div", "", ""), el("div", "room-badge", "1588"));
  header.children[1].append(el("p", "eyebrow", "Finale"), el("h2", "", finale.name), el("p", "", finale.intro));

  const feedback = el("div", "feedback-box hidden");
  const hint = el("div", "hint-box hidden", finale.hint);
  const form = el("form", "answer-form");
  const input = document.createElement("input");
  input.type = "text";
  input.name = "finalAnswer";
  input.required = true;
  input.autocomplete = "off";
  input.inputMode = "numeric";
  input.placeholder = "Vul het jaartal in";
  form.append(codeRow(), textBox("story-box", finale.question), conceptHelpBox(finale.conceptHelp), input, button("Hint", "hint-button", () => hint.classList.toggle("hidden")), hint, submitButton("Open de kluis"), feedback);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (textMatches(new FormData(form).get("finalAnswer"), finale.correct)) {
      state.won = true;
      renderWinScreen();
      return;
    }
    feedback.className = "feedback-box error";
    feedback.innerHTML = "";
    feedback.append(textLine("De kluis blijft dicht.", finale.feedbackWrong));
  });
  ui.gameView.append(header, form);
}

function renderWinScreen() {
  saveProgress();
  renderShell();
  ui.gameView.innerHTML = "";
  const banner = el("section", "ending-banner");
  banner.append(el("div", "win-symbol", "🏛️"), el("h2", "", state.game.ending.title), el("p", "", state.game.ending.text));
  const reward = el("section", "reward-box");
  reward.append(el("h3", "", state.game.ending.rewardTitle), el("p", "", state.game.ending.rewardText));
  const learned = el("section", "learned-box");
  const list = el("ul");
  state.game.ending.learnedSummary.forEach((item) => list.append(el("li", "", item)));
  learned.append(el("h3", "", "Wat heb je geleerd?"), list);
  ui.gameView.append(banner, reward, learned, button("Speel opnieuw", "primary-button", () => resetProgressNoConfirm()));
}

function resetProgressNoConfirm() {
  state.currentRoom = 0;
  state.completedCodes = [];
  state.won = false;
  saveProgress();
  renderShell();
  renderStartScreen();
}

function openGlossary() {
  ui.modalTitle.textContent = "Begrippenboek";
  ui.modalContent.innerHTML = "";
  ui.modalContent.append(el("p", "", state.game.glossaryIntro));
  state.game.glossary.forEach((item) => {
    const card = el("article", "glossary-item");
    card.append(el("h3", "", item.term), el("p", "", item.explanation), el("span", "glossary-help", item.help || ""));
    ui.modalContent.append(card);
  });
  openModal();
}

function openTeacherSheet() {
  ui.modalTitle.textContent = "Antwoordblad";
  ui.modalContent.innerHTML = "";
  ui.modalContent.append(el("p", "", "Dit is geen beveiligde omgeving. Het is alleen een hulpmiddel voor de docent."));
  state.game.rooms.forEach((room, index) => ui.modalContent.append(answerCard(`Kamer ${index + 1}: ${room.name}`, room.question, answerTextFor(room), room.code)));
  ui.modalContent.append(answerCard(`Finale: ${state.game.finale.name}`, state.game.finale.question, state.game.finale.correct, state.game.finale.endCode));
  openModal();
}

function answerCard(title, question, answer, code) {
  const card = el("article", "teacher-answer-card");
  card.append(el("h3", "", title), el("p", "", question));
  if (Array.isArray(answer)) {
    const list = el("ul");
    answer.forEach((item) => list.append(el("li", "", item)));
    card.append(list);
  } else {
    card.append(el("p", "", answer));
  }
  card.append(el("span", "teacher-code", `Code: ${code}`));
  return card;
}

function answerTextFor(room) {
  if (room.type === "multiple_choice") return textForAnswerId(room.answers, room.correct);
  if (room.type === "matching") return room.pairs.map((pair) => `${pair.left}: ${textForAnswerId(room.answers, room.correct[pair.id])}`);
  if (room.type === "true_false") return room.statements.map((statement) => `${statement.text} ${room.correct[statement.id] ? "Waar" : "Niet waar"}`);
  if (room.type === "multi_select") return room.answers.filter((answer) => room.correct.includes(answer.id)).map((answer) => answer.text);
  if (room.followUp) return [...toArray(room.correct), textForAnswerId(room.followUp.answers, room.followUp.correct)];
  return Array.isArray(room.correct) ? room.correct.join(" / ") : room.correct;
}

function openModal() {
  ui.modal.classList.remove("hidden");
  ui.modalClose.focus();
}

function closeModal() {
  ui.modal.classList.add("hidden");
  if (window.location.hash === "#docent") history.replaceState(null, "", window.location.pathname);
}

function conceptHelpBox(items = []) {
  if (!items.length) return document.createDocumentFragment();
  const box = el("aside", "concept-help");
  const list = el("dl", "concept-list");
  items.forEach((item) => list.append(el("dt", "", item.term), el("dd", "", item.explanation)));
  box.append(el("strong", "", "Begripshulp"), list);
  return box;
}

function codeRow() {
  const row = el("div", "vault-code");
  state.completedCodes.forEach((code) => row.append(el("span", "", code)));
  return row;
}

function codeReveal(code) {
  const box = el("div", "code-reveal");
  box.append(el("span", "", "Kamercode"), el("strong", "", code));
  return box;
}

function storyBridge(text) {
  if (!text) return document.createDocumentFragment();
  const box = el("div", "story-bridge");
  box.append(el("strong", "", "Volgend spoor"), el("p", "", text));
  return box;
}

function textBox(className, text) {
  const box = el("section", className);
  box.append(el("p", "", text));
  return box;
}

function textLine(label, text) {
  const p = document.createElement("p");
  p.append(el("strong", "", label), document.createTextNode(" " + text));
  return p;
}

function roomStatus(room, index) {
  if (hasCode(room.code)) return "done";
  if (index === state.currentRoom && state.currentRoom < state.game.rooms.length) return "current";
  return "locked";
}

function statusLabel(status, code) {
  if (status === "done") return `Voltooid: ${code}`;
  if (status === "current") return "Bezig";
  return "Gesloten";
}

function firstOpenRoomIndex() {
  const index = state.game.rooms.findIndex((room) => !hasCode(room.code));
  return index === -1 ? state.game.rooms.length : index;
}

function hasCode(code) { return state.completedCodes.includes(code); }
function textMatches(answer, correct) { return toArray(correct).some((value) => normalize(value) === normalize(answer)); }
function normalize(value) { return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function toArray(value) { return Array.isArray(value) ? value : [value]; }
function clamp(value, min, max) { const number = Number(value); return Number.isFinite(number) ? Math.min(Math.max(number, min), max) : min; }
function nextText(room) { return state.game.rooms.findIndex((item) => item.id === room.id) === state.game.rooms.length - 1 ? "Naar de finale" : "Volgende kamer"; }
function labelFor(type) { return { multiple_choice: "Multiple choice", matching: "Koppelen", true_false: "Waar of niet waar", multi_select: "Meerdere antwoorden", text_input: "Invullen" }[type] || "Opdracht"; }
function puzzleIcon(type) { return { multiple_choice: "✦", matching: "↔", true_false: "✓", multi_select: "☑", text_input: "✎" }[type] || "✦"; }
function roomIcon(index) { return ["⚓", "🧭", "📜", "👑", "⛵"][index] || "✦"; }
function textForAnswerId(answers, id) { const answer = answers.find((item) => item.id === id); return answer ? answer.text : id; }
function disableControls(container) { container.querySelectorAll("button, input, select").forEach((control) => { control.disabled = true; }); }

function radio(name, value, text) {
  const label = el("label", "choice-row");
  const input = document.createElement("input");
  input.type = "radio";
  input.name = name;
  input.value = value;
  input.required = true;
  label.append(input, el("span", "", text));
  return label;
}

function selectOption(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

function button(text, className, onClick) {
  const item = el("button", className, text);
  item.type = "button";
  item.addEventListener("click", onClick);
  return item;
}

function submitButton(text) {
  const item = el("button", "primary-button", text);
  item.type = "submit";
  return item;
}

function el(tagName, className = "", text = "") {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== "") element.textContent = text;
  return element;
}
