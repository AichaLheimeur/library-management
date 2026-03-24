import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function getPlaceholder(title) {
  return `https://placehold.co/300x400/1a2b3d/ffffff?text=${encodeURIComponent(title || "Book")}`;
}

function isDueSoon(dueDate) {
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  return days >= 0 && days <= 3;
}

function isOverdue(dueDate) {
  return new Date(dueDate) < new Date();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function wasReturnedLate(loan) {
  if (loan.status !== "RETURNED" || !loan.return_date || !loan.due_date) return false;
  return new Date(loan.return_date) > new Date(loan.due_date);
}

function LoanStatusBadge({ loan }) {
  if (loan.status === "RETURNED") {
    if (wasReturnedLate(loan)) {
      return <span className="bg-red-50 text-red-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Returned Late</span>;
    }
    return <span className="bg-green-50 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Returned on time</span>;
  }
  if (loan.status === "LATE" || (loan.status === "BORROWED" && isOverdue(loan.due_date))) {
    return <span className="bg-red-50 text-red-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Late</span>;
  }
  if (isDueSoon(loan.due_date)) {
    return <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Due Soon</span>;
  }
  return <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase">Borrowed</span>;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [loanToReturn, setLoanToReturn] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  };

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

  const handleReturnLoan = async () => {
    if (!loanToReturn) return;
    const wasLate = loanToReturn.status === "LATE" || isOverdue(loanToReturn.due_date);
    const title = loanToReturn.title;
    const id = loanToReturn.id;
    setLoanToReturn(null);
    try {
      const res = await api.put(`/api/loans/${id}/return`);
      setLoans((prev) => prev.map((l) => l.id === id ? { ...l, status: "RETURNED", return_date: new Date().toISOString() } : l));
      const penaltiesRes = await api.get("/api/penalties/me");
      setPenalties(penaltiesRes.data);
      if (wasLate) {
        const msg = res.data?.message || "";
        const match = msg.match(/([\d.]+)\s*€/);
        const amount = match ? match[1] : null;
        showError(
          amount
            ? `"${title}" returned. A penalty of ${amount} € has been applied. Please settle it at the library.`
            : `"${title}" returned late. Please settle your penalty at the library.`
        );
      } else {
        showToast(`"${title}" returned successfully.`);
      }
    } catch {
      showError("Could not return book. Please try again.");
    }
  };

  const handleCancelReservation = async () => {
    if (!reservationToCancel) return;
    const id = reservationToCancel.id;
    setReservationToCancel(null);
    try {
      await api.delete(`/api/reservations/${id}`);
      setReservations((prev) => prev.filter((r) => r.id !== id));
      showToast(`Reservation for "${reservationToCancel.title}" cancelled.`);
    } catch {
      showError("Could not cancel reservation. Please try again.");
    }
  };

  const activeLoans = loans.filter((l) => l.status === "BORROWED" || l.status === "LATE");
  const returnedLoans = loans.filter((l) => l.status === "RETURNED");
  const activeReservations = reservations.filter((r) => r.status === "ACTIVE");
  const totalPenalties = penalties
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
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
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight truncate text-slate-800">{user?.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Member</p>
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

          <div onClick={() => dueSoonCount > 0 && document.getElementById("loans")?.scrollIntoView({ behavior: "smooth" })} className={`p-8 rounded-2xl shadow-sm flex flex-col gap-5 hover:scale-[1.02] transition-transform cursor-pointer ${dueSoonCount > 0 ? "bg-primary text-white" : "bg-white border border-slate-100"}`}>
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
                {returnedLoans.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {showHistory ? "Hide history" : `Show history (${returnedLoans.length})`}
                    </button>
                    {showHistory && (
                      <button
                        onClick={async () => {
                          try {
                            await api.delete("/api/loans/history");
                            setLoans((prev) => prev.filter((l) => l.status !== "RETURNED"));
                            setShowHistory(false);
                            showToast("History cleared.");
                          } catch {
                            showError("Could not clear history.");
                          }
                        }}
                        className="text-xs font-semibold text-red-400 hover:text-red-600 hover:underline"
                      >
                        Clear history
                      </button>
                    )}
                  </div>
                )}
              </div>

              {loans.length === 0 ? (
                <div className="bg-white rounded-2xl p-14 text-center text-slate-400 border border-slate-100">
                  <span className="material-symbols-outlined text-5xl block mb-3">menu_book</span>
                  <p className="font-medium">You have no loans yet</p>
                </div>
              ) : activeLoans.length === 0 && !showHistory ? (
                <div className="bg-white rounded-2xl p-14 text-center text-slate-400 border border-slate-100">
                  <span className="material-symbols-outlined text-5xl block mb-3">task_alt</span>
                  <p className="font-medium">No active loans</p>
                  <p className="text-sm mt-1">
                    <button onClick={() => setShowHistory(true)} className="text-primary font-semibold hover:underline">
                      Check your history ({returnedLoans.length})
                    </button>
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Book</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Borrowed</th>
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                        {showHistory && <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Returned On</th>}
                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {loans
                        .filter((l) => showHistory || l.status !== "RETURNED")
                        .map((loan) => (
                        <tr key={loan.id} className={`hover:bg-slate-50/60 transition-colors ${loan.status === "RETURNED" ? "opacity-50" : ""}`}>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-9 h-14 rounded-lg overflow-hidden shrink-0 bg-primary/10">
                                <img
                                  src={loan.image_url ? `http://localhost:3000/images/${loan.image_url}` : getPlaceholder(loan.title)}
                                  alt={loan.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{loan.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{loan.author}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-600">{formatDate(loan.borrow_date)}</td>
                          <td className={`px-8 py-5 text-sm font-medium ${
                            (loan.status === "BORROWED" && (isDueSoon(loan.due_date) || isOverdue(loan.due_date))) || loan.status === "LATE" || wasReturnedLate(loan)
                              ? "text-red-600 font-semibold"
                              : "text-slate-600"
                          }`}>
                            {formatDate(loan.due_date)}
                          </td>
                          {showHistory && (
                            <td className={`px-8 py-5 text-sm font-medium ${
                              loan.status === "RETURNED"
                                ? wasReturnedLate(loan)
                                  ? "text-red-600"
                                  : "text-green-600"
                                : "text-slate-400"
                            }`}>
                              {loan.status === "RETURNED" ? formatDate(loan.return_date) : "—"}
                            </td>
                          )}
                          <td className="px-8 py-5">
                            <LoanStatusBadge loan={loan} />
                          </td>
                          <td className="px-8 py-5">
                            {(loan.status === "BORROWED" || loan.status === "LATE") && (
                              <button
                                onClick={() => setLoanToReturn(loan)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">undo</span>
                                Return
                              </button>
                            )}
                            {loan.status === "RETURNED" && (
                              <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-emerald-600 border border-emerald-100 bg-emerald-50">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Returned
                              </span>
                            )}
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
                    <div key={r.id} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5 group hover:border-primary/20 hover:shadow-md transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 bg-primary/10 shadow-sm">
                          <img
                            src={r.image_url ? `http://localhost:3000/images/${r.image_url}` : getPlaceholder(r.title)}
                            alt={r.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Waiting</span>
                          <h4 className="font-bold text-slate-800 text-base mt-2 leading-tight">{r.title}</h4>
                          <p className="text-sm text-slate-400 mt-0.5">{r.author}</p>
                          <p className="text-xs text-slate-400 mt-2">Reserved: {formatDate(r.reservation_date)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setReservationToCancel(r)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        Cancel reservation
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
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-2xl font-bold">My Penalties</h3>
                  {penalties.some((p) => p.status === "PAID") && (
                    <button
                      onClick={async () => {
                        try {
                          await api.delete("/api/penalties/history");
                          setPenalties((prev) => prev.filter((p) => p.status !== "PAID"));
                          showToast("Penalty history cleared.");
                        } catch {
                          showError("Could not clear history.");
                        }
                      }}
                      className="text-[11px] font-semibold text-white/50 hover:text-white transition-colors"
                    >
                      Clear history
                    </button>
                  )}
                </div>
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
                      <div key={p.id} className={`rounded-xl p-4 ${p.status === "PAID" ? "bg-white/5 opacity-50" : "bg-white/10"}`}>
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm font-semibold ${p.status === "PAID" ? "line-through" : ""}`}>{p.book_title}</p>
                          {p.status === "PAID" ? (
                            <span className="text-[10px] font-bold bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full shrink-0">PAID</span>
                          ) : (
                            <span className="text-[10px] font-bold bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full shrink-0">PENDING</span>
                          )}
                        </div>
                        <p className="text-xs text-white/60 mt-0.5">{p.reason}</p>
                        <div className="flex justify-between items-center mt-3">
                          <p className="text-base font-bold">{parseFloat(p.amount).toFixed(2)} €</p>
                          {p.status === "PENDING" && (
                            <p className="text-[10px] text-amber-300 font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">store</span>
                              Settle at the library
                            </p>
                          )}
                          {p.status === "PAID" && (
                            <p className="text-[10px] text-white/40">{formatDate(p.created_at)}</p>
                          )}
                        </div>
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

      {/* ── Success Toast ── */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-white px-5 py-4 rounded-xl shadow-lg">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* ── Error Toast ── */}
      {actionError && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-red-500 text-white px-5 py-4 rounded-xl shadow-lg">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <p className="text-sm font-semibold">{actionError}</p>
        </div>
      )}

      {/* ── Return Book Modal ── */}
      {loanToReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setLoanToReturn(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 mx-auto">
              <span className="material-symbols-outlined text-emerald-500 text-[32px]">undo</span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Return Book</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to return{" "}
                <span className="font-semibold text-slate-800">"{loanToReturn.title}"</span>?
              </p>
              {(loanToReturn.status === "LATE" || isOverdue(loanToReturn.due_date)) && (
                <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-left">
                  <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5">warning</span>
                  <p className="text-xs text-red-600 font-medium">
                    This book is overdue. A late penalty will be automatically applied to your account.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setLoanToReturn(null)}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnLoan}
                className="flex-1 px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
              >
                Return Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Reservation Modal ── */}
      {reservationToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReservationToCancel(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto">
              <span className="material-symbols-outlined text-red-500 text-[32px]">event_busy</span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Cancel Reservation</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to cancel your reservation for{" "}
                <span className="font-semibold text-slate-800">"{reservationToCancel.title}"</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReservationToCancel(null)}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={handleCancelReservation}
                className="flex-1 px-5 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                Cancel reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
