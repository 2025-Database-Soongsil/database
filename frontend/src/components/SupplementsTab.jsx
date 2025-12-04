import { useState, useEffect } from 'react'
import './SupplementsTab.css'
import NutrientDetail from './NutrientDetail'
import CustomSupplementForm from './CustomSupplementForm'
import Modal from './Modal'

const SupplementsTab = ({
  catalog,
  selectedNutrient,
  onSelectNutrient,
  onAddSupplement, // Legacy
  onAddCustom,
  activeSupplements: initialActiveSupplements,
  fetchNutrients,
  fetchUserSupplements,
  addUserSupplement,
  deleteUserSupplement,
  deleteUserSupplementBySupplementId
}) => {
  const [activePeriod, setActivePeriod] = useState('prep_basic')
  const [nutrients, setNutrients] = useState([])
  const [mySupplements, setMySupplements] = useState([])

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: null,
    type: 'alert'
  })

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

  // Fetch user supplements on mount
  useEffect(() => {
    loadUserSupplements()
  }, [])

  const loadUserSupplements = async () => {
    if (fetchUserSupplements) {
      const data = await fetchUserSupplements()
      setMySupplements(data)
    }
  }

  const showModal = (title, message, onConfirm = null, type = 'alert') => {
    setModalConfig({ title, message, onConfirm, type })
    setModalOpen(true)
  }

  const handleToggleSupplement = async (currentNutrient, supplement) => {
    // Check if already added
    const existing = mySupplements.find(s => s.supplement_id === supplement.id)

    if (existing) {
      // Remove with confirmation
      showModal(
        '영양제 제외',
        `'${supplement.name}'을(를) 목록에서 제외하시겠습니까?`,
        async () => {
          if (deleteUserSupplementBySupplementId) {
            try {
              await deleteUserSupplementBySupplementId(supplement.id)
              loadUserSupplements()
              setModalOpen(false)
            } catch (e) {
              console.error(e)
              // Error modal (reuse showModal but simple alert type)
              // Note: calling showModal inside showModal callback might be tricky with current state implementation
              // Ideally we should use a separate error state or just alert for error fallback
              alert('삭제에 실패했습니다.')
            }
          }
        },
        'danger'
      )
    } else {
      // Add
      if (addUserSupplement) {
        try {
          await addUserSupplement(supplement.id)
          showModal('성공', `${supplement.name}이(가) 추가되었습니다!`)
          loadUserSupplements()
        } catch (e) {
          console.error(e)
          showModal('오류', '추가에 실패했습니다.')
        }
      }
    }
  }

  const handleDeleteClick = (id, name) => {
    showModal(
      '영양제 삭제',
      `'${name}'을(를) 목록에서 삭제하시겠습니까?`,
      async () => {
        if (deleteUserSupplement) {
          await deleteUserSupplement(id)
          loadUserSupplements()
          setModalOpen(false)
        }
      },
      'danger'
    )
  }

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
              <NutrientDetail
                current={current}
                onToggleSupplement={handleToggleSupplement}
                mySupplements={mySupplements}
              />
            </>
          ) : (
            <div className="empty-state">해당 시기의 영양소 정보가 없습니다.</div>
          )}
        </div>
      </section>

      {/* 3. Active Supplements / Schedule */}
      <section className="my-schedule-section">
        <h4>복용중인 영양제 💊</h4>
        {mySupplements.length > 0 ? (
          <ul className="schedule-list">
            {mySupplements.map((item) => (
              <li key={item.id} className="schedule-item">
                <div className="item-content">
                  <span className="dot"></span>
                  {item.name}
                </div>
                <button
                  className="delete-btn minus-btn"
                  onClick={() => handleDeleteClick(item.id, item.name)}
                >
                  -
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-schedule">등록된 영양제가 없습니다.</p>
        )}
      </section>

      {/* 4. Custom Form */}
      <CustomSupplementForm onAddCustom={onAddCustom} />

      <Modal
        isOpen={modalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={() => {
          if (modalConfig.onConfirm) modalConfig.onConfirm()
          else setModalOpen(false)
        }}
        onCancel={modalConfig.onConfirm ? () => setModalOpen(false) : null}
        confirmText="확인"
        cancelText={modalConfig.onConfirm ? "취소" : null}
        type={modalConfig.type}
      />
    </div>
  )
}

export default SupplementsTab
