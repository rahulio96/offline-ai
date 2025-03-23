import { useEffect, useState } from 'react'
import './App.css'
import Header from './components/header/Header'
import Sidebar from './components/sidebar/Sidebar'
import Input from './components/input/Input'
import Message from './components/message/Message'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

function App() {

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const [text, setText] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  interface Message {
    text: string;
    isUser: boolean;
  }

  // How messages work:
  // We have a messages array with all the messages that have been sent (user and llm)
  // When user sends message, it's appended to array
  // When the llm responds to the user, we show a temporary message with the response as it's being streamed from backend
  // Once streaming is done, we set isResponding to false and stop rendering the temporary message
  // We then append the complete llm response to the messages array

  useEffect(() => {
    // Listen for stream message from backend
    // Update response with each element from the stream
    const unlisten = listen("stream-message", (event) => {
      setResponse((prev) => prev + (event.payload as string));
    })

    return () => {
      unlisten.then(fn => fn());
    }
  }, []);

  // When we're done streaming the input, we update the messages with the response
  useEffect(() => {
    if (!isResponding && response) {
      setMessages(prevMessages => [...prevMessages, { text: response, isUser: false }]);
      setResponse('');
    }
  }, [response, isResponding]);

  const handleSend = async () => {
    if (text === '' || isResponding) return;
    setMessages(prevMessages => [...prevMessages, { text: text, isUser: true }]);
    setIsResponding(true);

    try {
      setText('');
      await invoke('chat_response', { userMessage: text });
      setIsResponding(false); // We're done streaming the llm's response
    } catch (error) {
      console.error('Error with reponse: ', error);
    }
  }

  const scrollToBottom = () => {
    const container = document.querySelector('.msgs');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // Scroll to bottom of page if response is being streamed or when a new message is appended
  useEffect(() => {
    scrollToBottom();
  }, [messages, response]);

  return (
    <div className="container">
      <Header isOpen={isSidebarOpen} toggle={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      <div className={"msgs " + (isSidebarOpen ? "open" : "close")}>
        {messages.map((msg, i) =>
          <Message key={i} text={msg.text} isUser={msg.isUser} />
        )}

        {/* Temporary msg that only shows when streaming response */}
        {isResponding && <Message text={response} isUser={false} />}
      </div>

      <div className={"inner " + (isSidebarOpen ? "open" : "close")}>
        <Input text={text} setText={setText} handleSend={handleSend} />
      </div>
    </div>
  )
}

export default App
