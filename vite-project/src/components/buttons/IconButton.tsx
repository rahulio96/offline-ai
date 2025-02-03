import { ReactNode } from 'react'
import style from './IconButton.module.css'

interface props {
    children: ReactNode
    onClick?: () => void
}

export default function IconButton({children, onClick}: props) {
  return (
    <button className={style.btn} onClick={onClick}>
        {children}
    </button>
  )
}
