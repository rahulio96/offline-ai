import style from './Message.module.css'

interface MessageProps {
    text: string;
    isUser: boolean;
}

const Message = ({text, isUser}: MessageProps) => {
  return (
    <div className={`${style.container} ${isUser ? style.user : ''}`}>
        {text}
    </div>
  )
}

export default Message