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