import { useEffect, useState } from "react";
import Input from "../input/Input";
import Message from "../message/Message";
import { useOutletContext } from 'react-router-dom';
import LoadingMessage from "../message/LoadingMessage";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useParams } from 'react-router-dom';

// TODO:
// If the user changes chats, need to stop user's message from going to the backend
// - Add a temp user message to frontend array (might need to do it for backend as well)
// - Once llm responds:
//      - Remove the temp user messsge (pop)
//      - Add both the user and llm's response to the messages array
// Finish home page handleSend (let user type, then send msg, then create a chat, then send to backend)

// TODO: Change this later
import '../../App.css';

type OutletContextType = {
    chatId: number;
    isSidebarOpen: boolean;
    selectedModel: string;
    isResponding: boolean;
    setIsResponding: (isResponding: boolean) => void;
}

type Message = {
    id: number,
    chat_id: number,
    author_model: string,
    content: string,
    created_at: string,
}

export default function ChatPage() {

    const params = useParams();
    const chatId = params.id ? Number(params.id) : 0;
    const { isSidebarOpen, selectedModel, isResponding, setIsResponding } = useOutletContext<OutletContextType>();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [text, setText] = useState<string>('');
    const [response, setResponse] = useState<string>('');

    // We need this since the user could change selected model while the llm is responding
    // So we use this to immediately set the author model to the selected model
    const [authorModel, setAuthorModel] = useState<string>('');

    // How messages work:
    // We have a messages array with all the messages that have been sent (user and llm)
    // When user sends message, it's appended to array
    // When the llm responds to the user, we show a temporary message with the response as it's being streamed from backend
    // Once streaming is done, we set isResponding to false and stop rendering the temporary message
    // We then append the complete llm response to the messages array

    const fetchMessages = async (chatId: number) => {
        try {
            const msgs: Message[] = await invoke('get_messages', { chatId: chatId });
            setMessages(msgs);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    const scrollToBottom = () => {
        const container = document.querySelector('.msgs');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // Fetch messages when chatId changes!!!
    // Also reset state variables here
    useEffect(() => {
        invoke('cancel_chat_response');
        setMessages([]);
        setIsResponding(false);
        setIsLoading(false);
        setResponse('');
        setAuthorModel('');
        fetchMessages(chatId);
        requestAnimationFrame(() => {
            scrollToBottom();
        });
    }, [chatId]);

    useEffect(() => {
        // Listen for stream message from backend
        // Update response with each element from the stream
        const unlisten = listen("stream-message", (event) => {
            setResponse((prev) => prev + (event.payload as string));
        })

        return () => {
            unlisten.then(fn => fn());
        }
    }, [chatId]);

    const addResponse = async () => {
        if (!isResponding && response) {
            // Add the llm's response to the backend and db
            const llmMessage: Message = 
                await invoke(
                    'save_message',
                    { message: response, chatId: chatId, authorModel: authorModel }
                );
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
    }, [response, chatId]);

    const handleSend = async () => {
        if (isResponding) {
            await invoke('cancel_chat_response');
            setIsLoading(false);
            setIsResponding(false);
            return;
        }

        if (text === '') return;

        if (!selectedModel) {
            alert('Please select a model first');
            return;
        }

        const modelName = selectedModel;

        // Add the user's message to the backend and db
        const userMessage: Message = await invoke('save_message', { message: text, chatId: chatId });
        setMessages(prevMessages => [...prevMessages, userMessage]);

        setIsResponding(true);
        setIsLoading(true);

        try {
            setText('');
            setAuthorModel(modelName);
            await invoke('chat_response', { userMessage: text, modelName: modelName, chatId: chatId });
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

    return (
        <>
            <div className={"msgs " + (isSidebarOpen ? "open" : "close")}>
                {messages.map((msg) =>
                    <Message
                        key={msg.id}
                        text={msg.content}
                        isUser={msg.author_model ? false : true}
                        authorModel={msg.author_model}
                    />
                )}

                {isLoading && <LoadingMessage />}

                {/* Temporary msg that only shows when streaming response */}
                {isResponding && <Message text={response} isUser={false} />}
            </div>

            <div className={"inner " + (isSidebarOpen ? "open" : "close")}>
                <Input
                    text={text}
                    setText={setText}
                    handleSend={handleSend}
                    isResponding={isResponding}
                />
            </div>
        </>
    );
}