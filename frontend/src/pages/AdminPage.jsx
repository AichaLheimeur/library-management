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
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userToDelete, setUserToDelete] = useState(null);
  const [adminToast, setAdminToast] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const showAdminToast = (msg) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 3000);
  };

  // ── Book management state ──
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [bookForm, setBookForm] = useState({ title: "", author: "", category: "", description: "", total_quantity: 1, available_quantity: 1, image_url: "" });
  const [bookError, setBookError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [loansRes, usersRes, booksRes, reservationsRes, notifRes] =
          await Promise.all([
            api.get("/api/loans"),
            api.get("/api/users"),
            api.get("/api/books"),
            api.get("/api/reservations"),
            api.get("/api/notifications"),
          ]);
        setLoans(loansRes.data);
        setUsers(usersRes.data);
        setBooks(booksRes.data);
        setReservations(reservationsRes.data);
        setNotifications(notifRes.data);
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

  // ── User management handlers ──
  const handleValidateUser = async (u) => {
    try {
      await api.put(`/api/users/${u.id}/validate`);
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_validated: true } : x));
      showAdminToast(`${u.email} has been validated.`);
    } catch {
      showAdminToast("Could not validate user.");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/api/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== userToDelete.id));
      showAdminToast(`${userToDelete.email} has been deleted.`);
      setUserToDelete(null);
    } catch {
      setUserToDelete(null);
    }
  };

  // ── Book form handlers ──
  const openAddBook = () => {
    setEditingBook(null);
    setBookForm({ title: "", author: "", category: "", description: "", total_quantity: 1, image_url: "" });
    setBookError(null);
    setShowBookForm(true);
  };

  const openEditBook = (book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "",
      description: book.description || "",
      total_quantity: book.total_quantity || 1,
      available_quantity: book.available_quantity ?? 1,
      image_url: book.image_url || "",
    });
    setBookError(null);
    setShowBookForm(true);
  };

  const handleSaveBook = async () => {
    if (!bookForm.title.trim() || !bookForm.author.trim()) {
      setBookError("Title and author are required.");
      return;
    }

    try {
      if (editingBook) {
        const hasChanged =
          bookForm.title !== (editingBook.title || "") ||
          bookForm.author !== (editingBook.author || "") ||
          bookForm.category !== (editingBook.category || "") ||
          bookForm.description !== (editingBook.description || "") ||
          bookForm.image_url !== (editingBook.image_url || "") ||
          Number(bookForm.total_quantity) !== Number(editingBook.total_quantity) ||
          Number(bookForm.available_quantity) !== Number(editingBook.available_quantity);

        const res = await api.put(`/api/books/${editingBook.id}`, bookForm);
        setBooks((prev) => prev.map((b) => b.id === editingBook.id ? res.data : b));
        if (hasChanged) {
          const details = [bookForm.author, bookForm.category].filter(Boolean).join(" · ");
          showAdminToast(`"${bookForm.title}"${details ? ` (${details})` : ""} updated successfully.`);
        }
      } else {
        const res = await api.post("/api/books", bookForm);
        setBooks((prev) => [...prev, res.data]);
        showAdminToast(`"${bookForm.title}" added to the catalog.`);
      }
      setShowBookForm(false);
      setEditingBook(null);
    } catch {
      setBookError("Could not save book. Please try again.");
    }
  };

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    try {
      await api.delete(`/api/books/${bookToDelete.id}`);
      setBooks((prev) => prev.filter((b) => b.id !== bookToDelete.id));
      setBookToDelete(null);
    } catch {
      setBookToDelete(null);
    }
  };

  // ── Notification handlers ──
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      showAdminToast("Could not mark notification as read.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifications([]);
    } catch {
      showAdminToast("Could not mark all notifications as read.");
    }
  };

  // ── Clear history handlers ──
  const handleClearLoanHistory = async () => {
    try {
      await api.delete("/api/loans/admin/history");
      setLoans((prev) => prev.filter((l) => l.status !== "RETURNED"));
      showAdminToast("Returned loans history cleared.");
    } catch {
      showAdminToast("Could not clear loan history.");
    }
  };

  const handleClearReservationHistory = async () => {
    try {
      await api.delete("/api/reservations/history");
      setReservations((prev) => prev.filter((r) => r.status !== "CANCELLED"));
      showAdminToast("Cancelled reservations history cleared.");
    } catch {
      showAdminToast("Could not clear reservation history.");
    }
  };


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
          <a href="#books" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 text-[15px] font-medium transition-colors">
            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            Books
          </a>
          <a href="#loans" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 text-[15px] font-medium transition-colors">
            <span className="material-symbols-outlined text-[22px]">book</span>
            Loans
          </a>
          <a href="#users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 text-[15px] font-medium transition-colors">
            <span className="material-symbols-outlined text-[22px]">group</span>
            Users
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
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 w-64">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-500"
                placeholder="Search…"
                type="text"
              />
            </div>
            {/* Notification bell */}
            <button
              onClick={() => setShowNotifPanel((v) => !v)}
              className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-slate-500 text-[22px]">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>
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
                      <p className="text-sm font-medium text-slate-500">Suspended Users</p>
                      <h3 className="text-4xl font-bold mt-2 text-red-500">
                        {users.filter(u => u.points_blocked_until && new Date(u.points_blocked_until) > new Date()).length}
                      </h3>
                    </div>
                    <div className="p-3 bg-red-100 rounded-xl text-red-600">
                      <span className="material-symbols-outlined text-[24px]">block</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-5">0 points reached</p>
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

                {/* Active Reservations summary */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-7">
                    <h4 className="font-bold text-xl">Reservations</h4>
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
                      {activeReservations.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{r.title}</p>
                            <p className="text-xs text-slate-500">{r.email}</p>
                          </div>
                          <span className="ml-3 shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">ACTIVE</span>
                        </div>
                      ))}
                      {activeReservations.length > 5 && (
                        <a href="#reservations" className="block text-center text-xs text-primary font-semibold mt-2 hover:underline">
                          View all {activeReservations.length} reservations
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Reservations Table ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="reservations">
                <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xl">All Reservations</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeReservations.length} active ·{" "}
                      {reservations.filter((r) => r.status === "CANCELLED").length} cancelled
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{reservations.length} total</span>
                    {reservations.some((r) => r.status === "CANCELLED") && (
                      <button
                        onClick={handleClearReservationHistory}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
                      >
                        Clear cancelled
                      </button>
                    )}
                  </div>
                </div>
                {reservations.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2">event_available</span>
                    <p className="text-sm">No reservations yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Book</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Reserved On</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reservations.map((r) => (
                          <tr key={r.id} className={`transition-colors ${r.status !== "ACTIVE" ? "opacity-50 bg-slate-50/30" : "hover:bg-slate-50"}`}>
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{r.author}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{r.email}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {new Date(r.reservation_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </td>
                            <td className="px-6 py-4">
                              {r.status === "ACTIVE" && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">ACTIVE</span>}
                              {r.status === "CANCELLED" && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">CANCELLED</span>}
                              {r.status === "COMPLETED" && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">COMPLETED</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Book Inventory ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="books">
                <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xl">Book Inventory</h4>
                    <p className="text-xs text-slate-400 mt-1">{books.length} book{books.length !== 1 ? "s" : ""} in the catalog</p>
                  </div>
                  <button
                    onClick={openAddBook}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Book
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Book</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Available</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {books.map((book) => (
                        <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-13 rounded-lg overflow-hidden shrink-0 bg-primary/10">
                                <img
                                  src={book.image_url ? `http://localhost:3000/images/${book.image_url}` : `https://placehold.co/300x400/1a2b3d/ffffff?text=${encodeURIComponent(book.title)}`}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 text-sm">{book.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{book.author}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                              {book.category || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">{book.total_quantity}</td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-semibold ${book.available_quantity === 0 ? "text-red-500" : "text-emerald-600"}`}>
                              {book.available_quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditBook(book)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/5 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                Edit
                              </button>
                              <button
                                onClick={() => setBookToDelete(book)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Loans Table ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="loans">
                <div className="p-8 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xl">All Loans</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {loans.filter((l) => ["BORROWED", "LATE"].includes(l.status)).length} active ·{" "}
                      {loans.filter((l) => l.status === "LATE").length} overdue
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{loans.length} total</span>
                    {loans.some((l) => l.status === "RETURNED") && (
                      <button
                        onClick={handleClearLoanHistory}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
                      >
                        Clear returned
                      </button>
                    )}
                  </div>
                </div>
                {loans.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2">menu_book</span>
                    <p className="text-sm">No loans yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Book</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Borrowed</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Due Date</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Returned</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loans.map((l) => (
                          <tr key={l.id} className={`transition-colors ${l.status === "RETURNED" ? "opacity-50 bg-slate-50/30" : "hover:bg-slate-50"}`}>
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-slate-800">{l.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{l.author}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{l.email}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {new Date(l.borrow_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </td>
                            <td className={`px-6 py-4 text-sm font-medium ${
                              l.status === "LATE" ||
                              (l.status === "BORROWED" && new Date(l.due_date) < new Date()) ||
                              (l.status === "RETURNED" && l.return_date && new Date(l.return_date) > new Date(l.due_date))
                                ? "text-red-600 font-semibold"
                                : "text-slate-500"
                            }`}>
                              {new Date(l.due_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {l.return_date ? new Date(l.return_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                            </td>
                            <td className="px-6 py-4">
                              {l.status === "RETURNED" && (
                                l.return_date && new Date(l.return_date) > new Date(l.due_date)
                                  ? <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">RETURNED LATE</span>
                                  : <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">RETURNED ON TIME</span>
                              )}
                              {l.status === "BORROWED" && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">BORROWED</span>}
                              {l.status === "LATE" && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">LATE</span>}
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
                  <div>
                    <h4 className="font-bold text-xl">Registered Users</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {users.filter((u) => !u.is_validated).length} pending validation · {users.length} total
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{users.length} user{users.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Email</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Role</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Status</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Points</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Member Since</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Actions</th>
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
                              u.role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              u.is_validated ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              <span className="material-symbols-outlined text-[13px]">
                                {u.is_validated ? "check_circle" : "schedule"}
                              </span>
                              {u.is_validated ? "Validated" : "Pending"}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            {u.points_blocked_until && new Date(u.points_blocked_until) > new Date() ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                                <span className="material-symbols-outlined text-[13px]">block</span>
                                {u.points ?? 0} pts
                              </span>
                            ) : (
                              <span className={`text-sm font-bold ${(u.points ?? 100) >= 80 ? "text-emerald-600" : (u.points ?? 100) >= 50 ? "text-amber-500" : "text-red-500"}`}>
                                {u.points ?? 100} pts
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-500">
                            {new Date(u.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              {!u.is_validated && (
                                <button
                                  onClick={() => handleValidateUser(u)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 border border-emerald-100 hover:bg-emerald-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                  Validate
                                </button>
                              )}
                              {u.role !== "ADMIN" && (
                                <button
                                  onClick={() => setUserToDelete(u)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">delete</span>
                                  Delete
                                </button>
                              )}
                            </div>
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

      {/* ── Add / Edit Book Modal ── */}
      {showBookForm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{backgroundColor:"rgba(0,0,0,0.4)"}} onClick={() => setShowBookForm(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900">{editingBook ? "Edit Book" : "Add New Book"}</h3>

            {bookError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {bookError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Title *</label>
                <input
                  type="text"
                  value={bookForm.title}
                  onChange={(e) => setBookForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Book title"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Author *</label>
                <input
                  type="text"
                  value={bookForm.author}
                  onChange={(e) => setBookForm((f) => ({ ...f, author: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Author name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Category</label>
                <input
                  type="text"
                  value={bookForm.category}
                  onChange={(e) => setBookForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. Software, Fiction..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Total Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={bookForm.total_quantity}
                  onChange={(e) => setBookForm((f) => ({ ...f, total_quantity: e.target.value === "" ? "" : parseInt(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Image filename</label>
                <input
                  type="text"
                  value={bookForm.image_url}
                  onChange={(e) => setBookForm((f) => ({ ...f, image_url: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. clean-code.jpg"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Description</label>
                <textarea
                  value={bookForm.description}
                  onChange={(e) => setBookForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Short book description..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowBookForm(false)}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBook}
                className="flex-1 px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                {editingBook ? "Save Changes" : "Add Book"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Delete Book Modal ── */}
      {bookToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{backgroundColor:"rgba(0,0,0,0.4)"}} onClick={() => setBookToDelete(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto">
              <span className="material-symbols-outlined text-red-500 text-[32px]">delete</span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Book</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-800">"{bookToDelete.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBookToDelete(null)}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBook}
                className="flex-1 px-5 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Delete User Modal ── */}
      {userToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{backgroundColor:"rgba(0,0,0,0.4)"}} onClick={() => setUserToDelete(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto">
              <span className="material-symbols-outlined text-red-500 text-[32px]">person_remove</span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-800">{userToDelete.email}</span>? All their data will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-5 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {adminToast && createPortal(
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-emerald-500 text-white px-5 py-4 rounded-xl shadow-lg">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <p className="text-sm font-semibold">{adminToast}</p>
        </div>,
        document.body
      )}

      {/* ── Notification Panel ── */}
      {showNotifPanel && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowNotifPanel(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 z-[9999] h-full w-96 bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-700 text-[20px]">notifications</span>
                <h3 className="font-bold text-slate-900">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                    {notifications.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifPanel(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <span className="material-symbols-outlined text-5xl">notifications_off</span>
                  <p className="text-sm font-medium">No unread notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="px-6 py-4 flex gap-4 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="material-symbols-outlined text-orange-500 text-[18px]">schedule</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      title="Mark as read"
                      className="shrink-0 p-1 rounded-lg hover:bg-slate-200 transition-colors self-start"
                    >
                      <span className="material-symbols-outlined text-slate-400 text-[16px]">check</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
