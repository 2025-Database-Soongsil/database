import { getWeightStatus } from '../utils/helpers'

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
