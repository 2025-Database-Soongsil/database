/*import { useState } from 'react'

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
*/
// SettingsTab.jsx
import { useState } from 'react'
import './SettingsTab.css' // CSS 파일 임포트

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
    if (!newTime || notifications.includes(newTime)) return
    onNotificationsChange([...notifications, newTime].sort())
    setNewTime('')
  }

  const handleRemove = (time) => {
    onNotificationsChange(notifications.filter((item) => item !== time))
  }

  return (
    <div className="settings-container">
      <h2 className="page-title">설정 ⚙️</h2>
      
      {/* 1. 알림 설정 그룹 */}
      <section className="settings-group">
        <h3>⏰ 알림 시간 관리</h3>
        <div className="noti-list">
          {notifications.map((time) => (
            <span key={time} className="noti-chip">
              {time}
              <button type="button" onClick={() => handleRemove(time)} className="del-btn">
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="noti-input-row">
          <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
          <button type="button" onClick={handleAdd}>
            추가
          </button>
        </div>
      </section>
      
      {/* 2. 사용자 정보 그룹 */}
      <section className="settings-group">
        <h3>🧑‍💻 사용자 정보</h3>
        <div className="setting-item">
            <label>닉네임</label>
            <input value={nickname} onChange={(e) => onNicknameChange(e.target.value)} className="clean-input-right" />
        </div>
      </section>
      
      {/* 3. 계정 작업 (Danger Zone) */}
      <section className="settings-group danger-zone">
        <h3>⚠️ 계정 작업</h3>
        <button type="button" onClick={onLogout} className="action-btn primary-btn-outline">
          로그아웃
        </button>
        <button type="button" className="action-btn danger-btn" onClick={onDelete}>
          회원 탈퇴
        </button>
      </section>
    </div>
  )
}

export default SettingsTab