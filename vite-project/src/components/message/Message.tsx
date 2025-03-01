import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import style from './Message.module.css'

interface MessageProps {
    text: string;
    isUser: boolean;
}

const Message = ({text, isUser}: MessageProps) => {
  return (
    <div className={`${style.container} ${isUser ? style.user : ''}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}

export default Message