// -------------------------------------------------- Variable initializations
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
ctx.lineWidth = 8;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

const menu = document.getElementById('menu');
const background = document.getElementById('background');
const center = document.getElementById('center');
const center2 = document.getElementById('center2');
const result = document.getElementById('result');
let expanded = '';

const sizeSlider = document.getElementById('size-slider');
const currentTool = document.getElementById('current-tool');
const paintbrush = document.getElementById('paintbrush');
const eraser = document.getElementById('eraser');
const trash = document.getElementById('trash');

const forward = document.getElementById('forward');
const backward = document.getElementById('backward');
let canRedo = false, canUndo = false;

const guess = document.getElementById('guess');

const strokes = [];
const actions = new Array(21);
actions[0] = [];
let actionsIndex = 0;
let currentStroke = { width: ctx.lineWidth, color: ctx.strokeStyle, coords: [] };

let mode = 'draw';
let heldDown = false;

let rect = canvas.getBoundingClientRect();
let widthRatio = 1920 / rect.width;
let heightRatio = 1080 / rect.height;


// -------------------------------------------------- Functions
const flipBackground = () => {
	background.hidden = !background.hidden
	center.hidden = false;
	center2.hidden = true;
};
const getCanvasXPos = (e) => (e.clientX - rect.left) * widthRatio;
const getCanvasYPos = (e) => (e.clientY - rect.top) * heightRatio;
const resetCurrentStroke = () => currentStroke = { width: ctx.lineWidth, color: ctx.strokeStyle, coords: [] };

function regenerateCanvas(strokes) {
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

function aboutToDrag(e) {
	heldDown = true;
	if (mode === 'erase') canvas.style.cursor = 'grabbing';
	else if (mode === 'draw') {
		resetCurrentStroke();
		
		const x = getCanvasXPos(e);
		const y = getCanvasYPos(e);
		currentStroke.coords.push({x, y});

		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x, y);
		ctx.stroke();
	}
}

function drawingMode() {
	mode = 'draw';
	currentTool.style.marginLeft = '0';
	canvas.style.cursor = 'crosshair';
}
function erasingMode() {
	mode = 'erase';
	currentTool.style.marginLeft = '40px';
	canvas.style.cursor = 'default';
}

function swapModes() {
	if (mode === 'draw') erasingMode();
	else if (mode === 'erase') drawingMode();
	regenerateCanvas(strokes);
}

function dragging(e) {
	if (!heldDown) return;

	if (mode === 'erase' && !deleted) {
		const x = getCanvasXPos(e);
		const y = getCanvasYPos(e);
		if (isWhitePixel(x, y)) return;

		// Returns undefined sometimes when calculations are very slightly off.
		if (removeStrokeAt(x, y)) {
			deleted = true;
			setTimeout(() => { deleted = false;	}, 50); // There's a 50 ms cooldown between erases
			regenerateCanvas(strokes);
			insertNewAction(strokes);
		} 
	} else if (mode === 'draw') {
		const x = getCanvasXPos(e);
		const y = getCanvasYPos(e);
		currentStroke.coords.push({x, y});

		ctx.lineTo(x, y);
		ctx.stroke();
	}
}

function stopDragging() {
	heldDown = false;
	if (mode === 'erase') canvas.style.cursor = 'default';
  else if (mode === 'draw' && currentStroke.coords.length > 0) {
		strokes.push(currentStroke);
		insertNewAction(strokes);
  }
	resetCurrentStroke();
}

function enableFowards() {
	forward.style.opacity = '1';
	forward.style.cursor = 'pointer';
	canRedo = true;
}
function disableForwards() {
	forward.style.opacity = '.5';
	forward.style.cursor = 'not-allowed';
	canRedo = false;
}

function enableBackwards() {
	backward.style.opacity = '1';
	backward.style.cursor = 'pointer';
	canUndo = true;
}
function disableBackwards() {
	backward.style.opacity = '.5';
	backward.style.cursor = 'not-allowed';
	canUndo = false;
}

function insertNewAction(strokes) {
	if (canRedo) {
		for (let i = actionsIndex + 1; i < actions.length; i++)
			actions[i] = undefined;
		disableForwards();
	}
	enableBackwards();

	const deepCopy = JSON.parse(JSON.stringify(strokes));
	if (actionsIndex === actions.length - 1) {
		actions.shift();
		actions.push(deepCopy);
	} else actions[++actionsIndex] = deepCopy;
}

function redo() {
	if (!canRedo) return;
	enableBackwards();

	actionsIndex++;
	regenerateCanvas(actions[actionsIndex]);
	strokes.length = 0;
	strokes.push(...actions[actionsIndex]);
	
	if (!actions[actionsIndex+1]) disableForwards();
}

function undo() {
	if (!canUndo) return;
	enableFowards();

	actionsIndex--;
	regenerateCanvas(actions[actionsIndex]);
	strokes.length = 0;
	strokes.push(...actions[actionsIndex]);

	if (actionsIndex === 0) disableBackwards();
}

function cropCanvas(canvas) {
	let x1 = 1920, y1 = 0, x2 = 0, y2 = 1080, r = 0;

	for (let i = 0; i < strokes.length; i++) {
		const coords = strokes[i].coords;
		r = Math.max(r, strokes[i].width / 2);
		for (let k = 0; k < coords.length; k++) {
			const x = coords[k].x, y = coords[k].y;
			x1 = Math.min(x1, x), x2 = Math.max(x2, x);
			y1 = Math.max(y1, y), y2 = Math.min(y2, y);
		}
	}
	
	const croppedCanvas = document.createElement('canvas');
	let width = x2 - x1, height = y1 - y2;
	if (width < 120) width = 120;
	croppedCanvas.width = width;
	croppedCanvas.height = height;

	croppedCanvas.getContext('2d').drawImage(
		canvas, 
		x1-r, y2-r, // -r to shift r units to the top and left
		width+r*2, height+r*2, // +r*2 to shift r units to the bottom and right and make up for the previous shift
		0, 0, width, height
	);

	const actual = document.createElement('canvas');
	actual.width = width * 1.5;
	actual.height = height * 1.5;

	actual.getContext('2d').drawImage(
		croppedCanvas,
		width*.25, height*.25
	)

	return actual;
}

function expandResult() {
	background.hidden = false;
	center.hidden = true;
	center2.hidden = false;
	console.log(expanded);
	center2.innerText = `${expanded}`;
}

// -------------------------------------------------- Canvas
canvas.addEventListener('touchstart', (e) => aboutToDrag(e.touches[0]));
canvas.addEventListener('mousedown', (e) => {
	if (e.button === 0) aboutToDrag(e);
	else if (e.button === 2) swapModes();
});

let deleted = false;
canvas.addEventListener('mousemove', dragging);
canvas.addEventListener('touchmove', (e) => dragging(e.touches[0]));

canvas.addEventListener('mouseup', stopDragging);
canvas.addEventListener('mouseout', stopDragging);
canvas.addEventListener('touchend', stopDragging);

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

paintbrush.addEventListener('click', drawingMode);
eraser.addEventListener('click', erasingMode);

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
	}, 500); // Safety mechanism: double click within 500 ms
});

// -------------------------------------------------- Undo/Redo
forward.addEventListener('click', redo);
backward.addEventListener('click', undo);

// Key shortcuts for undoing/redoing
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    e.preventDefault();
		undo();
	} else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
		e.preventDefault();
		redo();
	}
});


// -------------------------------------------------- Send canvas to backend
let message = false;
guess.addEventListener('click', () => {
	if (message) return;

	if (strokes.length === 0) {
		message = true;
		guess.style.backgroundColor = 'red';
		guess.style.cursor = 'not-allowed';
		guess.innerText = 'Draw something!';

		setTimeout(() => {
			message = false;
			guess.style.backgroundColor = '#0d6efd';
			guess.style.cursor = 'pointer';
			guess.innerText = 'Guess';
		}, 1000)
		return;
	}

	cropCanvas(canvas).toBlob(blob => {
		fetch('/guess', {
			method: 'POST',
			headers: {'Content-Type': 'image/png'},
			body: blob
		})
    .then(response => response.json())
    .then((data) => {
			const arr = data.prediction.map((value, index) => ({ value, index }));
			arr.sort((a, b) => b.value - a.value);
			const sortedArr = arr.map(item => [item.index, (item.value*100.0).toFixed(4)]);

			expanded = '';
			for (let i = 0; i < sortedArr.length; i++) {
				expanded += sortedArr[i][1] + "% it is " + sortedArr[i][0];
				if (i != sortedArr.length - 1) expanded += "\n";
			}
			setTimeout(() => {
				result.innerHTML = `
					Is it a ${sortedArr[0][0]}?
					<button onclick="expandResult(expanded)" class="btn btn-secondary btn-sm">Expand</button>
				`;
				
				setTimeout(() => result.innerHTML = ``, 5000);
			}, 500);
		})
    .catch(error => console.error('Error:', error));
	});

	message = true;
	guess.style.backgroundColor = 'green';
	guess.style.cursor = 'not-allowed';
	guess.innerText = 'Processsing...';

	setTimeout(() => {
		message = false;
		guess.style.backgroundColor = '#0d6efd';
		guess.style.cursor = 'pointer';
		guess.innerText = 'Guess';
	}, 500)
	return;
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