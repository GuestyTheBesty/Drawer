// -------------------------------------------------- Variable initializations
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const menu = document.getElementById('menu');
const background = document.getElementById('background');
const sizeSlider = document.getElementById('size-slider');

const currentTool = document.getElementById('current-tool');
const paintbrush = document.getElementById('paintbrush');
const eraser = document.getElementById('eraser');
const trash = document.getElementById('trash');

const strokes = [];
let currentStroke = { width: ctx.lineWidth, color: ctx.strokeStyle, coords: [] };

let mode = 'draw';
let heldDown = false;

let rect = canvas.getBoundingClientRect();
let widthRatio = 1920 / rect.width;
let heightRatio = 1080 / rect.height;


// -------------------------------------------------- Functions
const flipBackground = () => background.hidden = !background.hidden;
const getCanvasXPos = (e) => (e.clientX - rect.left) * widthRatio;
const getCanvasYPos = (e) => (e.clientY - rect.top) * heightRatio;
const resetCurrentStroke = () => currentStroke = { width: ctx.lineWidth, color: ctx.strokeStyle, coords: [] };

function regenerateCanvas() {
	// If the drawing is large, requestAnimationFrame would make it look instant
	requestAnimationFrame( function () {
		const originalWidth = ctx.lineWidth;
		const originalColor = ctx.strokeStyle;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (let i = 0; i < strokes.length; i++) {
			const coords = strokes[i].coords;
			if (coords.length === 0) continue;

			ctx.lineWidth = strokes[i].width;
			ctx.strokeStyle = strokes[i].color;
			ctx.beginPath();
			ctx.moveTo(coords[0].x, coords[0].y);
			for (let k = 0; k < coords.length; k++)
				ctx.lineTo(coords[k].x, coords[k].y);
			ctx.stroke();
		}

		ctx.lineWidth = originalWidth
		ctx.strokeStyle = originalColor;
	});
}

function removeStrokeAt(xPos, yPos) {
	for (let i = strokes.length - 1; i >= 0; i--) {
		const width = strokes[i].width / 2;
		const coords = strokes[i].coords;
    
		// It means there's a circle [Yoo I used distance formula]
		if (coords.length === 1 &&	Math.sqrt((coords[0].x - xPos)**2 + (coords[0].y - yPos)**2) <= width * 2) 
			return strokes.splice(i, 1);

		for (let k = 0; k < coords.length - 1; k++) {
			// Makes it more consistent (x1 is left, y1 is down, x is right, y2 is up)
			const x1 = Math.min(coords[k].x, coords[k+1].x), y1 = Math.min(coords[k+1].y, coords[k+1].y),
						x2 = Math.max(coords[k].x, coords[k+1].x), y2 = Math.max(coords[k+1].y, coords[k+1].y);

			// If not in the general vicinity, return
			if (!(x1 - width <= xPos && xPos <= x2 + width &&
						y1 - width <= yPos && yPos <= y2 + width)) continue;

			// POINT SLOPE FORMULA IM SUCH A MATHEMATICAN
			const slope = x2 - x1 === 0 ? 0 : (y2 - y1) / (x2 - x1);
			const y = slope * (xPos - x1) + y1;
			if (y - width <= yPos && yPos <= y + width) return strokes.splice(i, 1);
		}
	}
}

function isWhitePixel(x, y) { // Forced to add "Pixel" at the end
	const pixel = ctx.getImageData(x, y, 1, 1).data; // Get 1x1 pixel data
	const [r, g, b, a] = pixel;
	if (a === 0 || (r === 255 && g === 255 && b === 255)) return true;
}


// -------------------------------------------------- Canvas
ctx.lineWidth = 8;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

canvas.addEventListener('mousedown', (e) => {
	resetCurrentStroke();
	if (e.button === 0) { // It's a left click
		heldDown = true;
		if (mode === 'erase') {
			canvas.style.cursor = 'grabbing';
		} else if (mode === 'draw') {
			const x = getCanvasXPos(e);
			const y = getCanvasYPos(e);
			currentStroke.coords.push({x, y});

			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x, y);
			ctx.stroke();
		}
	} else if (e.button === 2) { // If it's a right click, swap the modes
		if (mode === 'draw') {
			mode = 'erase';
			currentTool.style.marginLeft = '40px';
			canvas.style.cursor = 'default';
		} else if (mode === 'erase') {
			mode = 'draw';
			currentTool.style.marginLeft = '0';
			canvas.style.cursor = 'crosshair';
		}
	}
});

let deleted = false;
// When you move the mouse around and drawing is true, it starts drawing
canvas.addEventListener('mousemove', (e) => {
	if (!heldDown) return;

	if (mode === 'erase') {
		if (deleted) return;

		const x = getCanvasXPos(e);
		const y = getCanvasYPos(e);
		if (isWhitePixel(x, y)) return;

		// Returns undefined sometimes when calculations are very slightly off.
		if (removeStrokeAt(x, y)) {
			deleted = true;
			setTimeout(() => { deleted = false;	}, 50);
			regenerateCanvas();
		} 
	} else if (mode === 'draw') {
	  const x = getCanvasXPos(e);
	  const y = getCanvasYPos(e);
	  currentStroke.coords.push({x, y});

	  ctx.lineTo(x, y);
	  ctx.stroke();
	}
});

// You're no longer drawing
canvas.addEventListener('mouseup', () => {
	heldDown = false;
	console.log("mouseup");
  if (mode === 'erase') {
		canvas.style.cursor = 'default';
  } else if (mode === 'draw') {
	  if (currentStroke.coords.length > 0) strokes.push(currentStroke);
  }
});

canvas.addEventListener('mouseout', () => {
	heldDown = false;
	if (mode === 'erase') {
		canvas.style.cursor = 'default';
  } else if (mode === 'draw') {
		console.log('draw');
	  if (currentStroke.coords.length > 0) strokes.push(currentStroke);
  }
});

// The width and height ratios should be adjusted if there's a screen resize
window.addEventListener('resize', () => {
	rect = canvas.getBoundingClientRect();
	widthRatio = 1920 / rect.width;
	heightRatio = 1080 / rect.height;
});


// -------------------------------------------------- Menu
menu.addEventListener('click', flipBackground);
background.addEventListener('click', (e) => { if (e.target === background) flipBackground(); });

sizeSlider.addEventListener('input', () => {
	// Dynamically change the slider size as you slide the thumb circle
	sizeSlider.style.setProperty('--thumb-size', `${sizeSlider.value}px`);
	ctx.lineWidth = sizeSlider.value;
});


paintbrush.addEventListener('click', () => {
  mode = 'draw';
  currentTool.style.marginLeft = '0';
  canvas.style.cursor = 'crosshair';
});

eraser.addEventListener('click', () => {
  mode = 'erase';
  currentTool.style.marginLeft = '40px';
  canvas.style.cursor = 'default';
});

let wipe = false;
trash.addEventListener('click', () => {
	if (wipe) {
		strokes.length = 0;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		flipBackground();
		return;
	}

	wipe = true;
	trash.style.animation = 'shake 0.25s ease-in-out 2';

	setTimeout(() => {
		wipe = false 
		trash.style.animation = 'none';
		trash.offsetHeight;
	}, 500);
});

// -------------------------------------------------- Revert/Return
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    console.log(strokes.length, strokes);
    e.preventDefault(); // optional: prevent browser's default undo
    // Your custom undo logic here
	} else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
		console.log("restore");
		regenerateCanvas();
	}
});



// -------------------------------------------------- Application adjustments
// For the color picker [https://vanilla-picker.js.org/]
const picker = new Picker({
	parent: document.getElementById('color-picker'),
	popup: false,
	color: '#000000ff', 
	onChange: function(color) {
		sizeSlider.style.setProperty('--thumb-color', color.hex);
		ctx.strokeStyle = color.hex
	}
});
// Remove the inherit "Ok" button from the color picker
document.querySelector('.picker_done').style.display = 'none';

// Prevents right click menu from appearing when right clicking
document.addEventListener("contextmenu", (e) => e.preventDefault());
