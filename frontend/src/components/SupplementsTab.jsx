import { useState, useEffect } from 'react'
import { generateId } from '../utils/helpers'
import './SupplementsTab.css'

const NutrientDetail = ({ current, onAddSupplement }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Reset expansion when nutrient changes
  useEffect(() => {
    setIsExpanded(false)
  }, [current.id])

  // Parse description to separate main text and sub text (in parentheses)
  const parseDescription = (text) => {
    if (!text) return { main: '', sub: null }
    const match = text.match(/^(.*?)\s*\((.*?)\)\s*$/)
    if (match) {
      return { main: match[1], sub: match[2] }
    }
    return { main: text, sub: null }
  }

  const { main, sub } = parseDescription(current.description)

  const supplements = current.supplements || []
  const visibleSupplements = isExpanded ? supplements : supplements.slice(0, 2)
  const showToggle = supplements.length > 2

  return (
    <>
      <header className="content-header">
        <h2>{current.name}</h2>
        <p className="desc">{main}</p>
        {sub && <p className="sub-desc">{sub}</p>}
        <div className="benefit-tags">
          {current.benefits?.map((benefit) => (
            <span key={benefit} className="tag">{benefit}</span>
          ))}
        </div>
      </header>

      <section className="recommend-section">
        <h3>추천 제품 / 섭취 가이드</h3>
        <div className="supplement-grid">
          {visibleSupplements.length > 0 ? (
            visibleSupplements.map((supplement) => (
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
            ))
          ) : (
            <p className="empty-message">추천 제품 정보가 없습니다.</p>
          )}
        </div>

        {showToggle && (
          <button
            className="toggle-more-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '접기 ▲' : '더보기 ▼'}
          </button>
        )}
      </section>
    </>
  )
}

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
  activeSupplements,
  fetchNutrients
}) => {
  const [activePeriod, setActivePeriod] = useState('prep_basic')
  const [nutrients, setNutrients] = useState([])

  const periods = [
    { id: 'prep_basic', label: '기초 준비기' },
    { id: 'prep_focus', label: '집중 준비기' },
    { id: 'ovulation', label: '임박기' },
    { id: 'pregnancy_all', label: '임신 중' }
  ]

  // Fetch nutrients when activePeriod changes
  useEffect(() => {
    const loadNutrients = async () => {
      if (fetchNutrients) {
        const data = await fetchNutrients(activePeriod)
        setNutrients(data)
        // If current selection is not in new data, select first
        if (data.length > 0) {
          // Check if selectedNutrient is in data
          const exists = data.find(n => n.id === selectedNutrient)
          if (!exists) {
            onSelectNutrient(data[0].id)
          }
        }
      }
    }
    loadNutrients()
  }, [activePeriod, fetchNutrients, selectedNutrient, onSelectNutrient])

  // Determine active nutrient from the fetched list
  const current = nutrients.find(n => n.id === selectedNutrient) || nutrients[0]

  return (
    <div className="supplements-layout">
      {/* 1. Period Guide Section (Includes Selection + Content) */}
      <section className="period-guide-section">
        <h3>시기별 가이드 📅</h3>

        {/* Period Buttons */}
        <div className="period-buttons">
          {periods.map((period) => (
            <button
              key={period.id}
              className={`period-btn ${activePeriod === period.id ? 'active' : ''}`}
              onClick={() => setActivePeriod(period.id)}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Nutrient Content (Tabs + Detail) */}
        <div className="nutrient-content-area">
          {nutrients.length > 0 ? (
            <>
              <div className="nutrient-tabs">
                {nutrients.map(nutrient => (
                  <button
                    key={nutrient.id}
                    className={`nutrient-tab ${nutrient.id === current?.id ? 'active' : ''}`}
                    onClick={() => onSelectNutrient(nutrient.id)}
                  >
                    {nutrient.name}
                  </button>
                ))}
              </div>
              <NutrientDetail current={current} onAddSupplement={onAddSupplement} />
            </>
          ) : (
            <div className="empty-state">해당 시기의 영양소 정보가 없습니다.</div>
          )}
        </div>
      </section>

      {/* 3. Active Supplements / Schedule */}
      <section className="my-schedule-section">
        <h4>내 복용 일정 💊</h4>
        {activeSupplements.length > 0 ? (
          <ul className="schedule-list">
            {activeSupplements.map((item) => (
              <li key={item.id}>
                <span className="dot"></span>
                {item.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-schedule">등록된 일정이 없습니다.</p>
        )}
      </section>

      {/* 4. Custom Form */}
      <CustomSupplementForm onAddCustom={onAddCustom} />
    </div>
  )
}

export default SupplementsTab
