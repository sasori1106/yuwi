const envelope = document.getElementById("envelope");
const letter = document.getElementById("letter");
const letterOverlay = document.getElementById("letterOverlay");
const closeBtn = document.getElementById("closeBtn");

let canDrag = false;
let isDragging = false;
let offsetX = 0;
let offsetY = 0;
let holdTimer = null;
const HOLD_DURATION = 2000; // 2 seconds

// Only block bubbling once the envelope is open — otherwise the first
// click on the visible letter needs to bubble up and open the envelope
letter.addEventListener("click", (e) => {
    if (envelope.classList.contains("open")) {
        e.stopPropagation();
    }
});

// --- 1. Open/close the envelope ---
envelope.addEventListener("click", () => {
    // Don't let a click-to-close fire while the user is dragging the letter
    if (isDragging) return;
    envelope.classList.toggle("open");

    // If we're closing the envelope again, reset the letter back to normal
    if (!envelope.classList.contains("open")) {
        resetLetter();
    }
});

// --- 2. Wait for the pop-up animation to finish before allowing drag ---
letter.addEventListener("animationend", (e) => {
    if (e.animationName !== "popUpAndCenter") return;

    lockLetterPosition();
    canDrag = true;
    letter.classList.add("draggable");
});

// --- 3. Convert the animation's `transform` end-state into real left/top ---
function lockLetterPosition() {
    const letterRect = letter.getBoundingClientRect();
    const envelopeRect = envelope.getBoundingClientRect();

    // Position relative to the envelope (its positioned parent)
    const relativeLeft = letterRect.left - envelopeRect.left;
    const relativeTop = letterRect.top - envelopeRect.top;

    letter.style.animation = "none"; // inline style beats the CSS rule's specificity
    letter.style.transform = "none";
    letter.style.left = relativeLeft + "px";
    letter.style.top = relativeTop + "px";
    letter.style.bottom = "auto"; // stop the old bottom:0 from fighting with top
}

// --- 4. Reset letter when envelope is closed again ---
function resetLetter() {
    canDrag = false;
    letter.classList.remove("draggable", "dragging");
    letter.style.animation = "";
    letter.style.transform = "";
    letter.style.position = "";
    letter.style.left = "20px";
    letter.style.top = "";
    letter.style.bottom = "0";
}

// --- 5. Drag start (mouse + touch) ---
function dragStart(clientX, clientY) {
    if (!canDrag) return;
    isDragging = true;
    letter.classList.add("dragging");

    const letterRect = letter.getBoundingClientRect();
    offsetX = clientX - letterRect.left;
    offsetY = clientY - letterRect.top;

    // Start the 2-second long-press timer. If the user is still
    // dragging when this fires, show the fullscreen letter.
    holdTimer = setTimeout(() => {
        showFullLetter();
    }, HOLD_DURATION);
}

// --- 6. Drag move (mouse + touch) ---
function dragMove(clientX, clientY) {
    if (!isDragging) return;

    // Position relative to the viewport, since we're dragging letter
    // out of the envelope and it should move freely on screen.
    // We switch it to position: fixed the first time we drag.
    if (letter.style.position !== "fixed") {
        const rect = letter.getBoundingClientRect();
        letter.style.position = "fixed";
        letter.style.left = rect.left + "px";
        letter.style.top = rect.top + "px";
    }

    letter.style.left = clientX - offsetX + "px";
    letter.style.top = clientY - offsetY + "px";
}

// --- 7. Drag end (mouse + touch) ---
function dragEnd() {
    isDragging = false;
    letter.classList.remove("dragging");

    // Released before 2 seconds — cancel the pending fullscreen trigger
    clearTimeout(holdTimer);
}

// --- 8. Show/close the fullscreen letter ---
function showFullLetter() {
    // Stop treating this as an active drag — the letter is "released"
    // into fullscreen mode instead of following the cursor anymore
    isDragging = false;
    letter.classList.remove("dragging");

    letter.classList.add("hidden"); // hide the small draggable card
    letterOverlay.classList.add("show");
}

function closeFullLetter() {
    letterOverlay.classList.remove("show");
    letter.classList.remove("hidden"); // bring back the draggable card
}

closeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // don't let this bubble to anything behind it
    closeFullLetter();
});

// --- Mouse events ---
letter.addEventListener("mousedown", (e) => {
    dragStart(e.clientX, e.clientY);
});

document.addEventListener("mousemove", (e) => {
    dragMove(e.clientX, e.clientY);
});

document.addEventListener("mouseup", () => {
    dragEnd();
});

// --- Touch events (mobile) ---
letter.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    dragStart(touch.clientX, touch.clientY);
});

document.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    e.preventDefault(); // stop the page from scrolling while dragging
    const touch = e.touches[0];
    dragMove(touch.clientX, touch.clientY);
}, { passive: false });

document.addEventListener("touchend", () => {
    dragEnd();
});