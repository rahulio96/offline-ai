import { useEffect, useState } from 'react';
import './App.css';
import Header from './components/header/Header';
import Sidebar from './components/sidebar/Sidebar';
import Input from './components/input/Input';
import Message from './components/message/Message';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import LoadingMessage from './components/message/LoadingMessage';
import NewChat from './components/newchat/NewChat';

function App() {

  // TODO CHANGE LATER
  const CHAT_ID = 1;

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [text, setText] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  // Selected model from the dropdown
  const [selectedModel, setSelectedModel] = useState<string>('');

  // We need this since the user could change selected model while the llm is responding
  // So we use this to immediately set the author model to the selected model
  const [authorModel, setAuthorModel] = useState<string>('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  type Message = {
    id: number,
    chat_id: number,
    author_model: string,
    content: string,
    created_at: string,
  }

  // How messages work:
  // We have a messages array with all the messages that have been sent (user and llm)
  // When user sends message, it's appended to array
  // When the llm responds to the user, we show a temporary message with the response as it's being streamed from backend
  // Once streaming is done, we set isResponding to false and stop rendering the temporary message
  // We then append the complete llm response to the messages array

  const fetchMessages = async (chatId: number) => {
    try {
      const msgs: Message[] = await invoke('get_messages', { chatId: chatId });
      console.log(JSON.stringify(msgs));
      setMessages(msgs);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  // Handle getting the list of chats for the sidebar
  // We then pass it as a prop to the component
  type Chat = {
    id: number;
    name: string;
  }

  const [chatList, setChatList] = useState<Chat[]>([]);

  const fetchChats = async () => {
    setChatList([]);
    try {
      setChatList(await invoke('get_chats'));
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  }

  useEffect(() => {
    fetchChats();
  }, []);

  const scrollToBottom = () => {
    const container = document.querySelector('.msgs');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  useEffect(() => {
    fetchMessages(CHAT_ID);
    scrollToBottom();
  }, [])

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

  const addResponse = async () => {
    if (!isResponding && response) {
      // Add the llm's response to the backend and db
      const llmMessage: Message = await invoke('save_message', { message: response, chatId: CHAT_ID, authorModel: authorModel });
      setMessages(prevMessages => [...prevMessages, llmMessage]);
      setResponse('');
    }
  }

  // When we're done streaming the input, we update the messages with the response
  useEffect(() => {
    addResponse();
  }, [response, isResponding]);

  // Stop loading animation once we get anything streamed from the LLM
  useEffect(() => {
    if (isLoading && response != '') {
      setIsLoading(false);
    }
  }, [response]);

  const handleSend = async () => {
    if (text === '' || isResponding) return;

    if (!selectedModel) {
      alert('Please select a model first');
      return;
    }

    const modelName = selectedModel;

    // Add the user's message to the backend and db
    const userMessage: Message = await invoke('save_message', { message: text, chatId: CHAT_ID });
    setMessages(prevMessages => [...prevMessages, userMessage]);

    setIsResponding(true);
    setIsLoading(true);

    try {
      setText('');
      setAuthorModel(modelName);
      await invoke('chat_response', { userMessage: text, modelName: modelName, chatId: CHAT_ID });
    } catch (error) {
      setIsLoading(false);
      console.error('Error with reponse: ', error);
    } finally {
      setIsResponding(false); // We're done streaming the llm's response
    }
  }

  // Scroll to bottom of page if response is being streamed or when a new message is appended
  useEffect(() => {
    scrollToBottom();
  }, [messages, response]);

  // Manage creating a new chat
  const [newChatName, setNewChatName] = useState<string>('');

  const createNewChat = async () => {
    const chatName = newChatName.trim();
    if (chatName === '') {
      return;
    }

    try {
      // Create a new chat in the backend and db
      const newChat: Chat = await invoke('create_chat', { name: chatName });
      setChatList(prevChats => [newChat, ...prevChats]);
      setNewChatName('');
      setIsPopupOpen(false);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  }

  return (
    <div className="container">
      {isPopupOpen && <NewChat onSave={createNewChat} onCancel={() => setIsPopupOpen(false)} value={newChatName} setValue={setNewChatName} />};
      <Header isOpen={isSidebarOpen} toggle={toggleSidebar} setSelectedModel={setSelectedModel} />
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} setIsOpen={setIsPopupOpen} chatList={chatList} />
      <div className={"msgs " + (isSidebarOpen ? "open" : "close")}>
        {messages.map((msg, i) =>
          <Message key={i} text={msg.content} isUser={msg.author_model ? false : true} authorModel={msg.author_model} />
        )}

        {isLoading && <LoadingMessage />}

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
