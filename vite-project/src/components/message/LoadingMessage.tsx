import { useEffect, useState } from 'react';
import style from './Message.module.css';

const LoadingMessage = () => {

    const [loadingText, setLoadingText] = useState<string>('Loading');

    const changeLoadingText = () => {
        setLoadingText((prev) => {
            if (prev.length < 10) {
                return prev + '.';
            } else {
                return 'Loading';
            }
        });
    }
    
    // Add dots to 'Loading' every 500ms to let user know it's loading
    useEffect(() => {
        const interval = setInterval(() => {
            changeLoadingText();
        }, 500);

        return () => clearInterval(interval);
    }, []);
    
    return (
        <div className={`${style.container}`}>
            <div className={`${style.loading}`}>{loadingText}</div>
        </div>
    )
}

export default LoadingMessage;