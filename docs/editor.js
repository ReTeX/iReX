let input_element;
let worker;
let view_element;
let nav;
let status_element;
let view;
let mode = localStorage.mode || "svg";

let t0;
let ctx;
let fontsize = 48.0;
let current_size = null;
let zoom_level = 0;
let zoom_factor = 1.0;
let color_stack = [];
let status_message = null;
let render_success = null;

const render = {
    prepare: function(width_f, height_f) {
        let width = Math.ceil(width_f);
        let height = Math.ceil(height_f);
        let canvas = document.createElement("canvas");
        canvas.id = "view-canvas";
        canvas.width = width;
        canvas.height = height;
        canvas.style.height = `${height}px`;
        ctx = canvas.getContext("2d", { alpha: true } );
        current_size = null;
    },
    finish: function() {
        update_view(ctx.canvas);
    },
    symbol: function(x, y, codepoint, size) {
        let glyph = String.fromCodePoint(codepoint);
        if (current_size !== size) {
            ctx.font = `${size}px rex`;
            current_size = size;
        }
        ctx.fillText(glyph, x, y);
    },
    rule: function(x, y, w, h) {
        ctx.fillRect(x, y, w, h);
    },
    color_push: function(r, g, b, a) {
        color_stack.push(ctx.fillStyle);
        ctx.fillStyle = `rgba(${r/255.}, ${g/255.}, ${b/255.}, ${a/255.})`;
    },
    color_pop: function() {
        ctx.fillStyle = color_stack.pop();
    }
};

// Rust FFI
function render_canvas(input) {
    let input_len = lengthBytesUTF8(input);
    let input_data_p = _malloc(input_len+1);
    stringToUTF8(input, input_data_p, input_len+1);
    _render_direct(input_data_p, input_len, fontsize * zoom_factor);
    _free(input_data_p);
}

function render_svg(input) {
    let input_len = lengthBytesUTF8(input);
    let input_data_p = _malloc(input_len+1);
    stringToUTF8(input, input_data_p, input_len+1);
    timestamp = new Date();
    _render_svg(input_data_p, input_len, fontsize);
    _free(input_data_p);
}

function render_done(str) {
    if (str.length == 0) {
        status("empty SVG file");
        return;
    }
    let p = new DOMParser();
    let svg = p.parseFromString(str, "image/svg+xml").firstElementChild;
    svg.id = "view-svg";
    svg.style.zoom = zoom_factor;
    update_view(svg);
}

function status(s) {
    status_element.textContent = s;
}

function send_input(input) {
    render_success = false;
    switch (mode) {
        case 'svg':
            render_svg(input);
            break;
        case 'canvas':
            render_canvas(input);
            break;
    }
}

function send_input_measured(input) {
    t0 = performance.now();
    send_input(input);
    t1 = performance.now();
    status(`mode: ${mode}, time: ${ (t1 - t0).toFixed(3) }ms`);
}

// something was clicked on
function input_from_element(e) {
    let input = e.target.latex;
    input_element.textContent = input;
    send_input_measured(input);
}
// text input changed
function update_input() {
    let input = input_element.textContent;
    localStorage.input = input;
    send_input_measured(input);
}
// render complete
function update_view(element) {
    render_success = true;
    if (view_element) {
        view.removeChild(view_element);
    }
    view_element = element;
    view.appendChild(view_element);
}

Promise.all([
    new Promise(function(resolve, reject) {
        document.addEventListener("DOMContentLoaded", resolve);
    }),
    new FontFace("rex", "url(rex-xits.otf)").load()
]).then(function() {
    view = document.getElementById("view");
    nav = document.getElementById("nav");
    input_element = document.getElementById("input");
    status_element = document.getElementById("status");
    let examples_element = document.getElementById("examples");
    
    let examples = new Request("examples.json");
    fetch(examples)
    .then(response => response.json())
    .then(function(json) {
        for (let ex of json) {
            let e = document.createElement("li");
            e.appendChild(document.createTextNode(ex.title));
            e.latex = ex.latex;
            e.addEventListener("click", input_from_element);
            examples_element.appendChild(e);
        }
    });
    
    input_element.textContent = localStorage.input || "\\mathfrak{R_E} \\mathrm{T_E X}";
    
    let mode_select = document.getElementById("mode-select");
    mode_select.value = mode;
    mode_select.addEventListener("change", function(e) {
        mode = e.target.value;
        localStorage.mode = mode;
        update_input();
    });
    
    input_element.addEventListener("input", update_input);
    update_input();
    status("ready for input");
});

function zoom(level) {
    zoom_level += level;
    zoom_factor = Math.pow(1.3, zoom_level);
    
    if (mode === "canvas") {
        update_input();
    } else {
        view_element.style.zoom = zoom_factor;
    }
}

let test_running = null;
let test_stats;
function test_next() {
    let o = test_running.next();
    if (o.done) {
        test_running = null;
        status(`${ test_stats.success } of ${ test_stats.total } passed`);
        return;
    }
    send_input(o.value);
    if (render_success) {
        test_stats.success += 1;
    } else {
        console.error(`failed: ${o.value}`);
    }
    setTimeout(test_next, 20);
}
function* tests_pass(json) {
    for (let tex of json) {
        yield tex;
    }
}
function test() {
    let pass = new Request("pass.json");
    fetch(pass)
    .then(response => response.json())
    .then(function(json) {
        test_running = tests_pass(json);
        test_stats = {
            total: json.length,
            success: 0
        };
        test_next();
    });
}
