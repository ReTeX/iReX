let worker = new Worker('worker.js');
worker.addEventListener('message',
    function(e) {
        let svg = document.getElementById("view-svg");
        svg.innerHTML = e.data.svg;
    }
);
function send_input(input) {
    console.log("submit:", input);
    worker.postMessage({
        input: input
    });
}

function update_input(e) {
    let input = document.getElementById("input").value;
    send_input(input);
}

document.addEventListener("DOMContentLoaded", function(e) {
    let input = document.getElementById("input");
    input.addEventListener("change", update_input);
    update_input();
});

let zoom_level = 0;
function zoom(level) {
    zoom_level += level;
    let svg = document.getElementById("view-svg");
    svg.style.zoom = Math.pow(0.7, zoom_level);
}
