import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export function useNotifications(authToken, user) {
    const [notifications, setNotifications] = useState(['08:00', '21:00'])
    const [notificationsEnabled, setNotificationsEnabled] = useState(true)

    // Fetch User Settings
    useEffect(() => {
        if (!authToken) return
        const fetchSettings = async () => {
            try {
                const resSettings = await fetch(`${API_BASE}/auth/settings`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                })
                if (resSettings.ok) {
                    const settings = await resSettings.json()
                    setNotificationsEnabled(settings.notification_enabled)
                    setNotifications(settings.times || [])
                }
            } catch (e) {
                console.error("Failed to fetch settings", e)
            }
        }
        fetchSettings()
    }, [authToken, user?.id])

    const addNotification = async (time) => {
        // Optimistic
        setNotifications(prev => [...prev, time].sort())

        if (!authToken) return
        try {
            await fetch(`${API_BASE}/auth/settings/time`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ time })
            })
        } catch (e) {
            console.error("Failed to add notification", e)
        }
    }

    const removeNotification = async (time) => {
        // Optimistic
        setNotifications(prev => prev.filter(t => t !== time))

        if (!authToken) return
        try {
            await fetch(`${API_BASE}/auth/settings/time`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ time })
            })
        } catch (e) {
            console.error("Failed to remove notification", e)
        }
    }

    const toggleNotifications = async (enabled) => {
        // Optimistic
        setNotificationsEnabled(enabled)

        if (!authToken) return
        try {
            await fetch(`${API_BASE}/auth/settings/toggle`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ enabled })
            })
        } catch (e) {
            console.error("Failed to toggle settings", e)
        }
    }

    const resetNotifications = () => {
        setNotifications(['08:00', '21:00'])
        setNotificationsEnabled(true)
    }

    return {
        notifications,
        setNotifications,
        notificationsEnabled,
        setNotificationsEnabled,
        addNotification,
        removeNotification,
        toggleNotifications,
        resetNotifications
    }
}
