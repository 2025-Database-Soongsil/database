import { formatDate } from '../utils/helpers'
import './CalendarGrid.css' // CSS 파일 임포트 추가 (CalendarTab.css와 분리)

const CalendarHeader = ({ year, month, onChangeMonth }) => (
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
)

const DayCell = ({ date, isCurrent, isSelected, isToday, eventTypes, onSelect }) => {
  const iso = formatDate(date)

  return (
    <button
      type="button"
      onClick={() => onSelect(iso)}
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
}

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
      <CalendarHeader year={year} month={month} onChangeMonth={onChangeMonth} />

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
            <DayCell
              key={iso}
              date={date}
              isCurrent={isCurrent}
              isSelected={isSelected}
              isToday={isToday}
              eventTypes={eventTypes}
              onSelect={(iso) => {
                onSelectDate(iso)
                if (!isCurrent) {
                  if (date < firstDay) {
                    onChangeMonth(-1)
                  } else {
                    onChangeMonth(1)
                  }
                }
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid