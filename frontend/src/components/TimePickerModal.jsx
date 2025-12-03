import { useState, useEffect, useRef } from 'react'
import './TimePickerModal.css'

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const AMPM = ['오전', '오후']

const ITEM_HEIGHT = 40

const WheelColumn = ({ items, selectedValue, onSelect }) => {
    const containerRef = useRef(null)
    const isScrolling = useRef(false)

    // Initial Scroll Position
    useEffect(() => {
        if (containerRef.current) {
            const index = items.indexOf(selectedValue)
            if (index !== -1) {
                containerRef.current.scrollTop = index * ITEM_HEIGHT
            }
        }
    }, []) // Run once on mount

    const handleScroll = (e) => {
        if (isScrolling.current) return

        const scrollTop = e.target.scrollTop
        const index = Math.round(scrollTop / ITEM_HEIGHT)

        if (items[index] && items[index] !== selectedValue) {
            // We don't update state immediately on scroll to avoid jitter, 
            // but for a simple implementation, we can. 
            // Better: Update state only when snap finishes? 
            // Actually, for React controlled components, updating on scroll is fine 
            // if we don't force scroll position back immediately.
            onSelect(items[index])
        }
    }

    // Handle click to select
    const handleClick = (item, index) => {
        onSelect(item)
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: index * ITEM_HEIGHT,
                behavior: 'smooth'
            })
        }
    }

    return (
        <div
            className="wheel-column"
            ref={containerRef}
            onScroll={handleScroll}
        >
            {items.map((item, index) => (
                <div
                    key={item}
                    className={`wheel-item ${item === selectedValue ? 'selected' : ''}`}
                    onClick={() => handleClick(item, index)}
                >
                    {item}
                </div>
            ))}
        </div>
    )
}

const TimePickerModal = ({ isOpen, onClose, onConfirm, initialTime }) => {
    const [ampm, setAmpm] = useState('오전')
    const [hour, setHour] = useState(8)
    const [minute, setMinute] = useState('00')

    useEffect(() => {
        if (isOpen) {
            if (initialTime) {
                const [h, m] = initialTime.split(':').map(Number)
                if (h >= 12) {
                    setAmpm('오후')
                    setHour(h > 12 ? h - 12 : h) // 13->1, 12->12
                } else {
                    setAmpm('오전')
                    setHour(h === 0 ? 12 : h) // 0->12
                }
                setMinute(String(m).padStart(2, '0'))
            } else {
                // Default
                setAmpm('오전')
                setHour(8)
                setMinute('00')
            }
        }
    }, [isOpen, initialTime])

    if (!isOpen) return null

    const handleConfirm = () => {
        let h = hour
        if (ampm === '오후' && h !== 12) h += 12
        if (ampm === '오전' && h === 12) h = 0

        const timeString = `${String(h).padStart(2, '0')}:${minute}`
        onConfirm(timeString)
        onClose()
    }

    return (
        <div className="time-picker-overlay" onClick={onClose}>
            <div className="time-picker-modal" onClick={e => e.stopPropagation()}>
                <div className="time-picker-header">
                    <h3>시간 선택</h3>
                </div>

                <div className="wheel-container">
                    <div className="wheel-highlight"></div>

                    <WheelColumn
                        items={AMPM}
                        selectedValue={ampm}
                        onSelect={setAmpm}
                    />
                    <WheelColumn
                        items={HOURS}
                        selectedValue={hour}
                        onSelect={setHour}
                    />
                    <WheelColumn
                        items={MINUTES}
                        selectedValue={minute}
                        onSelect={setMinute}
                    />
                </div>

                <div className="time-picker-footer">
                    <button className="time-picker-btn cancel" onClick={onClose}>취소</button>
                    <button className="time-picker-btn confirm" onClick={handleConfirm}>확인</button>
                </div>
            </div>
        </div>
    )
}

export default TimePickerModal
