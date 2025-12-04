import { stages } from '../data/presets'

export const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const calculateStage = (startDate, dueDate) => {
  if (!startDate || !dueDate) {
    return {
      label: '일정을 입력해주세요',
      description: '마이페이지에서 임신 정보를 입력하면\n맞춤 정보를 알려드려요!',
      daysUntil: null,
      weeks: 0,
      days: 0,
      babySize: '?',
      dueDate: '-'
    }
  }

  const today = new Date()
  const start = new Date(startDate)
  const due = new Date(dueDate)

  // Calculate D-Day
  const daysToDue = Math.ceil((due.getTime() - today.getTime()) / 86400000)

  // Calculate Current Week/Day (Pregnancy starts from LMP)
  const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / 86400000)
  const weeks = Math.floor(daysSinceStart / 7)
  const days = daysSinceStart % 7

  let label = ''
  let description = `출산 예정일: ${formatDate(due)}`
  let babySize = '작은 씨앗'

  if (weeks < 4) {
    label = '임신 초기'
    babySize = '양귀비 씨앗'
  } else if (weeks < 12) {
    label = '임신 초기'
    babySize = '라임'
  } else if (weeks < 28) {
    label = '임신 중기'
    babySize = '옥수수'
  } else {
    label = '임신 후기'
    babySize = '수박'
  }

  return {
    label,
    description,
    daysUntil: daysToDue,
    weeks: weeks > 0 ? weeks : 0,
    days: days > 0 ? days : 0,
    babySize,
    dueDate: formatDate(due)
  }
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
