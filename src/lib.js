mergeInto(LibraryManager.library, {
    svg_done: function(ptr, len) {
        var data = UTF8Decoder.decode(Module.HEAPU8.subarray(ptr, ptr+len));
        render_done(data);
    },
    draw_prepare: function(width, height) {
        render.prepare(width, height);
    },
    draw_finish: function() {
        render.finish();
    },
    draw_bbox: function(x, y, w, h) {
        render.bbox(x, y, w, h);
    },
    draw_symbol: function(x, y, codepoint, scale) {
        render.symbol(x, y, codepoint, scale);
    },
    draw_rule: function(x, y, width, height) {
        render.rule(x, y, width, height);
    },
    color_push: function(ptr, len) {
        var data = UTF8Decoder.decode(Module.HEAPU8.subarray(ptr, ptr+len));
        render.color_push(data);
    },
    color_pop: function(color) {
        render.color_pop(color);
    }
});
