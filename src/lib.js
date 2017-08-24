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
    draw_symbol: function(x, y, codepoint, scale) {
        render.symbol(x, y, codepoint, scale);
    },
    draw_rule: function(x, y, width, height) {
        render.rule(x, y, width, height);
    },
    color_push: function(r, g, b, a) {
        render.color_push(r, g, b, a);
    },
    color_pop: function(color) {
        render.color_pop(color);
    }
});
