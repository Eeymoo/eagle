/// Eagle desktop shell — window bootstrap. Kept intentionally minimal:
/// no custom commands yet; the frontend talks to sources via plain HTTP
/// (CSP below) and stores settings in localStorage.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running eagle desktop");
}
