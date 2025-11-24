import { useMemo } from 'react'
import CalendarGrid from './CalendarGrid'
import TodoForm from './TodoForm'

const CalendarTab = ({
  stage,
  calendarMonth,
  selectedDate,
  todos,
  startDate,
  dueDate,
  onSelectDate,
  onChangeMonth,
  onAddTodo,
  onToggleTodo,
  supplements,
  partnerCalendarSamples
}) => {
  const selectedTodos = useMemo(
    () => todos.filter((todo) => todo.date === selectedDate),
    [todos, selectedDate]
  )

  return (
    <div className="calendar-tab">
      <section className="stage-summary">
        <div>
          <h2>{stage.label}</h2>
          <p>{stage.description}</p>
          {typeof stage.daysUntil === 'number' && stage.daysUntil >= 0 && <p>D-{stage.daysUntil}</p>}
        </div>
        <div className="timeline">
          {stage.timeline.map((item) => (
            <div key={item.id} style={{ background: item.active ? item.color : '#f3f4f6' }}>
              <strong>{item.label}</strong>
              <span>{item.range}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="calendar-section">
        <CalendarGrid
          month={calendarMonth.month}
          year={calendarMonth.year}
          selectedDate={selectedDate}
          todos={todos}
          startDate={startDate}
          dueDate={dueDate}
          onSelectDate={onSelectDate}
          onChangeMonth={onChangeMonth}
        />
        <div className="day-panel">
          <h3>{selectedDate}</h3>
          <ul>
            {selectedTodos.length === 0 && <li>등록된 할 일이 없어요.</li>}
            {selectedTodos.map((todo) => (
              <li key={todo.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => onToggleTodo(todo.id)}
                  />
                  <span className={todo.completed ? 'done' : ''}>{todo.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="todo-form">
        <h3>To do</h3>
        <TodoForm defaultDate={selectedDate} onAdd={onAddTodo} />
        <div className="todo-list">
          {todos.slice(-3).map((todo) => (
            <span key={todo.id}>
              {todo.text} · {todo.date}
            </span>
          ))}
        </div>
      </section>

      <section className="supplement-reminders">
        <h3>영양제 복용 알림</h3>
        <ul>
          {supplements.map((supplement) => (
            <li key={supplement.id}>
              <strong>{supplement.name}</strong>
              <span>{supplement.schedule}</span>
              <small>{supplement.notes}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="partner-calendar">
        <h3>부부 캘린더 공유</h3>
        <div className="partner-cards">
          {partnerCalendarSamples.map((item) => (
            <article key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <span>{item.tag}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default CalendarTab
