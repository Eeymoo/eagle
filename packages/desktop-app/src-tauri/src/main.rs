// Eagle desktop shell — Rust main. All app logic lives in the web head
// (@eagle/tauri-ui-plugin); this only boots the WebView window.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    eagle_desktop_lib::run()
}
