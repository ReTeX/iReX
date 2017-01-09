#![feature(link_args)]

extern crate rex;

#[cfg_attr(target_arch="asmjs",
  link_args="-s EXPORTED_FUNCTIONS=['_render'] --js-library src/lib.js")]

extern "C" {
    fn _done(data: *const u8, len: usize);
}

use std::slice;
use std::str;

fn done(data: &[u8]) {
    unsafe {
        _done(data.as_ptr(), data.len());
    }
}

#[no_mangle]
pub extern "C" fn render(input_p: *const u8, input_len: usize) {
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
    done(data.as_bytes());
}

fn main() {}
