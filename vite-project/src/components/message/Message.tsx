import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import style from './Message.module.css'
import { useEffect, useState } from 'react';
import IconButton from '../buttons/IconButton';
import Trash from '../../icons/Trash';
import Copy from '../../icons/Copy';
import Check from '../../icons/Check';

interface MessageProps {
  text: string;
  isUser: boolean;
  areEditOptionsVisible: boolean;
  authorModel?: string;
  onDelete?: () => void;
}

const Message = ({ text, isUser, authorModel, onDelete, areEditOptionsVisible }: MessageProps) => {

  const [thinkText, setThinkText] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const [displayText, setDisplayText] = useState<string>('');

  function replaceThinkTags(text: string) {
    const thinkTagRegex = /<\/?think>/g;
    return text.replace(thinkTagRegex, '');
  }

  // Process thinking text (what the llm is thinking) and display text (actual response)
  useEffect(() => {

    // This is how we know if the LLM returns its thoughts in a response
    if (text.length == 7 && text.startsWith('<think>')) {
      setIsThinking(true);
      setDisplayText('');
    }

    // Hide think tags
    if (isThinking) {
      setThinkText(replaceThinkTags(text));
    }

    // We reached the end of the LLM thinking
    if (text.endsWith('</think>')) {
      setIsThinking(false);
    }

    // This case is important, as it applies to messages that are being streamed AND previous messages
    if (!isThinking) {
      let thinkLength = thinkText.length;
      if (text.startsWith('<think>')) {
        const idx = text.search('</think>');
        thinkLength = idx + 8;
        setThinkText(replaceThinkTags(text.slice(0, thinkLength)));
      }

      // Include author model if it's there
      if (authorModel) {
        setDisplayText(text.slice(thinkLength, text.length) + `\n\n**Author Model:** ${authorModel}`);
      } else {
        setDisplayText(text.slice(thinkLength, text.length));
      }
    }

  }, [text, isThinking]);

  const [isHovered, setIsHovered] = useState<boolean>(false);

  // For changing icon from copy to checkmark when user clicks
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const onCopy = () => {
    navigator.clipboard.writeText(text);
    setIsChecked(true);
    setTimeout(() => {
      setIsChecked(false);
    }, 1000);
  }

  return (
    <div
      className={`${style.container} ${isUser ? style.userContainer : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`${style.box} ${isUser ? style.user : ''}`}>
        <div className={`${style.thinking}`}>
          {thinkText &&
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}>
              {thinkText}
            </ReactMarkdown>}
        </div>

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}>
          {displayText}
        </ReactMarkdown>
      </div>
 
      <div className={`
          ${style.btn} ${isUser ? style.userbtn : ''}
          ${style.fade} ${isHovered && !isThinking ? style.show : ''}
      `}>
          {/* Don't allow delete/edit options if it's loading or responding */}
          {areEditOptionsVisible && <IconButton onClick={onDelete}><Trash /></IconButton>}
          <IconButton onClick={onCopy}>
            {isChecked ? <Check color='currentColor' size='20' /> : <Copy />}
          </IconButton>
      </div>
    </div>
  )
}

export default Message