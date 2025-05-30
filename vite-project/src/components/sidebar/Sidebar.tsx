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
}

type Chat = {
    id: number;
    name: string;
}

export default function Sidebar({ toggle, isOpen, setIsOpen, chatList, setChatList }: props) {

    const onDelete = async (id: number) => {
        await invoke('delete_chat', { chatId: id });
        setChatList(chatList.filter(chat => chat.id !== id));
        navigate('/');
    }

    const navigate = useNavigate();

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
                            id={chat.id}
                            onDelete={() => onDelete(chat.id)}
                            title={chat.name}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
