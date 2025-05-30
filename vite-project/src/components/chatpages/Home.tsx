import { useNavigate, useOutletContext } from "react-router-dom";
import Input from "../input/Input";
import { useState } from "react";

// TODO: Change this later
import '../../App.css';

type OutletContextType = {
    chatId: number;
    isSidebarOpen: boolean;
    selectedModel: string;
    chatText?: string;
}

export default function Home() {
    const { isSidebarOpen, selectedModel } = useOutletContext<OutletContextType>();
    const [text, setText] = useState<string>('');

    const navigate = useNavigate();

    // TODO: Change later to create a new chat then naviagte to it and send msg
    const handleSend = async () => {
        navigate("/");
        console.log(`Home scren send clicked ${selectedModel}`);
    }
    
    return (
        <>
            <div className={"msgs " + (isSidebarOpen ? "open" : "close")}>
                <h1>HOME</h1>
            </div>
            <div className={"inner " + (isSidebarOpen ? "open" : "close")}>
                <Input text={text} setText={setText} handleSend={handleSend} />
            </div>
        </>
    );
}