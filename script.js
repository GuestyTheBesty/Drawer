const menu = document.getElementById('menu');
const background = document.getElementById('background');
const sizeSlider = document.getElementById('size-slider');
let currentColor = `#000000ff`;

// Change the color of the slider
function changeColor(color) {
  currentColor = color.hex;
  sizeSlider.style.setProperty('--thumb-color', currentColor);
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

menu.addEventListener('click', () => {
  background.hidden = false;
});

background.addEventListener('click', (e) => {
  if (e.target === background) background.hidden = true;
});
