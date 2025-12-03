/*import { useEffect, useState } from 'react'

const TodoForm = ({ defaultDate, onAdd }) => {
  const [text, setText] = useState('')
  const [date, setDate] = useState(defaultDate)

  useEffect(() => {
    setDate(defaultDate)
  }, [defaultDate])

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd(text, date)
    setText('')
  }

  return (
    <form className="todo-entry" onSubmit={handleSubmit}>
      <input value={text} placeholder="할 일을 입력하세요" onChange={(e) => setText(e.target.value)} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <button type="submit">추가</button>
    </form>
  )
}

export default TodoForm*/
// TodoForm.jsx
import { useEffect, useState } from 'react'
import { formatDate } from '../utils/helpers'
import './TodoForm.css' // CSS 파일 임포트

const TodoForm = ({ defaultDate, onAdd }) => {
  const [text, setText] = useState('')
  const [date, setDate] = useState(defaultDate)

  useEffect(() => {
    // defaultDate가 변경될 때마다 date 상태를 업데이트합니다.
    if (defaultDate) {
        setDate(defaultDate)
    } else {
        // defaultDate가 없을 경우 오늘 날짜로 설정
        setDate(formatDate(new Date()))
    }
  }, [defaultDate])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text.trim(), date)
    setText('')
  }

  return (
    <form className="todo-entry" onSubmit={handleSubmit}>
      <input 
        value={text} 
        placeholder="할 일을 입력하세요" 
        onChange={(e) => setText(e.target.value)} 
        className="todo-input"
      />
      <input 
        type="date" 
        value={date} 
        onChange={(e) => setDate(e.target.value)} 
        className="date-input"
      />
      <button type="submit" className="add-btn">추가</button>
    </form>
  )
}

export default TodoForm