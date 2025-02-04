import { useState, useRef, useEffect } from 'react'
import Dots from '../../icons/Dots'
import style from './Sidebar.module.css'
import Trash from '../../icons/Trash'

interface props {
    title: string
    onDelete: () => void
}

export default function ChatBtn({ title, onDelete }: props) {
    const [isDotHover, setIsDotHover] = useState<boolean>(false)
    const [isBtnHover, setIsBtnHover] = useState<boolean>(false)
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)

    const [areDotsFocused, setAreDotsFocused] = useState<boolean>(false)

    const [x, setX] = useState<number>(0)
    const [y, setY] = useState<number>(0)

    const toggleBtnHover = () => {
        if (!areDotsFocused) {
            setIsBtnHover(!isBtnHover)
        }
    }

    const toggleDotHover = () => {
        setIsDotHover(!isDotHover)
    }

    const btnRef = useRef<HTMLButtonElement>(null)

    const openPopup = () => {
        // Get the position of the button
        if (btnRef.current) {
            setX(btnRef.current.getBoundingClientRect().right)
            setY(btnRef.current.getBoundingClientRect().top)
        }
        setIsPopupOpen(!isPopupOpen)
    }

    // Hovering logic for 3 dots button with focus in mind
    useEffect(() => {
        if (areDotsFocused) {
            setIsBtnHover(true)
        } else {
            setIsBtnHover(false)
        }
    }, [areDotsFocused])



    // Deal with 3 dots button focus
    useEffect(() => {
        const inFocus = () => setAreDotsFocused(true)
        const outFocus = () => setAreDotsFocused(false)

        if (btnRef.current) {
            btnRef.current.addEventListener('focus', inFocus)
            btnRef.current.addEventListener('blur', outFocus)
        }

        return () => {
            if (btnRef.current) {
                btnRef.current.removeEventListener('focus', inFocus)
                btnRef.current.removeEventListener('blur', outFocus)
            }
        }
    }, [])

    // Deal with popup focus
    useEffect(() => {
        if (!isBtnHover) {
            setIsPopupOpen(false)
        }
    }, [isBtnHover])

    return (
        <button className={`${style.btn} ${style.chat}`} ref={btnRef} onMouseEnter={toggleBtnHover} onMouseLeave={toggleBtnHover}>
            {title}
            <div className={style.dots} onMouseEnter={toggleDotHover} onMouseLeave={toggleDotHover} onClick={openPopup}>
                {isBtnHover && <Dots color={isDotHover && isBtnHover ? '#FFFFFF' : '#ADADAD'} />}
            </div>

            {isPopupOpen &&
                <div className={`${style.popup}`} style={{ left: x-170, top: y-20}}onClick={onDelete}>
                    <Trash /> <div className={style.delete}>Delete Chat</div>
                    
                </div>}
        </button>
    )
}
