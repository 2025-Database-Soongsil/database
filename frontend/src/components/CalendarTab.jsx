/*import { useMemo } from 'react'
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
*/
import { useMemo, useEffect, useState } from 'react'
import CalendarGrid from './CalendarGrid'
import TodoForm from './TodoForm'
import './CalendarTab.css'

const TodoList = ({ selectedDate, todos, onAdd, onToggle, onDelete }) => (
  <section className="day-detail card-box">
    <div className="panel-header">
      <h3>{selectedDate}의 할 일</h3>
      <span className="count">{todos.length}</span>
    </div>

    <ul className="todo-list-ui">
      {todos.length === 0 && <li className="empty-msg">등록된 할 일이 없어요 🍃</li>}
      {todos.map((todo) => (
        <li key={todo.id} className="todo-item">
          <label className="todo-label">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggle(todo.id)}
            />
            <span className={todo.completed ? 'done' : ''}>{todo.text}</span>
          </label>
          <button
            className="delete-btn minus-btn"
            onClick={() => onDelete(todo.id)}
            aria-label="Delete todo"
          >
            -
          </button>
        </li>
      ))}
    </ul>
    <div className="todo-input-wrapper">
      <TodoForm defaultDate={selectedDate} onAdd={onAdd} />
    </div>
  </section>
)

const SupplementList = ({ supplements }) => (
  <section className="supplement-mini card-box">
    <h3>💊 오늘의 영양제</h3>
    <ul className="supplement-list">
      {supplements.slice(0, 5).map((sup) => (
        <li key={sup.id}>
          <strong>{sup.name}</strong>
          {/* Time removed as requested */}
        </li>
      ))}
    </ul>
    {supplements.length === 0 && <div className="empty-msg">등록된 영양제가 없습니다.</div>}
  </section>
)

const PartnerCalendar = ({ items }) => (
  <section className="partner-calendar card-box">
    <h3>💑 부부 캘린더 공유</h3>
    <div className="partner-cards">
      {items.map((item) => (
        <article key={item.id} className="partner-card">
          <strong>{item.title}</strong>
          <p>{item.detail}</p>
          <span className="partner-tag">{item.tag}</span>
        </article>
      ))}
    </div>
  </section>
)

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
  onDeleteTodo,
  supplements, // Legacy prop, can be ignored or removed if unused
  fetchUserSupplements,
  partnerCalendarSamples,
  gender
}) => {
  const [mySupplements, setMySupplements] = useState([])

  // Fetch user supplements on mount
  useEffect(() => {
    const loadSupplements = async () => {
      if (fetchUserSupplements) {
        const data = await fetchUserSupplements()
        setMySupplements(data)
      }
    }
    loadSupplements()
  }, [fetchUserSupplements])

  const selectedTodos = useMemo(
    () => todos.filter((todo) => todo.date === selectedDate),
    [todos, selectedDate]
  )

  const stageColorMap = {
    '준비기': '#E3F2FD',
    '임신 초기': '#FCE4EC',
    '임신 중기': '#FFF3E0',
    '임신 후기': '#E8F5E9'
  }

  // Custom title for male users
  const displayTitle = gender === 'male' ? '우리 아기 성장 기록 👶' : stage.label

  let displayDesc = stage.description
  if (gender === 'male') {
    if (stage.label === '일정을 입력해주세요') {
      displayDesc = '아내가 임신 정보를 입력하면 아기 성장 기록을 볼 수 있어요!'
    } else {
      displayDesc = `현재 아내는 ${stage.label}입니다. 함께 응원해주세요!`
    }
  }

  return (
    <div className="calendar-layout">
      <section className="stage-card card-box" style={{
        background: stageColorMap[stage.label] || '#F9FBE7',
        border: `1px solid ${stage.color || '#E0E0E0'}`
      }}>
        <div className="stage-info">
          <h2>{displayTitle}</h2>
          <p>{displayDesc}</p>
        </div>

        <div className="dashboard-grid">
          <div className="dash-item">
            <span className="dash-label">D-Day</span>
            <strong className="dash-value accent">
              {stage.daysUntil !== null ? `D-${stage.daysUntil}` : '-'}
            </strong>
          </div>
          <div className="dash-item">
            <span className="dash-label">현재 주수</span>
            <strong className="dash-value">
              {stage.weeks}주 {stage.days}일
            </strong>
          </div>
          <div className="dash-item">
            <span className="dash-label">아기 크기</span>
            <strong className="dash-value">{stage.babySize}</strong>
          </div>
        </div>
      </section>

      <main className="main-content-grid">
        <section className="calendar-area card-box">
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
        </section>

        <aside className="detail-panel">
          <TodoList
            selectedDate={selectedDate}
            todos={selectedTodos}
            onAdd={onAddTodo}
            onToggle={onToggleTodo}
            onDelete={onDeleteTodo}
          />
          <SupplementList supplements={mySupplements} />
        </aside>
      </main>

      <PartnerCalendar items={partnerCalendarSamples} />
    </div>
  )
}

export default CalendarTab