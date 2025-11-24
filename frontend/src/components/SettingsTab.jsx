import { useState } from 'react'

const SettingsTab = ({
  notifications,
  onNotificationsChange,
  nickname,
  onNicknameChange,
  onLogout,
  onDelete
}) => {
  const [newTime, setNewTime] = useState('')

  const handleAdd = () => {
    if (!newTime) return
    onNotificationsChange([...notifications, newTime])
    setNewTime('')
  }

  const handleRemove = (time) => {
    onNotificationsChange(notifications.filter((item) => item !== time))
  }

  return (
    <div className="settings">
      <section>
        <h2>알림 설정</h2>
        <div className="notification-list">
          {notifications.map((time) => (
            <span key={time}>
              {time}
              <button type="button" onClick={() => handleRemove(time)}>
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="add-notification">
          <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          <button type="button" onClick={handleAdd}>
            추가
          </button>
        </div>
      </section>
      <section>
        <h2>닉네임 변경</h2>
        <input value={nickname} onChange={(e) => onNicknameChange(e.target.value)} />
      </section>
      <section className="danger-zone">
        <button type="button" onClick={onLogout}>
          로그아웃
        </button>
        <button type="button" className="danger" onClick={onDelete}>
          회원 탈퇴
        </button>
      </section>
    </div>
  )
}

export default SettingsTab
