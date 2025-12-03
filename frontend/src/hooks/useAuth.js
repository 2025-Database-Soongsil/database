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
                if (!res.ok) {
                    const txt = await res.text()
                    throw new Error(txt || 'Kakao 로그인 실패')
                }
                const data = await res.json()
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
            pregnant: Boolean(data.user?.pregnant),
            email: data.user?.email ?? '',
        }
        const datesFromUser = data.user?.dates || {}

        setUser(userInfo)
        setDates({ startDate: datesFromUser.startDate || '', dueDate: datesFromUser.dueDate || '' })
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

    const login = async (form) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, password: form.password }),
            })
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(txt || '로그인 실패')
            }
            const data = await res.json()
            handleAuthSuccess(data)
        } catch (err) {
            alert(err.message)
        }
    }

    const signup = async (form) => {
        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    nickname: form.nickname,
                    pregnant: form.pregnant,
                    due_date: form.dueDate || null,
                }),
            })
            if (!res.ok) {
                const txt = await res.text()
                throw new Error(txt || '회원가입 실패')
            }
            const data = await res.json()
            handleAuthSuccess(data)
        } catch (err) {
            alert(err.message)
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

    const loadGoogleScript = () =>
        new Promise((resolve, reject) => {
            if (googleReady.current) return resolve()
            if (googleScriptLoading.current) return reject(new Error('Google 스크립트 로딩 중입니다.'))
            googleScriptLoading.current = true
            const script = document.createElement('script')
            script.src = 'https://accounts.google.com/gsi/client'
            script.async = true
            script.onload = () => {
                googleReady.current = true
                resolve()
            }
            script.onerror = () => reject(new Error('Google 스크립트 로드 실패'))
            document.head.appendChild(script)
        })

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
                                if (!res.ok) {
                                    const txt = await res.text()
                                    throw new Error(txt || 'Google 로그인 실패')
                                }
                                const data = await res.json()
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
            )}&response_type=code`
            window.location.href = authorizeUrl
        }
    }

    return {
        loggedIn,
        user,
        setUser,
        authToken,
        dates,
        setDates,
        login,
        signup,
        logout,
        deleteAccount,
        socialLogin,
        updateNickname
    }
}
