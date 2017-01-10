var input_element;
var worker;
var view_element = null;
var nav;
var status_element = null;
var view;
var mode = "svg";

var t0;
var ctx;
var fontsize = 48.0;
var current_size = null;
var zoom_level = 0;
var zoom_factor = 1.0;

var render = {
    prepare: function(width_f, height_f) {
        var width = Math.ceil(width_f * zoom_factor);
        var height = Math.ceil(height_f * zoom_factor);
        var canvas = document.createElement("canvas");
        canvas.id = "view-canvas";
        canvas.width = width;
        canvas.height = height;
        canvas.style.height = `${height}px`;
        ctx = canvas.getContext("2d");
        current_size = null;
    },
    finish: function() {
        update_view(ctx.canvas);
    },
    bbox: function(x, y, w, h) {
        //ctx.strokeRect(x, y, w, h);
    },
    symbol: function(x, y, codepoint, scale) {
        let glyph = String.fromCodePoint(codepoint);
        let size = scale * fontsize * zoom_factor;
        if (current_size !== size) {
            ctx.font = `${size}px rex`;
            current_size = size;
        }
        ctx.fillText(glyph, x * zoom_factor, y * zoom_factor);
    },
    rule: function(x, y, w, h) {
        ctx.fillRect(x * zoom_factor, y * zoom_factor, w * zoom_factor, h * zoom_factor);
    }
};

// Rust FFI
function render_canvas(input) {
    let input_len = lengthBytesUTF8(input);
    let input_data_p = _malloc(input_len+1);
    stringToUTF8(input, input_data_p, input_len+1);
    _render_direct(input_data_p, input_len);
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

function render_done(data_p, data_len) {
    var data = Module.HEAPU8.subarray(data_p, data_p+data_len);
    var str = UTF8Decoder.decode(data);
    console.log(str);
    if (str.length == 0) {
        status("empty SVG file");
        return;
    }
    var p = new DOMParser();
    var svg = p.parseFromString(str, "image/svg+xml").firstElementChild;
    svg.id = "view-svg";
    svg.zoom = zoom_level;
    update_view(svg);
}

function status(s) {
    status_element.innerHTML = s;
}

function send_input(input) {
    t0 = new Date();
    status(`processing as ${mode} …`);
    switch (mode) {
        case 'svg':
            render_svg(input);
            break;
        case 'canvas':
            render_canvas(input);
            break;
    }
}

// something was clicked on
function input_from_element(e) {
    let input = e.target.latex;
    input_element.textContent = input;
    send_input(input);
}
// text input changed
function update_input() {
    send_input(input_element.textContent);
}
// render complete
function update_view(element) {
    if (view_element) {
        view.removeChild(view_element);
    }
    view_element = element;
    view.appendChild(view_element);
    
    let t1 = new Date();
    status(`mode: ${mode}, time: ${ t1 - t0 }ms`);
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
    
    document.getElementById("mode-select").addEventListener("change", function(e) {
        mode = e.target.value;
        status(`render mode: ${mode}`);
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
