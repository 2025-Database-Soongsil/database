/*import { useState } from 'react'

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

export default ChatbotTab*/
// ChatbotTab.jsx
import { useState, useEffect } from 'react'
import './ChatbotTab.css' // CSS 파일 임포트

const Typewriter = ({ text, speed = 30, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i))
        i++
      } else {
        clearInterval(timer)
        if (onComplete) onComplete()
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, onComplete])

  return <p>{displayedText}</p>
}

const ChatbotTab = ({ messages, onSend, isLoading, markAsRead }) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="chatbot-container">
      <div className="chat-window">
        {messages.length === 0 && (
          <div className="empty-chat">
            <span className="bot-icon">🤖</span>
            <p>궁금한 점을 물어보세요!<br />친절하게 답변해 드릴게요.</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`message-row ${message.role}`}>
            {message.role === 'bot' && <div className="avatar">🤖</div>}
            <div className="bubble">
              {message.role === 'bot' && message.isNew ? (
                <Typewriter
                  text={message.text}
                  onComplete={() => markAsRead(message.id)}
                />
              ) : (
                <p>{message.text}</p>
              )}
              <time>{message.time}</time>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-row bot">
            <div className="avatar">🤖</div>
            <div className="bubble loading">
              <div className="dot-flashing"></div>
            </div>
          </div>
        )}
      </div>
      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input
          value={input}
          placeholder="임신 초기 주의사항, 영양제 복용량 등을 물어보세요."
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="send-btn">전송</button>
      </form>
    </div>
  )
}

export default ChatbotTab