import { useState } from 'react'

export function useProfile() {
    const [height, setHeight] = useState('')
    const [preWeight, setPreWeight] = useState('')
    const [currentWeight, setCurrentWeight] = useState('')

    const resetProfile = () => {
        setHeight('')
        setPreWeight('')
        setCurrentWeight('')
    }

    return {
        height,
        setHeight,
        preWeight,
        setPreWeight,
        currentWeight,
        setCurrentWeight,
        resetProfile
    }
}
