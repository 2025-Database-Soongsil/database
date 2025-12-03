/*import { useState } from 'react'
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
*/
import { useState } from 'react'
import { generateId } from '../utils/helpers'
import './SupplementsTab.css'

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
    <div className="supplements-layout">
      {/* 왼쪽: 영양소 카테고리 메뉴 */}
      <aside className="nutrient-menu">
        <h3>영양소 가이드 📖</h3>
        <div className="menu-list">
          {catalog.map((nutrient) => (
            <button
              key={nutrient.id}
              type="button"
              className={`menu-item ${nutrient.id === current.id ? 'active' : ''}`}
              onClick={() => onSelectNutrient(nutrient.id)}
            >
              <span className="label">{nutrient.label ?? nutrient.nutrient}</span>
              <span className="stage-tag">{nutrient.stage}</span>
            </button>
          ))}
        </div>
        
        {/* 등록된 일정 요약 (사이드바 하단 배치) */}
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

      {/* 오른쪽: 상세 정보 및 액션 */}
      <main className="nutrient-content">
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
      </main>
    </div>
  )
}

export default SupplementsTab
