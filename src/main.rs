#![feature(link_args)]

extern crate rex;

#[cfg_attr(target_arch="asmjs",
  link_args="-s EXPORTED_FUNCTIONS=['_render_svg','_render_direct'] --js-library src/lib.js")]

extern "C" {
    fn _done(data: *const u8, len: usize);
    fn draw_prepare(width: Float, height: Float);
    fn draw_finish();
    fn draw_bbox(x: Float, y: Float, width: Float, height: Float);
    fn draw_symbol(x: Float, y: Float, codepoint: u32, scale: Float);
    fn draw_rule(x: Float, y: Float, width: Float, height: Float);
}

use std::slice;
use std::str;
use rex::dimensions::{Pixels, Float};
use rex::render::{Renderer, RenderSettings, SVGRenderer};


fn done(data: &[u8]) {
    unsafe {
        _done(data.as_ptr(), data.len());
    }
}

#[no_mangle]
pub extern "C" fn render_svg(input_p: *const u8, input_len: usize, fontsize: Float) {
    let input_raw = unsafe {
        slice::from_raw_parts(input_p, input_len)
    };
    let input = str::from_utf8(input_raw).expect("invalid utf8");
    println!("input: {}", input);
    
    let mut data = String::new();
    let settings = RenderSettings::default()
        .font_size(fontsize)
        .font_src("rex-xits.otf")
        .debug(false);
    SVGRenderer::new(&mut data, &settings).render(input);
    done(data.as_bytes());
}

#[no_mangle]
pub extern "C" fn render_direct(input_p: *const u8, input_len: usize) {
    let input_raw = unsafe {
        slice::from_raw_parts(input_p, input_len)
    };
    let input = str::from_utf8(input_raw).expect("invalid utf8");
    println!("input: {}", input);
    
    IReX::new(&RenderSettings::default()).render(input);
}

struct IReX<'a> {
    cursor_x: Float,
    cursor_y: Float,
    settings: &'a RenderSettings
}
impl<'a> IReX<'a> {
    fn new(settings: &RenderSettings) -> IReX {
        IReX {
            cursor_x: 0.0,
            cursor_y: 0.0,
            settings: settings
        }
    }
}
impl<'a> Renderer for IReX<'a> {
    fn settings(&self) -> &RenderSettings {
        self.settings
    }
    
    fn g<F>(&mut self, off_x: Pixels, off_y: Pixels, mut contents: F)
    where F: FnMut(&mut Self) {
        contents(&mut IReX {
            cursor_x: self.cursor_x + *off_x,
            cursor_y: self.cursor_y + *off_y,
            settings: self.settings
        })
    }

    fn prepare(&mut self, width: Pixels, height: Pixels) {
        unsafe {
            draw_prepare(*width, *height);
        }
    }
    
    fn finish(&mut self) {
        unsafe {
            draw_finish();
        }
    }
    
    fn bbox(&mut self, width: Pixels, height: Pixels) {
        unsafe {
            draw_bbox(self.cursor_x, self.cursor_y, *width, *height);
        }
    }

    fn symbol(&mut self, symbol: u32, scale: Float) {
        unsafe {
            draw_symbol(self.cursor_x, self.cursor_y, symbol, scale)
        }
    }
    
    fn rule(&mut self, x: Pixels, y: Pixels, width: Pixels, height: Pixels) {
        unsafe {
            draw_rule(self.cursor_x + *x, self.cursor_y + *y, *width, *height)
        }
    }

    fn color<F>(&mut self, color: &str, mut contents: F)
        where F: FnMut(&mut Self)
    {
        contents(self)
    }
    
}

fn main() {}
