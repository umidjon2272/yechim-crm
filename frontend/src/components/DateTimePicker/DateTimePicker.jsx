import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { dateTimeParts, formatLocalDateTime } from '../../utils/dateTime'
import './DateTimePicker.scss'

const WEEKDAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const HOURS = Array.from({ length: 24 }, (_, index) => index)
const MINUTES = Array.from({ length: 60 }, (_, index) => index)
const WHEEL_ITEM_HEIGHT = 44

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

function WheelColumn({ label, value, items, wheelRef, onScroll, onSelect, id }) {
  return (
    <div className="date-time-picker__wheel-column">
      <span className="date-time-picker__wheel-label">{label}</span>
      <div className="date-time-picker__wheel-wrap">
        <div className="date-time-picker__wheel-selection" aria-hidden="true" />
        <div
          ref={wheelRef}
          className="date-time-picker__wheel"
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${id}-${value}`}
          onScroll={onScroll}
        >
          <span className="date-time-picker__wheel-spacer" aria-hidden="true" />
          {items.map((item) => (
            <button
              type="button"
              role="option"
              id={`${id}-${item}`}
              key={item}
              aria-selected={item === value}
              className={item === value ? 'is-selected' : ''}
              onClick={() => onSelect(item)}
            >
              {pad(item)}
            </button>
          ))}
          <span className="date-time-picker__wheel-spacer" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export function DateTimePicker({ value = '', onChange, disabled = false, defaultHour = 14, defaultMinute = 0, placeholder = 'Sana va vaqtni tanlang', id, name, 'aria-invalid': ariaInvalid }) {
  const pickerId = useId()
  const rootRef = useRef(null)
  const hourWheelRef = useRef(null)
  const minuteWheelRef = useRef(null)
  const scrollTimersRef = useRef({ hour: null, minute: null })
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('date')
  const [draft, setDraft] = useState(null)
  const selected = dateTimeParts(value, { defaultHour, defaultMinute })
  const today = useMemo(() => dateTimeParts(new Date()), [])
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = selected || today
    return { year: initial.year, month: initial.month - 1 }
  })

  const clearScrollTimers = useCallback(() => {
    Object.values(scrollTimersRef.current).forEach((timer) => {
      if (timer) window.clearTimeout(timer)
    })
    scrollTimersRef.current = { hour: null, minute: null }
  }, [])

  const closePicker = useCallback(() => {
    clearScrollTimers()
    setDraft(null)
    setOpen(false)
  }, [clearScrollTimers])

  useEffect(() => {
    if (!open) return undefined
    const handleOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) closePicker()
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') closePicker()
    }
    document.addEventListener('pointerdown', handleOutsidePointer)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [closePicker, open])

  useEffect(() => clearScrollTimers, [clearScrollTimers])

  useEffect(() => {
    if (!open || view !== 'time' || !draft) return undefined
    const frame = window.requestAnimationFrame(() => {
      hourWheelRef.current?.scrollTo({ top: draft.hour * WHEEL_ITEM_HEIGHT, behavior: 'auto' })
      minuteWheelRef.current?.scrollTo({ top: draft.minute * WHEEL_ITEM_HEIGHT, behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open, view])

  const previewParts = open ? draft || selected : selected
  const displayedValue = previewParts
    ? `${previewParts.day} ${MONTHS[previewParts.month - 1].toLowerCase()} ${previewParts.year} · ${pad(previewParts.hour)} : ${pad(previewParts.minute)}`
    : ''

  const emit = (parts) => {
    onChange?.({ target: { name, value: formatLocalDateTime(`${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`) } })
  }

  const selectDate = (day) => {
    if (!day) return
    const base = draft || selected || { ...today, hour: defaultHour, minute: defaultMinute }
    setDraft({
      ...base,
      year: visibleMonth.year,
      month: visibleMonth.month + 1,
      day,
    })
    setView('time')
  }

  const updateDraftTime = (type, index) => {
    setDraft((current) => {
      const base = current || selected || { ...today, hour: defaultHour, minute: defaultMinute }
      return { ...base, [type]: index }
    })
  }

  const snapWheel = (type, target, itemCount) => {
    const rawIndex = Math.round(target.scrollTop / WHEEL_ITEM_HEIGHT)
    const index = Math.max(0, Math.min(itemCount - 1, rawIndex))
    updateDraftTime(type, index)
    if (scrollTimersRef.current[type]) window.clearTimeout(scrollTimersRef.current[type])
    scrollTimersRef.current[type] = window.setTimeout(() => {
      if (Math.abs(target.scrollTop - index * WHEEL_ITEM_HEIGHT) > 1) target.scrollTo({ top: index * WHEEL_ITEM_HEIGHT, behavior: 'smooth' })
      scrollTimersRef.current[type] = null
    }, 90)
  }

  const handleWheelScroll = (type, itemCount) => (event) => {
    snapWheel(type, event.currentTarget, itemCount)
  }

  const selectWheelItem = (type, index) => {
    updateDraftTime(type, index)
    const wheel = type === 'hour' ? hourWheelRef.current : minuteWheelRef.current
    wheel?.scrollTo({ top: index * WHEEL_ITEM_HEIGHT, behavior: 'smooth' })
  }

  const moveMonth = (offset) => {
    setVisibleMonth((current) => {
      const next = new Date(current.year, current.month + offset, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const openPicker = () => {
    if (disabled) return
    if (open) {
      closePicker()
      return
    }
    const initial = selected || today
    setDraft(selected)
    setVisibleMonth({ year: initial.year, month: initial.month - 1 })
    setView(selected ? 'time' : 'date')
    setOpen(true)
  }

  const saveAndClose = () => {
    if (draft) emit(draft)
    closePicker()
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
            <button type="button" role="tab" aria-selected={view === 'time'} className={view === 'time' ? 'is-active' : ''} onClick={() => setView('time')} disabled={!draft && !selected}>Vaqt</button>
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
                    className={day && sameDate(draft || selected, { year: visibleMonth.year, month: visibleMonth.month + 1, day }) ? 'is-selected' : ''}
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
              <div className="date-time-picker__time-value">{draft ? `${pad(draft.hour)} : ${pad(draft.minute)}` : '-- : --'}</div>
              <span className="date-time-picker__time-label">24 soatlik vaqt</span>
              <div className="date-time-picker__wheels" aria-label="Vaqt tanlash">
                <WheelColumn
                  label="Soat"
                  value={draft?.hour ?? defaultHour}
                  items={HOURS}
                  wheelRef={hourWheelRef}
                  onScroll={handleWheelScroll('hour', HOURS.length)}
                  onSelect={(hour) => selectWheelItem('hour', hour)}
                  id={`${id || pickerId}-hour`}
                />
                <span className="date-time-picker__wheels-separator" aria-hidden="true">:</span>
                <WheelColumn
                  label="Daqiqa"
                  value={draft?.minute ?? defaultMinute}
                  items={MINUTES}
                  wheelRef={minuteWheelRef}
                  onScroll={handleWheelScroll('minute', MINUTES.length)}
                  onSelect={(minute) => selectWheelItem('minute', minute)}
                  id={`${id || pickerId}-minute`}
                />
              </div>
            </div>
          )}
          <div className="date-time-picker__footer">
            <span>{previewParts ? `${previewParts.day} ${MONTHS[previewParts.month - 1].toLowerCase()} · ${pad(previewParts.hour)} : ${pad(previewParts.minute)}` : 'Avval sana tanlang'}</span>
            <button type="button" onClick={saveAndClose}>Tayyor</button>
          </div>
        </div>
      )}
    </div>
  )
}
