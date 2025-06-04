import { useOutletContext } from "react-router-dom";
import Input from "../input/Input";
import style from './Chat.module.css';

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
    setIsConfirmOpen: (isConfirmOpen: boolean) => void;
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
            <div className={`${style.home} ${style.msgs} ` + (isSidebarOpen ? `${style.open}` : `${style.close}`)}>
                <p>👋 Welcome to Offline AI.</p>
                <p>🚀 Select an AI model, type below, and get started!</p>
            </div>
            <div className={`${style.inner} ` + (isSidebarOpen ? `${style.open}` : `${style.close}`)}>
                <Input
                    text={chatText}
                    setText={setChatText}
                    handleSend={handleSend}
                    handleStop={() => { }}
                />
            </div>
        </>
    );
}