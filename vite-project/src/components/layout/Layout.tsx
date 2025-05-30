import { useEffect, useState } from "react";
import Header from "../header/Header";
import NewChat from "../newchat/NewChat";
import Sidebar from "../sidebar/Sidebar";
import { invoke } from "@tauri-apps/api/core";
import { Outlet } from "react-router-dom";

// TODO: Change this later
import '../../App.css';

// Handle getting the list of chats for the sidebar
// We then pass it as a prop to the component
type Chat = {
    id: number;
    name: string;
}

export default function Layout() {

    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

    // Selected model from the dropdown
    const [selectedModel, setSelectedModel] = useState<string>('');

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
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
            {isPopupOpen && 
                <NewChat
                    onSave={createNewChat}
                    onCancel={() => setIsPopupOpen(false)}
                    value={newChatName}
                    setValue={setNewChatName} 
                />}

            <Header
                isOpen={isSidebarOpen}
                toggle={toggleSidebar}
                setSelectedModel={setSelectedModel}
            />

            <Sidebar
                isOpen={isSidebarOpen}
                toggle={toggleSidebar}
                setIsOpen={setIsPopupOpen}
                chatList={chatList}
                setChatList={setChatList} 
            />

            <Outlet context={{ isSidebarOpen, selectedModel }} />
        </div>
    );
}