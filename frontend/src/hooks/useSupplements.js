import { useState, useEffect } from 'react'
import { nutrientCatalog, initialSupplements } from '../data/presets'
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

    const fetchCustomSupplements = async (activeOnly = false) => {
        if (!authToken) return []
        try {
            const query = activeOnly ? '?active=true' : ''
            const res = await fetch(`${API_BASE}/users/custom-supplements${query}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
            if (res.ok) return await res.json()
        } catch (e) {
            console.error(e)
        }
        return []
    }

    const addCustomSupplement = async (name, note) => {
        if (!authToken) return null
        try {
            const res = await fetch(`${API_BASE}/users/custom-supplements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ name, note })
            })
            if (res.ok) return await res.json()
        } catch (e) {
            console.error(e)
        }
        return null
    }

    const toggleCustomSupplement = async (id, enabled) => {
        if (!authToken) return false
        try {
            const res = await fetch(`${API_BASE}/users/custom-supplements/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ enabled })
            })
            return res.ok
        } catch (e) {
            console.error(e)
            return false
        }
    }

    const deleteCustomSupplement = async (id) => {
        if (!authToken) return false
        try {
            const res = await fetch(`${API_BASE}/users/custom-supplements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
            return res.ok
        } catch (e) {
            console.error(e)
            return false
        }
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
        resetSupplements,
        fetchCustomSupplements,
        addCustomSupplement,
        deleteCustomSupplement,
        toggleCustomSupplement
    }
}
