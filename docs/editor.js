let input_element;
let worker;
let svg_element = null;
let nav;
let status = null;
let view_element;

worker = new Worker('worker.js');

function send_input(input) {
    worker.postMessage({
        input: input
    });
    
    status.innerHTML = "processing …";
}

function input_from_element(e) {
    let input = e.target.latex;
    input_element.textContent = input;
    send_input(input);
}

function update_input(e) {
    send_input(input_element.textContent);
}
function update_view(e) {
    let data = e.data;
    
    if (svg_element) {
        view.removeChild(svg_element);
        svg_element = null;
    }
    let t0 = new Date();
    if (e.data.svg.length) {
        let p = new DOMParser();
        let svg = p.parseFromString(data.svg, "image/svg+xml");
        svg.id = "view-svg";
        
        svg_element = svg.firstElementChild;
        zoom(0);
        view.appendChild(svg_element);
    }
    let t1 = new Date();
    status.innerHTML = `rex: ${ data.time }ms, parsing: ${ t1 - t0 }ms`;
}

document.addEventListener("DOMContentLoaded", function(e) {
    view_element = document.getElementById("view");
    nav = document.getElementById("nav");
    input_element = document.getElementById("input");
    status = document.getElementById("status");
    
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
    
    worker.addEventListener('message', update_view);
    input_element.addEventListener("input", update_input);
    update_input();
});

let zoom_level = 0;
function zoom(level) {
    zoom_level += level;
    svg_element.style.zoom = Math.pow(1.3, zoom_level);
}
