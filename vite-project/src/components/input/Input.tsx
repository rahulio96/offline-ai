import Send from '../../icons/Send';
import IconButton from '../buttons/IconButton';
import style from './input.module.css'
import { useState } from 'react';

const Input = () => {

    const [text, setText] = useState('');

    const handleSend = () => {
        console.log(text);
        setText('');
    }

    return (
        <div className={style.container}>
            <textarea
                className={style.textarea}
                placeholder='Type here'
                value={text}
                onChange={(e) => { setText(e.target.value) }}
            />
            <IconButton onClick={handleSend}><Send/></IconButton>
        </div>
    )
}

export default Input