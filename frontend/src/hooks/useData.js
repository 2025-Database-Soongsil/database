import { useState, useEffect } from 'react'
import { initialSupplements, initialTodos, nutrientCatalog } from '../data/presets'
import { generateId } from '../utils/helpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export function useData(authToken, user) {
    const [activeTab, setActiveTab] = useState('calendar')
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
    const [supplements, setSupplements] = useState(initialSupplements)
    const [todos, setTodos] = useState(initialTodos)
    const [notifications, setNotifications] = useState(['08:00', '21:00'])

    // Profile State
    const [height, setHeight] = useState('')
    const [preWeight, setPreWeight] = useState('')
    const [currentWeight, setCurrentWeight] = useState('')
    const [selectedNutrient, setSelectedNutrient] = useState(nutrientCatalog[0].id)

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
                    // data is List[CalendarDayInfo]
                    // We need to extract todos from it to set 'todos' state?
                    // Or does CalendarTab use the monthly data directly?
                    // CalendarTab takes 'todos' prop.
                    // Currently 'todos' is a flat list of all todos.
                    // The backend returns daily info.
                    // I should flatten the todos from the response.
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
                    // Update ID with real one from DB (saved is CalendarEvent dict)
                    setTodos(prev => prev.map(t => t.id === tempId ? { ...t, id: String(saved.id) } : t))
                    // Actually saved.id might be int, need to handle that.
                }
            } catch (e) {
                console.error("Failed to save todo", e)
                // Rollback?
            }
        }
    }

    const handleToggleTodo = async (id) => {
        // Since we don't have 'completed' in DB, treat toggle as DELETE for now?
        // Or just ignore persistence?
        // User asked for "Add".
        // Let's implement Delete if the UI allows deleting.
        // If 'toggle' is the only interaction, maybe I should map it to delete?
        // Let's just keep local toggle for now, but maybe add a delete function if needed.
        // For now, I'll leave toggle as local only to avoid data loss if they just wanted to check it.
        setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
    }

    const handleAddSupplement = (nutrient, supplement) => {
        setSupplements((prev) => [
            ...prev,
            {
                id: `${supplement.id}-${generateId()}`,
                name: supplement.name,
                nutrient: nutrient.nutrient,
                schedule: supplement.schedule,
                stage: nutrient.stage,
                notes: supplement.caution,
            },
        ])
    }

    const handleAddCustomSupplement = (supplement) => {
        setSupplements((prev) => [...prev, supplement])
    }

    const resetData = () => {
        setSupplements(initialSupplements)
        setTodos(initialTodos)
        setNotifications(['08:00', '21:00'])
        setSelectedNutrient(nutrientCatalog[0].id)
        setSelectedDate(
            new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).replace(/\. /g, '-').replace('.', '')
        )
        setActiveTab('calendar')
    }

    return {
        activeTab,
        setActiveTab,
        calendarMonth,
        handleMonthChange,
        selectedDate,
        setSelectedDate,
        supplements,
        setSupplements,
        todos,
        setTodos,
        notifications,
        setNotifications,
        height,
        setHeight,
        preWeight,
        setPreWeight,
        currentWeight,
        setCurrentWeight,
        selectedNutrient,
        setSelectedNutrient,
        handleAddTodo,
        handleToggleTodo,
        handleAddSupplement,
        handleAddCustomSupplement,
        resetData
    }
}
