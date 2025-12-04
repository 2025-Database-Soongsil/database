import { useState, useMemo } from 'react'
import './App.css'
import { useAuth } from './hooks/useAuth'
import { useChatbot } from './hooks/useChatbot'
import { useCalendar } from './hooks/useCalendar'
import { useSupplements } from './hooks/useSupplements'
import { useNotifications } from './hooks/useNotifications'
import { useProfile } from './hooks/useProfile'
import { calculateStage } from './utils/helpers'
import { nutrientCatalog } from './data/presets'

// Components
import AuthScreen from './components/AuthScreen'
import CalendarTab from './components/CalendarTab'
import SupplementsTab from './components/SupplementsTab'
import MyPageTab from './components/MyPageTab'
import ChatbotTab from './components/ChatbotTab'
import SettingsTab from './components/SettingsTab'

function App() {
  const {
    user, setUser,
    authToken,
    loggedIn,
    socialLogin, logout, deleteAccount,
    registeringUser, socialRegister, cancelRegister,
    dates, updateNickname, updatePregnancy,
    fetchDoctorsNotes, createDoctorsNote, deleteDoctorsNote, healthTips, refreshHealthTips,
    fetchUserSupplements, addUserSupplement, deleteUserSupplement, deleteUserSupplementBySupplementId
  } = useAuth()

  const [activeTab, setActiveTab] = useState('calendar')

  // Hooks
  const {
    calendarMonth, handleMonthChange,
    selectedDate, setSelectedDate,
    todos, handleAddTodo, handleToggleTodo, handleDeleteTodo,
    resetCalendar
  } = useCalendar(authToken, user)

  const {
    supplements, handleAddSupplement, handleAddCustomSupplement,
    selectedNutrient, setSelectedNutrient, fetchNutrients,
    resetSupplements
  } = useSupplements(authToken, user)

  const {
    notifications, addNotification, removeNotification,
    notificationsEnabled, toggleNotifications,
    resetNotifications
  } = useNotifications(authToken, user)

  const {
    height, setHeight,
    preWeight, setPreWeight,
    currentWeight, setCurrentWeight,
    resetProfile, saveProfile
  } = useProfile(authToken, user)

  const { chatMessages, sendMessage, resetChat, isLoading, markAsRead } = useChatbot(authToken)

  // Derived State
  const stage = useMemo(() => {
    if (!user.pregnant) return calculateStage(null, null)
    return calculateStage(dates.startDate, dates.dueDate)
  }, [dates, user.pregnant])

  // Handlers
  const handleLogout = () => {
    logout()
    resetCalendar()
    resetSupplements()
    resetNotifications()
    resetProfile()
    resetChat()
    setActiveTab('calendar')
  }

  const handleDelete = async () => {
    await deleteAccount()
  }

  if (!loggedIn) {
    return (
      <AuthScreen
        onSocialLogin={socialLogin}
        registeringUser={registeringUser}
        onSocialRegister={socialRegister}
        onCancelRegister={cancelRegister}
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
              onDeleteTodo={handleDeleteTodo}
              supplements={supplements}
              fetchUserSupplements={fetchUserSupplements}
              partnerCalendarSamples={[]}
              gender={user.gender}
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
              fetchNutrients={fetchNutrients}
              fetchUserSupplements={fetchUserSupplements}
              addUserSupplement={addUserSupplement}
              deleteUserSupplement={deleteUserSupplement}
              deleteUserSupplementBySupplementId={deleteUserSupplementBySupplementId}
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
              onSaveProfile={saveProfile}
              gender={user.gender}
              isPregnant={user.pregnant}
              pregnancyDates={user.pregnancyDates}
              onPregnancyChange={updatePregnancy}
              fetchDoctorsNotes={fetchDoctorsNotes}
              createDoctorsNote={createDoctorsNote}
              deleteDoctorsNote={deleteDoctorsNote}
              healthTips={healthTips}
              refreshHealthTips={refreshHealthTips}
            />
          )}

          {activeTab === 'chatbot' && <ChatbotTab messages={chatMessages} onSend={sendMessage} isLoading={isLoading} markAsRead={markAsRead} />}

          {activeTab === 'settings' && (
            <SettingsTab
              notifications={notifications}
              onAddNotification={addNotification}
              onRemoveNotification={removeNotification}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={toggleNotifications}
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
