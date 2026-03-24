import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const today = new Date().toLocaleDateString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});


export default function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [loans, setLoans] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [penaltyToConfirm, setPenaltyToConfirm] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [loansRes, penaltiesRes, usersRes, booksRes, reservationsRes] =
          await Promise.all([
            api.get("/api/loans"),
            api.get("/api/penalties"),
            api.get("/api/users"),
            api.get("/api/books"),
            api.get("/api/reservations"),
          ]);
        setLoans(loansRes.data);
        setPenalties(penaltiesRes.data);
        setUsers(usersRes.data);
        setBooks(booksRes.data);
        setReservations(reservationsRes.data);
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Computed stats ──
  const activeLoans = loans.filter((l) =>
    ["BORROWED", "LATE"].includes(l.status)
  );
  const overdueLoans = loans.filter((l) => l.status === "LATE");
  const totalPenaltiesAmount = penalties
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalCopies = books.reduce((sum, b) => sum + (b.total_quantity || 0), 0);
  const availableCopies = books.reduce(
    (sum, b) => sum + (b.available_quantity || 0),
    0
  );
  const borrowedCopies = totalCopies - availableCopies;
  const availablePct =
    totalCopies > 0 ? Math.round((availableCopies / totalCopies) * 100) : 0;
  const borrowedPct =
    totalCopies > 0 ? Math.round((borrowedCopies / totalCopies) * 100) : 0;
  const activeReservations = reservations.filter((r) => r.status === "ACTIVE");

  // ── Filtered penalties table ──
  const filteredPenalties = penalties.filter(
    (p) =>
      p.book_title?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
    <div className="flex h-screen overflow-hidden font-display bg-slate-100 text-slate-900">

      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined">auto_stories</span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">LibraryConnect</h1>
              <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-3">Menu</p>
          <a href="#overview" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white text-[15px] font-semibold">
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            Dashboard
          </a>
          <a href="#inventory" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 text-[15px] font-medium transition-colors">
            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            Inventory
          </a>
          <a href="#users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 text-[15px] font-medium transition-colors">
            <span className="material-symbols-outlined text-[22px]">group</span>
            Users
          </a>
          <a href="#penalties" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 text-[15px] font-medium transition-colors">
            <span className="material-symbols-outlined text-[22px]">payments</span>
            Penalties
          </a>
          <a href="#reservations" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 text-[15px] font-medium transition-colors">
            <span className="material-symbols-outlined text-[22px]">event_upcoming</span>
            Reservations
          </a>
        </nav>

        {/* Admin account info at bottom */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-tight truncate">{user?.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">Administrator</p>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-8 h-[64px] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold leading-none">Dashboard Overview</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{today}</p>
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 w-64">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-500"
              placeholder="Search penalties…"
              type="text"
            />
          </div>
        </header>

      {/* ── Scrollable content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 md:p-10">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-400">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-primary"></div>
            </div>
          ) : (
            <div className="w-full space-y-10">

              {/* Page title */}
              <div id="overview">
                <h2 className="text-4xl font-black tracking-tight">Dashboard Overview</h2>
                <p className="text-slate-500 mt-2 text-base">Library status at a glance.</p>
              </div>

              {/* ── Metric Cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Active Loans</p>
                      <h3 className="text-4xl font-bold mt-2">{activeLoans.length}</h3>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                      <span className="material-symbols-outlined text-[24px]">book</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-5">BORROWED + LATE</p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Overdue Loans</p>
                      <h3 className="text-4xl font-bold mt-2 text-rose-600">{overdueLoans.length}</h3>
                    </div>
                    <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
                      <span className="material-symbols-outlined text-[24px]">pending_actions</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-5">Status LATE</p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Total Penalties</p>
                      <h3 className="text-4xl font-bold mt-2">{totalPenaltiesAmount.toFixed(2)} €</h3>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                      <span className="material-symbols-outlined text-[24px]">payments</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-5">{penalties.length} penalty record{penalties.length !== 1 ? "s" : ""}</p>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">Registered Users</p>
                      <h3 className="text-4xl font-bold mt-2">{users.length}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                      <span className="material-symbols-outlined text-[24px]">group</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-5">{users.filter(u => u.is_validated).length} validated</p>
                </div>
              </div>

              {/* ── Two-column section ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10" id="inventory">

                {/* Inventory Health */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-xl mb-7">Inventory Health</h4>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-500">Available Copies</span>
                        <span className="font-bold">{availableCopies} ({availablePct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${availablePct}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-500">On Loan</span>
                        <span className="font-bold">{borrowedCopies} ({borrowedPct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full">
                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${borrowedPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">info</span>
                    <p className="text-xs text-slate-600">
                      {books.length} book titles · {totalCopies} total copies in the system.
                    </p>
                  </div>
                </div>

                {/* Active Reservations */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm" id="reservations">
                  <div className="flex items-center justify-between mb-7">
                    <h4 className="font-bold text-xl">Active Reservations</h4>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {activeReservations.length} active
                    </span>
                  </div>
                  {activeReservations.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <span className="material-symbols-outlined text-3xl block mb-2">event_available</span>
                      <p className="text-sm">No active reservations</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {activeReservations.slice(0, 8).map((r) => (
                        <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{r.title}</p>
                            <p className="text-xs text-slate-500">{r.email}</p>
                          </div>
                          <span className="ml-3 shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            ACTIVE
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Penalties Table ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="penalties">
                <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xl">Penalties</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {penalties.filter((p) => p.status === "PENDING").length} pending · {penalties.filter((p) => p.status === "PAID").length} paid
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{filteredPenalties.length} record{filteredPenalties.length !== 1 ? "s" : ""}</span>
                </div>
                {filteredPenalties.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2">check_circle</span>
                    <p className="text-sm">No penalty records found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Book</th>
                          <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">User</th>
                          <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Reason</th>
                          <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Amount</th>
                          <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Status</th>
                          <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPenalties.map((p) => (
                          <tr key={p.id} className={`transition-colors ${p.status === "PAID" ? "bg-slate-50/50 opacity-60" : "hover:bg-slate-50"}`}>
                            <td className="px-8 py-5">
                              <p className={`text-sm font-bold ${p.status === "PAID" ? "line-through text-slate-400" : ""}`}>{p.book_title}</p>
                            </td>
                            <td className="px-8 py-5">
                              <p className="text-sm font-medium">{p.email}</p>
                            </td>
                            <td className="px-8 py-5">
                              <p className="text-sm text-slate-500">{p.reason}</p>
                            </td>
                            <td className="px-8 py-5">
                              <p className="text-sm font-bold">{parseFloat(p.amount).toFixed(2)} €</p>
                            </td>
                            <td className="px-8 py-5">
                              {p.status === "PAID" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                  Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                  <span className="material-symbols-outlined text-[13px]">schedule</span>
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-8 py-5">
                              {p.status === "PENDING" ? (
                                <button
                                  onClick={() => setPenaltyToConfirm(p)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">payments</span>
                                  Mark as Paid
                                </button>
                              ) : (
                                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-600 border border-emerald-100 bg-emerald-50 w-fit">
                                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                  Paid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Users Table ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="users">
                <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-bold text-xl">Registered Users</h4>
                  <span className="text-xs text-slate-500">{users.length} user{users.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Email</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Role</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Validated</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Member Since</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                                {u.email.charAt(0).toUpperCase()}
                              </div>
                              <p className="text-sm font-medium">{u.email}</p>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              u.role === "ADMIN"
                                ? "bg-primary/10 text-primary"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              u.is_validated
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              <span className="material-symbols-outlined text-[13px]">
                                {u.is_validated ? "check_circle" : "schedule"}
                              </span>
                              {u.is_validated ? "Validated" : "Pending"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(u.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
      </div>
    </div>

      {penaltyToConfirm && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setPenaltyToConfirm(null)}>
          <div style={{ position: 'relative', zIndex: 10000, backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', width: '100%', maxWidth: '28rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 mx-auto">
              <span className="material-symbols-outlined text-emerald-500 text-[32px]">payments</span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Payment</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Confirm that <span className="font-semibold text-slate-800">{penaltyToConfirm.email}</span> has paid the penalty of{" "}
                <span className="font-semibold text-slate-800">{parseFloat(penaltyToConfirm.amount).toFixed(2)} €</span> for{" "}
                <span className="font-semibold text-slate-800">"{penaltyToConfirm.book_title}"</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPenaltyToConfirm(null)}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.put(`/api/penalties/${penaltyToConfirm.id}/mark-paid`);
                    setPenalties((prev) =>
                      prev.map((x) => x.id === penaltyToConfirm.id ? { ...x, status: "PAID" } : x)
                    );
                    setPenaltyToConfirm(null);
                  } catch {
                    console.error("Failed to mark penalty as paid");
                  }
                }}
                className="flex-1 px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
