import { formatDate } from '../utils/helpers'

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
