import { createPortal } from 'react-dom'
import './Modal.css'

const Modal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = '확인', cancelText, type = 'alert' }) => {
    if (!isOpen) return null

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-content">
                {title && <h3>{title}</h3>}
                <p>{message}</p>
                <div className="modal-actions">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`action-btn ${type === 'danger' ? 'danger-btn' : 'primary-btn'}`}
                    >
                        {confirmText}
                    </button>
                    {cancelText && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="action-btn secondary-btn"
                        >
                            {cancelText}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}

export default Modal
