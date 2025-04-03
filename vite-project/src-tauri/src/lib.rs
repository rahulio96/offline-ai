use futures::StreamExt;
use ollama_rs::generation::chat::request::ChatMessageRequest;
use ollama_rs::generation::chat::ChatMessage;
use ollama_rs::generation::chat::ChatMessageResponseStream;
use ollama_rs::Ollama;
use tauri::Emitter;
use tauri::Window;
use std::process::Command;

#[tauri::command]
// Get the list of models from ollama
async fn get_modals() -> Vec<String> {
    let ollama = Ollama::default();
    let model_list = ollama.list_local_models().await.unwrap();
    let mut model_names: Vec<String> = vec![];
    for model in model_list {
        let name = model.name;
        model_names.push(name);
    }
    return model_names;
}

// TEMPORARY: Array of chat messages, this would ideally be stored somewhere instead of a global variable
lazy_static::lazy_static! {
  static ref MESSAGES: tokio::sync::Mutex<Vec<ChatMessage>> = tokio::sync::Mutex::new(vec![]);
}

#[tauri::command]
// Stream responses from ollama back to the frontend
async fn chat_response(window: Window, user_message: String, model_name: String) {
    let ollama = Ollama::default();
    let model = model_name.to_string();

    // Get list of messages (history)
    let mut messages = MESSAGES.lock().await;

    // Format user message and add to history
    let user_message = ChatMessage::user(user_message.to_string());
    messages.push(user_message);

    // Response stream from LLM
    let mut stream: ChatMessageResponseStream = ollama
        .send_chat_messages_stream(ChatMessageRequest::new(model, messages.clone()))
        .await
        .unwrap();

    // This variable stores the complete response from the stream
    let mut llm_response = String::new();

    while let Some(res) = stream.next().await {
        let partial_response = res.unwrap().message.content;

        // Send partial response from the stream to the frontend
        let _ = window.emit("stream-message", partial_response.clone());

        // Add partial response to the complete response
        llm_response += partial_response.as_str();
    }

    // Add complete response to the history
    messages.push(ChatMessage::assistant(llm_response));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Start ollama
            Command::new("ollama").arg("serve").spawn().ok();
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![chat_response, get_modals])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
