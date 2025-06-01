import { invoke } from '@tauri-apps/api/core'
import Home from '../../icons/Home'
import Plus from '../../icons/Plus'
import SidebarLeft from '../../icons/SidebarLeft'
import IconButton from '../buttons/IconButton'
import ChatBtn from './ChatBtn'
import style from './Sidebar.module.css'
import { useNavigate } from 'react-router-dom'

interface props {
    toggle: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    chatList: Chat[];
    setChatList: (chatList: Chat[]) => void;
    chatId: number;
    isResponding: boolean;
    setIsConfirmOpen: (isOpen: boolean) => void;
    setNavId: (id: number) => void;
}

type Chat = {
    id: number;
    name: string;
}

export default function Sidebar({
    toggle,
    isOpen,
    setIsOpen,
    chatList,
    setChatList,
    chatId,
    isResponding,
    setIsConfirmOpen,
    setNavId
 }: props) {

    const onDelete = async (id: number) => {
        await invoke('delete_chat', { chatId: id });
        setChatList(chatList.filter(chat => chat.id !== id));
        navigate('/');
    }

    const navigate = useNavigate();

    const navigateToChat = (id: number) => {
        setNavId(id);
        if (isResponding) {
            setIsConfirmOpen(true);
        } else {
            navigate(`/chats/${id}`);
        }
    }

    return (
        <div className={`${style.container} ${isOpen ? style.open : style.close}`}>
            <div className={style.headerSection}>
                <div className={style.headerBtn}>
                    <IconButton onClick={() => navigate('/')}><Home /></IconButton>
                    <IconButton onClick={toggle}><SidebarLeft /></IconButton>
                </div>
                <button className={`${style.btn} ${style.new}`} onClick={() => setIsOpen(true)}>New Chat <Plus /></button>
            </div>


            <div className={style.scroll}>
                <div className={style.history}>
                    <div className={style.text}>Chat History</div>
                    {chatList.map((chat) => (
                        <ChatBtn
                            key={chat.id}
                            onDelete={() => onDelete(chat.id)}
                            title={chat.name}
                            isFocused={chatId === chat.id}
                            navigateToChat={() => navigateToChat(chat.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
