import { useState } from 'react'
import { Shield, Eye, EyeOff, Search, X } from 'lucide-react'

export default function AdminPinPanel({ onClose, fetchAllUserPins }) {
  const [pins, setPins] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [visiblePins, setVisiblePins] = useState({})

  async function loadPins() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAllUserPins()
      setPins(data)
      setLoaded(true)
    } catch (err) {
      setError(err.message || 'Failed to load PINs')
    } finally {
      setLoading(false)
    }
  }

  function togglePinVisibility(userId) {
    setVisiblePins((prev) => ({ ...prev, [userId]: !prev[userId] }))
  }

  const filteredPins = pins.filter((p) =>
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-300/70 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-stone-200 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4 dark:border-slate-700 dark:from-red-900/20 dark:to-orange-900/20">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h2 className="font-serif text-lg text-stone-900 dark:text-stone-100">
              Admin — User PINs
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-200 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-5">
          {!loaded ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-stone-600 dark:text-slate-300">
                Click below to load all user PINs. This action is restricted to admins only.
              </p>
              <button
                onClick={loadPins}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                <Shield className="h-4 w-4" />
                {loading ? 'Loading...' : 'Load User PINs'}
              </button>
              {error && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-9 pr-4 text-sm text-stone-900 outline-none ring-red-500 transition focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto">
                {filteredPins.length === 0 ? (
                  <p className="py-4 text-center text-sm text-stone-500 dark:text-slate-400">
                    No users found.
                  </p>
                ) : (
                  filteredPins.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800 dark:text-slate-100">
                          {user.username}
                        </p>
                        <p className="truncate text-xs text-stone-500 dark:text-slate-400">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-stone-800 dark:text-slate-100">
                          {visiblePins[user.id]
                            ? user.pin_code || 'No PIN'
                            : user.pin_code
                              ? '• • • •'
                              : 'No PIN'}
                        </span>
                        {user.pin_code && (
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(user.id)}
                            className="rounded-lg p-1 text-stone-400 transition hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300"
                          >
                            {visiblePins[user.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
