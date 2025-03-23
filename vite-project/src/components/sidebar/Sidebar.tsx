import { useState } from 'react'
import Home from '../../icons/Home'
import Plus from '../../icons/Plus'
import SidebarLeft from '../../icons/SidebarLeft'
import IconButton from '../buttons/IconButton'
import ChatBtn from './ChatBtn'
import style from './Sidebar.module.css'

interface props {
    toggle: () => void
    isOpen: boolean
}


export default function Sidebar({toggle, isOpen}: props) {
    const [testChats, setTestChats] = useState([1])

    const onDelete = (id: number) => {
        setTestChats(testChats.filter(chat => chat !== id))
        console.log(`Delete ID: ${id}`)
    }

    return (
        <div className={`${style.container} ${isOpen ? style.open : style.close}`}>
            <div className={style.headerSection}>
                <div className={style.headerBtn}>
                    <IconButton><Home /></IconButton>
                    <IconButton onClick={toggle}><SidebarLeft /></IconButton>
                </div>
                <button className={`${style.btn} ${style.new}`}>New Chat <Plus /></button>
            </div>
        
            
            <div className={style.scroll}>
                <div className={style.history}>
                    <div className={style.text}>Chat History</div>
                    {testChats.map((i) => (
                        <ChatBtn key={i} onDelete={() => onDelete(i)} title={`Chat ${i}`} />
                    ))}
                </div>
            </div>
        </div>
    )
}
