import { useState } from 'react'
import { generateId } from '../utils/helpers'
import './SupplementsTab.css'

const CustomSupplementForm = ({ onAddCustom, onManage }) => {
    const [customForm, setCustomForm] = useState({
        name: '',
        notes: ''
    })

    const handleInput = (e) => {
        const { name, value } = e.target
        setCustomForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!customForm.name) return

        // onAddCustom is expected to be an async function (API call)
        await onAddCustom(customForm.name, customForm.notes)

        setCustomForm({ name: '', notes: '' })
    }

    return (
        <section className="custom-section">
            <div className="custom-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>직접 등록하기 ✍️</h3>
                <button
                    type="button"
                    onClick={onManage}
                    className="manage-btn"
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    관리
                </button>
            </div>
            <form onSubmit={handleSubmit} className="custom-form">
                <div className="form-row">
                    <input
                        name="name"
                        placeholder="영양제 이름 (필수)"
                        value={customForm.name}
                        onChange={handleInput}
                        className="input-primary"
                        style={{ flex: 1 }}
                    />
                </div>
                <textarea
                    name="notes"
                    placeholder="메모할 내용이 있나요?"
                    value={customForm.notes}
                    onChange={handleInput}
                    className="input-area"
                />
                <button type="submit" className="submit-custom-btn">추가하기</button>
            </form>
        </section>
    )
}

export default CustomSupplementForm
