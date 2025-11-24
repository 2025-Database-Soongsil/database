import { useState } from 'react'

const ChatbotTab = ({ messages, onSend }) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="chatbot">
      <div className="chat-window">
        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble ${message.role}`}>
            <p>{message.text}</p>
            <time>{message.time}</time>
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          value={input}
          placeholder="무엇이 궁금한가요?"
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">전송</button>
      </form>
    </div>
  )
}

export default ChatbotTab
