#![feature(link_args)]

extern crate rex;

#[cfg_attr(target_arch="asmjs",
           link_args="-s EXPORTED_FUNCTIONS=['_render','_drop_string']")]
extern {}

use std::slice;
use std::str;

#[no_mangle]
pub extern "C" fn render(input_p: *const u8, input_len: usize) -> *mut String {
    let input_raw = unsafe {
        slice::from_raw_parts(input_p, input_len)
    };
    let input = str::from_utf8(input_raw).expect("invalid utf8");
    println!("input: {}", input);
    
    let svg = rex::SVGRenderer::new()
    .font_size(96.0)
    .font_src("rex-xits.otf")
    .debug(false);
    let data = svg.render(input);
    Box::into_raw(Box::new(data))
}

#[no_mangle]
pub extern "C" fn drop_string(s: *mut String) {
    let b = unsafe {
        Box::from_raw(s)
    };
    drop(b);
}

fn main() {}
