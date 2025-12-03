// SettingsTab.jsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleAdd = () => {
    if (!newTime || notifications.includes(newTime)) return
    onNotificationsChange([...notifications, newTime].sort())
    setNewTime('')
  }

  const handleRemove = (time) => {
    onNotificationsChange(notifications.filter((item) => item !== time))
  }

  const confirmModal =
    showLogoutConfirm || showDeleteConfirm
      ? createPortal(
          <div className="login-overlay">
            <div className="login-overlay__content confirm-modal">
              <h3>{showLogoutConfirm ? '로그아웃' : '회원 탈퇴'}</h3>
              <p>{showLogoutConfirm ? '정말 로그아웃 하시겠어요?' : '정말 탈퇴하시겠어요? 모든 데이터가 초기화됩니다.'}</p>
              <div className="confirm-actions">
                <button
                  type="button"
                  onClick={() => {
                    if (showLogoutConfirm) onLogout()
                    if (showDeleteConfirm) onDelete()
                    setShowLogoutConfirm(false)
                    setShowDeleteConfirm(false)
                  }}
                  className="action-btn danger-btn"
                >
                  예
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false)
                    setShowDeleteConfirm(false)
                  }}
                  className="action-btn primary-btn-outline"
                >
                  아니오
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div className="settings-container">
      {confirmModal}
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
        <button type="button" onClick={() => setShowLogoutConfirm(true)} className="action-btn primary-btn-outline">
          로그아웃
        </button>
        <button type="button" className="action-btn danger-btn" onClick={() => setShowDeleteConfirm(true)}>
          회원 탈퇴
        </button>
      </section>
    </div>
  )
}

export default SettingsTab
