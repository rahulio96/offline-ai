use ollama_rs::generation::completion::request::GenerationRequest;
use ollama_rs::Ollama;
use tauri::{Window};
use tauri::Emitter;
use futures::StreamExt;


#[tauri::command]
// Stream responses from ollama back to the frontend
async fn chat_response(window: Window, user_message: String) {
  let ollama = Ollama::default();
  let model = "deepseek-r1:7b".to_string();

  let mut stream = ollama.generate_stream(GenerationRequest::new(model, user_message)).await.unwrap();

  while let Some(res) = stream.next().await {
    let responses = res.unwrap();
    for resp in responses {
        let _ = window.emit("stream-message", &resp.response.to_string());
    }
  }
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
