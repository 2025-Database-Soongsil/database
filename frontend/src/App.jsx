import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import AuthScreen from './components/AuthScreen'
import CalendarTab from './components/CalendarTab'
import SupplementsTab from './components/SupplementsTab'
import MyPageTab from './components/MyPageTab'
import ChatbotTab from './components/ChatbotTab'
import SettingsTab from './components/SettingsTab'
import {
  nutrientCatalog,
  partnerCalendarSamples,
  initialSupplements,
  initialTodos,
} from './data/presets'
import { calculateStage, formatDate, generateId } from './utils/helpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI

const requireEnv = (value, name) => {
  if (!value) {
    throw new Error(`${name} 환경 변수가 설정되어 있지 않습니다.`)
  }
  return value
}

function App() {
  const today = new Date()
  const [loggedIn, setLoggedIn] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [user, setUser] = useState({
    nickname: '준비맘',
    pregnant: false,
    email: '',
  })
  const [authToken, setAuthToken] = useState(null)
  const [activeTab, setActiveTab] = useState('calendar')
  const [dates, setDates] = useState({ startDate: '', dueDate: '' })
  const [calendarMonth, setCalendarMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })
  const [selectedDate, setSelectedDate] = useState(formatDate(today))
  const [supplements, setSupplements] = useState(initialSupplements)
  const [todos, setTodos] = useState(initialTodos)
  const [notifications, setNotifications] = useState(['08:00', '21:00'])
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'chat-01',
      role: 'bot',
      text: '임신 준비 관련 궁금한 점을 물어보세요.',
      time: '지금',
    },
  ])
  const [height, setHeight] = useState('')
  const [preWeight, setPreWeight] = useState('')
  const [currentWeight, setCurrentWeight] = useState('')
  const [selectedNutrient, setSelectedNutrient] = useState(nutrientCatalog[0].id)
  const googleScriptLoading = useRef(false)
  const googleReady = useRef(false)
  const googleBusy = useRef(false)
  const googleCodeClient = useRef(null)
  const googleLoginPending = useRef(false)
  const kakaoHandled = useRef(false)

  const stage = useMemo(() => calculateStage(dates.startDate, dates.dueDate), [dates])

  // 새로고침 시 로그인 상태 복구
  useEffect(() => {
    const savedAuth = localStorage.getItem('bp-auth')
    if (!savedAuth) return
    try {
      const parsed = JSON.parse(savedAuth)
      if (parsed?.token) {
        setAuthToken(parsed.token)
        setUser(parsed.user || user)
        setDates(parsed.dates || { startDate: '', dueDate: '' })
        setLoggedIn(true)
      }
    } catch (e) {
      console.warn('Failed to parse saved auth', e)
      localStorage.removeItem('bp-auth')
    }
  }, [])

  const handleLogin = async (form) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || '로그인 실패')
      }
      const data = await res.json()
      const nickname = data.user?.nickname || user.nickname || '준비맘'
      setUser({
        nickname,
        pregnant: Boolean(data.user?.pregnant),
        email: data.user?.email ?? '',
      })
      const datesFromUser = data.user?.dates || {}
      setDates({ startDate: datesFromUser.startDate || '', dueDate: datesFromUser.dueDate || '' })
      setAuthToken(data.token)
      setLoggedIn(true)
      localStorage.setItem(
        'bp-auth',
        JSON.stringify({
          token: data.token,
          user: { nickname, pregnant: Boolean(data.user?.pregnant), email: data.user?.email ?? '' },
          dates: datesFromUser,
        })
      )
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSignup = async (form) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nickname: form.nickname,
          pregnant: form.pregnant,
          due_date: form.dueDate || null,
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || '회원가입 실패')
      }
      const data = await res.json()
      const nickname = data.user?.nickname || user.nickname || '준비맘'
      setUser({
        nickname,
        pregnant: Boolean(data.user?.pregnant),
        email: data.user?.email ?? '',
      })
      const datesFromUser = data.user?.dates || {}
      setDates({ startDate: datesFromUser.startDate || '', dueDate: datesFromUser.dueDate || '' })
      setAuthToken(data.token)
      setLoggedIn(true)
      localStorage.setItem(
        'bp-auth',
        JSON.stringify({
          token: data.token,
          user: { nickname, pregnant: Boolean(data.user?.pregnant), email: data.user?.email ?? '' },
          dates: datesFromUser,
        })
      )
    } catch (err) {
      alert(err.message)
    }
  }

  const loadGoogleScript = () =>
    new Promise((resolve, reject) => {
      if (googleReady.current) return resolve()
      if (googleScriptLoading.current) return reject(new Error('Google 스크립트 로딩 중입니다.'))
      googleScriptLoading.current = true
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = () => {
        googleReady.current = true
        resolve()
      }
      script.onerror = () => reject(new Error('Google 스크립트 로드 실패'))
      document.head.appendChild(script)
    })

  const handleSocialLogin = async (provider) => {
    if (provider === 'Google') {
      if (googleBusy.current) {
        alert('구글 로그인 진행 중입니다. 잠시만 기다려주세요.')
        return
      }
      try {
        const clientId = requireEnv(GOOGLE_CLIENT_ID, 'VITE_GOOGLE_CLIENT_ID')
        await loadGoogleScript()
        if (!googleCodeClient.current) {
          googleCodeClient.current = window.google.accounts.oauth2.initCodeClient({
            client_id: clientId,
            scope: 'email profile',
            ux_mode: 'popup',
            callback: async (response) => {
              console.log('[GoogleLogin] auth code response', response)
              if (!response.code) {
                alert('Google 로그인 코드 발급에 실패했습니다.')
                googleBusy.current = false
                googleLoginPending.current = false
                return
              }
              try {
                const res = await fetch(`${API_BASE}/auth/google`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ credential: response.code, is_code: true }),
                })
                if (!res.ok) {
                  const txt = await res.text()
                  throw new Error(txt || 'Google 로그인 실패')
                }
                const data = await res.json()
                const nickname = data.user?.nickname || '준비맘'
                setUser({
                  nickname,
                  pregnant: Boolean(data.user?.pregnant),
                  email: data.user?.email ?? '',
                })
                setAuthToken(data.token)
                const datesFromUser = data.user?.dates || {}
                setDates({ startDate: datesFromUser.startDate || '', dueDate: datesFromUser.dueDate || '' })
                setLoggedIn(true)
              } catch (err) {
                alert(err.message)
              } finally {
                googleBusy.current = false
                googleLoginPending.current = false
              }
            },
          })
        }
        googleBusy.current = true
        googleLoginPending.current = true
        googleCodeClient.current.requestCode()
      } catch (err) {
        alert(err.message)
        googleBusy.current = false
        googleLoginPending.current = false
      }
    } else if (provider === 'Kakao') {
      const clientId = requireEnv(KAKAO_CLIENT_ID, 'VITE_KAKAO_CLIENT_ID')
      const redirectUri = requireEnv(KAKAO_REDIRECT_URI, 'VITE_KAKAO_REDIRECT_URI')
      const authorizeUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=code`
      window.location.href = authorizeUrl
    }
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    const isKakaoCallback = url.pathname.includes('/login/oauth2/code/kakao')
    const code = url.searchParams.get('code')
    if (!isKakaoCallback || !code || kakaoHandled.current) return
    kakaoHandled.current = true
    const exchange = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/kakao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(txt || 'Kakao 로그인 실패')
        }
        const data = await res.json()
        const nickname = data.user?.nickname || '카카오 사용자'
        setUser({
          nickname,
          pregnant: Boolean(data.user?.pregnant),
          email: data.user?.email ?? '',
        })
        setAuthToken(data.token)
        const datesFromUser = data.user?.dates || {}
        setDates({ startDate: datesFromUser.startDate || '', dueDate: datesFromUser.dueDate || '' })
        setLoggedIn(true)
        localStorage.setItem(
          'bp-auth',
          JSON.stringify({
            token: data.token,
            user: { nickname, pregnant: Boolean(data.user?.pregnant), email: data.user?.email ?? '' },
            dates: datesFromUser,
          })
        )
      } catch (err) {
        alert(err.message)
      } finally {
        window.history.replaceState({}, document.title, '/')
      }
    }
    exchange()
  }, [])

  useEffect(() => {
    const onFocus = () => {
      if (googleLoginPending.current) {
        // 사용자가 팝업을 닫고 돌아온 경우 다시 시도할 수 있도록 상태 초기화
        googleBusy.current = false
        googleLoginPending.current = false
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const handleChangeMonth = (delta) => {
    setCalendarMonth((prev) => {
      const newMonth = prev.month + delta
      const newDate = new Date(prev.year, newMonth, 1)
      return {
        year: newDate.getFullYear(),
        month: newDate.getMonth(),
      }
    })
  }

  const handleMonthChange = (offset) => {
    setCalendarMonth((prev) => {
      const date = new Date(prev.year, prev.month + offset, 1)
      return { year: date.getFullYear(), month: date.getMonth() }
    })
  }

  const handleAddTodo = (text, date) => {
    if (!text || !date) return
    const clean = text.trim()
    if (!clean) return
    setTodos((prev) => [...prev, { id: generateId(), text: clean, date, completed: false }])
  }

  const handleToggleTodo = (id) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const handleAddSupplement = (nutrient, supplement) => {
    setSupplements((prev) => [
      ...prev,
      {
        id: `${supplement.id}-${generateId()}`,
        name: supplement.name,
        nutrient: nutrient.nutrient,
        schedule: supplement.schedule,
        stage: nutrient.stage,
        notes: supplement.caution,
      },
    ])
  }

  const handleAddCustomSupplement = (supplement) => {
    setSupplements((prev) => [...prev, supplement])
  }

  const handleChatSend = async (message) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    const userMessage = { id: generateId(), role: 'user', text: message, time }
    setChatMessages((prev) => [...prev, userMessage])

    try {
      const res = await fetch(`${API_BASE}/chatbot/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || '챗봇 요청에 실패했습니다.')
      }
      const data = await res.json()
      const reply = data?.reply || '답변을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
      const assistantMessage = {
        id: `${generateId()}-assistant`,
        role: 'bot',
        text: reply,
        time: '방금',
      }
      setChatMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const assistantMessage = {
        id: `${generateId()}-assistant`,
        role: 'bot',
        text: err.message || '채팅 중 오류가 발생했어요.',
        time: '방금',
      }
      setChatMessages((prev) => [...prev, assistantMessage])
    }
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setAuthToken(null)
    setActiveTab('calendar')
    googleBusy.current = false
    googleLoginPending.current = false
    localStorage.removeItem('bp-auth')
  }

  const handleDelete = () => {
    setLoggedIn(false)
    setAuthToken(null)
    setUser({ nickname: '준비맘', pregnant: false, email: '' })
    setDates({ startDate: '', dueDate: '' })
    setSupplements(initialSupplements)
    setTodos(initialTodos)
    setNotifications(['08:00', '21:00'])
    setSelectedNutrient(nutrientCatalog[0].id)
    setSelectedDate(formatDate(new Date()))
    setChatMessages([
      {
        id: 'chat-reset',
        role: 'bot',
        text: '임신 준비 관련 궁금한 점을 물어보세요.',
        time: '지금',
      },
    ])
    googleBusy.current = false
    googleLoginPending.current = false
    localStorage.removeItem('bp-auth')
  }

  if (!loggedIn) {
    return (
      <AuthScreen
        mode={authMode}
        onModeChange={setAuthMode}
        onSubmit={authMode === 'login' ? handleLogin : handleSignup}
        onSocialLogin={handleSocialLogin}
      />
    )
  }

  const tabs = [
    { id: 'calendar', label: '캘린더' },
    { id: 'supplements', label: '영양제' },
    { id: 'mypage', label: '마이페이지' },
    { id: 'chatbot', label: '챗봇' },
    { id: 'settings', label: '설정' },
  ]
  return (
    <>
      <div className="app-shell">
        <nav className="main-nav-bar">
          <div className="nav-title">Baby Prep 대시보드</div>
          <div className="nav-tab-menu">
            {['calendar', 'supplements', 'mypage', 'chatbot', 'settings'].map((tab) => (
              <button
                key={tab}
                className={`nav-tab-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'calendar' && '캘린더'}
                {tab === 'supplements' && '영양제'}
                {tab === 'mypage' && '마이페이지'}
                {tab === 'chatbot' && '챗봇'}
                {tab === 'settings' && '설정'}
              </button>
            ))}
          </div>
        </nav>

        <main className="app-content-area">
          {activeTab === 'calendar' && (
            <CalendarTab
              stage={stage}
              calendarMonth={calendarMonth}
              selectedDate={selectedDate}
              todos={todos}
              startDate={dates.startDate}
              dueDate={dates.dueDate}
              onSelectDate={setSelectedDate}
              onChangeMonth={handleMonthChange}
              onAddTodo={handleAddTodo}
              onToggleTodo={handleToggleTodo}
              supplements={supplements}
              partnerCalendarSamples={partnerCalendarSamples}
            />
          )}

          {activeTab === 'supplements' && (
            <SupplementsTab
              catalog={nutrientCatalog}
              selectedNutrient={selectedNutrient}
              onSelectNutrient={setSelectedNutrient}
              onAddSupplement={handleAddSupplement}
              onAddCustom={handleAddCustomSupplement}
              activeSupplements={supplements}
            />
          )}

          {activeTab === 'mypage' && (
            <MyPageTab
              nickname={user.nickname}
              onNicknameChange={(value) => setUser((prev) => ({ ...prev, nickname: value }))}
              height={height}
              preWeight={preWeight}
              currentWeight={currentWeight}
              onProfileChange={(field, value) => {
                if (field === 'height') setHeight(value)
                if (field === 'pre') setPreWeight(value)
                if (field === 'current') setCurrentWeight(value)
              }}
            />
          )}

          {activeTab === 'chatbot' && <ChatbotTab messages={chatMessages} onSend={handleChatSend} />}

          {activeTab === 'settings' && (
            <SettingsTab
              notifications={notifications}
              onNotificationsChange={setNotifications}
              nickname={user.nickname}
              onNicknameChange={(value) => setUser((prev) => ({ ...prev, nickname: value }))}
              onLogout={handleLogout}
              onDelete={handleDelete}
            />
          )}
        </main>
      </div>
    </>
  )
}

export default App
