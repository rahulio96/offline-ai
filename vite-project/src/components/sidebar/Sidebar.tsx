import { useState } from 'react'
import Dots from '../../icons/Dots'
import Home from '../../icons/Home'
import Plus from '../../icons/Plus'
import SidebarLeft from '../../icons/SidebarLeft'
import IconButton from '../buttons/IconButton'
import style from './Sidebar.module.css'

interface props {
    toggle: () => void
    isOpen: boolean
}


export default function Sidebar({toggle, isOpen}: props) {

    const [isDotHover, setIsDotHover] = useState<boolean>(false)
    const [isBtnHover, setIsBtnHover] = useState<boolean>(false)

    const toggleBtnHover = () => {
        setIsBtnHover(!isBtnHover)
    }

    const toggleDotHover = () => {
        setIsDotHover(!isDotHover)
    }

    return (
        <div className={`${style.container} ${isOpen ? style.open : style.close}`}>
            <div className={style.headerBtn}>
                <IconButton><Home /></IconButton>
                <IconButton onClick={toggle}><SidebarLeft /></IconButton>
            </div>
        
            <button className={`${style.btn} ${style.new}`}>New Chat <Plus /></button>

            <div className={style.text}>Chat History</div>
            <button className={`${style.btn} ${style.chat}`} onMouseEnter={toggleBtnHover} onMouseLeave={toggleBtnHover}>
                Chat 1
                <div className={style.dots} onMouseEnter={toggleDotHover} onMouseLeave={toggleDotHover}>
                    {isBtnHover && <Dots color={isDotHover ? '#FFFFFF' : '#ADADAD'}/>}
                </div>
            </button>
            <button className={`${style.btn} ${style.chat}`}>Chat 2</button>
            <button className={`${style.btn} ${style.chat}`}>Chat 3</button>
        </div>
    )
}
