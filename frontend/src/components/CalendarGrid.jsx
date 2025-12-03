/*import { formatDate } from '../utils/helpers'

const CalendarGrid = ({
  month,
  year,
  selectedDate,
  todos,
  startDate,
  dueDate,
  onSelectDate,
  onChangeMonth
}) => {
  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const date = new Date(year, month - 1, prevMonthDays - i)
    cells.push({ date, isCurrent: false })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    cells.push({ date, isCurrent: true })
  }
  let nextDay = 1
  while (cells.length < 42) {
    const date = new Date(year, month + 1, nextDay)
    cells.push({ date, isCurrent: false })
    nextDay += 1
  }

  const today = formatDate(new Date())

  const getBadges = (iso) => {
    const badges = []
    if (startDate === iso) badges.push('준비 시작')
    if (dueDate === iso) badges.push('예정일')
    const dayTodos = todos.filter((todo) => todo.date === iso)
    if (dayTodos.length) badges.push(`${dayTodos.length}개의 할 일`)
    return badges
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" onClick={() => onChangeMonth(-1)}>
          ◀
        </button>
        <strong>
          {year}년 {month + 1}월
        </strong>
        <button type="button" onClick={() => onChangeMonth(1)}>
          ▶
        </button>
      </div>
      <div className="calendar-grid">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        {cells.map(({ date, isCurrent }) => {
          const iso = formatDate(date)
          const badges = getBadges(iso)
          const classes = [
            'calendar-cell',
            isCurrent ? 'current' : '',
            iso === selectedDate ? 'selected' : '',
            iso === today ? 'today' : ''
          ]
          return (
            <button
              type="button"
              key={iso}
              onClick={() => onSelectDate(iso)}
              className={classes.join(' ')}
            >
              <span className="date-number">{date.getDate()}</span>
              {badges.map((badge) => (
                <span key={badge} className="calendar-badge">
                  {badge}
                </span>
              ))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid
*/
// CalendarGrid.jsx
import { formatDate } from '../utils/helpers'
import './CalendarGrid.css' // CSS 파일 임포트 추가 (CalendarTab.css와 분리)

const CalendarGrid = ({
  month,
  year,
  selectedDate,
  todos,
  startDate,
  dueDate,
  onSelectDate,
  onChangeMonth
}) => {
  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const date = new Date(year, month - 1, prevMonthDays - i)
    cells.push({ date, isCurrent: false })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    cells.push({ date, isCurrent: true })
  }
  let nextDay = 1
  while (cells.length < 42) {
    const date = new Date(year, month + 1, nextDay)
    cells.push({ date, isCurrent: false })
    nextDay += 1
  }

  const today = formatDate(new Date())

  const getEventTypes = (iso) => {
    const types = []
    if (startDate === iso) types.push('start')
    if (dueDate === iso) types.push('due')
    const dayTodos = todos.filter((todo) => todo.date === iso)
    if (dayTodos.length) types.push('todo')
    return types
  }

  return (
    <div className="calendar-wrapper">
      <div className="calendar-header-nav">
        <button type="button" onClick={() => onChangeMonth(-1)}>
          ◀
        </button>
        <strong>
          {year}. {month + 1}
        </strong>
        <button type="button" onClick={() => onChangeMonth(1)}>
          ▶
        </button>
      </div>
      
      <div className="calendar-grid-view">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
        {cells.map(({ date, isCurrent }) => {
          const iso = formatDate(date)
          const eventTypes = getEventTypes(iso)
          const isSelected = iso === selectedDate
          const isToday = iso === today

          return (
            <button
              type="button"
              key={iso}
              onClick={() => onSelectDate(iso)}
              className={`day-cell ${!isCurrent ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
            >
              <span className="day-number">{date.getDate()}</span>
              <div className="day-dots">
                {eventTypes.includes('start') && <span className="dot start-dot" title="시작일"></span>}
                {eventTypes.includes('due') && <span className="dot due-dot" title="예정일"></span>}
                {eventTypes.includes('todo') && <span className="dot todo-dot" title="할 일 있음"></span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid