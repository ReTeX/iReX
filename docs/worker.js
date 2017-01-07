importScripts("irex.js");

function render_svg(input) {
        let input_len = lengthBytesUTF8(input);
        let input_data_p = _malloc(input_len+1);
        stringToUTF8(input, input_data_p, input_len+1);
        _render(input_data_p, input_len);
        _free(input_data_p);
}

function render_done(data_p, data_len) {
    let data = Module.HEAPU8.subarray(data_p, data_p+data_len);
    self.postMessage({
        svg: UTF8Decoder.decode(data)
    });
}

self.addEventListener('message', function(e) {
    render_svg(e.data.input);
});
