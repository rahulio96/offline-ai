import Check from "../../icons/Check";
import Close from "../../icons/Close";
import IconButton from "../buttons/IconButton";
import style from './NewChat.module.css'

interface props {
    onSave: () => void;
    onCancel: () => void;
    value: string;
    setValue: (name: string) => void;
}

const NewChat = ({ onSave, onCancel, value, setValue }: props) => {
    return (
        <div className={style.background}>
            <div className={style.container}>
                <h2 className={style.title}>New Chat</h2>
                <input
                    className={style.input}
                    type="text"
                    placeholder="Enter chat name"
                    value={value}
                    onChange={(e) => { setValue(e.target.value) }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            // Stop newline
                            e.preventDefault();
                            onSave();
                        }
                    }}
                />

                <div className={style.btnContainer}>
                    {/* Save name */}
                    <IconButton onClick={onSave}><Check color="white" /></IconButton>

                    {/* Cancel */}
                    <IconButton onClick={onCancel}><Close color="white" /></IconButton>
                </div>
            </div>
        </div>
    );
}

export default NewChat;