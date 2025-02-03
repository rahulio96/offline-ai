import style from './Sidebar.module.css'

interface props {
    toggle: () => void
    isOpen: boolean
}


export default function Sidebar({toggle, isOpen}: props) {

    return (
        <div className={`${style.container} ${isOpen ? style.open : style.close}`}>
            <div className={style.headerBtn}>
                <button className={style.iconBtn}>H</button>
                <button className={style.iconBtn} onClick={toggle}>✖</button>
            </div>
        
            <button>New Chat</button>

            <h4>Chat History</h4>
            <button>Chat 1</button>
            <button>Chat 2</button>
            <button>Chat 3</button>
        </div>
    )
}
