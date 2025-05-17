// For the color picker
const picker = new Picker({
    parent: document.getElementById('color-picker'),
    popup: false,
    color: '#000000', 
    onDone: function(color) { console.log(color.hex); }
});

const colorsCircles = document.querySelectorAll('.color-circle');

colorsCircles.forEach(color => {
    color.addEventListener('click', () => {
        color.style.backgroundColor = 'yellow';
    })
});

/*
const green = document.getElementById('green');

green.addEventListener('click', () => {
    green.style.backgroundColor = 'red';
})
*/