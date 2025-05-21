// -------------------------------------------------- Canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
ctx.lineWidth = 8;

let rect = canvas.getBoundingClientRect();
let widthRatio = 1920 / rect.width;
let heightRatio = 1080 / rect.height;
let lastX, lastY, drawing;

const getCanvasXPos = (e) => (e.clientX - rect.left) * widthRatio;
const getCanvasYPos = (e) => (e.clientY - rect.top) * heightRatio;

// Drawing starts when you hold the mouse down
canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    lastX = getCanvasXPos(e);
    lastY = getCanvasYPos(e);
});

// When you move the mouse around and drawing is true, it starts drawing
canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;

    const currentX = getCanvasXPos(e);
    const currentY = getCanvasYPos(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastX = currentX;
    lastY = currentY;
});

// You're no longer drawing
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);

// The width and height ratios should be adjusted if there's a screen resize
window.addEventListener('resize', () => {
    rect = canvas.getBoundingClientRect();
    widthRatio = 1920 / rect.width;
    heightRatio = 1080 / rect.height;
});


// -------------------------------------------------- Menu/Colors
const menu = document.getElementById('menu');
const background = document.getElementById('background');
const sizeSlider = document.getElementById('size-slider');
let currentColor = `#000000ff`;

const flipBackground = () => background.hidden = !background.hidden;

// Applies change when the user presses "Ok"
function changeColor(color) {
    currentColor = color.hex;
    sizeSlider.style.setProperty('--thumb-color', currentColor);

    ctx.lineWidth = sizeSlider.value;
    ctx.strokeStyle = currentColor;
    console.log(currentColor);

    flipBackground();
}

// Dynamically change the slider size as you slide the thumb circle
sizeSlider.addEventListener('input', () => {
    sizeSlider.style.setProperty('--thumb-size', `${sizeSlider.value}px`);
});

// Turn on the background when menu is clicked
menu.addEventListener('click', flipBackground);
// Turn off the background when background is clicked
background.addEventListener('click', (e) => { if (e.target === background) flipBackground(); });

// For the color picker
const picker = new Picker({
    parent: document.getElementById('color-picker'),
    popup: false,
    color: '#000000ff', 
    onDone: changeColor
});


// -------------------------------------------------- Menu/Tools
const currentTool = document.getElementById('current-tool');
const paintbrush = document.getElementById('paintbrush');
const eraser = document.getElementById('eraser');
let erase = false;

paintbrush.addEventListener('click', () => {
  erase = false;
  currentTool.style.marginLeft = '0';
  
  canvas.style.cursor = 'crosshair';

  sizeSlider.style.setProperty('--thumb-color', currentColor);
  ctx.strokeStyle = currentColor;
});

eraser.addEventListener('click', () => {
  erase = true;
  currentTool.style.marginLeft = '40px';

  canvas.style.cursor = 'grabbing';
  ctx.strokeStyle = '#ffffff';

  sizeSlider.style.setProperty('--thumb-color', 'white');
});