const envelope = document.getElementById("envelope");
const letter = document.getElementById("letter");
const letterOverlay = document.getElementById("letterOverlay");
const closeBtn = document.getElementById("closeBtn");
const heartsContainer = document.getElementById("hearts");
const dragHeartsContainer = document.getElementById("dragHearts");

let dragHeartInterval = null;

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

    if (envelope.classList.contains("open")) {
        spawnHearts();
    } else {
        // If we're closing the envelope again, reset the letter back to normal
        resetLetter();
    }
});

// --- 2. Wait for the pop-up animation to finish before allowing drag ---
letter.addEventListener("animationend", (e) => {
    if (e.animationName !== "popUpAndCenter") return;

    lockLetterPosition();
    canDrag = true;
    letter.classList.add("draggable");
    letter.classList.add("show-hint"); // reveal "drag me" hint + arrow
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
    letter.classList.remove("draggable", "dragging", "show-hint");
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
    letter.classList.remove("show-hint"); // they get it now, hide the hint

    const letterRect = letter.getBoundingClientRect();
    offsetX = clientX - letterRect.left;
    offsetY = clientY - letterRect.top;

    // Start the 2-second long-press timer. If the user is still
    // dragging when this fires, show the fullscreen letter.
    holdTimer = setTimeout(() => {
        showFullLetter();
    }, HOLD_DURATION);

    // Spawn a heart near the letter every 150ms while dragging continues
    spawnDragHeart(); // one immediately, so it doesn't feel delayed
    dragHeartInterval = setInterval(spawnDragHeart, 150);
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

    // Stop the heart trail
    clearInterval(dragHeartInterval);
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

// --- 9. Spawn floating hearts when the envelope opens ---
const HEART_COLORS = ["#e07a7a", "#d95d5d", "#f4a6c1", "#c94f6d"];
const HEART_SHAPES = ["❤", "💕", "💖", "❣"];

function spawnHearts(count = 18) {
    for (let i = 0; i < count; i++) {
        const heart = document.createElement("span");
        heart.className = "heart";
        heart.textContent = HEART_SHAPES[Math.floor(Math.random() * HEART_SHAPES.length)];
        heart.style.color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];

        // Random horizontal starting position near the envelope opening
        heart.style.left = 70 + Math.random() * 160 + "px";

        // Random sideways drift as it floats up (used inside the keyframes)
        const drift = (Math.random() * 120 - 60) + "px";
        heart.style.setProperty("--drift", drift);

        // Random size, duration, and delay so they don't all look identical
        const size = 14 + Math.random() * 16;
        heart.style.fontSize = size + "px";
        heart.style.animationDuration = 1.3 + Math.random() * 1 + "s";
        heart.style.animationDelay = Math.random() * 0.9 + "s";

        heartsContainer.appendChild(heart);

        // Clean up each heart element once its animation finishes,
        // so we don't leave hundreds of invisible divs in the DOM
        heart.addEventListener("animationend", () => heart.remove());
    }
}

// --- 10. Spawn a single heart at the letter's current screen position (used while dragging) ---
function spawnDragHeart() {
    const rect = letter.getBoundingClientRect();

    const heart = document.createElement("span");
    heart.className = "drag-heart";
    heart.textContent = HEART_SHAPES[Math.floor(Math.random() * HEART_SHAPES.length)];
    heart.style.color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];

    // Spawn somewhere along the letter's current edges, in real screen coordinates
    heart.style.left = rect.left + Math.random() * rect.width + "px";
    heart.style.top = rect.top + Math.random() * rect.height + "px";

    const drift = (Math.random() * 50 - 25) + "px";
    heart.style.setProperty("--drift", drift);

    const size = 14 + Math.random() * 12;
    heart.style.fontSize = size + "px";
    heart.style.animationDuration = "0.8s";

    dragHeartsContainer.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove());
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
