let input_element;
let worker;
let svg_element;
let nav;

worker = new Worker('worker.js');
worker.addEventListener('message',
    function(e) {
        svg_element.innerHTML = e.data.svg;
    }
);
function send_input(input) {
    console.log("submit:", input);
    worker.postMessage({
        input: input
    });
}

function input_from_element(e) {
    let input = e.target.latex;
    input_element.value = input;
    send_input(input);
}

function update_input(e) {
    let input = document.getElementById("input").value;
    send_input(input);
}

document.addEventListener("DOMContentLoaded", function(e) {
    svg_element = document.getElementById("view-svg");
    nav = document.getElementById("nav");
    input_element = document.getElementById("input");
    
    var examples = new Request("examples.json");
    fetch(examples)
    .then(response => response.json())
    .then(function(json) {
        for (var ex of json) {
            let p = document.createElement("p");
            p.setAttribute("title", ex.title);
            p.latex = ex.latex;
            p.addEventListener("click", input_from_element);
            nav.appendChild(p);
        }
    });
    
    input_element.addEventListener("change", update_input);
    update_input();
});

let zoom_level = 0;
function zoom(level) {
    zoom_level += level;
    svg_element.style.zoom = Math.pow(1.3, zoom_level);
}
