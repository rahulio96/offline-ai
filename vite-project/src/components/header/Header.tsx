import style from './Header.module.css'

interface props {
    isOpen: boolean
    toggle: () => void
}

export default function Header({toggle, isOpen}: props) {
  return (
    <div className={`${style.container} `}>
        <button className={style.iconBtn} onClick={toggle}>✔</button>
        <h1 className={`${style.header} ${isOpen ? style.open : style.close}`}>Desktop LLM</h1>
    </div>
  )
}
