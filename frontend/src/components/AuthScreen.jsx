// AuthScreen.jsx
import { useState } from 'react'
import './AuthScreen.css' // CSS 파일 임포트

const LoginForm = ({ form, onChange, onSubmit }) => (
  <form onSubmit={onSubmit} className="auth-form">
    <div className="input-group">
      <label>이메일</label>
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={onChange}
        required
        placeholder="user@example.com"
      />
    </div>
    <div className="input-group">
      <label>비밀번호</label>
      <input
        name="password"
        type="password"
        value={form.password}
        onChange={onChange}
        required
        placeholder="8자 이상 입력"
      />
    </div>
    <button type="submit" className="submit-btn">
      시작하기
    </button>
  </form>
)

const SignupForm = ({ form, onChange, onSubmit }) => (
  <form onSubmit={onSubmit} className="auth-form">
    <div className="input-group">
      <label>이메일</label>
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={onChange}
        required
        placeholder="user@example.com"
      />
    </div>
    <div className="input-group">
      <label>비밀번호</label>
      <input
        name="password"
        type="password"
        value={form.password}
        onChange={onChange}
        required
        placeholder="8자 이상 입력"
      />
    </div>
    <div className="signup-fields">
      <div className="input-group">
        <label>닉네임</label>
        <input
          name="nickname"
          value={form.nickname}
          onChange={onChange}
          placeholder="부부가 함께 쓸 별명"
        />
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="pregnant"
          checked={form.pregnant}
          onChange={onChange}
        />
        <span className="check-text">현재 임신 중이에요 🤰</span>
      </label>
      <div className="input-group">
        <label>출산 예정일</label>
        <input
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={onChange}
        />
      </div>
    </div>
    <button type="submit" className="submit-btn">
      가입하기
    </button>
  </form>
)

const SocialLogin = ({ onSocialLogin }) => (
  <div className="social-section">
    <div className="divider">
      <span>또는</span>
    </div>
    <div className="social-buttons">
      <button className="social-btn google" onClick={() => onSocialLogin('Google')}>
        Google
      </button>
      <button className="social-btn kakao" onClick={() => onSocialLogin('Kakao')}>
        Kakao
      </button>
    </div>
  </div>
)

const AuthScreen = ({ mode, onModeChange, onSubmit, onSocialLogin }) => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    nickname: '',
    pregnant: false,
    dueDate: ''
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="auth-container">
      <div className="auth-card ui-card">
        <header className="auth-header">
          <h1>Baby Prep</h1>
          <p>임신 준비 전용 맞춤 캘린더</p>
        </header>

        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => onModeChange('login')}
          >
            로그인
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => onModeChange('signup')}
          >
            회원가입
          </button>
        </div>

        {mode === 'login' ? (
          <LoginForm form={form} onChange={handleChange} onSubmit={handleSubmit} />
        ) : (
          <SignupForm form={form} onChange={handleChange} onSubmit={handleSubmit} />
        )}

        <SocialLogin onSocialLogin={onSocialLogin} />
      </div>
    </div>
  )
}

export default AuthScreen