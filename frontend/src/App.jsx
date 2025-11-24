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

  const handleAuthSubmit = (form) => {
    const nickname = form.nickname || user.nickname || '준비맘'
    setUser({
      nickname,
      pregnant: form.pregnant,
      email: form.email
    })
    if (form.dueDate) {
      setDates((prev) => ({ ...prev, dueDate: form.dueDate }))
    }
    setLoggedIn(true)
  }

  const handleSocialLogin = (provider) => {
    setUser({
      nickname: `${provider} 사용자`,
      pregnant: false,
      email: `${provider.toLowerCase()}@connected`
    })
    setLoggedIn(true)
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

  if (!loggedIn) {
    return <AuthScreen mode={authMode} onModeChange={setAuthMode} onSubmit={handleAuthSubmit} onSocialLogin={handleSocialLogin} />
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
      <header className="app-header">
        <div>
          <h1>Baby Prep Dashboard</h1>
          <p>
            {user.nickname}님, {stage.label}
          </p>
        </div>
        <div className="dates-inputs">
          <label>
            임신 준비 시작일
            <input
              type="date"
              value={dates.startDate}
              onChange={(e) => setDates((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </label>
          <label>
            예정일
            <input
              type="date"
              value={dates.dueDate}
              onChange={(e) => setDates((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </label>
        </div>
      </header>

      <nav className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={tab.id === activeTab ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main>
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
  )
}

export default App
