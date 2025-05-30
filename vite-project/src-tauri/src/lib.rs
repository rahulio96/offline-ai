use futures::StreamExt;
use ollama_rs::generation::chat::request::ChatMessageRequest;
use ollama_rs::generation::chat::ChatMessage;
use ollama_rs::generation::chat::ChatMessageResponseStream;
use ollama_rs::Ollama;
use rusqlite::params;
use tauri::App;
use tauri::Emitter;
use tauri::Manager;
use tauri::Window;
use std::fs;
use std::process::Command;
use std::sync::Mutex;
use rusqlite::{Connection, Result};
use serde::Serialize;

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
            author_model TEXT,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats(id)
        );
    ")?;
    
    Ok(conn)
}

// TODO LIST:
// need to save a chat (when creating a new chat, or renaming an existing one)
// delete chat (and all associated messages)

// Global variable that holds messages for the current chat
lazy_static::lazy_static! {
  static ref MESSAGES: tokio::sync::Mutex<Vec<ChatMessage>> = tokio::sync::Mutex::new(vec![]);
}

#[derive(Serialize)]
struct Chat {
    id: i32,
    name: String,
}

// Just create a new chat
#[tauri::command]
async fn create_chat(state: tauri::State<'_, DbState>, name: String) -> Result<Chat, String> {
    let conn = state.conn.lock().unwrap();
    conn.execute("INSERT INTO chats (name) VALUES (?1)", params![name]).unwrap();
    
    // Get the last inserted chat id
    let last_id = conn.last_insert_rowid();
    
    Ok(Chat {
        id: last_id as i32,
        name,
    })
}

// Fetch all chats
#[tauri::command]
async fn get_chats(state: tauri::State<'_, DbState>) -> Result<Vec<Chat>, String> {
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
        if let Ok(chat) = chat {
            chats.push(chat);
        }
    }

    Ok(chats)
}

#[derive(Serialize)]
struct CustomChatMessage {
    id: i32,
    chat_id: i32,
    author_model: Option<String>,
    content: String,
    created_at: String,
}

// Fetch all messages from the current chat
#[tauri::command]
async fn get_messages(state: tauri::State<'_, DbState>, chat_id: i32) -> Result<Vec<CustomChatMessage>, String> {
    // Locking here, so we need to put it in a closure to avoid issues
    let (frontend_messages, backend_messages) = {
        let conn = state.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, chat_id, author_model, content, created_at FROM message WHERE chat_id = ? ORDER BY created_at ASC").unwrap();
        let message_iter = stmt.query_map([chat_id], |row| {
            Ok(CustomChatMessage {
                id: row.get(0)?,
                chat_id: row.get(1)?,
                author_model: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        }).unwrap();

        // Update both the global messages variable and the frontend messages
        let mut frontend_messages = Vec::new();
        let mut backend_messages = Vec::new();

        for message in message_iter {
            if let Ok(message) = message {
                let parsed_msg: ChatMessage = serde_json::from_str(&message.content).unwrap();

                // Backend will get the message in the format that ollama uses
                backend_messages.push(parsed_msg.clone());

                // Frontend ditches the extra info from the ollama format and only uses the content
                frontend_messages.push(CustomChatMessage {
                    id: message.id,
                    chat_id: message.chat_id,
                    author_model: message.author_model,
                    content: parsed_msg.content,
                    created_at: message.created_at,
                });
            }
        }
        (frontend_messages, backend_messages)
    };

    // Now update the global messages variable
    let mut global_messages = MESSAGES.lock().await;
    global_messages.clear();
    global_messages.extend(backend_messages);

    Ok(frontend_messages)
}

#[tauri::command]
async fn save_message(state: tauri::State<'_, DbState>, message: String, chat_id: i32, author_model: Option<String>) -> Result<CustomChatMessage, String> {
    // Get list of messages (history)
    let mut messages = MESSAGES.lock().await;

    // Format user message and add to history
    let user_message = ChatMessage::user(message.to_string());
    let user_json_content = serde_json::to_string(&user_message).unwrap();

    let row;

    // Insert user message into DB (lock only for this block)
    {
        let conn = state.conn.lock().unwrap();

        if author_model.is_some() {
            // If author_model is provided, use it
            conn.execute("INSERT INTO MESSAGE (chat_id, author_model, content) VALUES (?1, ?2, ?3)",
                params![chat_id, author_model, user_json_content]).unwrap();
        } else {
            // Otherwise, insert without author_model
            conn.execute("INSERT INTO MESSAGE (chat_id, content) VALUES (?1, ?2)",
                params![chat_id, user_json_content]).unwrap();
        }

        // Once we insert, we fetch it from the db to get info like msg id (will be useful later for deleting/editing)
        let last_id = conn.last_insert_rowid();
        let mut stmt = conn.prepare("SELECT id, chat_id, author_model, created_at FROM message WHERE id = ?", ).unwrap();
            row = stmt.query_row([last_id], |row| {
            Ok(CustomChatMessage {
                id: row.get(0)?,
                chat_id: row.get(1)?,
                author_model: row.get(2)?,
                content: message.clone(),
                created_at: row.get(3)?,
            })
        }).unwrap();
    }

    messages.push(user_message);

    Ok(row)
}

#[tauri::command]
// Stream responses from ollama back to the frontend
async fn chat_response(window: Window, model_name: String) -> Result<(), String> {
    let ollama = Ollama::default();
    let model = model_name.to_string();
    let messages = MESSAGES.lock().await;

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

    Ok(())
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
            get_messages,
            save_message,
            create_chat,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
