// AuthScreen.jsx
import { useState } from 'react'
import './AuthScreen.css'
import Modal from './Modal'

const SocialLogin = ({ onSocialLogin }) => (
  <div className="social-section">
    <div className="social-buttons">
      <button className="social-btn google" onClick={() => onSocialLogin('Google')}>
        Google 계정으로 시작하기
      </button>
      <button className="social-btn kakao" onClick={() => onSocialLogin('Kakao')}>
        Kakao 계정으로 시작하기
      </button>
    </div>
  </div>
)

const SignupModal = ({ isOpen, socialInfo, onConfirm, onCancel }) => {
  const [form, setForm] = useState({
    gender: '',
    nickname: socialInfo?.nickname || '',
    height: '',
    weight: ''
  })

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.gender) {
      alert('성별을 선택해주세요.')
      return
    }
    if (!form.nickname.trim()) {
      alert('닉네임을 입력해주세요.')
      return
    }
    onConfirm({
      gender: form.gender,
      nickname: form.nickname,
      is_pregnant: form.gender === 'female' ? (form.is_pregnant || false) : false,
      height: form.height ? Number(form.height) : null,
      weight: form.weight ? Number(form.weight) : null
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content signup-modal">
        <h3>회원가입 추가 정보</h3>
        <p className="modal-desc">맞춤형 서비스를 위해 추가 정보를 입력해주세요.</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>성별 (필수)</label>
            <div className="gender-options">
              <label className={`gender-btn ${form.gender === 'male' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={form.gender === 'male'}
                  onChange={handleChange}
                />
                남성 👨
              </label>
              <label className={`gender-btn ${form.gender === 'female' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={form.gender === 'female'}
                  onChange={handleChange}
                />
                여성 👩
              </label>
            </div>
          </div>

          <div className="input-group">
            <label>닉네임 (필수)</label>
            <input
              name="nickname"
              value={form.nickname}
              onChange={handleChange}
              placeholder="닉네임 입력"
              required
            />
          </div>

          {form.gender === 'female' && (
            <div className="input-group">
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="is_pregnant"
                  checked={form.is_pregnant || false}
                  onChange={(e) => setForm(prev => ({ ...prev, is_pregnant: e.target.checked }))}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span style={{ fontSize: '14px', color: '#555' }}>현재 임신 중이에요 🤰</span>
              </label>
            </div>
          )}

          <div className="input-row">
            <div className="input-group">
              <label>키 (cm)</label>
              <input
                name="height"
                type="number"
                value={form.height}
                onChange={handleChange}
                placeholder="선택"
              />
            </div>
            <div className="input-group">
              <label>몸무게 (kg)</label>
              <input
                name="weight"
                type="number"
                value={form.weight}
                onChange={handleChange}
                placeholder="선택"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="submit" className="action-btn primary-btn">가입하기</button>
            <button type="button" onClick={onCancel} className="action-btn secondary-btn">취소</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const AuthScreen = ({ onSocialLogin, registeringUser, onSocialRegister, onCancelRegister }) => {
  // Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  })

  const openModal = (title, message) => {
    setModalState({
      isOpen: true,
      title,
      message,
      onConfirm: () => setModalState(prev => ({ ...prev, isOpen: false }))
    })
  }

  const handleSocialLogin = async (provider) => {
    try {
      await onSocialLogin(provider)
    } catch (err) {
      openModal('로그인 실패', err.message)
    }
  }

  const handleRegisterConfirm = async (formData) => {
    try {
      await onSocialRegister(formData)
    } catch (err) {
      openModal('가입 실패', err.message)
    }
  }

  return (
    <div className="auth-container">
      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        confirmText="확인"
      />

      {registeringUser && (
        <SignupModal
          isOpen={true}
          socialInfo={registeringUser}
          onConfirm={handleRegisterConfirm}
          onCancel={onCancelRegister}
        />
      )}

      <div className="auth-card ui-card">
        <header className="auth-header">
          <h1>Baby Prep</h1>
          <p>임신 준비 전용 맞춤 캘린더</p>
        </header>

        <div className="login-intro">
          <p>간편하게 소셜 계정으로 시작하세요 💖</p>
        </div>

        <SocialLogin onSocialLogin={handleSocialLogin} />
      </div>
    </div>
  )
}

export default AuthScreen