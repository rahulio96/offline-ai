use pyo3::prelude::*;
use pyo3::ffi::c_str;

#[tauri::command]
fn chat_response(user_message: String) -> String {
    Python::with_gil(|py| {
        let chat_module = PyModule::from_code(
          py,
          c_str!(r#"def generate_response(user_message: str) -> str:
            return "Echo, " + user_message
            "#),
          c_str!("chat_module.py"),
          c_str!("chat_module"),
        );
        let response: String = chat_module.expect("Failed").getattr("generate_response").expect("Failed").call1((user_message,)).expect("Failed").extract().expect("Failed");
        response
    })
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Initialize the Python interpreter
  pyo3::prepare_freethreaded_python();

  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![chat_response])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
