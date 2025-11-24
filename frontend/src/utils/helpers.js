import { stages } from '../data/presets'

export const formatDate = (date) => date.toISOString().split('T')[0]

export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const calculateStage = (startDate, dueDate) => {
  if (!startDate || !dueDate) {
    return {
      label: '일정을 입력해주세요',
      description: '임신 준비 시작일과 예정일을 입력하면 자동으로 단계가 계산돼요.',
      daysUntil: null,
      daysToDue: null,
      timeline: stages.map((stage) => ({ ...stage, active: false }))
    }
  }

  const today = new Date()
  const start = new Date(startDate)
  const dayDiff = Math.ceil((start.getTime() - today.getTime()) / 86400000)
  const due = new Date(dueDate)
  const daysToDue = Math.ceil((due.getTime() - today.getTime()) / 86400000)

  let label = ''
  let description = ''

  if (dayDiff > 90) {
    label = '기초 준비기'
    description = '몸 상태를 가볍게 정비하면서 생활 습관을 조정하면 좋아요.'
  } else if (dayDiff > 30) {
    label = '집중 준비기'
    description = '배란 주기를 일정하게 유지하고 필요한 검진 일정을 챙겨볼까요?'
  } else if (dayDiff >= 0) {
    label = '임박기'
    description = '배란 주간이에요. 휴식과 수분 섭취, 일정한 수면 리듬을 신경 써주세요.'
  } else {
    label = '임신 진행 중'
    description = '임신 주차 정보를 기반으로 영양과 검사 일정을 관리해요.'
  }

  const timeline = stages.map((stage) => ({
    ...stage,
    active: stage.label === label
  }))

  return { label, description, daysUntil: dayDiff, daysToDue, timeline }
}

export const getWeightStatus = (height, prePregWeight, currentWeight) => {
  const h = Number(height)
  const pre = Number(prePregWeight)
  const current = Number(currentWeight)
  if (!h || !pre || !current) return null

  const bmi = pre / ((h / 100) ** 2)
  let targetGainRange
  if (bmi < 18.5) targetGainRange = [12.5, 18]
  else if (bmi < 25) targetGainRange = [11.5, 16]
  else if (bmi < 30) targetGainRange = [7, 11.5]
  else targetGainRange = [5, 9]

  const gained = current - pre

  let message = '안정적인 범위예요.'
  if (gained < targetGainRange[0]) {
    message = '조금 더 에너지를 보충해도 괜찮아요.'
  } else if (gained > targetGainRange[1]) {
    message = '증가 폭이 다소 빠릅니다. 담당의와 상의해 주세요.'
  }

  return {
    bmi: bmi.toFixed(1),
    gained: gained.toFixed(1),
    target: `${targetGainRange[0]}kg ~ ${targetGainRange[1]}kg`,
    message
  }
}
