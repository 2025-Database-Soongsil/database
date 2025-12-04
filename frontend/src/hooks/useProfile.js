import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export function useProfile(authToken, user) {
    const [height, setHeight] = useState('')
    const [preWeight, setPreWeight] = useState('')
    const [currentWeight, setCurrentWeight] = useState('')

    // Sync with user profile on load/update
    useEffect(() => {
        if (user?.profile) {
            setHeight(user.profile.height || '')
            setPreWeight(user.profile.preWeight || '')
            setCurrentWeight(user.profile.currentWeight || '')
        }

        // Also fetch fresh data from API if we have a token
        if (authToken) {
            fetch(`${API_BASE}/users/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.user?.profile) {
                        setHeight(data.user.profile.height || '')
                        setPreWeight(data.user.profile.preWeight || '')
                        setCurrentWeight(data.user.profile.currentWeight || '')
                    }
                })
                .catch(err => console.error("Failed to fetch profile", err))
        }
    }, [user, authToken])

    const resetProfile = () => {
        setHeight('')
        setPreWeight('')
        setCurrentWeight('')
    }

    const saveProfile = async (profileData) => {
        if (!authToken) {
            alert('로그인이 필요합니다.')
            return false
        }
        try {
            const res = await fetch(`${API_BASE}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(profileData)
            })

            if (!res.ok) {
                throw new Error('프로필 저장 실패')
            }

            const data = await res.json()
            const { profile } = data
            setHeight(profile.height || '')
            setPreWeight(profile.preWeight || '')
            setCurrentWeight(profile.currentWeight || '')
            return true
        } catch (err) {
            console.error(err)
            alert('프로필 저장에 실패했습니다.')
            return false
        }
    }

    return {
        height,
        setHeight,
        preWeight,
        setPreWeight,
        currentWeight,
        setCurrentWeight,
        resetProfile,
        saveProfile
    }
}
