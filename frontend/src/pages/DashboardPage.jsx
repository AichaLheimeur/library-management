import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function isDueSoon(dueDate) {
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  return days >= 0 && days <= 3;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function LoanStatusBadge({ loan }) {
  if (loan.status === "RETURNED") {
    return <span className="bg-green-50 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Returned</span>;
  }
  if (loan.status === "LATE") {
    return <span className="bg-red-50 text-red-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Late</span>;
  }
  if (isDueSoon(loan.due_date)) {
    return <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Due Soon</span>;
  }
  return <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Borrowed</span>;
}

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [loansRes, reservationsRes, penaltiesRes] = await Promise.all([
          api.get("/api/loans/me"),
          api.get("/api/reservations/me"),
          api.get("/api/penalties/me"),
        ]);
        setLoans(loansRes.data);
        setReservations(reservationsRes.data);
        setPenalties(penaltiesRes.data);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCancelReservation = async (id) => {
    try {
      await api.delete(`/api/reservations/${id}`);
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Could not cancel reservation.");
    }
  };

  const activeLoans = loans.filter((l) => l.status === "BORROWED" || l.status === "LATE");
  const activeReservations = reservations.filter((r) => r.status === "ACTIVE");
  const totalPenalties = penalties.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const dueSoonCount = activeLoans.filter((l) => isDueSoon(l.due_date)).length;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center text-slate-400">
        <span className="material-symbols-outlined text-4xl animate-pulse">hourglass_empty</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center text-red-500">
        <span className="material-symbols-outlined mr-2">error</span>{error}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* TopBar unique — full width */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
          {/* Gauche : logo + titre */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-lg">
                <span className="material-symbols-outlined text-white text-lg">auto_stories</span>
              </div>
              <span className="font-bold text-primary text-lg tracking-tight hidden lg:block">LibraryConnect</span>
            </div>
            <div className="h-5 w-px bg-slate-200 mx-2"></div>
            <div>
              <h2 className="font-bold text-primary text-base">My Dashboard</h2>
              <p className="text-slate-400 text-xs hidden lg:block">Welcome back, manage your books easily</p>
            </div>
          </div>

          {/* Droite : nav links + search + icônes */}
          <div className="flex items-center gap-4 text-sm font-medium">
            <button onClick={() => navigate("/catalog")} className="text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors">Catalog</button>
            <button onClick={() => navigate("/dashboard")} className="text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors">Dashboard</button>
            <div className="h-5 w-px bg-slate-200"></div>
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input type="text" placeholder="Search loans..." className="bg-slate-100 rounded-full border-none pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 w-48 transition-all" />
            </div>
            <button onClick={() => { logout(); navigate("/login"); }} className="text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors">Logout</button>
          </div>
        </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1">

        {/* Sidebar locale au dashboard */}
        <aside className="w-80 shrink-0 hidden md:flex flex-col bg-slate-50 border-r border-slate-200 p-8 space-y-10 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
          <nav className="flex-1 space-y-2">
            <a href="#dashboard" className="flex items-center gap-4 bg-white text-primary rounded-xl px-5 py-4 shadow-sm font-semibold text-sm tracking-wider uppercase transition-all hover:translate-x-1 duration-200">
              <span className="material-symbols-outlined">dashboard</span>
              Dashboard
            </a>
            <a href="#loans" className="flex items-center gap-4 text-slate-500 px-5 py-4 font-semibold text-sm tracking-wider uppercase transition-all hover:bg-slate-200/50 hover:translate-x-1 duration-200 rounded-xl">
              <span className="material-symbols-outlined">book</span>
              My Loans
            </a>
            <a href="#reservations" className="flex items-center gap-4 text-slate-500 px-5 py-4 font-semibold text-sm tracking-wider uppercase transition-all hover:bg-slate-200/50 hover:translate-x-1 duration-200 rounded-xl">
              <span className="material-symbols-outlined">event_upcoming</span>
              Reservations
            </a>
            <a href="#penalties" className="flex items-center gap-4 text-slate-500 px-5 py-4 font-semibold text-sm tracking-wider uppercase transition-all hover:bg-slate-200/50 hover:translate-x-1 duration-200 rounded-xl">
              <span className="material-symbols-outlined">payments</span>
              Penalties
            </a>
          </nav>

          <div className="space-y-5">
            <button
              onClick={() => navigate("/catalog")}
              className="w-full bg-primary text-white rounded-full py-4 px-5 font-semibold text-base shadow-md active:scale-95 transition-all hover:bg-primary/90"
            >
              Browse Catalog
            </button>
            <div className="pt-4 space-y-1 border-t border-slate-200">
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="flex items-center gap-4 text-slate-500 px-5 py-3 font-semibold text-sm tracking-wider uppercase hover:text-red-500 w-full"
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-slate-50 p-8 lg:p-12">
        <div className="space-y-12">

        {/* Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-5 hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-blue-50 rounded-full text-blue-700">
                <span className="material-symbols-outlined">book_5</span>
              </div>
              <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">Live</span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase mb-2">Active Loans</p>
              <h3 className="text-4xl font-bold text-primary">{activeLoans.length}</h3>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-5 hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="p-3 bg-amber-50 rounded-full w-fit text-amber-700">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase mb-2">Reservations</p>
              <h3 className="text-4xl font-bold text-primary">{activeReservations.length}</h3>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-5 hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="p-3 bg-red-50 rounded-full w-fit text-red-700">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase mb-2">Penalties</p>
              <h3 className="text-4xl font-bold text-primary">{totalPenalties.toFixed(2)} €</h3>
            </div>
          </div>

          <div className={`p-8 rounded-2xl shadow-sm flex flex-col gap-5 hover:scale-[1.02] transition-transform cursor-pointer ${dueSoonCount > 0 ? "bg-primary text-white" : "bg-white border border-slate-100"}`}>
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-full w-fit ${dueSoonCount > 0 ? "bg-white/20 text-white" : "bg-green-50 text-green-700"}`}>
                <span className="material-symbols-outlined">alarm</span>
              </div>
              {dueSoonCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">URGENT</span>
              )}
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase mb-2 ${dueSoonCount > 0 ? "text-white/70" : "text-slate-500"}`}>Books Due Soon</p>
              <h3 className={`text-4xl font-bold ${dueSoonCount > 0 ? "text-white" : "text-primary"}`}>{dueSoonCount}</h3>
            </div>
          </div>

        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 xl:gap-14">

          {/* Left: Loans + Reservations */}
          <div className="lg:col-span-2 space-y-12">

            {/* My Loans */}
            <section id="loans">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">My Loans</h3>
                  <p className="text-slate-500 text-sm mt-1">{activeLoans.length} active item{activeLoans.length !== 1 ? "s" : ""} checked out</p>
                </div>
              </div>

              {loans.length === 0 ? (
                <div className="bg-white rounded-2xl p-14 text-center text-slate-400 border border-slate-100">
                  <span className="material-symbols-outlined text-5xl block mb-3">menu_book</span>
                  <p className="font-medium">No loans yet</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Book</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Borrowed</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-14 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary">book</span>
                              </div>
                              <span className="font-semibold text-primary">Book #{loan.book_id}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-600">{formatDate(loan.borrow_date)}</td>
                          <td className={`px-8 py-5 text-sm font-medium ${loan.status === "BORROWED" && isDueSoon(loan.due_date) ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                            {formatDate(loan.due_date)}
                          </td>
                          <td className="px-8 py-5">
                            <LoanStatusBadge loan={loan} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* My Reservations */}
            <section id="reservations">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-800">My Reservations</h3>
                <p className="text-slate-500 text-sm mt-1">Books you are currently waiting for</p>
              </div>

              {activeReservations.length === 0 ? (
                <div className="bg-white rounded-2xl p-14 text-center text-slate-400 border border-slate-100">
                  <span className="material-symbols-outlined text-5xl block mb-3">event_upcoming</span>
                  <p className="font-medium">No active reservations</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activeReservations.map((r) => (
                    <div key={r.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-primary/20 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-100 rounded-xl group-hover:bg-primary/5 transition-colors">
                          <span className="material-symbols-outlined text-primary">pending_actions</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-primary">{r.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{r.author}</p>
                          <p className="text-xs text-slate-400 mt-1">Reserved: {formatDate(r.reservation_date)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelReservation(r.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        title="Cancel reservation"
                      >
                        <span className="material-symbols-outlined">cancel</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* Right: Penalties + CTA */}
          <div id="penalties" className="space-y-6">

            <section className="bg-primary text-white p-10 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-1">My Penalties</h3>
                <p className="text-white/60 text-xs mb-8">
                  {totalPenalties === 0 ? "Good news! Your record is clear." : "Please settle your outstanding penalties."}
                </p>

                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {totalPenalties === 0 ? "verified" : "payments"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-4xl font-extrabold">{totalPenalties.toFixed(2)} €</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-white/60">Total Outstanding</p>
                  </div>
                </div>

                {penalties.length > 0 && (
                  <div className="mt-8 space-y-3">
                    {penalties.map((p) => (
                      <div key={p.id} className="bg-white/10 rounded-xl p-4">
                        <p className="text-sm font-semibold">{p.book_title}</p>
                        <p className="text-xs text-white/60 mt-0.5">{p.reason}</p>
                        <p className="text-base font-bold mt-2">{parseFloat(p.amount).toFixed(2)} €</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-[11px] font-medium leading-relaxed italic opacity-70">
                    "A library is not a luxury but one of the necessities of life."
                  </p>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
            </section>

            {/* CTA Browse Catalog */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary">auto_stories</span>
              </div>
              <div>
                <h4 className="font-bold text-primary">Explore the Catalog</h4>
                <p className="text-xs text-slate-400 mt-1">Discover new books available to borrow</p>
              </div>
              <button
                onClick={() => navigate("/catalog")}
                className="w-full bg-primary text-white rounded-full py-3 text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95"
              >
                Browse Catalog
              </button>
            </div>

          </div>

        </div>
        </div>
        </main>
      </div>
    </div>
  );
}
