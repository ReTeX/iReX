importScripts("irex.js");

function render_svg(input) {
        let input_len = lengthBytesUTF8(input);
        let input_data_p = _malloc(input_len+1);
        stringToUTF8(input, input_data_p, input_len+1);
        let output_p = _render(input_data_p, input_len);
        
        let string_ptr = Module.HEAP32[output_p/4];
        let string_len = Module.HEAP32[output_p/4+2];
        
        let output_data = Module.HEAPU8.subarray(string_ptr, string_ptr+string_len);
        let output = UTF8Decoder.decode(output_data);
        
        _drop_string(output_p);
        _free(input_data_p);
        
        return output;
}

self.addEventListener('message', function(e) {
    let svg = render_svg(e.data.input);
    self.postMessage({
        svg: svg
    });
});
