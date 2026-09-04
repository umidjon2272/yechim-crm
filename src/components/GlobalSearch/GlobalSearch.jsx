import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchService } from '../../services/search.service'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useDisclosure } from '../../hooks/useDisclosure'
import { SearchIcon, InboxIcon } from '../icons/Icons'
import { EmptyState } from '../EmptyState/EmptyState'
import { Spinner } from '../Spinner/Spinner'
import './GlobalSearch.scss'

const TYPE_LABELS = { customer: 'Mijoz', business: 'Biznes', lead: 'Murojaat', deal: 'Savdo' }
const TYPE_ROUTES = {
  customer: '/admin/crm/customers',
  business: '/admin/crm/businesses',
  lead: '/admin/crm/leads',
  deal: '/admin/crm/deals',
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const { isOpen, open, close } = useDisclosure()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setError(null)
      return undefined
    }

    const controller = new AbortController()
    setLoading(true)
    searchService
      .global(debouncedQuery.trim(), controller.signal)
      .then((data) => {
        setResults(data?.items ?? data ?? [])
        setError(null)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [debouncedQuery])

  useEffect(() => {
    if (!isOpen) return undefined
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, close])

  const handleSelect = (result) => {
    const basePath = TYPE_ROUTES[result.type]
    if (basePath) navigate(`${basePath}/${result.id}`)
    setQuery('')
    close()
  }

  return (
    <div className="global-search" ref={ref}>
      <span className="global-search__icon">
        <SearchIcon width={16} height={16} />
      </span>
      <input
        type="search"
        className="global-search__input"
        placeholder="Mijoz, biznes, murojaat, savdo qidirish..."
        value={query}
        onFocus={open}
        onChange={(e) => {
          setQuery(e.target.value)
          open()
        }}
      />

      {isOpen && query.trim() && (
        <div className="global-search__results">
          {loading && (
            <div className="page-loading" style={{ minHeight: 80 }}>
              <Spinner size="sm" />
            </div>
          )}

          {!loading && (error || results.length === 0) && (
            <EmptyState compact icon={<InboxIcon width={18} height={18} />} title="Natija topilmadi" />
          )}

          {!loading && !error && results.length > 0 && (
            <ul>
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button type="button" className="global-search__result" onClick={() => handleSelect(result)}>
                    <span className="global-search__result-type">{TYPE_LABELS[result.type] || result.type}</span>
                    <span className="global-search__result-label">{result.label || result.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
