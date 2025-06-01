import Check from '../../icons/Check';
import Close from '../../icons/Close';
import IconButton from '../buttons/IconButton';
import style from './NewChat.module.css'

interface props {
    onYes: () => void;
    onNo: () => void;
}

const ConfirmNavigate = ({onYes, onNo}: props) => {
    return (
        <div className={style.background}>
            <div className={style.container}>
                <h2 className={style.title}>Are you sure?</h2>
                <p className={style.text}>The LLM is currently responding.</p>
                <p className={style.text}>Moving to a different chat will cancel and remove the response.</p>

                <div className={style.btnContainer}>
                    <IconButton onClick={onYes}><Check color="white" /></IconButton>
                    <IconButton onClick={onNo}><Close color="white" /></IconButton>
                </div>

            </div>
        </div>
    )
}

export default ConfirmNavigate;