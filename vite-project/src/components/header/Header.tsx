import SidebarRight from '../../icons/SidebarRight'
import IconButton from '../buttons/IconButton'
import style from './Header.module.css'

interface props {
    isOpen: boolean
    toggle: () => void
}

export default function Header({toggle, isOpen}: props) {
  return (
    <div className={`${style.container} `}>
        <IconButton onClick={toggle}><SidebarRight /></IconButton>
        <h1 className={`${style.header} ${isOpen ? style.open : style.close}`}>Desktop LLM</h1>
    </div>
  )
}
