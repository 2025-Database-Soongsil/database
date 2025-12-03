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
// CalendarTab.jsx
import { useMemo } from 'react'
import CalendarGrid from './CalendarGrid'
import TodoForm from './TodoForm'
import './CalendarTab.css' // CSS 파일 임포트

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
  
  // 상태별 배경색 매핑 (CSS 변수 사용을 가정)
  const stageColorMap = {
      '준비기': '#E3F2FD', 
      '임신 초기': '#FCE4EC', 
      '임신 중기': '#FFF3E0',
      '임신 후기': '#E8F5E9'
  }

  return (
    <div className="calendar-layout">
      {/* 1. 상단 스테이지 요약 카드 */}
      <section className="stage-card card-box" style={{ 
          background: stageColorMap[stage.label] || '#F9FBE7', 
          border: `1px solid ${stage.color}` 
      }}>
        <div className="stage-info">
          <h2>{stage.label}</h2>
          <p>{stage.description}</p>
          {typeof stage.daysUntil === 'number' && stage.daysUntil >= 0 && (
              <span className="d-day-badge">D-{stage.daysUntil}</span>
          )}
        </div>
        <div className="stage-timeline">
          {stage.timeline.map((item) => (
            <div key={item.id} className={`timeline-item ${item.active ? 'active' : ''}`}>
              <strong>{item.label}</strong>
              <span>{item.range}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 메인 컨텐츠 (캘린더 + 상세 패널) */}
      <main className="main-content-grid">
        {/* 왼쪽: 캘린더 그리드 */}
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

        {/* 오른쪽: 상세 정보 패널 */}
        <aside className="detail-panel">
          {/* 할 일 목록 및 입력 */}
          <section className="day-detail card-box">
            <div className="panel-header">
              <h3>{selectedDate}의 할 일</h3>
              <span className="count">{selectedTodos.length}</span>
            </div>
            
            <ul className="todo-list-ui">
              {selectedTodos.length === 0 && <li className="empty-msg">등록된 할 일이 없어요 🍃</li>}
              {selectedTodos.map((todo) => (
                <li key={todo.id} className="todo-item">
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
            <div className="todo-input-wrapper">
                <TodoForm defaultDate={selectedDate} onAdd={onAddTodo} />
            </div>
          </section>

          {/* 영양제 알림 */}
          <section className="supplement-mini card-box">
            <h3>💊 오늘의 영양제</h3>
            <ul className="supplement-list">
              {supplements.slice(0, 3).map((sup) => (
                <li key={sup.id}>
                  <strong>{sup.name}</strong>
                  <span className="time">{sup.schedule}</span>
                </li>
              ))}
            </ul>
            {supplements.length === 0 && <div className="empty-msg">등록된 영양제가 없습니다.</div>}
          </section>
        </aside>
      </main>
      
      {/* 부부 캘린더 공유 (전체 너비) */}
      <section className="partner-calendar card-box">
        <h3>💑 부부 캘린더 공유</h3>
        <div className="partner-cards">
          {partnerCalendarSamples.map((item) => (
            <article key={item.id} className="partner-card">
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
              <span className="partner-tag">{item.tag}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default CalendarTab