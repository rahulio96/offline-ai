import { useOutletContext } from "react-router-dom";
import Input from "../input/Input";

// TODO: Change this later
import '../../App.css';

type OutletContextType = {
    isSidebarOpen: boolean;
    selectedModel: string;
    isResponding: boolean;
    setIsResponding: (isResponding: boolean) => void;
    setIsPopupOpen: (isPopupOpen: boolean) => void;
    sentFromHome: boolean;
    setSentFromHome: (sentFromHome: boolean) => void;
    homePageModel: string;
    setHomePageModel: (model: string) => void;
    chatText: string;
    setChatText: (chatText: string) => void;
}

export default function Home() {
    const { 
        isSidebarOpen,
        selectedModel,
        setIsPopupOpen,
        setSentFromHome,
        setHomePageModel,
        chatText,
        setChatText
    } = useOutletContext<OutletContextType>();

    const handleSend = async () => {
        if (chatText.trim() === '') return;

        if (!selectedModel) {
            alert('Please select a model first');
            return;
        }
        setHomePageModel(selectedModel);
        setSentFromHome(true);
        setIsPopupOpen(true);
    }
    
    return (
        <>
            <div className={"msgs " + (isSidebarOpen ? "open" : "close")}>
                <h1>HOME</h1>
            </div>
            <div className={"inner " + (isSidebarOpen ? "open" : "close")}>
                <Input text={chatText} setText={setChatText} handleSend={handleSend} />
            </div>
        </>
    );
}