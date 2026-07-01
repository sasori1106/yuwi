const envelope = document.getElementById("envelope");
const letter = document.getElementById("letter");

let canDrag = false;
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

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

    letter.style.transform = "none";
    letter.style.left = relativeLeft + "px";
    letter.style.top = relativeTop + "px";
    letter.style.bottom = "auto"; // stop the old bottom:0 from fighting with top
}

// --- 4. Reset letter when envelope is closed again ---
function resetLetter() {
    canDrag = false;
    letter.classList.remove("draggable", "dragging");
    letter.style.transform = "";
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
}

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
