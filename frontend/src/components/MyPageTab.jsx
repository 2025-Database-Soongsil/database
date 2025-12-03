/*import { getWeightStatus } from '../utils/helpers'

const MyPageTab = ({ nickname, onNicknameChange, height, preWeight, currentWeight, onProfileChange }) => {
  const result = getWeightStatus(height, preWeight, currentWeight)
  return (
    <div className="mypage">
      <section>
        <h2>사용자 정보</h2>
        <label>
          닉네임
          <input name="nickname" value={nickname} onChange={(e) => onNicknameChange(e.target.value)} />
        </label>
        <div className="grid-3">
          <label>
            키(cm)
            <input
              type="number"
              name="height"
              value={height}
              onChange={(e) => onProfileChange('height', e.target.value)}
            />
          </label>
          <label>
            준비 전 체중(kg)
            <input
              type="number"
              name="pre"
              value={preWeight}
              onChange={(e) => onProfileChange('pre', e.target.value)}
            />
          </label>
          <label>
            현재 체중(kg)
            <input
              type="number"
              name="current"
              value={currentWeight}
              onChange={(e) => onProfileChange('current', e.target.value)}
            />
          </label>
        </div>
        {result && (
          <div className="weight-status">
            <h3>체중 변화 리포트</h3>
            <p>
              BMI: {result.bmi} / 증가량: {result.gained}kg
            </p>
            <p>권장 증가 범위: {result.target}</p>
            <strong>{result.message}</strong>
          </div>
        )}
      </section>
      <section>
        <h2>개인화 주의 문구</h2>
        <ul>
          <li>수면 시간을 일정하게 유지하면 호르몬 리듬이 안정돼요.</li>
          <li>카페인은 하루 1잔 이하로 제한해 주세요.</li>
          <li>하루 2L 이상의 수분 섭취가 필요합니다.</li>
        </ul>
      </section>
    </div>
  )
}

export default MyPageTab
*/
// MyPageTab.jsx
import { getWeightStatus } from '../utils/helpers'
import './MyPageTab.css' // CSS 파일 임포트

import { getWeightStatus } from '../utils/helpers'
import './MyPageTab.css'

const ProfileForm = ({ nickname, onNicknameChange, height, preWeight, currentWeight, onProfileChange }) => {
  // 값이 입력되지 않았을 경우 0으로 처리하여 계산 오류 방지
  const safeHeight = Number(height) || 0;
  const safePreWeight = Number(preWeight) || 0;
  const safeCurrentWeight = Number(currentWeight) || 0;

  return (
    <section className="profile-card card-box">
      <h3>신체 정보 입력 📝</h3>

      <div className="field-group">
        <label>닉네임</label>
        <input
          name="nickname"
          value={nickname}
          onChange={(e) => onNicknameChange(e.target.value)}
          className="styled-input"
        />
      </div>

      <div className="field-group">
        <div className="field-row">
          <div>
            <label>키(cm)</label>
            <input
              type="number"
              name="height"
              value={safeHeight}
              onChange={(e) => onProfileChange('height', e.target.value)}
              className="styled-input large"
            />
          </div>
          <div>
            <label>준비 전 체중(kg)</label>
            <input
              type="number"
              name="pre"
              value={safePreWeight}
              onChange={(e) => onProfileChange('pre', e.target.value)}
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
          value={safeCurrentWeight}
          onChange={(e) => onProfileChange('current', e.target.value)}
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