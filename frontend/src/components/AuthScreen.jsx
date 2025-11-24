import { useState } from 'react'

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
    <div className="auth-screen">
      <div className="auth-card">
        <header>
          <h1>Baby Prep</h1>
          <p>임신 준비 전용 맞춤 캘린더</p>
        </header>
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => onModeChange('login')}
          >
            로그인
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => onModeChange('signup')}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            이메일
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="example@email.com"
            />
          </label>
          <label>
            비밀번호
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="8자 이상 입력"
            />
          </label>
          {mode === 'signup' && (
            <>
              <label>
                닉네임
                <input
                  name="nickname"
                  value={form.nickname}
                  onChange={handleChange}
                  placeholder="부부가 함께 쓰는 별명"
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="pregnant"
                  checked={form.pregnant}
                  onChange={handleChange}
                />
                현재 임신 진행 중이에요
              </label>
              <label>
                예정일
                <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
              </label>
            </>
          )}
          <button type="submit" className="primary">
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="social-login">
          <p>간편 로그인</p>
          <div className="social-buttons">
            <button type="button" onClick={() => onSocialLogin('Google')}>
              구글 계정
            </button>
            <button type="button" onClick={() => onSocialLogin('Kakao')}>
              카카오 계정
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthScreen
