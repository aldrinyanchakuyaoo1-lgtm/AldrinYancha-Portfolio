// Small JavaScript helpers for the portfolio page.
// The profile cards are already written in index.html, so JavaScript only
// handles buttons, animations, and the small browser-only study tools.

let notes = [];
let journalEntries = [];
let flashcards = [];
let currentCard = 0;

// Save the mini-app data in this browser (not on the website/server).
function loadSavedData() {
  try {
    const saved = JSON.parse(localStorage.getItem("portfolio-saved-data") || "{}");
    notes = Array.isArray(saved.notes) ? saved.notes : [];
    journalEntries = Array.isArray(saved.diaryEntries) ? saved.diaryEntries : [];
    flashcards = Array.isArray(saved.flashcards) ? saved.flashcards : [];
  } catch (error) {
    notes = [];
    journalEntries = [];
    flashcards = [];
  }
}

function saveData() {
  const data = {
    notes: notes,
    diaryEntries: journalEntries,
    flashcards: flashcards,
  };
  localStorage.setItem("portfolio-saved-data", JSON.stringify(data));
}

// Show one portfolio section and highlight its navigation button.
function openTab(event, sectionName) {
  document.querySelectorAll(".tab-content").forEach(function (section) {
    section.classList.remove("active");
  });
  document.querySelectorAll(".nav-btn").forEach(function (button) {
    button.classList.remove("active");
  });
  document.getElementById(sectionName).classList.add("active");
  event.currentTarget.classList.add("active");
  // Start every tab from the top with the full header, so a short tab never
  // inherits a collapsed header from a long one.
  document.getElementById("scrollContainer").scrollTop = 0;
  document.querySelector(".header-container").classList.remove("compact");
}

// Switch between light and dark mode and remember the choice.
function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  const button = document.getElementById("themeToggle");
  button.textContent = isDark ? "Light mode" : "Dark mode";
  button.setAttribute(
    "aria-label",
    "Switch to " + (isDark ? "light" : "dark") + " mode",
  );
  button.setAttribute("aria-pressed", String(isDark));
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem("portfolio-theme", nextTheme);
}

// The CSS animates the header when the "compact" class is added or removed.
//
// Why this used to shake: the header sits ABOVE the scroll area, so shrinking
// it makes the scroll area taller. On a short tab the extra height shrinks the
// scrollable distance, the browser pushes scrollTop back under the trigger,
// the header re-expands, and the loop repeats forever.
// Fix: (1) two different thresholds (hysteresis) so it can't flip-flop, and
// (2) never collapse unless there is enough content left to keep scrolling.
const COLLAPSE_AT = 60; // collapse after scrolling past this many px
const EXPAND_AT = 8; // expand again only when almost back at the top
const SAFETY_ROOM = 40; // extra scroll room required after collapsing
let headerDelta = 0; // how many px the header loses when it collapses
let headerTicking = false;

function measureHeaderDelta() {
  const header = document.querySelector(".header-container");
  if (!header) return;
  const wasCompact = header.classList.contains("compact");
  header.classList.add("no-transition");
  header.classList.remove("compact");
  const full = header.offsetHeight;
  header.classList.add("compact");
  const small = header.offsetHeight;
  header.classList.toggle("compact", wasCompact);
  header.offsetHeight; // apply the final state before transitions come back
  header.classList.remove("no-transition");
  headerDelta = Math.max(0, full - small);
}

function updateHeader() {
  const header = document.querySelector(".header-container");
  const content = document.getElementById("scrollContainer");
  if (!header || !content) return;
  const top = content.scrollTop;
  const isCompact = header.classList.contains("compact");
  if (isCompact) {
    if (top < EXPAND_AT) header.classList.remove("compact");
  } else if (top > COLLAPSE_AT) {
    // Distance still scrollable once the scroll area grows by headerDelta.
    const roomAfter = content.scrollHeight - content.clientHeight - headerDelta;
    if (roomAfter > COLLAPSE_AT + SAFETY_ROOM) header.classList.add("compact");
  }
}

// Run at most once per frame instead of on every scroll event.
function onContentScroll() {
  if (headerTicking) return;
  headerTicking = true;
  requestAnimationFrame(function () {
    headerTicking = false;
    updateHeader();
  });
}

// Add a sticky note, then redraw the list.
function addNote() {
  const input = document.getElementById("noteInput");
  const text = input.value.trim();
  if (!text) return alert("Enter a note first.");
  notes.push(text);
  input.value = "";
  saveData();
  showNotes();
}

function showNotes() {
  const list = document.getElementById("notesList");
  list.innerHTML = "";
  notes.forEach(function (note, index) {
    const card = document.createElement("div");
    card.className = "simple-card";
    const text = document.createElement("p");
    text.textContent = note;
    const button = document.createElement("button");
    button.className = "small-button";
    button.textContent = "Delete";
    button.onclick = function () {
      notes.splice(index, 1);
      saveData();
      showNotes();
    };
    card.append(text, button);
    list.appendChild(card);
  });
}

// Save a journal entry and draw the saved entries.
function addDiaryEntry() {
  const titleInput = document.getElementById("diaryTitle");
  const textInput = document.getElementById("diaryText");
  const title = titleInput.value.trim();
  const text = textInput.value.trim();
  if (!title || !text) return alert("Enter both a title and journal entry.");
  journalEntries.push({ title: title, text: text });
  titleInput.value = "";
  textInput.value = "";
  saveData();
  showDiaryEntries();
}

function showDiaryEntries() {
  const list = document.getElementById("diaryList");
  list.innerHTML = "";
  journalEntries.forEach(function (entry, index) {
    const card = document.createElement("div");
    card.className = "simple-card";
    const title = document.createElement("h4");
    title.textContent = entry.title;
    const text = document.createElement("p");
    text.textContent = entry.text;
    const button = document.createElement("button");
    button.className = "small-button";
    button.textContent = "Delete";
    button.onclick = function () {
      journalEntries.splice(index, 1);
      saveData();
      showDiaryEntries();
    };
    card.append(title, text, button);
    list.appendChild(card);
  });
}

// Add, display, navigate, and delete reviewer flashcards.
function addFlashcard() {
  const question = document.getElementById("questionInput").value.trim();
  const answer = document.getElementById("answerInput").value.trim();
  if (!question || !answer) return alert("Enter both a question and an answer.");
  flashcards.push({ question: question, answer: answer });
  currentCard = flashcards.length - 1;
  document.getElementById("questionInput").value = "";
  document.getElementById("answerInput").value = "";
  saveData();
  showFlashcard();
  showFlashcardList();
}

function showFlashcard() {
  const question = document.getElementById("cardQuestion");
  const answer = document.getElementById("cardAnswer");
  if (flashcards.length === 0) {
    question.textContent = "No flashcards yet. Add one using the form above.";
    answer.textContent = "";
    answer.style.display = "none";
    document.getElementById("cardNumber").textContent = "0 / 0";
    return;
  }
  question.textContent = flashcards[currentCard].question;
  answer.textContent = flashcards[currentCard].answer;
  answer.style.display = "none";
  document.getElementById("cardNumber").textContent =
    currentCard + 1 + " / " + flashcards.length;
}

function showAnswer() {
  if (flashcards.length === 0) return alert("Add a flashcard first.");
  const answer = document.getElementById("cardAnswer");
  answer.style.display = answer.style.display === "none" ? "block" : "none";
}

function nextCard() {
  if (flashcards.length === 0) return;
  currentCard = (currentCard + 1) % flashcards.length;
  showFlashcard();
}

function previousCard() {
  if (flashcards.length === 0) return;
  currentCard = (currentCard - 1 + flashcards.length) % flashcards.length;
  showFlashcard();
}

function deleteCurrentFlashcard() {
  if (flashcards.length === 0) return alert("There are no flashcards to delete.");
  flashcards.splice(currentCard, 1);
  if (currentCard >= flashcards.length)
    currentCard = Math.max(0, flashcards.length - 1);
  saveData();
  showFlashcard();
  showFlashcardList();
}

function showFlashcardList() {
  const list = document.getElementById("flashcardList");
  list.innerHTML = "";
  flashcards.forEach(function (flashcard, index) {
    const card = document.createElement("div");
    card.className = "simple-card";
    const question = document.createElement("p");
    question.textContent = index + 1 + ". " + flashcard.question;
    const button = document.createElement("button");
    button.className = "small-button danger-button";
    button.textContent = "Delete";
    button.setAttribute("aria-label", "Delete flashcard " + (index + 1));
    button.onclick = function () {
      flashcards.splice(index, 1);
      currentCard = Math.min(currentCard, Math.max(0, flashcards.length - 1));
      saveData();
      showFlashcard();
      showFlashcardList();
    };
    card.append(question, button);
    list.appendChild(card);
  });
}

function openPersonalProject() {
  window.location.href = "personal-project/index.html";
}

// Set up the portfolio after the page is ready.
loadSavedData();
applyTheme(localStorage.getItem("portfolio-theme") || "light");
showNotes();
showDiaryEntries();
showFlashcard();
showFlashcardList();

document
  .getElementById("scrollContainer")
  .addEventListener("scroll", onContentScroll, { passive: true });
window.addEventListener("resize", function () {
  measureHeaderDelta();
  updateHeader();
});
window.addEventListener("load", measureHeaderDelta);
measureHeaderDelta();
