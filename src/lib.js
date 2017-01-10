mergeInto(LibraryManager.library, {
    _done: function(ptr, len) {
        render_done(ptr, len);
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
    }
});
