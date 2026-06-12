import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || `Error ${res.status}`)
  return data
}
const get  = (path)       => apiFetch(path)
const post = (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) })

export default function Home() {
  const [tab, setTab]               = useState('books')
  const [books, setBooks]           = useState([])
  const [members, setMembers]       = useState([])
  const [borrows, setBorrows]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [toast, setToast]           = useState(null)
  const [modal, setModal]           = useState(null)
  const [form, setForm]             = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState('all')
  const [returning, setReturning]   = useState(null)

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [b, m] = await Promise.all([get('/books/'), get('/members/')])
      setBooks(b)
      setMembers(m)
      try {
        const recs = await get('/borrow')
        setBorrows(recs.map(r => ({ ...r, member_name: m.find(x => x.id === r.member_id)?.name || `Member #${r.member_id}` })))
      } catch { setBorrows([]) }
    } catch (e) { notify(e.message, 'error') }
    finally { setLoading(false) }
  }, [notify])

  useEffect(() => { loadAll() }, [loadAll])

  const openModal  = (type) => { setModal(type); setForm({}) }
  const closeModal = ()     => { setModal(null);  setForm({}) }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (modal === 'add-book') {
        if (!form.title || !form.author || !form.isbn) throw new Error('Title, author and ISBN are required')
        await post('/books/', { title: form.title.trim(), author: form.author.trim(), isbn: form.isbn.trim(), total_copies: parseInt(form.total_copies) || 1 })
        notify('Book added successfully')
      }
      if (modal === 'add-member') {
        if (!form.name || !form.email || !form.phone) throw new Error('Name, email and phone are required')
        await post('/members/member_add', { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() })
        notify('Member added successfully')
      }
      if (modal === 'borrow') {
        if (!form.book_id || !form.member_id) throw new Error('Please select a book and a member')
        await post('/borrow', { book_id: parseInt(form.book_id), member_id: parseInt(form.member_id) })
        notify('Book borrowed successfully')
      }
      closeModal(); loadAll()
    } catch (e) { notify(e.message, 'error') }
    finally { setSubmitting(false) }
  }

  const handleReturn = async (recordId) => {
    setReturning(recordId)
    try {
      await post('/return', { record_id: recordId })
      notify('Book returned successfully')
      loadAll()
    } catch (e) { notify(e.message, 'error') }
    finally { setReturning(null) }
  }

  const isActive  = (r) => r.status === 'borrowed'
  const daysOut   = (r) => Math.floor((Date.now() - new Date(r.borrow_date)) / 86400000)
  const isOverdue = (r) => isActive(r) && daysOut(r) > 14
  const activeCount  = borrows.filter(r => isActive(r)).length
  const overdueCount = borrows.filter(r => isOverdue(r)).length
  const fmtDate  = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '–'
  const initials = (n) => n?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  const filteredBooks   = books.filter(b => b.title?.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase()) || b.isbn?.includes(search))
  const filteredMembers = members.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase()))
  const filteredBorrows = borrows.filter(r => filter === 'active' ? isActive(r) : filter === 'returned' ? !isActive(r) : true)

  const S = (v) => ({ background: v })
  const statsData = [
    { icon: '📚', label: 'Total books',  value: books.length   },
    { icon: '👥', label: 'Members',      value: members.length },
    { icon: '📖', label: 'Borrowed',     value: activeCount    },
    { icon: '⚠️', label: 'Overdue',      value: overdueCount   },
  ]

  return (
    <>
      <Head><title>Library Manager</title></Head>
      <div style={{ minHeight: '100vh' }}>

        {/* ── Header ── */}
        <div style={{ background: 'var(--bg-primary)', borderBottom: '0.5px solid var(--border-light)', padding: '0 24px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14, height: 56 }}>
            <span style={{ fontSize: 22 }}>🏛️</span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Library Manager</span>
            <div style={{ width: 1, height: 20, background: 'var(--border-light)' }} />
            <nav style={{ display: 'flex', gap: 2 }}>
              {[['books','📚','Books'],['members','👥','Members'],['borrow','📖','Lending']].map(([id, icon, label]) => (
                <button key={id} onClick={() => { setTab(id); setSearch(''); setFilter('all') }} style={{
                  background: tab === id ? 'var(--bg-secondary)' : 'transparent',
                  border: '0.5px solid ' + (tab === id ? 'var(--border-light)' : 'transparent'),
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: tab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: tab === id ? 600 : 400,
                }}>{icon} {label}</button>
              ))}
            </nav>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>

          {/* ── Stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 20 }}>
            {statsData.map(s => (
              <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{s.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Main Panel ── */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border-light)', padding: 24 }}>

            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              {tab !== 'borrow' ? (
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>🔍</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab}…`} style={{ paddingLeft: 34 }} />
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 3, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 3 }}>
                  {[['all','All'],['active','Active'],['returned','Returned']].map(([v, l]) => (
                    <button key={v} onClick={() => setFilter(v)} style={{
                      background: filter === v ? 'var(--bg-primary)' : 'transparent',
                      border: '0.5px solid ' + (filter === v ? 'var(--border-light)' : 'transparent'),
                      borderRadius: 'var(--radius-md)', padding: '5px 12px', fontSize: 13,
                      fontWeight: filter === v ? 600 : 400,
                    }}>
                      {l}{v === 'active' && activeCount > 0 && <span style={{ marginLeft: 4, background: 'var(--color-red-bg)', color: 'var(--color-red)', borderRadius: 10, padding: '0 5px', fontSize: 11 }}>{activeCount}</span>}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ flex: 1 }} />
              {tab === 'books'   && <button onClick={() => openModal('add-book')}>+ Add book</button>}
              {tab === 'members' && <button onClick={() => openModal('add-member')}>+ Add member</button>}
              {tab === 'borrow'  && <button onClick={() => openModal('borrow')}>📤 Record borrow</button>}
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>}

            {/* Books list */}
            {!loading && tab === 'books' && (filteredBooks.length === 0
              ? <Empty icon="📚" title={search ? 'No books match your search' : 'No books yet'} sub={search ? 'Try different keywords' : 'Click + Add book to get started'} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredBooks.map(book => (
                    <div key={book.id} style={{ border: '0.5px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--color-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📚</div>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <p style={{ margin: 0, fontWeight: 500 }}>{book.title}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{book.author} · <code style={{ fontSize: 12 }}>{book.isbn}</code></p>
                      </div>
                      <span style={{ background: book.available_copies > 0 ? 'var(--color-green-bg)' : 'var(--color-red-bg)', color: book.available_copies > 0 ? 'var(--color-green)' : 'var(--color-red)', borderRadius: 'var(--radius-md)', padding: '2px 8px', fontSize: 12, fontWeight: 500 }}>
                        {book.available_copies}/{book.total_copies} available
                      </span>
                    </div>
                  ))}
                </div>
            )}

            {/* Members grid */}
            {!loading && tab === 'members' && (filteredMembers.length === 0
              ? <Empty icon="👥" title={search ? 'No members match your search' : 'No members yet'} sub={search ? 'Try different keywords' : 'Click + Add member to get started'} />
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}>
                  {filteredMembers.map(mem => (
                    <div key={mem.id} style={{ border: '0.5px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-blue-bg)', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>{initials(mem.name)}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 500 }}>{mem.name}</p>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>ID #{mem.id}</p>
                        </div>
                      </div>
                      <div style={{ borderTop: '0.5px solid var(--border-light)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>✉️ {mem.email}</p>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>📞 {mem.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
            )}

            {/* Lending list */}
            {!loading && tab === 'borrow' && (filteredBorrows.length === 0
              ? <Empty icon="📖" title="No borrow records" sub={filter === 'active' ? 'No books currently out' : filter === 'returned' ? 'No returns yet' : 'Click Record borrow to get started'} />
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredBorrows.map(rec => {
                    const active  = isActive(rec)
                    const days    = daysOut(rec)
                    const overdue = isOverdue(rec)
                    const book    = books.find(b => b.id === rec.book_id)
                    return (
                      <div key={rec.id} style={{ border: `0.5px solid ${overdue ? 'var(--color-red)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0, fontSize: 20, background: active ? (overdue ? 'var(--color-red-bg)' : 'var(--color-amber-bg)') : 'var(--color-green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {active ? (overdue ? '⚠️' : '⏳') : '✅'}
                        </div>
                        <div style={{ flex: 1, minWidth: 150 }}>
                          <p style={{ margin: 0, fontWeight: 500 }}>{book?.title || `Book #${rec.book_id}`}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{rec.member_name} · {fmtDate(rec.borrow_date)}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ background: overdue ? 'var(--color-red-bg)' : active ? 'var(--color-amber-bg)' : 'var(--color-green-bg)', color: overdue ? 'var(--color-red)' : active ? 'var(--color-amber)' : 'var(--color-green)', borderRadius: 'var(--radius-md)', padding: '2px 8px', fontSize: 12, fontWeight: 500 }}>
                            {overdue ? `${days}d overdue` : active ? `Out ${days}d` : `Returned ${fmtDate(rec.return_date)}`}
                          </span>
                          {active && <button onClick={() => handleReturn(rec.id)} disabled={returning === rec.id} style={{ fontSize: 13, opacity: returning === rec.id ? 0.5 : 1 }}>{returning === rec.id ? 'Returning…' : 'Return'}</button>}
                        </div>
                      </div>
                    )
                  })}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 }} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border-light)', padding: '1.5rem', width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>{modal === 'add-book' ? 'Add new book' : modal === 'add-member' ? 'Add new member' : 'Record a borrow'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 20, padding: 4 }}>✕</button>
            </div>
            {modal === 'add-book' && <>
              <FF label="Title *">  <input value={form.title  || ''} onChange={e => setForm(f => ({ ...f, title:  e.target.value }))} placeholder="The Great Gatsby" /></FF>
              <FF label="Author *"> <input value={form.author || ''} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="F. Scott Fitzgerald" /></FF>
              <FF label="ISBN *">   <input value={form.isbn   || ''} onChange={e => setForm(f => ({ ...f, isbn:   e.target.value }))} placeholder="978-0-0000-0000-0" /></FF>
              <FF label="Copies">   <input type="number" min={1} value={form.total_copies || 1} onChange={e => setForm(f => ({ ...f, total_copies: e.target.value }))} /></FF>
            </>}
            {modal === 'add-member' && <>
              <FF label="Full name *"> <input value={form.name  || ''} onChange={e => setForm(f => ({ ...f, name:  e.target.value }))} placeholder="Jane Smith" /></FF>
              <FF label="Email *">     <input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" /></FF>
              <FF label="Phone *">     <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" /></FF>
            </>}
            {modal === 'borrow' && <>
              <FF label="Book">
                <select value={form.book_id || ''} onChange={e => setForm(f => ({ ...f, book_id: e.target.value }))}>
                  <option value="">Select a book…</option>
                  {books.filter(b => b.available_copies > 0).map(b => <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>)}
                </select>
              </FF>
              <FF label="Member">
                <select value={form.member_id || ''} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}>
                  <option value="">Select a member…</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </FF>
              {books.filter(b => b.available_copies > 0).length === 0 && <p style={{ fontSize: 13, color: 'var(--color-amber)', margin: '0 0 12px' }}>⚠️ No books currently available.</p>}
            </>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={closeModal}>Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, background: toast.type === 'error' ? 'var(--color-red-bg)' : 'var(--color-green-bg)', color: toast.type === 'error' ? 'var(--color-red)' : 'var(--color-green)', borderRadius: 'var(--radius-md)', padding: '12px 16px', border: '0.5px solid currentColor', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, maxWidth: 340 }}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', marginLeft: 'auto', padding: 0, color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}
    </>
  )
}

function FF({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</label>{children}</div>
}

function Empty({ icon, title, sub }) {
  return (
    <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
      <p style={{ fontSize: 40, margin: '0 0 10px' }}>{icon}</p>
      <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</p>
      {sub && <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}
