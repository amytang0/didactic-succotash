const canvas = document.querySelector("#drawing-canvas");
const saveButton = document.querySelector("#save-drawing");
const printButton = document.querySelector("#print-template");
const colorButtons = document.querySelectorAll("[data-color]");
const sizeButtons = document.querySelectorAll("[data-size]");
const stampButtons = document.querySelectorAll("[data-stamp]");
const heroCopy = document.querySelector(".hero-copy");
const context = canvas.getContext("2d");

let currentColor = "#e53935";
let currentSize = 5;
let currentStamp = null;
let isDrawing = false;
let lastPoint = null;
let heroUnlockTimer = null;

const unlockHero = () => {
  if (!document.body.classList.contains("is-hero-locked")) {
    return;
  }

  document.body.classList.remove("is-hero-locked");
  document.body.classList.add("is-hero-ready");
  window.clearTimeout(heroUnlockTimer);
};

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  unlockHero();
} else if (heroCopy) {
  heroCopy.addEventListener("animationend", (event) => {
    if (event.animationName === "hero-reveal") {
      unlockHero();
    }
  });

  heroUnlockTimer = window.setTimeout(unlockHero, 7600);
} else {
  unlockHero();
}

context.lineCap = "round";
context.lineJoin = "round";

const drawSnowmanBase = (targetContext) => {
  targetContext.fillStyle = "#eaf4f8";
  targetContext.fillRect(0, 0, 360, 360);
  targetContext.fillStyle = "#ffffff";
  targetContext.strokeStyle = "#91aebb";
  targetContext.lineWidth = 3;

  [
    { x: 180, y: 250, radius: 88 },
    { x: 180, y: 105, radius: 62 },
  ].forEach(({ x, y, radius }) => {
    targetContext.beginPath();
    targetContext.arc(x, y, radius, 0, Math.PI * 2);
    targetContext.fill();
    targetContext.stroke();
  });
};

const setActive = (buttons, activeButton) => {
  buttons.forEach((button) => button.classList.toggle("is-active", button === activeButton));
};

const getCanvasPoint = (event) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
};

const drawLine = (point) => {
  if (!lastPoint) {
    lastPoint = point;
  }

  context.strokeStyle = currentColor;
  context.lineWidth = currentSize;
  context.beginPath();
  context.moveTo(lastPoint.x, lastPoint.y);
  context.lineTo(point.x, point.y);
  context.stroke();
  lastPoint = point;
};

const drawHeart = (x, y, size) => {
  const scale = size / 32;

  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.beginPath();
  context.moveTo(0, 10);
  context.bezierCurveTo(-24, -8, -22, -28, 0, -14);
  context.bezierCurveTo(22, -28, 24, -8, 0, 10);
  context.closePath();
  context.fill();
  context.restore();
};

const drawStar = (x, y, size) => {
  const spikes = 5;
  const outerRadius = size / 2;
  const innerRadius = outerRadius * 0.45;
  let rotation = -Math.PI / 2;

  context.beginPath();
  context.moveTo(x + Math.cos(rotation) * outerRadius, y + Math.sin(rotation) * outerRadius);

  for (let i = 0; i < spikes; i += 1) {
    rotation += Math.PI / spikes;
    context.lineTo(x + Math.cos(rotation) * innerRadius, y + Math.sin(rotation) * innerRadius);
    rotation += Math.PI / spikes;
    context.lineTo(x + Math.cos(rotation) * outerRadius, y + Math.sin(rotation) * outerRadius);
  }

  context.closePath();
  context.fill();
};

const drawSnowflake = (x, y, size) => {
  const radius = size / 2;
  const branch = radius * 0.34;

  context.save();
  context.translate(x, y);
  context.strokeStyle = currentColor;
  context.lineWidth = Math.max(size / 12, 2);
  context.lineCap = "round";

  for (let i = 0; i < 6; i += 1) {
    context.rotate(Math.PI / 3);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, -radius);
    context.moveTo(0, -radius * 0.55);
    context.lineTo(-branch, -radius * 0.78);
    context.moveTo(0, -radius * 0.55);
    context.lineTo(branch, -radius * 0.78);
    context.stroke();
  }

  context.restore();
};

const drawStamp = (point) => {
  const stampSize = Math.max(currentSize * 3, 24);

  context.fillStyle = currentColor;

  if (currentStamp === "heart") {
    drawHeart(point.x, point.y, stampSize);
  }

  if (currentStamp === "star") {
    drawStar(point.x, point.y, stampSize);
  }

  if (currentStamp === "snowflake") {
    drawSnowflake(point.x, point.y, stampSize);
  }
};

const startDrawing = (point) => {
  if (currentStamp) {
    drawStamp(point);
    return;
  }

  isDrawing = true;
  lastPoint = point;
  drawLine(point);
};

const continueDrawing = (point) => {
  if (!isDrawing || currentStamp) {
    return;
  }

  drawLine(point);
};

const stopDrawing = () => {
  isDrawing = false;
  lastPoint = null;
};

colorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentColor = button.dataset.color;
    setActive(colorButtons, button);
  });
});

sizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentSize = Number(button.dataset.size);
    currentStamp = null;
    setActive(sizeButtons, button);
    stampButtons.forEach((stampButton) => stampButton.classList.remove("is-active"));
  });
});

stampButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentStamp = button.dataset.stamp;
    setActive(stampButtons, button);
  });
});

if (window.PointerEvent) {
  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    startDrawing(getCanvasPoint(event));
  });

  canvas.addEventListener("pointermove", (event) => {
    continueDrawing(getCanvasPoint(event));
  });

  canvas.addEventListener("pointerup", stopDrawing);
  canvas.addEventListener("pointercancel", stopDrawing);
  canvas.addEventListener("pointerleave", stopDrawing);
} else {
  canvas.addEventListener("mousedown", (event) => {
    startDrawing(getCanvasPoint(event));
  });

  canvas.addEventListener("mousemove", (event) => {
    continueDrawing(getCanvasPoint(event));
  });

  window.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);

  canvas.addEventListener("touchstart", (event) => {
    event.preventDefault();
    startDrawing(getCanvasPoint(event.touches[0]));
  });

  canvas.addEventListener("touchmove", (event) => {
    event.preventDefault();
    continueDrawing(getCanvasPoint(event.touches[0]));
  });

  canvas.addEventListener("touchend", stopDrawing);
  canvas.addEventListener("touchcancel", stopDrawing);
}

saveButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  const exportContext = exportCanvas.getContext("2d");
  const link = document.createElement("a");

  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  drawSnowmanBase(exportContext);
  exportContext.drawImage(canvas, 0, 0);
  link.download = "the-snow-woman-drawing.png";
  link.href = exportCanvas.toDataURL("image/png");
  link.click();
});

printButton.addEventListener("click", () => {
  window.print();
});

window.snowWomanDrawReady = true;
