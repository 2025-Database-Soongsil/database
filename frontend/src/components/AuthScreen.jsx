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

const AuthScreen = ({ onSocialLogin }) => {
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

  return (
    <div className="auth-container">
      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        confirmText="확인"
      />

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