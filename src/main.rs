#![feature(link_args)]

extern crate rex;

type Float = f64;

#[cfg_attr(target_arch="asmjs",
  link_args="-s EXPORTED_FUNCTIONS=['_render_svg','_render_direct'] --js-library src/lib.js")]

extern "C" {
    fn svg_done(data: *const u8, len: usize);
    fn draw_prepare(width: Float, height: Float);
    fn draw_finish();
    fn draw_symbol(x: Float, y: Float, codepoint: u32, size: Float);
    fn draw_rule(x: Float, y: Float, width: Float, height: Float);
    fn color_push(color_p: *const u8, color_len: usize);
    fn color_pop();
}

use std::slice;
use std::str;
use rex::dimensions::{Pixels};
use rex::render::*;

#[no_mangle]
pub extern "C" fn render_svg(input_p: *const u8, input_len: usize, fontsize: Float) {
    let input_raw = unsafe {
        slice::from_raw_parts(input_p, input_len)
    };
    let input = str::from_utf8(input_raw).expect("invalid utf8");
    
    let settings = RenderSettings::default()
        .font_size(fontsize)
        .font_src("rex-xits.otf")
        .debug(false);
    let data: String = SVGRenderer::new(&settings).render(input);
    unsafe {
        svg_done(data.as_ptr(), data.len());
    }
}

#[no_mangle]
pub extern "C" fn render_direct(input_p: *const u8, input_len: usize, fontsize: Float) {
    let input_raw = unsafe {
        slice::from_raw_parts(input_p, input_len)
    };
    let input = str::from_utf8(input_raw).expect("invalid utf8");
    
    IReX::new(
        &RenderSettings::default()
        .font_size(fontsize)
    ).render(input);
}

struct IReX<'a> {
    settings: &'a RenderSettings
}
impl<'a> IReX<'a> {
    fn new(settings: &RenderSettings) -> IReX {
        IReX {
            settings: settings
        }
    }
}
impl<'a> Renderer for IReX<'a> {
    type Out = ();
    
    fn settings(&self) -> &RenderSettings {
        self.settings
    }
    
    fn prepare(&self, _: &mut (), width: Pixels, height: Pixels) {
        unsafe {
            draw_prepare(*width, *height);
        }
    }
    
    fn finish(&self, _: &mut ()) {
        unsafe {
            draw_finish();
        }
    }

    fn symbol(&self, _: &mut (), pos: Cursor, symbol: u32, scale: Float) {
        unsafe {
            draw_symbol(*pos.x, *pos.y, symbol, scale * self.settings.font_size)
        }
    }
    
    fn rule(&self, _: &mut (), pos: Cursor, width: Pixels, height: Pixels) {
        unsafe {
            draw_rule(*pos.x, *pos.y, *width, *height)
        }
    }

    fn color<F>(&self, o: &mut (), color: &str, mut contents: F)
        where F: FnMut(&Self, &mut ())
    {
        unsafe {
            color_push(color.as_ptr(), color.len());
        }
        contents(self, o);
        unsafe {
            color_pop();
        }
    }
    
}

fn main() {}
