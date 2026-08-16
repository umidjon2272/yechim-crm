import { Fragment } from 'react'
import './Pagination.scss'

export function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )

  return (
    <div className="pagination">
      <span className="pagination__info">
        {total === 0 ? '0 ta natija' : `${from}–${to} / ${total} ta natijadan`}
      </span>
      <div className="pagination__controls">
        <button className="pagination__btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Oldingi">
          ‹
        </button>
        {pages.map((p, idx) => (
          <Fragment key={p}>
            {idx > 0 && pages[idx - 1] !== p - 1 && <span>…</span>}
            <button
              className={`pagination__btn${p === page ? ' pagination__btn--active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          </Fragment>
        ))}
        <button
          className="pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Keyingi"
        >
          ›
        </button>
      </div>
    </div>
  )
}
