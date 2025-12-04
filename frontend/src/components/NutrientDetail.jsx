import { useState, useEffect } from 'react'
import './SupplementsTab.css'

const NutrientDetail = ({ current, onToggleSupplement, mySupplements = [] }) => {
    const [isExpanded, setIsExpanded] = useState(false)

    // Reset expansion when nutrient changes
    useEffect(() => {
        setIsExpanded(false)
    }, [current.id])

    // Parse description to separate main text and sub text (in parentheses)
    const parseDescription = (text) => {
        if (!text) return { main: '', sub: null }
        const match = text.match(/^(.*?)\s*\((.*?)\)\s*$/)
        if (match) {
            return { main: match[1], sub: match[2] }
        }
        return { main: text, sub: null }
    }

    const { main, sub } = parseDescription(current.description)

    const supplements = current.supplements || []
    const visibleSupplements = isExpanded ? supplements : supplements.slice(0, 2)
    const showToggle = supplements.length > 2

    return (
        <>
            <header className="content-header">
                <h2>{current.name}</h2>
                <p className="desc">{main}</p>
                {sub && <p className="sub-desc">{sub}</p>}
                <div className="benefit-tags">
                    {current.benefits?.map((benefit) => (
                        <span key={benefit} className="tag">{benefit}</span>
                    ))}
                </div>
            </header>

            <section className="recommend-section">
                <h3>추천 제품 / 섭취 가이드</h3>
                <div className="supplement-grid">
                    {visibleSupplements.length > 0 ? (
                        visibleSupplements.map((supplement) => {
                            const isAdded = mySupplements.some(s => s.supplement_id === supplement.id)
                            return (
                                <article key={supplement.id} className={`supplement-card ${isAdded ? 'selected' : ''}`}>
                                    <div className="card-header">
                                        <h4>{supplement.name}</h4>
                                        <button
                                            className={`add-btn ${isAdded ? 'remove' : ''}`}
                                            onClick={() => onToggleSupplement(current, supplement)}
                                        >
                                            {isAdded ? '제외 -' : '추가 ＋'}
                                        </button>
                                    </div>
                                    <p className="schedule-info">🕒 {supplement.schedule}</p>
                                    {supplement.caution && (
                                        <p className="caution-info">⚠️ {supplement.caution}</p>
                                    )}
                                </article>
                            )
                        })
                    ) : (
                        <p className="empty-message">추천 제품 정보가 없습니다.</p>
                    )}
                </div>

                {showToggle && (
                    <button
                        className="toggle-more-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? '접기 ▲' : '더보기 ▼'}
                    </button>
                )}
            </section>
        </>
    )
}

export default NutrientDetail
