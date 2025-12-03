import { useState } from 'react'
import Modal from './Modal'
import './SettingsTab.css'

const SettingsTab = ({
  notifications,
  onNotificationsChange,
  nickname,
  onSaveNickname,
  onLogout,
  onDelete
}) => {
  const [newTime, setNewTime] = useState('')
  const [localNickname, setLocalNickname] = useState(nickname)

  // Modal States
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert', // alert, confirm, danger
    onConfirm: null,
    onCancel: null
  })

  const openModal = (props) => {
    setModalState({ ...props, isOpen: true })
  }

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }

  const handleAdd = () => {
    if (!newTime || notifications.includes(newTime)) return
    onNotificationsChange([...notifications, newTime].sort())
    setNewTime('')
  }

  const handleRemove = (time) => {
    onNotificationsChange(notifications.filter((item) => item !== time))
  }

  const handleNicknameSave = async () => {
    try {
      await onSaveNickname(localNickname)
      openModal({
        title: '저장 완료',
        message: '닉네임이 성공적으로 저장되었습니다.',
        onConfirm: closeModal
      })
    } catch (e) {
      openModal({
        title: '저장 실패',
        message: '닉네임 저장 중 오류가 발생했습니다.',
        type: 'alert',
        onConfirm: closeModal
      })
    }
  }

  const handleLogoutClick = () => {
    openModal({
      title: '로그아웃',
      message: '정말 로그아웃 하시겠어요?',
      type: 'confirm',
      confirmText: '예',
      cancelText: '아니오',
      onConfirm: () => {
        onLogout()
        closeModal()
      },
      onCancel: closeModal
    })
  }

  const handleDeleteClick = () => {
    openModal({
      title: '회원 탈퇴',
      message: '정말 탈퇴하시겠어요? 모든 데이터가 초기화됩니다.',
      type: 'danger',
      confirmText: '예',
      cancelText: '아니오',
      onConfirm: async () => {
        try {
          await onDelete()
          closeModal()
          // App.jsx handles the reset, but we might want to show a success message first?
          // Since onDelete (handleDelete in App) calls deleteAccount which throws on error.
          // If successful, App resets state and redirects to AuthScreen.
          // So we might not see the success modal.
          // But if we want to show it, we need to defer the reset.
          // For now, let's assume App handles the redirect immediately.
        } catch (e) {
          openModal({
            title: '탈퇴 실패',
            message: '회원 탈퇴 중 오류가 발생했습니다: ' + e.message,
            onConfirm: closeModal
          })
        }
      },
      onCancel: closeModal
    })
  }

  return (
    <div className="settings-container">
      <Modal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />

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
          <div className="nickname-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              value={localNickname}
              onChange={(e) => setLocalNickname(e.target.value)}
              className="clean-input-right"
            />
            <button
              type="button"
              onClick={handleNicknameSave}
              className="primary-btn"
            >
              저장
            </button>
          </div>
        </div>
      </section>

      {/* 3. 계정 작업 (Danger Zone) */}
      <section className="settings-group danger-zone">
        <h3>⚠️ 계정 작업</h3>
        <button type="button" onClick={handleLogoutClick} className="primary-btn-outline">
          로그아웃
        </button>
        <button type="button" className="danger-btn" onClick={handleDeleteClick}>
          회원 탈퇴
        </button>
      </section>
    </div>
  )
}

export default SettingsTab
