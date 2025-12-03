import { useState } from 'react'
import { initialSupplements, nutrientCatalog } from '../data/presets'
import { generateId } from '../utils/helpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export function useSupplements(authToken, user) {
    const [supplements, setSupplements] = useState(initialSupplements)
    const [selectedNutrient, setSelectedNutrient] = useState(nutrientCatalog[0].id)

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

    const fetchNutrients = async (period) => {
        try {
            const res = await fetch(`${API_BASE}/supplements/nutrients?period=${period}`)
            if (res.ok) {
                return await res.json()
            }
        } catch (e) {
            console.error("Failed to fetch nutrients", e)
        }
        return []
    }

    const resetSupplements = () => {
        setSupplements(initialSupplements)
        setSelectedNutrient(nutrientCatalog[0].id)
    }

    return {
        supplements,
        setSupplements,
        selectedNutrient,
        setSelectedNutrient,
        handleAddSupplement,
        handleAddCustomSupplement,
        fetchNutrients,
        resetSupplements
    }
}
