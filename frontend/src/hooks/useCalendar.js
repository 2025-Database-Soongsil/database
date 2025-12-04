import { useState, useEffect } from 'react'
import { initialTodos } from '../data/presets'
import { generateId } from '../utils/helpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export function useCalendar(authToken, user) {
    const [calendarMonth, setCalendarMonth] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
    })

    const [selectedDate, setSelectedDate] = useState(
        new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).replace(/\. /g, '-').replace('.', '')
    )

    const [todos, setTodos] = useState(initialTodos)

    const handleMonthChange = (offset) => {
        setCalendarMonth((prev) => {
            const date = new Date(prev.year, prev.month + offset, 1)
            return { year: date.getFullYear(), month: date.getMonth() }
        })
    }

    // Fetch monthly data
    useEffect(() => {
        if (!authToken) return
        const fetchMonthly = async () => {
            try {
                const res = await fetch(`${API_BASE}/calendar/monthly?year=${calendarMonth.year}&month=${calendarMonth.month + 1}&user_id=${user.id || 0}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    const flatTodos = data.flatMap(day => day.todos || [])
                    setTodos(flatTodos)
                }
            } catch (e) {
                console.error("Failed to fetch calendar data", e)
            }
        }
        fetchMonthly()
    }, [calendarMonth, authToken, user?.id])

    const handleAddTodo = async (text, date) => {
        if (!text || !date) return
        const clean = text.trim()
        if (!clean) return

        // Optimistic update
        const tempId = generateId()
        const newTodo = { id: tempId, text: clean, date, completed: false }
        setTodos((prev) => [...prev, newTodo])

        if (authToken) {
            try {
                const res = await fetch(`${API_BASE}/calendar/events?user_id=${user.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ text: clean, date })
                })
                if (res.ok) {
                    const saved = await res.json()
                    setTodos(prev => prev.map(t => t.id === tempId ? { ...t, id: String(saved.id) } : t))
                }
            } catch (e) {
                console.error("Failed to save todo", e)
            }
        }
    }

    const handleToggleTodo = async (id) => {
        setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
    }

    const handleDeleteTodo = async (id) => {
        // Optimistic update
        setTodos((prev) => prev.filter((todo) => todo.id !== id))

        if (authToken) {
            try {
                const res = await fetch(`${API_BASE}/calendar/events/${id}?user_id=${user.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                })
                if (!res.ok) {
                    console.error("Failed to delete todo")
                    // Revert if failed (optional, but good practice)
                }
            } catch (e) {
                console.error("Failed to delete todo", e)
            }
        }
    }

    const resetCalendar = () => {
        setTodos(initialTodos)
        setSelectedDate(
            new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).replace(/\. /g, '-').replace('.', '')
        )
        setCalendarMonth({
            year: new Date().getFullYear(),
            month: new Date().getMonth(),
        })
    }

    return {
        calendarMonth,
        handleMonthChange,
        selectedDate,
        setSelectedDate,
        todos,
        setTodos,
        handleAddTodo,
        handleToggleTodo,
        handleDeleteTodo,
        resetCalendar
    }
}
