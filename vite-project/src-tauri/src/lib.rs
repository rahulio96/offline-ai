use futures::StreamExt;
use ollama_rs::generation::chat::request::ChatMessageRequest;
use ollama_rs::generation::chat::ChatMessage;
use ollama_rs::generation::chat::ChatMessageResponseStream;
use ollama_rs::Ollama;
use tauri::App;
use tauri::Emitter;
use tauri::Manager;
use tauri::Window;
use std::fs;
use std::process::Command;
use std::sync::Mutex;
use rusqlite::{Connection, Result};

#[tauri::command]
// Get the list of models from ollama
async fn get_models() -> Vec<String> {
    let ollama = Ollama::default();
    let model_list = ollama.list_local_models().await.unwrap();
    let mut model_names: Vec<String> = vec![];
    for model in model_list {
        let name = model.name;
        model_names.push(name);
    }
    return model_names;
}

// Initialize SQLite database
fn init_db(app: &App) -> Result<Connection> {

    // Create db file in app data directory (AppData/Roaming/com.tauri.com/llm.db)
    let path = app.path().app_data_dir().expect("Failed to get app data dir").join("llm.db");

    // Create directory if it doesn't exist
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).expect("Failed to create app data directory");
        }
    }

    let conn = Connection::open(path)?;

    // Init tables
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS message (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats(id)
        );
    ")?;
    
    Ok(conn)
}

struct Chat {
    id: i32,
    name: String,
}

// need to fetch all chats
#[tauri::command]
async fn get_chats(state: tauri::State<'_, DbState>) -> Result<Vec<Vec<String>>, String> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, created_at FROM chats ORDER BY created_at DESC").unwrap();
    let chat_iter = stmt.query_map([], |row| {
        Ok(Chat {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    }).unwrap();

    let mut chats = Vec::new();
    for chat in chat_iter {
        let mut chat_item = Vec::<String>::new();
        if let Ok(chat) = chat {
            chat_item.push(chat.id.to_string());
            chat_item.push(chat.name);
            chats.push(chat_item);
        }
    }

    Ok(chats)
}

// need to fetch all messages from a chat
// need to save a message to a chat (also adds it to the fetched messages array)
// need to save a chat (when creating a new chat, or renaming an existing one)
// delete chat (and all associated messages)

// When changing a chat, we'll need to fetch messages from db
// When sending a message to the llm, need to save user message to db along with llm's response
//      We'll also add it to the fetched messages array at the same time, so we don't need to fetch twice

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

// Struct to hold the database connection state
pub struct DbState {
    pub conn: Mutex<Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Connect to db
            let conn = init_db(&app).expect("Failed to initialize DB");
            app.manage(DbState {
                conn: Mutex::new(conn),
            });

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

        // API commands
        .invoke_handler(tauri::generate_handler![
            chat_response,
            get_models,
            get_chats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
