import { useEffect, useState } from 'react'

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

export default TodoForm
