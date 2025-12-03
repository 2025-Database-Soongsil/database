import { useState } from 'react'
import { generateId } from '../utils/helpers'
import './SupplementsTab.css'

const CustomSupplementForm = ({ onAddCustom }) => {
    const [customForm, setCustomForm] = useState({
        name: '',
        nutrient: '',
        schedule: '',
        notes: ''
    })

    const handleInput = (e) => {
        const { name, value } = e.target
        setCustomForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!customForm.name || !customForm.schedule) return
        onAddCustom({
            id: generateId(),
            ...customForm,
            stage: '사용자 지정'
        })
        setCustomForm({ name: '', nutrient: '', schedule: '', notes: '' })
    }

    return (
        <section className="custom-section">
            <h3>직접 등록하기 ✍️</h3>
            <form onSubmit={handleSubmit} className="custom-form">
                <div className="form-row">
                    <input
                        name="name"
                        placeholder="영양제 이름 (필수)"
                        value={customForm.name}
                        onChange={handleInput}
                        className="input-primary"
                    />
                    <input
                        name="schedule"
                        placeholder="복용 시간 (예: 아침 식후)"
                        value={customForm.schedule}
                        onChange={handleInput}
                        className="input-primary"
                    />
                </div>
                <input
                    name="nutrient"
                    placeholder="관련 영양소 (선택)"
                    value={customForm.nutrient}
                    onChange={handleInput}
                    className="input-secondary"
                />
                <textarea
                    name="notes"
                    placeholder="메모할 내용이 있나요?"
                    value={customForm.notes}
                    onChange={handleInput}
                    className="input-area"
                />
                <button type="submit" className="submit-custom-btn">일정 추가하기</button>
            </form>
        </section>
    )
}

export default CustomSupplementForm
