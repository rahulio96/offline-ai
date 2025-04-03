import SidebarRight from '../../icons/SidebarRight'
import IconButton from '../buttons/IconButton'
import Dropdown from '../dropdown/Dropdown'
import style from './Header.module.css'

interface props {
    isOpen: boolean
    toggle: () => void
    setSelectedModel: (s: string) => void
}

export default function Header({toggle, isOpen, setSelectedModel}: props) {
  return (
    <div className={`${style.container}`}>
      <div className={`${style.inner}`}>
        <IconButton onClick={toggle}><SidebarRight /></IconButton>
        <h1 className={`${style.header} ${isOpen ? style.open : style.close}`}>Desktop LLM</h1>
      </div>
        <Dropdown setSelectedModel={setSelectedModel} />
    </div>
  )
}
