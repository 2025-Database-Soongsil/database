import { useMemo } from 'react'
import './App.css'
import AuthScreen from './components/AuthScreen'
import CalendarTab from './components/CalendarTab'
import SupplementsTab from './components/SupplementsTab'
import MyPageTab from './components/MyPageTab'
import ChatbotTab from './components/ChatbotTab'
import SettingsTab from './components/SettingsTab'
import { nutrientCatalog, partnerCalendarSamples } from './data/presets'
import { calculateStage } from './utils/helpers'
import { useAuth } from './hooks/useAuth'
import { useData } from './hooks/useData'
import { useChatbot } from './hooks/useChatbot'

function App() {
  // Custom Hooks
  const {
    loggedIn, user, setUser, authToken, dates,
    login, signup, logout, deleteAccount, socialLogin, updateNickname
  } = useAuth()

  const {
    activeTab, setActiveTab,
    calendarMonth, handleMonthChange,
    selectedDate, setSelectedDate,
    supplements, todos, notifications, setNotifications,
    height, setHeight, preWeight, setPreWeight, currentWeight, setCurrentWeight,
    selectedNutrient, setSelectedNutrient,
    handleAddTodo, handleToggleTodo,
    handleAddSupplement, handleAddCustomSupplement,
    resetData
  } = useData(authToken, user)

  const { chatMessages, sendMessage, resetChat } = useChatbot(authToken)

  // Derived State
  const stage = useMemo(() => calculateStage(dates.startDate, dates.dueDate), [dates])

  // Handlers
  const handleLogout = () => {
    logout()
    setActiveTab('calendar')
  }

  const handleDelete = () => {
    deleteAccount()
    resetData()
    resetChat()
  }

  if (!loggedIn) {
    return (
      <AuthScreen
        mode="login" // Default mode, internal state handled by AuthScreen if needed or lift up
        onModeChange={() => { }} // AuthScreen handles its own mode switching usually, or we can add state here if strictly needed
        onSubmit={(form) => {
          // Simple heuristic: if form has nickname, it's signup
          if (form.nickname) return signup(form)
          else return login(form)
        }}
        onSocialLogin={socialLogin}
      />
    )
  }

  return (
    <>
      <div className="app-shell">
        <nav className="main-nav-bar">
          <div className="nav-title">Baby Prep</div>
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

          {activeTab === 'chatbot' && <ChatbotTab messages={chatMessages} onSend={sendMessage} />}

          {activeTab === 'settings' && (
            <SettingsTab
              notifications={notifications}
              onNotificationsChange={setNotifications}
              nickname={user.nickname}
              // onNicknameChange removed as we use onSaveNickname now
              onSaveNickname={updateNickname}
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
