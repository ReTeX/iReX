#![feature(link_args)]

extern crate rex;

#[cfg_attr(
    target_arch="asmjs",
    link_args="-s TOTAL_MEMORY=33554432 --js-library src/lib.js --memory-init-file 1"
)]

extern "C" {
    fn svg_done(data: *const u8, len: usize);
    fn draw_prepare(width: i32, height: i32);
    fn draw_finish();
    fn draw_symbol(x: i32, y: i32, codepoint: u32, size: f32);
    fn draw_rule(x: i32, y: i32, width: i32, height: i32);
    fn color_push(r: u8, g: u8, b: u8, a: u8);
    fn color_pop();
}

use std::slice;
use std::str;
use rex::render::*;
use rex::fp::F24P8;
use rex::parser::color::RGBA;

#[no_mangle]
pub extern "C" fn render_svg(input_p: *const u8, input_len: usize, fontsize: u16) {
    let input_raw = unsafe {
        slice::from_raw_parts(input_p, input_len)
    };
    let input = str::from_utf8(input_raw).expect("invalid utf8");
    
    let settings = RenderSettings::default()
        .font_size(fontsize)
        .font_src("rex-xits.otf")
        .debug(false);
    if let Ok(data) = SVGRenderer::<Vec<u8>>::new(&settings).render(input) {
        unsafe {
            svg_done(data.as_ptr(), data.len());
        }
    }
}

#[no_mangle]
pub extern "C" fn render_direct(input_p: *const u8, input_len: usize, fontsize: u16) {
    let input_raw = unsafe {
        slice::from_raw_parts(input_p, input_len)
    };
    let input = str::from_utf8(input_raw).expect("invalid utf8");
    
    IReX::new(
        &RenderSettings::default()
        .font_size(fontsize)
    ).render(input).unwrap();
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
    
    fn prepare(&self, _: &mut (), width: F24P8, height: F24P8) {
        unsafe {
            draw_prepare(width.bits, height.bits);
        }
    }
    
    fn finish(&self, _: &mut ()) {
        unsafe {
            draw_finish();
        }
    }

    fn symbol(&self, _: &mut (), pos: Cursor, symbol: u32, scale: f64) {
        unsafe {
            draw_symbol(pos.x.bits, pos.y.bits, symbol, scale as f32* self.settings.font_size as f32)
        }
    }
    
    fn rule(&self, _: &mut (), pos: Cursor, width: F24P8, height: F24P8) {
        unsafe {
            draw_rule(pos.x.bits, pos.y.bits, width.bits, height.bits)
        }
    }

    fn color<F>(&self, o: &mut (), color: RGBA, mut contents: F)
        where F: FnMut(&Self, &mut ())
    {
        unsafe {
            color_push(color.0, color.1, color.2, color.3);
        }
        contents(self, o);
        unsafe {
            color_pop();
        }
    }
    
}

fn main() {}
