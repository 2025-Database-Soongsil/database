import { useState } from 'react'
import { generateId } from '../utils/helpers'

const SupplementsTab = ({
  catalog,
  selectedNutrient,
  onSelectNutrient,
  onAddSupplement,
  onAddCustom,
  activeSupplements
}) => {
  const [customForm, setCustomForm] = useState({
    name: '',
    nutrient: '',
    schedule: '',
    notes: ''
  })

  const current = catalog.find((item) => item.id === selectedNutrient) ?? catalog[0]

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
    <div className="supplements-tab">
      <aside className="nutrient-list">
        {catalog.map((nutrient) => (
          <button
            key={nutrient.id}
            type="button"
            className={nutrient.id === current.id ? 'active' : ''}
            onClick={() => onSelectNutrient(nutrient.id)}
          >
            <strong>{nutrient.label ?? nutrient.nutrient}</strong>
            <span>{nutrient.stage}</span>
          </button>
        ))}
      </aside>
      <section className="nutrient-detail">
        <h2>
          {current.nutrient} · {current.stage}
        </h2>
        <p className="nutrient-desc">{current.description}</p>
        <ul className="benefit-list">
          {current.benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
        <div className="supplement-options">
          {current.supplements.map((supplement) => (
            <article key={supplement.id} className="supplement-card">
              <h3>{supplement.name}</h3>
              <p>{supplement.schedule}</p>
              <small>{supplement.caution}</small>
              <button type="button" onClick={() => onAddSupplement(current, supplement)}>
                캘린더에 반영
              </button>
            </article>
          ))}
        </div>
        <div className="custom-section">
          <h3>직접 등록</h3>
          <form onSubmit={handleSubmit}>
            <input
              name="name"
              placeholder="영양제 이름"
              value={customForm.name}
              onChange={handleInput}
            />
            <input
              name="nutrient"
              placeholder="영양소 (선택)"
              value={customForm.nutrient}
              onChange={handleInput}
            />
            <input
              name="schedule"
              placeholder="복용 주기 (예: 매일 09:00)"
              value={customForm.schedule}
              onChange={handleInput}
            />
            <textarea
              name="notes"
              placeholder="주의사항"
              value={customForm.notes}
              onChange={handleInput}
            />
            <button type="submit">캘린더에 추가</button>
          </form>
        </div>
      </section>
      <aside className="active-supplements">
        <h3>등록된 복용 일정</h3>
        <ul>
          {activeSupplements.map((supplement) => (
            <li key={supplement.id}>
              <strong>{supplement.name}</strong>
              <span>{supplement.schedule}</span>
              <small>{supplement.stage}</small>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

export default SupplementsTab
