import { useState, useEffect } from 'react'
import './SupplementsTab.css'
import NutrientDetail from './NutrientDetail'
import CustomSupplementForm from './CustomSupplementForm'

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
