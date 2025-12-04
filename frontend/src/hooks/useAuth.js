import { useState, useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID
const KAKAO_REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI

const requireEnv = (value, name) => {
    if (!value) {
        throw new Error(`${name} 환경 변수가 설정되어 있지 않습니다.`)
    }
    return value
}

export function useAuth() {
    const [loggedIn, setLoggedIn] = useState(false)
    const [user, setUser] = useState({
        nickname: '준비맘',
        pregnant: false,
        email: '',
    })
    const [authToken, setAuthToken] = useState(null)
    const [dates, setDates] = useState({ startDate: '', dueDate: '' })

    // Google Login Refs
    const googleScriptLoading = useRef(false)
    const googleReady = useRef(false)
    const googleBusy = useRef(false)
    const googleCodeClient = useRef(null)
    const googleLoginPending = useRef(false)
    const kakaoHandled = useRef(false)

    // Restore auth state on mount
    useEffect(() => {
        const savedAuth = localStorage.getItem('bp-auth')
        if (!savedAuth) return
        try {
            const parsed = JSON.parse(savedAuth)
            if (parsed?.token && parsed?.user?.id) {
                setAuthToken(parsed.token)
                setUser(parsed.user)
                setDates(parsed.dates || { startDate: '', dueDate: '' })
                setLoggedIn(true)
            } else {
                // Invalid session (missing ID), force logout
                localStorage.removeItem('bp-auth')
            }
        } catch (e) {
            console.warn('Failed to parse saved auth', e)
            localStorage.removeItem('bp-auth')
        }
    }, [])

    // Handle Google Login Focus
    useEffect(() => {
        const onFocus = () => {
            if (googleLoginPending.current) {
                googleBusy.current = false
                googleLoginPending.current = false
            }
        }
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [])

    const [registeringUser, setRegisteringUser] = useState(null) // { provider, social_id, email, nickname }

    const socialLogin = async (provider) => {
        if (provider === 'Google') {
            if (googleBusy.current) {
                alert('구글 로그인 진행 중입니다. 잠시만 기다려주세요.')
                return
            }
            try {
                const clientId = requireEnv(GOOGLE_CLIENT_ID, 'VITE_GOOGLE_CLIENT_ID')
                await loadGoogleScript()
                if (!googleCodeClient.current) {
                    googleCodeClient.current = window.google.accounts.oauth2.initCodeClient({
                        client_id: clientId,
                        scope: 'email profile',
                        ux_mode: 'popup',
                        callback: async (response) => {
                            if (!response.code) {
                                alert('Google 로그인 코드 발급에 실패했습니다.')
                                googleBusy.current = false
                                googleLoginPending.current = false
                                return
                            }
                            try {
                                const res = await fetch(`${API_BASE}/auth/google`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ credential: response.code, is_code: true }),
                                })
                                const data = await res.json()

                                if (data.status === 'register_required') {
                                    setRegisteringUser(data.social_info)
                                    return
                                }

                                if (!res.ok) {
                                    throw new Error(data.detail || 'Google 로그인 실패')
                                }
                                handleAuthSuccess(data)
                            } catch (err) {
                                alert(err.message)
                            } finally {
                                googleBusy.current = false
                                googleLoginPending.current = false
                            }
                        },
                    })
                }
                googleBusy.current = true
                googleLoginPending.current = true
                googleCodeClient.current.requestCode()
            } catch (err) {
                alert(err.message)
                googleBusy.current = false
                googleLoginPending.current = false
            }
        } else if (provider === 'Kakao') {
            const clientId = requireEnv(KAKAO_CLIENT_ID, 'VITE_KAKAO_CLIENT_ID')
            const redirectUri = requireEnv(KAKAO_REDIRECT_URI, 'VITE_KAKAO_REDIRECT_URI')
            const authorizeUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
                redirectUri,
            )}&response_type=code&prompt=login`
            window.location.href = authorizeUrl
        }
    }

    // Handle Kakao Callback
    useEffect(() => {
        const url = new URL(window.location.href)
        const isKakaoCallback = url.pathname.includes('/login/oauth2/code/kakao')
        const code = url.searchParams.get('code')
        if (!isKakaoCallback || !code || kakaoHandled.current) return
        kakaoHandled.current = true

        const exchange = async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/kakao`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code }),
                })
                const data = await res.json()

                if (data.status === 'register_required') {
                    setRegisteringUser(data.social_info)
                    // Clean URL
                    window.history.replaceState({}, document.title, '/')
                    return
                }

                if (!res.ok) {
                    throw new Error(data.detail || 'Kakao 로그인 실패')
                }
                handleAuthSuccess(data)
            } catch (err) {
                alert(err.message)
            } finally {
                window.history.replaceState({}, document.title, '/')
            }
        }
        exchange()
    }, [])

    const handleAuthSuccess = (data) => {
        const nickname = data.user?.nickname || user.nickname || '준비맘'
        const userInfo = {
            id: data.user?.id, // Store user ID
            nickname,
            pregnant: Boolean(data.user?.is_pregnant ?? data.user?.pregnant), // Handle DB column name
            gender: data.user?.gender, // Extract gender
            email: data.user?.email ?? '',
            profile: data.user?.profile || {},
            pregnancyDates: {
                lastPeriodDate: data.user?.pregnancy_info?.pregnancy_start || '',
                dueDate: data.user?.pregnancy_info?.due_date || ''
            }
        }
        const datesFromUser = {
            startDate: data.user?.pregnancy_info?.pregnancy_start || '',
            dueDate: data.user?.pregnancy_info?.due_date || ''
        }

        setUser(userInfo)
        setDates(datesFromUser)
        setAuthToken(data.token)
        setLoggedIn(true)

        localStorage.setItem(
            'bp-auth',
            JSON.stringify({
                token: data.token,
                user: userInfo,
                dates: datesFromUser,
            })
        )
    }

    const updatePregnancy = async (isPregnant, dates = {}) => {
        if (!authToken) return
        try {
            const payload = {
                is_pregnant: isPregnant,
                last_period_date: dates.lastPeriodDate || null,
                due_date: dates.dueDate || null
            }

            const res = await fetch(`${API_BASE}/users/pregnancy`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            })
            if (!res.ok) throw new Error('Failed to update pregnancy status')

            setUser(prev => ({
                ...prev,
                pregnant: isPregnant,
                pregnancyDates: {
                    lastPeriodDate: payload.last_period_date,
                    dueDate: payload.due_date
                }
            }))

            // Update local storage
            const saved = localStorage.getItem('bp-auth')
            if (saved) {
                const parsed = JSON.parse(saved)
                parsed.user.pregnant = isPregnant
                parsed.user.pregnancyDates = {
                    lastPeriodDate: payload.last_period_date,
                    dueDate: payload.due_date
                }
                localStorage.setItem('bp-auth', JSON.stringify(parsed))
            }
        } catch (e) {
            console.error(e)
            throw e
        }
    }

    const logout = () => {
        setLoggedIn(false)
        setAuthToken(null)
        googleBusy.current = false
        googleLoginPending.current = false
        localStorage.removeItem('bp-auth')
    }

    const deleteAccount = async () => {
        if (!authToken) return
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(txt || '회원 탈퇴 실패')
            }
            // 성공 시 로그아웃 처리는 UI에서 모달 확인 후 수행하도록 변경
            // logout() 
            // setUser(...) 
            // setDates(...)
        } catch (err) {
            console.error(err)
            throw err
        }
    }

    const updateNickname = async (newNickname) => {
        if (!authToken) return
        if (!newNickname || !newNickname.trim()) {
            throw new Error('닉네임을 입력해주세요.')
        }
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ nickname: newNickname })
            })
            if (!res.ok) throw new Error('Failed to update nickname')

            setUser(prev => ({ ...prev, nickname: newNickname }))

            // Update local storage
            const saved = localStorage.getItem('bp-auth')
            if (saved) {
                const parsed = JSON.parse(saved)
                parsed.user.nickname = newNickname
                localStorage.setItem('bp-auth', JSON.stringify(parsed))
            }
        } catch (e) {
            console.error(e)
            throw e // Throw error to be caught by UI
        }
    }

    const socialRegister = async (formData) => {
        if (!registeringUser) return
        try {
            const payload = {
                ...registeringUser,
                ...formData
            }
            const res = await fetch(`${API_BASE}/auth/signup/social`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(txt || '회원가입 실패')
            }
            const data = await res.json()
            handleAuthSuccess(data)
            setRegisteringUser(null)
        } catch (err) {
            console.error(err)
            throw err
        }
    }

    const cancelRegister = () => {
        setRegisteringUser(null)
    }

    const fetchDoctorsNotes = async () => {
        if (!authToken) return []
        const res = await fetch(`${API_BASE}/users/notes`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
        if (!res.ok) return []
        return await res.json()
    }

    const createDoctorsNote = async (content, visitDate) => {
        if (!authToken) return null
        const res = await fetch(`${API_BASE}/users/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ content, visit_date: visitDate || null })
        })
        if (!res.ok) throw new Error('Failed to create note')
        return await res.json()
    }

    const deleteDoctorsNote = async (noteId) => {
        if (!authToken) return false
        const res = await fetch(`${API_BASE}/users/notes/${noteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        })
        return res.ok
    }

    const [healthTips, setHealthTips] = useState([])

    useEffect(() => {
        if (authToken) {
            fetchHealthTips().then(setHealthTips)
        }
    }, [authToken])

    const fetchHealthTips = async () => {
        // Tips endpoint might not need auth, but we can send it if we have it
        const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        const res = await fetch(`${API_BASE}/users/tips`, { headers })
        if (!res.ok) return []
        return await res.json()
    }

    const refreshHealthTips = async () => {
        const tips = await fetchHealthTips()
        setHealthTips(tips)
    }

    return {
        loggedIn,
        user,
        setUser,
        authToken,
        dates,
        setDates,

        logout,
        deleteAccount,
        socialLogin,
        updateNickname,
        updatePregnancy,
        registeringUser,
        socialRegister,
        cancelRegister,

        fetchDoctorsNotes,
        createDoctorsNote,
        deleteDoctorsNote,
        healthTips,
        refreshHealthTips
    }
}
