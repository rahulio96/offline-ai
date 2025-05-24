import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import style from './Message.module.css'
import { useEffect, useState } from 'react';

interface MessageProps {
  text: string;
  isUser: boolean;
}

const Message = ({ text, isUser }: MessageProps) => {

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
      setDisplayText(text.slice(thinkLength, text.length));
    }

  }, [text, isThinking]);

  return (
    <div className={`${style.container} ${isUser ? style.user : ''}`}>
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
  )
}

export default Message