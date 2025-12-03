import { useState } from 'react'
import { initialSupplements, initialTodos, nutrientCatalog } from '../data/presets'
import { generateId } from '../utils/helpers'

export function useData() {
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

    const handleAddTodo = (text, date) => {
        if (!text || !date) return
        const clean = text.trim()
        if (!clean) return
        setTodos((prev) => [...prev, { id: generateId(), text: clean, date, completed: false }])
    }

    const handleToggleTodo = (id) => {
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
