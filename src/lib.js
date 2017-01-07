mergeInto(LibraryManager.library, {
    _done: function(ptr, len) {
        render_done(ptr, len);
    }
});
