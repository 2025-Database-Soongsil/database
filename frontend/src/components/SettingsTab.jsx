
import { useState } from 'react'
import Modal from './Modal'
import TimePickerModal from './TimePickerModal'
import './SettingsTab.css'

const SettingsTab = ({
  notifications,
  onAddNotification,
  onRemoveNotification,
  notificationsEnabled,
  onToggleNotifications,
  nickname,
  onSaveNickname,
  onLogout,
  onDelete
}) => {
  const [newTime, setNewTime] = useState('')
  const [localNickname, setLocalNickname] = useState(nickname)
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false)

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
    onAddNotification(newTime)
    setNewTime('')
  }

  const handleRemove = (time) => {
    onRemoveNotification(time)
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
        message: '닉네임을 입력해주세요',
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
        // closeModal() // Switch to success modal
        openModal({
          title: '로그아웃 완료',
          message: '로그아웃 되었습니다.',
          type: 'alert',
          onConfirm: () => {
            closeModal()
            onLogout()
          }
        })
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
          // closeModal() // Don't close the confirm modal, just switch to success modal
          openModal({
            title: '탈퇴 완료',
            message: '회원탈퇴가 완료되었습니다.',
            type: 'alert',
            onConfirm: () => {
              closeModal()
              onLogout() // Trigger logout and redirect to login screen
            }
          })
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

      <TimePickerModal
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        onConfirm={(time) => {
          setNewTime(time);
          setIsTimePickerOpen(false);
        }}
        initialTime={newTime}
      />

      <h2 className="page-title">설정 ⚙️</h2>

      {/* 1. 알림 설정 그룹 */}
      <section className="settings-group">
        <div className="section-header">
          <h3>⏰ 알림 시간 관리</h3>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => onToggleNotifications(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>

        <div className={`noti-content ${!notificationsEnabled ? 'disabled' : ''}`}>
          <div className="noti-input-container">
            <div className="time-input-wrapper">
              <button
                type="button"
                className="modern-time-input"
                onClick={() => notificationsEnabled && setIsTimePickerOpen(true)}
                disabled={!notificationsEnabled}
                style={{ color: newTime ? 'inherit' : '#aaa', textAlign: 'left' }}
              >
                {newTime || '시간을 선택해주세요'}
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="add-time-btn"
                disabled={!notificationsEnabled}
              >
                추가
              </button>
            </div>
            <p className="helper-text">원하는 알림 시간을 추가해주세요.</p>
          </div>

          <div className="noti-list">
            {notifications.length > 0 ? (
              notifications.map((time) => (
                <div key={time} className="noti-chip">
                  <span className="time-text">{time}</span>
                  <button type="button" onClick={() => handleRemove(time)} className="del-btn" aria-label="삭제">
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-noti">설정된 알림이 없습니다.</p>
            )}
          </div>
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
        <h3>⚠️ 계정</h3>
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
