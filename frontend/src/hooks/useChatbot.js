import { useState } from 'react'
import { generateId } from '../utils/helpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export function useChatbot(authToken) {
    const [chatMessages, setChatMessages] = useState([
        {
            id: 'chat-01',
            role: 'bot',
            text: '임신 준비 관련 궁금한 점을 물어보세요.',
            time: '지금',
        },
    ])

    const sendMessage = async (message) => {
        const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        const userMessage = { id: generateId(), role: 'user', text: message, time }
        setChatMessages((prev) => [...prev, userMessage])

        try {
            const res = await fetch(`${API_BASE}/chatbot/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({ message }),
            })
            if (!res.ok) {
                const errText = await res.text()
                throw new Error(errText || '챗봇 요청에 실패했습니다.')
            }
            const data = await res.json()
            const reply = data?.reply || '답변을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'
            const assistantMessage = {
                id: `${generateId()}-assistant`,
                role: 'bot',
                text: reply,
                time: '방금',
            }
            setChatMessages((prev) => [...prev, assistantMessage])
        } catch (err) {
            const assistantMessage = {
                id: `${generateId()}-assistant`,
                role: 'bot',
                text: err.message || '채팅 중 오류가 발생했어요.',
                time: '방금',
            }
            setChatMessages((prev) => [...prev, assistantMessage])
        }
    }

    const resetChat = () => {
        setChatMessages([
            {
                id: 'chat-reset',
                role: 'bot',
                text: '임신 준비 관련 궁금한 점을 물어보세요.',
                time: '지금',
            },
        ])
    }

    return {
        chatMessages,
        sendMessage,
        resetChat
    }
}
