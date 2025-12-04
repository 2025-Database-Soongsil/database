import { useState, useEffect } from 'react'
import { getWeightStatus } from '../utils/helpers'
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './MyPageTab.css' // CSS 파일 임포트



const ProfileForm = ({
  nickname,
  onNicknameChange,
  height,
  preWeight,
  currentWeight,
  onLocalChange,
  onSave,
  gender,
  isPregnant,
  onPregnancyChange,
  lastPeriodDate,
  dueDate,
  onDateChange,
  canAnalyze,
  onAnalyze,
  isAnalyzing
}) => {
  // 값이 입력되지 않았을 경우 0으로 처리하여 계산 오류 방지
  // Local state is used for display, so we keep it as string or number as entered

  const handleNumberInput = (field, value) => {
    // Allow empty
    if (value === '') {
      onLocalChange(field, value)
      return
    }
    // Regex: Max 3 digits integer, optional 1 decimal place
    // Matches: 1, 12, 123, 1., 1.2, 12.3, 123.4
    if (/^\d{0,3}(\.\d{0,1})?$/.test(value)) {
      onLocalChange(field, value)
    }
  }

  return (
    <section className="profile-card card-box">
      <div className="profile-header-row">
        <h3>{gender === 'male' ? '내 정보' : '신체 정보 입력 📝'}</h3>
        {gender === 'female' && (
          <button className="primary-btn save-btn" onClick={onSave}>저장</button>
        )}
      </div>

      <div className="field-group">
        <label>닉네임 (수정 불가)</label>
        <input
          name="nickname"
          value={nickname}
          disabled
          className="styled-input disabled"
        />
      </div>

      {gender === 'female' && (
        <div className="field-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isPregnant}
              onChange={(e) => onPregnancyChange(e.target.checked)}
            />
            <span className="check-text">현재 임신 중이에요 🤰</span>
          </label>

          {isPregnant && (
            <div className="field-row" style={{ marginTop: '12px' }}>
              <div>
                <label>마지막 생리 시작일</label>
                <input
                  type="date"
                  className="styled-input"
                  value={lastPeriodDate || ''}
                  onChange={(e) => onDateChange('lastPeriod', e.target.value)}
                />
              </div>
              <div>
                <label>출산 예정일</label>
                <input
                  type="date"
                  className="styled-input"
                  value={dueDate || ''}
                  onChange={(e) => onDateChange('dueDate', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {gender === 'female' && (
        <>
          <div className="field-group">
            <div className="field-row">
              <div>
                <label>키(cm)</label>
                <input
                  type="number"
                  name="height"
                  min="0"
                  placeholder="-"
                  value={height}
                  onChange={(e) => handleNumberInput('height', e.target.value)}
                  className="styled-input large"
                />
              </div>
              <div>
                <label>준비 전 체중(kg)</label>
                <input
                  type="number"
                  name="pre"
                  min="0"
                  placeholder="-"
                  value={preWeight}
                  onChange={(e) => handleNumberInput('pre', e.target.value)}
                  className="styled-input large"
                />
              </div>
            </div>
          </div>

          <div className="field-group">
            <label>현재 체중(kg)</label>
            <input
              type="number"
              name="current"
              min="0"
              placeholder="-"
              value={currentWeight}
              onChange={(e) => handleNumberInput('current', e.target.value)}
              className="styled-input large"
            />
          </div>

          <button
            className={`primary-btn analyze-btn ${canAnalyze && !isAnalyzing ? '' : 'disabled'}`}
            onClick={onAnalyze}
            disabled={!canAnalyze || isAnalyzing}
          >
            {isAnalyzing ? '분석 중...' : '분석'}
          </button>
        </>
      )}
    </section>
  )
}



const WeightAnalysis = ({ height, preWeight, currentWeight }) => {
  const result = getWeightStatus(height, preWeight, currentWeight)
  const safeHeight = Number(height) || 0;
  const safePreWeight = Number(preWeight) || 0;
  const safeCurrentWeight = Number(currentWeight) || 0;

  if (safeHeight <= 0 || safePreWeight <= 0 || safeCurrentWeight <= 0 || !result) {
    return null
  }

  return (
    <section className="report-card card-box">
      <h3>체중 변화 분석 📊</h3>
      <div className="stat-row">
        <div className="stat-item">
          <span className="label">현재 BMI</span>
          <strong className="value">{result.bmi}</strong>
        </div>
        <div className="stat-item">
          <span className="label">체중 변화</span>
          <strong className={`value ${result.gained > 0 ? 'plus' : ''}`}>
            {result.gained > 0 ? '+' : ''}{result.gained}kg
          </strong>
        </div>
      </div>
      <div className="advice-box">
        <p className="target-range">권장 증가 범위: {result.target}</p>
        <p className="message">{result.message}</p>
      </div>
    </section>
  )
}
const WeightGraph = ({ preWeight, currentWeight, minGain, maxGain, currentWeek }) => {
  // Generate data for 0 to 40 weeks
  const data = []
  for (let week = 0; week <= 40; week += 4) {
    // Calculate recommended range (linear interpolation)
    const minW = preWeight + (minGain * (week / 40))
    const maxW = preWeight + (maxGain * (week / 40))

    // User data (only up to current week)
    let myW = null
    if (week === 0) myW = preWeight
    else if (week <= currentWeek && week >= currentWeek - 4) myW = currentWeight // Approximate for display

    // Better logic: linear interpolation for user weight
    // Week 0: preWeight
    // Current Week: currentWeight
    // We only have two points, so we can draw a line between them.
    // But the chart needs data points at intervals.

    if (week <= currentWeek) {
      const progress = week / currentWeek
      myW = preWeight + ((currentWeight - preWeight) * progress)
    }

    data.push({
      week: `${week}주`,
      min: Number(minW.toFixed(1)),
      max: Number(maxW.toFixed(1)),
      my: myW ? Number(myW.toFixed(1)) : null,
      range: [Number(minW.toFixed(1)), Number(maxW.toFixed(1))]
    })
  }

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 20 }}>
      <ComposedChart width={320} height={250} data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
        <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} />
        <Tooltip />
        {/* Recommended Range Area */}
        <Area
          type="monotone"
          dataKey="range"
          stroke="none"
          fill="#e3f2fd"
          name="권장 범위"
        />
        {/* User Weight Line */}
        <Line
          type="monotone"
          dataKey="my"
          stroke="#ff4081"
          strokeWidth={3}
          dot={{ r: 4 }}
          name="나의 체중"
        />
      </ComposedChart>
    </div>
  )
}

const AnalysisResultModal = ({ isOpen, onClose, result, preWeight, currentWeight, weeks }) => {
  const [showGraph, setShowGraph] = useState(false)

  if (!isOpen || !result) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <section className="report-card card-box" style={{ boxShadow: 'none', padding: 0 }}>
          <h3>AI 체중 분석 🤖</h3>

          {!showGraph ? (
            <>
              <div className="stat-row">
                <div className="stat-item">
                  <span className="label">현재 BMI</span>
                  <strong className="value">{Number(result.bmi).toFixed(2)}</strong>
                </div>
                <div className="stat-item">
                  <span className="label">체중 변화</span>
                  <strong className={`value ${result.gained > 0 ? 'plus' : ''}`}>
                    {result.gained > 0 ? '+' : ''}{result.gained}kg
                  </strong>
                </div>
              </div>
              <div className="advice-box">
                <p className="target-range">현재 주수 권장 증가: {result.current_week_gain_range}</p>
                <p className="target-range">전체 기간 권장 증가: {result.total_gain_range}</p>
                <hr style={{ margin: '10px 0', border: '0', borderTop: '1px solid #eee' }} />
                <p className="message">{result.message}</p>
              </div>
            </>
          ) : (
            <WeightGraph
              preWeight={preWeight}
              currentWeight={currentWeight}
              minGain={result.min_recommended_gain || 11.5}
              maxGain={result.max_recommended_gain || 16.0}
              currentWeek={weeks}
            />
          )}

        </section>
        <div className="modal-actions" style={{ flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="secondary-btn"
            style={{ width: '100%' }}
          >
            {showGraph ? '분석 결과 보기' : '그래프로 보기 📈'}
          </button>
          <button onClick={onClose} className="primary-btn" style={{ width: '100%' }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
const AddNoteModal = ({ isOpen, onClose, onSave }) => {
  const [content, setContent] = useState('')
  const [visitDate, setVisitDate] = useState('')

  useEffect(() => {
    if (isOpen) {
      setContent('')
      setVisitDate(new Date().toISOString().split('T')[0])
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }
    onSave(content, visitDate)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content note-modal">
        <h3>진료 기록 추가 📝</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>방문 날짜</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="styled-input"
              required
            />
          </div>
          <div className="input-group">
            <label>진료 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예: 아기 심장 소리 들음, 초음파 사진 받음"
              className="styled-input"
              rows={4}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="primary-btn">저장</button>
            <button type="button" onClick={onClose} className="secondary-btn">취소</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const DoctorsNoteSection = ({ fetchNotes, createNote, deleteNote }) => {
  const [notes, setNotes] = useState([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    if (fetchNotes) {
      const data = await fetchNotes()
      setNotes(data)
    }
  }

  const handleAddNote = async (content, visitDate) => {
    if (createNote) {
      await createNote(content, visitDate)
      loadNotes()
    }
  }

  const handleDeleteClick = (id) => {
    setDeleteTargetId(id)
  }

  const confirmDelete = async () => {
    if (deleteTargetId && deleteNote) {
      await deleteNote(deleteTargetId)
      setDeleteTargetId(null)
      loadNotes()
    }
  }

  return (
    <section className="doctors-note-card card-box" style={{ marginTop: '20px' }}>
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>🩺 닥터스 노트</h3>
        <button onClick={() => setIsAddModalOpen(true)} className="primary-btn small">
          + 기록 추가
        </button>
      </div>

      <ul className="note-list">
        {notes.length === 0 && <li className="empty-msg">기록된 진료 노트가 없습니다.</li>}
        {notes.map((note) => (
          <li key={note.id} className="note-item">
            <div className="note-info">
              <span className="note-date">{note.visit_date || note.created_at.split('T')[0]}</span>
              <span className="note-content">{note.content}</span>
            </div>
            <button onClick={() => handleDeleteClick(note.id)} className="delete-btn minus-btn" title="삭제">
              -
            </button>
          </li>
        ))}
      </ul>

      <AddNoteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddNote}
      />

      <Modal
        isOpen={!!deleteTargetId}
        title="기록 삭제"
        message="정말 이 진료 기록을 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
        confirmText="삭제"
        cancelText="취소"
      />
    </section>
  )
}

const HealthTips = ({ tips }) => {
  return (
    <section className="tips-card card-box" style={{ marginTop: '20px' }}>
      <h3>💡 건강 팁</h3>
      <ul className="tip-list">
        {tips && tips.length > 0 ? (
          tips.map((tip) => (
            <li key={tip.id}>{tip.content}</li>
          ))
        ) : (
          <>
            <li>🌙 수면 패턴을 규칙적으로 유지하세요.</li>
            <li>☕ 카페인은 하루 200mg(약 1잔) 이하로!</li>
            <li>💧 하루 2L 물 마시기, 잊지 마세요.</li>
          </>
        )}
      </ul>
    </section>
  )
}

import Modal from './Modal'

const MyPageTab = ({ nickname, onNicknameChange, height, preWeight, currentWeight, onProfileChange, onSaveProfile, gender, isPregnant, pregnancyDates, onPregnancyChange, fetchDoctorsNotes, createDoctorsNote, deleteDoctorsNote, healthTips, refreshHealthTips }) => {
  // Local state for editing
  const [localHeight, setLocalHeight] = useState(height || '')
  const [localPreWeight, setLocalPreWeight] = useState(preWeight || '')
  const [localCurrentWeight, setLocalCurrentWeight] = useState(currentWeight || '')
  const [localLastPeriod, setLocalLastPeriod] = useState(pregnancyDates?.lastPeriodDate || '')
  const [localDueDate, setLocalDueDate] = useState(pregnancyDates?.dueDate || '')
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: ''
  })

  // Sync local state if props change (e.g. after save or external update)
  useEffect(() => {
    setLocalHeight(height || '')
    setLocalPreWeight(preWeight || '')
    setLocalCurrentWeight(currentWeight || '')
    setLocalLastPeriod(pregnancyDates?.lastPeriodDate || '')
    setLocalDueDate(pregnancyDates?.dueDate || '')
  }, [height, preWeight, currentWeight, pregnancyDates])

  // Refresh health tips when LEAVING MyPage (to prevent flicker on enter)
  useEffect(() => {
    return () => {
      if (refreshHealthTips) {
        refreshHealthTips()
      }
    }
  }, []) // Empty dependency array means cleanup runs on unmount

  const handleLocalChange = (field, value) => {
    if (field === 'height') setLocalHeight(value)
    if (field === 'pre') setLocalPreWeight(value)
    if (field === 'current') setLocalCurrentWeight(value)
  }

  const handlePregnancyChange = (checked) => {
    onPregnancyChange(checked, {
      lastPeriodDate: localLastPeriod,
      dueDate: localDueDate
    })
  }

  const handleDateChange = (field, value) => {
    if (field === 'lastPeriod') setLocalLastPeriod(value)
    if (field === 'dueDate') setLocalDueDate(value)

    // Auto-save dates if pregnant is checked
    if (isPregnant) {
      onPregnancyChange(true, {
        lastPeriodDate: field === 'lastPeriod' ? value : localLastPeriod,
        dueDate: field === 'dueDate' ? value : localDueDate
      })
    }
  }

  const handleSave = async () => {
    // Validate pregnancy dates if pregnant
    if (isPregnant) {
      if (!localLastPeriod || !localDueDate) {
        setModalState({
          isOpen: true,
          title: '입력 오류',
          message: '임신 중인 경우 마지막 생리 시작일과 출산 예정일을 모두 입력해주세요.'
        })
        return
      }
    }

    // onProfileChange updates local state in App.jsx (optional if we reload from API)
    // But we should call onSaveProfile to persist to DB
    if (onSaveProfile) {
      const success = await onSaveProfile({
        height: localHeight ? Number(localHeight) : null,
        preWeight: localPreWeight ? Number(localPreWeight) : null,
        currentWeight: localCurrentWeight ? Number(localCurrentWeight) : null
      })
      if (success) {
        setModalState({
          isOpen: true,
          title: '알림',
          message: '저장되었습니다.'
        })
      }
    } else {
      // Fallback for legacy behavior
      onProfileChange('height', localHeight)
      onProfileChange('pre', localPreWeight)
      onProfileChange('current', localCurrentWeight)
      setModalState({
        isOpen: true,
        title: '알림',
        message: '저장되었습니다.'
      })
    }
  }

  const canAnalyze = gender === 'female' &&
    isPregnant &&
    localLastPeriod &&
    localDueDate &&
    localHeight &&
    localPreWeight &&
    localCurrentWeight

  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!canAnalyze) return

    setIsAnalyzing(true)
    try {
      // Calculate weeks
      const today = new Date()
      const start = new Date(localLastPeriod)
      const diffTime = Math.abs(today - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const weeks = Math.floor(diffDays / 7)

      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const res = await fetch(`${API_BASE}/users/analyze-weight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('bp-auth')).token}`
        },
        body: JSON.stringify({
          height: Number(localHeight),
          preWeight: Number(localPreWeight),
          currentWeight: Number(localCurrentWeight),
          weeks: weeks
        })
      })

      if (!res.ok) throw new Error('Analysis failed')

      const data = await res.json()
      setAnalysisResult(data)
      setShowAnalysisModal(true)
    } catch (e) {
      alert('분석 중 오류가 발생했습니다.')
      console.error(e)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="mypage-container">
      <header className="mypage-header">
        <div className="profile-icon">💖</div>
        <h2>{nickname}님의 마이페이지</h2>
      </header>

      <ProfileForm
        nickname={nickname}
        onNicknameChange={onNicknameChange}
        height={localHeight}
        preWeight={localPreWeight}
        currentWeight={localCurrentWeight}
        onLocalChange={handleLocalChange}
        onSave={handleSave}
        gender={gender}
        isPregnant={isPregnant}
        onPregnancyChange={handlePregnancyChange}
        lastPeriodDate={localLastPeriod}
        dueDate={localDueDate}
        onDateChange={handleDateChange}
        canAnalyze={canAnalyze}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      <AnalysisResultModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        result={analysisResult}
        preWeight={Number(localPreWeight)}
        currentWeight={Number(localCurrentWeight)}
        weeks={(() => {
          if (!pregnancyDates?.lastPeriodDate) return 0
          const today = new Date()
          const start = new Date(pregnancyDates.lastPeriodDate)
          const diffTime = Math.abs(today - start)
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return Math.floor(diffDays / 7)
        })()}
      />

      <HealthTips tips={healthTips} />

      <DoctorsNoteSection
        fetchNotes={fetchDoctorsNotes}
        createNote={createDoctorsNote}
        deleteNote={deleteDoctorsNote}
      />

      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

export default MyPageTab