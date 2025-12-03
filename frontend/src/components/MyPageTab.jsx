import { getWeightStatus } from '../utils/helpers'
import './MyPageTab.css' // CSS 파일 임포트



const ProfileForm = ({ nickname, onNicknameChange, height, preWeight, currentWeight, onProfileChange }) => {
  // 값이 입력되지 않았을 경우 0으로 처리하여 계산 오류 방지
  const safeHeight = Number(height) || 0;
  const safePreWeight = Number(preWeight) || 0;
  const safeCurrentWeight = Number(currentWeight) || 0;

  const handleNumberInput = (field, value) => {
    // Allow empty
    if (value === '') {
      onProfileChange(field, value)
      return
    }
    // Regex: Max 3 digits integer, optional 1 decimal place
    // Matches: 1, 12, 123, 1., 1.2, 12.3, 123.4
    if (/^\d{0,3}(\.\d{0,1})?$/.test(value)) {
      onProfileChange(field, value)
    }
  }

  return (
    <section className="profile-card card-box">
      <h3>신체 정보 입력 📝</h3>

      <div className="field-group">
        <label>닉네임</label>
        <input
          name="nickname"
          value={nickname}
          disabled
          className="styled-input disabled"
        />
      </div>

      <div className="field-group">
        <div className="field-row">
          <div>
            <label>키(cm)</label>
            <input
              type="number"
              name="height"
              min="0"
              placeholder="-"
              value={height > 0 ? height : ''}
              onChange={(e) => handleNumberInput('height', e.target.value)}
              className="styled-input large"
            />
          </div>
          <div>
            <label>준비 전 체중(kg)</label>
            <input
              type="number"
              name="pre"
              min="0"
              placeholder="-"
              value={preWeight > 0 ? preWeight : ''}
              onChange={(e) => handleNumberInput('pre', e.target.value)}
              className="styled-input large"
            />
          </div>
        </div>
      </div>

      <div className="field-group">
        <label>현재 체중(kg)</label>
        <input
          type="number"
          name="current"
          min="0"
          placeholder="-"
          value={currentWeight > 0 ? currentWeight : ''}
          onChange={(e) => handleNumberInput('current', e.target.value)}
          className="styled-input large"
        />
      </div>
    </section>
  )
}

const HealthReport = ({ height, preWeight, currentWeight }) => {
  const result = getWeightStatus(height, preWeight, currentWeight)
  const safeHeight = Number(height) || 0;
  const safePreWeight = Number(preWeight) || 0;
  const safeCurrentWeight = Number(currentWeight) || 0;

  if (safeHeight <= 0 || safePreWeight <= 0 || safeCurrentWeight <= 0 || !result) {
    return (
      <div className="report-column">
        <section className="tips-card card-box">
          <h3>💡 닥터스 노트</h3>
          <ul className="tip-list">
            <li>🌙 수면 패턴을 규칙적으로 유지하세요.</li>
            <li>☕ 카페인은 하루 200mg(약 1잔) 이하로!</li>
            <li>💧 하루 2L 물 마시기, 잊지 마세요.</li>
          </ul>
        </section>
      </div>
    )
  }

  return (
    <div className="report-column">
      <section className="report-card card-box">
        <h3>체중 변화 분석 📊</h3>
        <div className="stat-row">
          <div className="stat-item">
            <span className="label">현재 BMI</span>
            <strong className="value">{result.bmi}</strong>
          </div>
          <div className="stat-item">
            <span className="label">체중 변화</span>
            <strong className={`value ${result.gained > 0 ? 'plus' : ''}`}>
              {result.gained > 0 ? '+' : ''}{result.gained}kg
            </strong>
          </div>
        </div>
        <div className="advice-box">
          <p className="target-range">권장 증가 범위: {result.target}</p>
          <p className="message">{result.message}</p>
        </div>
      </section>

      <section className="tips-card card-box">
        <h3>💡 닥터스 노트</h3>
        <ul className="tip-list">
          <li>🌙 수면 패턴을 규칙적으로 유지하세요.</li>
          <li>☕ 카페인은 하루 200mg(약 1잔) 이하로!</li>
          <li>💧 하루 2L 물 마시기, 잊지 마세요.</li>
        </ul>
      </section>
    </div>
  )
}

const MyPageTab = ({ nickname, onNicknameChange, height, preWeight, currentWeight, onProfileChange }) => {
  return (
    <div className="mypage-container">
      <header className="mypage-header">
        <div className="profile-icon">💖</div>
        <h2>{nickname}님의 마이페이지</h2>
      </header>

      <div className="mypage-grid">
        <ProfileForm
          nickname={nickname}
          onNicknameChange={onNicknameChange}
          height={height}
          preWeight={preWeight}
          currentWeight={currentWeight}
          onProfileChange={onProfileChange}
        />
        <HealthReport
          height={height}
          preWeight={preWeight}
          currentWeight={currentWeight}
        />
      </div>
    </div>
  )
}

export default MyPageTab