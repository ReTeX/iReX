var input_element;
var worker;
var view_element;
var nav;
var status_element;
var view;
var mode = "svg";

var t0;
var ctx;
var fontsize = 48.0;
var current_size = null;
var zoom_level = 0;
var zoom_factor = 1.0;
var color_stack = [];
var status_message = null;
var render_success = null;

var render = {
    prepare: function(width_f, height_f) {
        var width = Math.ceil(width_f);
        var height = Math.ceil(height_f);
        var canvas = document.createElement("canvas");
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
    color_push: function(color) {
        color_stack.push(ctx.fillStyle);
        ctx.fillStyle = color;
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
    var p = new DOMParser();
    var svg = p.parseFromString(str, "image/svg+xml").firstElementChild;
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
    send_input_measured(input_element.textContent);
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
    var examples_element = document.getElementById("examples");
    
    var examples = new Request("examples.json");
    fetch(examples)
    .then(response => response.json())
    .then(function(json) {
        for (var ex of json) {
            var e = document.createElement("li");
            e.appendChild(document.createTextNode(ex.title));
            e.latex = ex.latex;
            e.addEventListener("click", input_from_element);
            examples_element.appendChild(e);
        }
    });
    
    document.getElementById("mode-select").addEventListener("change", function(e) {
        mode = e.target.value;
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

var test_running = null;
var test_stats;
function test_next() {
    var o = test_running.next();
    if (o.done) {
        test_running = null;
        status(`${ test_stats.success } of ${ test_stats.total } passed`);
        return;
    }
    send_input(o.value);
    if (render_success) {
        test_stats.success += 1;
    }
    setTimeout(test_next, 20);
}
function* tests_pass(json) {
    for (var tex of json) {
        yield tex;
    }
}
function test() {
    var pass = new Request("pass.json");
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
