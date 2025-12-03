import { useState } from 'react'
import { generateId } from '../utils/helpers'
import './SupplementsTab.css'

const NutrientMenu = ({ catalog, currentId, onSelect, activeSupplements }) => (
  <aside className="nutrient-menu">
    <h3>영양소 가이드 📖</h3>
    <div className="menu-list">
      {catalog.map((nutrient) => (
        <button
          key={nutrient.id}
          type="button"
          className={`menu - item ${nutrient.id === currentId ? 'active' : ''} `}
          onClick={() => onSelect(nutrient.id)}
        >
          <span className="label">{nutrient.label ?? nutrient.nutrient}</span>
          <span className="stage-tag">{nutrient.stage}</span>
        </button>
      ))}
    </div>

    <div className="active-summary-card">
      <h4>내 복용 일정 ✨</h4>
      <ul>
        {activeSupplements.length === 0 && <li>등록된 영양제가 없어요.</li>}
        {activeSupplements.map((supplement) => (
          <li key={supplement.id}>
            <span className="dot"></span>
            {supplement.name}
          </li>
        ))}
      </ul>
    </div>
  </aside>
)

const NutrientDetail = ({ current, onAddSupplement }) => (
  <>
    <header className="content-header">
      <h2>{current.nutrient}</h2>
      <p className="desc">{current.description}</p>
      <div className="benefit-tags">
        {current.benefits.map((benefit) => (
          <span key={benefit} className="tag">{benefit}</span>
        ))}
      </div>
    </header>

    <section className="recommend-section">
      <h3>추천 제품 / 섭취 가이드</h3>
      <div className="supplement-grid">
        {current.supplements.map((supplement) => (
          <article key={supplement.id} className="supplement-card">
            <div className="card-header">
              <h4>{supplement.name}</h4>
              <button
                className="add-btn"
                onClick={() => onAddSupplement(current, supplement)}
              >
                내 캘린더에 담기 ＋
              </button>
            </div>
            <p className="schedule-info">🕒 {supplement.schedule}</p>
            {supplement.caution && (
              <p className="caution-info">⚠️ {supplement.caution}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  </>
)

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

const SupplementsTab = ({
  catalog,
  selectedNutrient,
  onSelectNutrient,
  onAddSupplement,
  onAddCustom,
  activeSupplements
}) => {
  const current = catalog.find((item) => item.id === selectedNutrient) ?? catalog[0]

  return (
    <div className="supplements-layout">
      <NutrientMenu
        catalog={catalog}
        currentId={current.id}
        onSelect={onSelectNutrient}
        activeSupplements={activeSupplements}
      />

      <main className="nutrient-content">
        <NutrientDetail current={current} onAddSupplement={onAddSupplement} />
        <CustomSupplementForm onAddCustom={onAddCustom} />
      </main>
    </div>
  )
}

export default SupplementsTab
