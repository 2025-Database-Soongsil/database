import { useMemo, useState } from 'react'
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
  chatbotHints
} from './data/presets'
import { calculateStage, formatDate, generateId } from './utils/helpers'

function App() {
  const today = new Date()
  const [loggedIn, setLoggedIn] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [user, setUser] = useState({
    nickname: '준비맘',
    pregnant: false,
    email: ''
  })
  const [activeTab, setActiveTab] = useState('calendar')
  const [dates, setDates] = useState({ startDate: '', dueDate: '' })
  const [calendarMonth, setCalendarMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth()
  })
  const [selectedDate, setSelectedDate] = useState(formatDate(today))
  const [supplements, setSupplements] = useState(initialSupplements)
  const [todos, setTodos] = useState(initialTodos)
  const [notifications, setNotifications] = useState(['08:00', '21:00'])
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'chat-01',
      role: 'assistant',
      text: '임신 준비 타임라인 정리가 필요하면 언제든 물어보세요.',
      time: '지금'
    }
  ])
  const [height, setHeight] = useState('')
  const [preWeight, setPreWeight] = useState('')
  const [currentWeight, setCurrentWeight] = useState('')
  const [selectedNutrient, setSelectedNutrient] = useState(nutrientCatalog[0].id)

  const stage = useMemo(() => calculateStage(dates.startDate, dates.dueDate), [dates])

// ----------------------------------------------------
// 1. handleLogin 함수 추가 (로그인 처리)
// ----------------------------------------------------
  const handleLogin = (form) => {
    // 실제 로그인 처리 로직이 여기에 들어갑니다. (이메일/비번 확인 등)
    console.log('로그인 시도:', form.email)

    setUser((prev) => ({
      ...prev,
      email: form.email,
      nickname: form.nickname || prev.nickname,
    }))
    
    setLoggedIn(true) // 👈 로그인 상태를 true로 설정
  }
  
// ----------------------------------------------------
// 2. handleSignup 함수 정의 (기존 handleAuthSubmit)
// ----------------------------------------------------
  const handleSignup = (form) => {
    const nickname = form.nickname || user.nickname || '준비맘'
    setUser({
      nickname,
      pregnant: form.pregnant,
      email: form.email
    })
    if (form.dueDate) {
      setDates((prev) => ({ ...prev, dueDate: form.dueDate }))
    }
    setLoggedIn(true) // 회원가입 후 로그인 처리
  }

  const handleSocialLogin = (provider) => {
    setUser({
      nickname: `${provider} 사용자`,
      pregnant: false,
      email: `${provider.toLowerCase()}@connected`
    })
    setLoggedIn(true)
  }
  // App.jsx 파일 내, 상태 정의 (useState) 아래나 핸들러 함수들 사이에 추가
// calendarMonth 상태를 업데이트하는 함수가 필요합니다.

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

// ⚠️ 참고: `CalendarTab` 컴포넌트를 사용하는 곳(App.jsx 렌더링 부분)에서도 
// 이 함수를 `onChangeMonth` prop으로 올바르게 전달하는지 확인해야 합니다.
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
        notes: supplement.caution
      }
    ])
  }

  const handleAddCustomSupplement = (supplement) => {
    setSupplements((prev) => [...prev, supplement])
  }

  const handleChatSend = (message) => {
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    const userMessage = { id: generateId(), role: 'user', text: message, time }
    const matchedHint = chatbotHints.find((hint) => message.includes(hint.keyword))
    const reply = matchedHint?.reply ?? '지금 단계에 맞는 할 일과 알림을 자동으로 정리해 둘게요.'
    const assistantMessage = {
      id: `${generateId()}-assistant`,
      role: 'assistant',
      text: reply,
      time: '방금'
    }
    setChatMessages((prev) => [...prev, userMessage, assistantMessage])
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setActiveTab('calendar')
  }

  const handleDelete = () => {
    setLoggedIn(false)
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
        role: 'assistant',
        text: '임신 준비 타임라인 정리가 필요하면 언제든 물어보세요.',
        time: '지금'
      }
    ])
  }

// ----------------------------------------------------
// 3. AuthScreen 렌더링 수정
// ----------------------------------------------------
  if (!loggedIn) {
    return (
      <AuthScreen 
        mode={authMode} 
        onModeChange={setAuthMode} 
        onSubmit={authMode === 'login' ? handleLogin : handleSignup} // 👈 수정된 부분
        onSocialLogin={handleSocialLogin} 
      />
    )
  }

  const tabs = [
    { id: 'calendar', label: '캘린더' },
    { id: 'supplements', label: '영양제' },
    { id: 'mypage', label: '마이페이지' },
    { id: 'chatbot', label: '챗봇' },
    { id: 'settings', label: '설정' }
  ]

  return (
    <div className="app-shell">
      {/* 둥글고 예쁜 상단 네비게이션 */}
      <nav className="main-nav-bar">
        <div className="nav-title">Baby Prep 💖</div>
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
            onChangeMonth={handleMonthChange} // 👈 이 부분도 함수 이름 통일
            onAddTodo={handleAddTodo}
            onToggleTodo={handleToggleTodo}
            supplements={supplements}
            partnerCalendarSamples={partnerCalendarSamples}
          />
        )}

        {activeTab === 'supplements' && (
          <SupplementsTab
            catalog={nutrientCatalog}
            selectedNutrient={stage.nutrient} // 기존 stage.nutrient 대신 임시로 '엽산' 등 기본값 필요
            onSelectNutrient={() => { /* 기능 구현 필요 */}} 
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
  )
}

export default App