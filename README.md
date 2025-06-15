<p align="center">
   <img src="https://github.com/user-attachments/assets/400ab8e4-b41f-4e48-aeee-9821a09a5f34" alt=""/>
</p>

# Offline AI
The desktop app that lets you interact with AI LLM models locally on your PC. All conversation history is stored locally, meaning you have full control over your personal data. Once you download and install everything, it also works fully offline!

## Download
- See [GitHub Releases](https://github.com/rahulio96/offline-ai/releases).
- Download either the `.msi` or the `.exe` and install on your device!

## Run Locally
1. Install [prerequisites](https://v2.tauri.app/start/prerequisites/) for Tauri

2. Download and install [Ollama](https://ollama.com/)

2. Clone repository with:
    ```bash
    git clone https://github.com/rahulio96/offline-ai.git
    ```

3. Then run the following commands:
    ```bash 
    cd vite-project
    ```
    ```bash
    npm install
    ```
    ```bash
    npx tauri dev
    ```

## Tech Stack
- Framework: Tauri
- Frontend: React, TypeScript
- Backend: Rust, Ollama
- Database: SQLite
