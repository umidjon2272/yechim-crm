import { useEffect, useMemo, useRef, useState } from 'react'
import { dateTimeParts, formatLocalDateTime } from '../../utils/dateTime'
import './DateTimePicker.scss'

const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const HOURS = Array.from({ length: 24 }, (_, index) => index)
const MINUTES = Array.from({ length: 60 }, (_, index) => index)

const pad = (value) => String(value).padStart(2, '0')

function calendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const mondayFirstOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []

  for (let index = 0; index < mondayFirstOffset; index += 1) days.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) days.push(day)
  while (days.length < 42) days.push(null)
  return days
}

function sameDate(left, right) {
  return left?.year === right?.year && left?.month === right?.month && left?.day === right?.day
}

export function DateTimePicker({ value = '', onChange, disabled = false, defaultHour = 14, defaultMinute = 0, placeholder = 'Sana va vaqtni tanlang', id, name, 'aria-invalid': ariaInvalid }) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('date')
  const selected = dateTimeParts(value, { defaultHour, defaultMinute })
  const today = useMemo(() => dateTimeParts(new Date()), [])
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = selected || today
    return { year: initial.year, month: initial.month - 1 }
  })

  useEffect(() => {
    if (!open) return undefined
    const handleOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handleOutsidePointer)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const displayedValue = selected
    ? `${selected.day} ${MONTHS[selected.month - 1].toLowerCase()} ${selected.year} · ${pad(selected.hour)}:${pad(selected.minute)}`
    : ''

  const emit = (parts) => {
    onChange?.({ target: { name, value: formatLocalDateTime(`${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`) } })
  }

  const selectDate = (day) => {
    if (!day) return
    emit({
      year: visibleMonth.year,
      month: visibleMonth.month + 1,
      day,
      hour: selected?.hour ?? defaultHour,
      minute: selected?.minute ?? defaultMinute,
    })
    setView('time')
  }

  const selectTime = (hour, minute = selected?.minute ?? defaultMinute) => {
    if (!selected) return
    emit({ ...selected, hour, minute })
  }

  const moveMonth = (offset) => {
    setVisibleMonth((current) => {
      const next = new Date(current.year, current.month + offset, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const openPicker = () => {
    if (disabled) return
    const initial = selected || today
    setVisibleMonth({ year: initial.year, month: initial.month - 1 })
    setView(selected ? 'time' : 'date')
    setOpen((current) => !current)
  }

  const days = calendarDays(visibleMonth.year, visibleMonth.month)

  return (
    <div className={`date-time-picker${open ? ' date-time-picker--open' : ''}`} ref={rootRef}>
      <button
        type="button"
        id={id}
        name={name}
        className={`date-time-picker__trigger${ariaInvalid ? ' date-time-picker__trigger--error' : ''}`}
        onClick={openPicker}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={ariaInvalid}
      >
        <span className={displayedValue ? '' : 'date-time-picker__placeholder'}>{displayedValue || placeholder}</span>
        <span className="date-time-picker__trigger-icon" aria-hidden="true">▣</span>
      </button>
      {open && (
        <div className="date-time-picker__popover" role="dialog" aria-label="Sana va vaqt tanlash">
          <div className="date-time-picker__tabs" role="tablist" aria-label="Tanlash turi">
            <button type="button" role="tab" aria-selected={view === 'date'} className={view === 'date' ? 'is-active' : ''} onClick={() => setView('date')}>Sana</button>
            <button type="button" role="tab" aria-selected={view === 'time'} className={view === 'time' ? 'is-active' : ''} onClick={() => setView('time')} disabled={!selected}>Vaqt</button>
          </div>
          {view === 'date' ? (
            <>
              <div className="date-time-picker__calendar-header">
                <button type="button" onClick={() => moveMonth(-1)} aria-label="Oldingi oy">‹</button>
                <strong>{MONTHS[visibleMonth.month]} {visibleMonth.year}</strong>
                <button type="button" onClick={() => moveMonth(1)} aria-label="Keyingi oy">›</button>
              </div>
              <div className="date-time-picker__weekdays" aria-hidden="true">
                {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
              </div>
              <div className="date-time-picker__days">
                {days.map((day, index) => (
                  <button
                    type="button"
                    key={`${visibleMonth.year}-${visibleMonth.month}-${day || `empty-${index}`}`}
                    className={day && sameDate(selected, { year: visibleMonth.year, month: visibleMonth.month + 1, day }) ? 'is-selected' : ''}
                    onClick={() => selectDate(day)}
                    disabled={!day}
                    aria-label={day ? `${day} ${MONTHS[visibleMonth.month]} ${visibleMonth.year}` : undefined}
                  >
                    {day || ''}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="date-time-picker__time-panel">
              <div className="date-time-picker__time-value">{selected ? `${pad(selected.hour)}:${pad(selected.minute)}` : '--:--'}</div>
              <span className="date-time-picker__time-label">Soatni tanlang</span>
              <div className="date-time-picker__time-section">
                <span className="date-time-picker__time-section-label">Soat</span>
                <div className="date-time-picker__options date-time-picker__options--hours">
                  {HOURS.map((hour) => <button type="button" key={hour} className={selected?.hour === hour ? 'is-selected' : ''} onClick={() => selectTime(hour)}>{pad(hour)}</button>)}
                </div>
              </div>
              <div className="date-time-picker__time-section">
                <span className="date-time-picker__time-section-label">Daqiqa</span>
                <div className="date-time-picker__options date-time-picker__options--minutes">
                  {MINUTES.map((minute) => <button type="button" key={minute} className={selected?.minute === minute ? 'is-selected' : ''} onClick={() => selectTime(selected?.hour ?? defaultHour, minute)}>{pad(minute)}</button>)}
                </div>
              </div>
            </div>
          )}
          <div className="date-time-picker__footer">
            <span>{selected ? `${selected.day} ${MONTHS[selected.month - 1].toLowerCase()} · ${pad(selected.hour)}:${pad(selected.minute)}` : 'Avval sana tanlang'}</span>
            <button type="button" onClick={() => setOpen(false)}>Tayyor</button>
          </div>
        </div>
      )}
    </div>
  )
}
