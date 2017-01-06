let worker = new Worker('worker.js');
worker.addEventListener('message',
    function(e) {
        let svg = document.getElementById("view");
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
    let input = e.target.value;
    send_input(input);
}

document.addEventListener("DOMContentLoaded", function(e) {
    let input = document.getElementById("input");
    input.addEventListener("change", update_input);
    send_input("x^2");
});
