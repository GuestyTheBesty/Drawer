// -------------------------------------------------- Canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
ctx.lineWidth = 8;
ctx.lineCap = 'round';
ctx.lineJoin = 'round'; 

const strokes = [];
let currentStroke = []
let rect = canvas.getBoundingClientRect();
let widthRatio = 1920 / rect.width;
let heightRatio = 1080 / rect.height;
let lastX, lastY, drawing;

const getCanvasXPos = (e) => (e.clientX - rect.left) * widthRatio;
const getCanvasYPos = (e) => (e.clientY - rect.top) * heightRatio;

function regenerateCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < strokes.length; i++) {
    console.log(i);
    const coords = strokes[i].coords;
    for (let k = 0; k < coords.length - 1; k++) {
      let x1 = coords[k].x;
      let y1 = coords[k].y;
      let x2 = coords[k+1].x;
      let y2 = coords[k+1].y;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}

let eraseMode = false;
// Drawing starts when you hold the mouse down
canvas.addEventListener('mousedown', (e) => {
  if (erase) eraseMode = true;
    currentStroke = {
      lineWidth: ctx.lineWidth,
      coords: []
    };
    drawing = true;
    lastX = getCanvasXPos(e);
    lastY = getCanvasYPos(e);
});

// When you move the mouse around and drawing is true, it starts drawing
canvas.addEventListener('mousemove', (e) => {
    if (eraseMode) {
      const currentX = getCanvasXPos(e);
      const currentY = getCanvasYPos(e);

      // Get 1x1 pixel data
      const pixel = ctx.getImageData(currentX, currentY, 1, 1).data;
      const [r, g, b, a] = pixel;

      // If it's white, return
      if (a === 0 || (r === 255 && g === 255 && b === 255)) return;

      for (let i = strokes.length - 1; i >= 0; i--) {
        const lineWidth = strokes[i].lineWidth;
        
        const coords = strokes[i].coords;
        for (let k = 0; k < coords.length; k++) {
          let x = coords[k].x;
          let y = coords[k].y;

          if (x - lineWidth <= currentX && currentX <= x + lineWidth &&
              y - lineWidth <= currentY && currentY <= y + lineWidth) {
            console.log(strokes);
            console.log(i);
            strokes.splice(i, 1);
            console.log(strokes);
            console.log("spliecd");
            
            regenerateCanvas();
            return;
          }
        }
      }
    } else if (drawing) {
      const currentX = getCanvasXPos(e);
      const currentY = getCanvasYPos(e);
      currentStroke.coords.push({
        x: currentX,
        y: currentY
      });

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      lastX = currentX;
      lastY = currentY;
    } 
});

// You're no longer drawing
canvas.addEventListener('mouseup', () => {
  drawing = false;
  eraseMode = false;
  strokes.push(currentStroke);
  console.log(currentStroke.lineWidth, "mouseup"); 
});
canvas.addEventListener('mouseout', () => {
  drawing = false;
  eraseMode = false;
});

// The width and height ratios should be adjusted if there's a screen resize
window.addEventListener('resize', () => {
    rect = canvas.getBoundingClientRect();
    widthRatio = 1920 / rect.width;
    heightRatio = 1080 / rect.height;
});

let erase = false;


// -------------------------------------------------- Menu/Colors
const menu = document.getElementById('menu');
const background = document.getElementById('background');
const sizeSlider = document.getElementById('size-slider');
let currentColor = `#000000ff`;

const flipBackground = () => background.hidden = !background.hidden;

// Dynamically change the slider size as you slide the thumb circle
sizeSlider.addEventListener('input', () => {
    sizeSlider.style.setProperty('--thumb-size', `${sizeSlider.value}px`);
    ctx.lineWidth = sizeSlider.value;
});

// Turn on the background when menu is clicked
menu.addEventListener('click', flipBackground);
// Turn off the background when background is clicked
background.addEventListener('click', (e) => { if (e.target === background) flipBackground(); });

// Applies change when the user changes the color
function changeColor(color) {
    currentColor = color.hex;
    if (erase) return;

    sizeSlider.style.setProperty('--thumb-color', currentColor);
    ctx.strokeStyle = currentColor;
}

// For the color picker
const picker = new Picker({
    parent: document.getElementById('color-picker'),
    popup: false,
    color: '#000000ff', 
    onChange: changeColor
});
// Remove the inherit "Ok" button
document.querySelector('.picker_done').style.display = 'none';


// -------------------------------------------------- Menu/Tools
const currentTool = document.getElementById('current-tool');
const paintbrush = document.getElementById('paintbrush');
const eraser = document.getElementById('eraser');
const trash = document.getElementById('trash');

paintbrush.addEventListener('click', () => {
  erase = false;
  currentTool.style.marginLeft = '0';
  canvas.style.cursor = 'crosshair';
  const color = {hex: currentColor}
  changeColor(color);
});


eraser.addEventListener('click', () => {
  erase = true;
  currentTool.style.marginLeft = '40px';

});

let del = false;
trash.addEventListener('click', () => {
    
    if (del) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        flipBackground();
        return;
    }

    del = true;
    trash.style.animation = 'shake 0.25s ease-in-out 2';

    setTimeout(() => {
        del = false 
        trash.style.animation = 'none';
        trash.offsetHeight;
    }, 500);
});