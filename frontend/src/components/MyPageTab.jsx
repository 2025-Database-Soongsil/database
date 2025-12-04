import { useState, useEffect } from 'react'
import { getWeightStatus } from '../utils/helpers'
import './MyPageTab.css' // CSS 파일 임포트



const ProfileForm = ({ nickname, onNicknameChange, height, preWeight, currentWeight, onLocalChange, onSave, gender, isPregnant, onPregnancyChange }) => {
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
        <h3>신체 정보 입력 📝</h3>
        <button className="primary-btn save-btn" onClick={onSave}>저장</button>
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
        </div>
      )}

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
    </section>
  )
}

const HealthReport = ({ height, preWeight, currentWeight }) => {
  const result = getWeightStatus(height, preWeight, currentWeight)
  const safeHeight = Number(height) || 0;
  const safePreWeight = Number(preWeight) || 0;
  const safeCurrentWeight = Number(currentWeight) || 0;

  if (safeHeight <= 0 || safePreWeight <= 0 || safeCurrentWeight <= 0 || !result) {
    return (
      <div className="report-column">
        <section className="tips-card card-box">
          <h3>💡 닥터스 노트</h3>
          <ul className="tip-list">
            <li>🌙 수면 패턴을 규칙적으로 유지하세요.</li>
            <li>☕ 카페인은 하루 200mg(약 1잔) 이하로!</li>
            <li>💧 하루 2L 물 마시기, 잊지 마세요.</li>
          </ul>
        </section>
      </div>
    )
  }

  return (
    <div className="report-column">
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

      <section className="tips-card card-box">
        <h3>💡 닥터스 노트</h3>
        <ul className="tip-list">
          <li>🌙 수면 패턴을 규칙적으로 유지하세요.</li>
          <li>☕ 카페인은 하루 200mg(약 1잔) 이하로!</li>
          <li>💧 하루 2L 물 마시기, 잊지 마세요.</li>
        </ul>
      </section>
    </div>
  )
}

import Modal from './Modal'

const MyPageTab = ({ nickname, onNicknameChange, height, preWeight, currentWeight, onProfileChange, onSaveProfile, gender, isPregnant, onPregnancyChange }) => {
  // Local state for editing
  const [localHeight, setLocalHeight] = useState(height || '')
  const [localPreWeight, setLocalPreWeight] = useState(preWeight || '')
  const [localCurrentWeight, setLocalCurrentWeight] = useState(currentWeight || '')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Sync local state if props change (e.g. after save or external update)
  useEffect(() => {
    setLocalHeight(height || '')
    setLocalPreWeight(preWeight || '')
    setLocalCurrentWeight(currentWeight || '')
  }, [height, preWeight, currentWeight])

  const handleLocalChange = (field, value) => {
    if (field === 'height') setLocalHeight(value)
    if (field === 'pre') setLocalPreWeight(value)
    if (field === 'current') setLocalCurrentWeight(value)
  }

  const handleSave = async () => {
    // onProfileChange updates local state in App.jsx (optional if we reload from API)
    // But we should call onSaveProfile to persist to DB
    if (onSaveProfile) {
      const success = await onSaveProfile({
        height: localHeight ? Number(localHeight) : null,
        preWeight: localPreWeight ? Number(localPreWeight) : null,
        currentWeight: localCurrentWeight ? Number(localCurrentWeight) : null
      })
      if (success) {
        setIsModalOpen(true)
      }
    } else {
      // Fallback for legacy behavior
      onProfileChange('height', localHeight)
      onProfileChange('pre', localPreWeight)
      onProfileChange('current', localCurrentWeight)
      setIsModalOpen(true)
    }
  }

  return (
    <div className="mypage-container">
      <header className="mypage-header">
        <div className="profile-icon">💖</div>
        <h2>{nickname}님의 마이페이지</h2>
      </header>

      <div className="mypage-grid">
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
          onPregnancyChange={onPregnancyChange}
        />
        <HealthReport
          height={localHeight}
          preWeight={localPreWeight}
          currentWeight={localCurrentWeight}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        title="알림"
        message="저장되었습니다."
        onConfirm={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default MyPageTab