const menu = document.getElementById('menu');
const background = document.getElementById('background');
const sizeSlider = document.getElementById('size-slider');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
ctx.lineWidth = 20;

let width = window.innerWidth;
let height = window.innerHeight;
let widthRatio = 1920 / width;
let heightRatio = 1080 / height;

window.addEventListener('resize', () => {
    const rect = canvas.getBoundingClientRect();
    widthRatio = 1920 / rect.width;
    heightRatio = 1080 / rect.height;

    console.log(window.innerWidth, window.innerHeight);
    width = Math.max(window.innerWidth, width);
    height = Math.max(window.innerHeight, height);
    
    
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
});


let drawing = false;
let lastX = 0, lastY = 0;

canvas.addEventListener('mousedown', (e) => {
    drawing = true;

    const rect = canvas.getBoundingClientRect();
    lastX = (e.clientX - rect.left) * widthRatio;
    lastY = (e.clientY - rect.top) * heightRatio;
});

canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) * widthRatio;
    const currentY = (e.clientY - rect.top) * heightRatio;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastX = currentX;
    lastY = currentY;
});

// Stop drawing when mouse is released or leaves the canvas
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);

let currentColor = `#000000ff`;

// Change the color of the slider
function changeColor(color) {
    currentColor = color.hex;
    sizeSlider.style.setProperty('--thumb-color', currentColor);
    ctx.lineWidth = sizeSlider.value;
    flipBackground();
}

// Change the size when slid 
sizeSlider.addEventListener('input', () => {
  sizeSlider.style.setProperty('--thumb-size', `${sizeSlider.value}px`);
  
})

// For the color picker
const picker = new Picker({
    parent: document.getElementById('color-picker'),
    popup: false,
    color: '#000000ff', 
    onDone: changeColor
});

const flipBackground = () => background.hidden = !background.hidden;

menu.addEventListener('click', () => {
  background.hidden = false;
});

background.addEventListener('click', (e) => {
  if (e.target === background) background.hidden = true;
});
