import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function getPlaceholder(title) {
  return `https://placehold.co/300x400/1a2b3d/ffffff?text=${encodeURIComponent(title)}`;
}

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [reserveSuccess, setReserveSuccess] = useState(false);
  const [reserveError, setReserveError] = useState(null);
  const [borrowing, setBorrowing] = useState(false);
  const [borrowSuccess, setBorrowSuccess] = useState(false);
  const [borrowError, setBorrowError] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistMsg, setWishlistMsg] = useState(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    api.get("/api/wishlist").then((res) => {
      const ids = res.data.map((item) => item.book_id);
      setIsWishlisted(ids.includes(Number(id)));
    }).catch(() => {});
  }, [id]);

  const handleWishlist = async () => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await api.delete(`/api/wishlist/${id}`);
        setIsWishlisted(false);
        setWishlistMsg("Removed from wishlist");
      } else {
        await api.post("/api/wishlist", { book_id: Number(id) });
        setIsWishlisted(true);
        setWishlistMsg("Added to wishlist");
      }
      setTimeout(() => setWishlistMsg(null), 2000);
    } catch (err) {
      setWishlistMsg(err.response?.data?.message || "Wishlist error");
      setTimeout(() => setWishlistMsg(null), 2000);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    setBorrowing(true);
    setBorrowError(null);
    try {
      await api.post("/api/loans", { book_id: Number(id) });
      setBorrowSuccess(true);
    } catch (err) {
      setBorrowError(err.response?.data?.message || "Failed to borrow. Please try again.");
    } finally {
      setBorrowing(false);
    }
  };

  const handleReserve = async () => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    setReserving(true);
    setReserveError(null);
    try {
      await api.post("/api/reservations", { book_id: Number(id) });
      setReserveSuccess(true);
    } catch (err) {
      setReserveError(err.response?.data?.message || "Failed to create reservation. Please try again.");
    } finally {
      setReserving(false);
    }
  };

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/books/${id}`);
        setBook(res.data);
      } catch (err) {
        setError("Book not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-65px)] bg-background-light">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-slate-200 border-t-primary"></div>
          <p className="text-sm font-medium tracking-wide">Loading book details…</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-65px)] bg-background-light text-slate-500 gap-5">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-slate-400">menu_book</span>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-slate-700 mb-1">Book not found</p>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
        <button
          onClick={() => navigate("/catalog")}
          className="mt-2 flex items-center gap-2 text-white bg-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Catalog
        </button>
      </div>
    );
  }

  const isAvailable = book.available_quantity > 0;

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-[calc(100vh-65px)]">

      <main className="flex justify-center py-12 lg:py-20 px-4 md:px-8 lg:px-16">
        <div className="max-w-[1400px] w-full flex flex-col md:flex-row gap-12 lg:gap-24">

          {/* ── Left: Cover + Badges + Library Info ── */}
          <div className="w-full md:w-5/12 lg:w-[460px] shrink-0">
            <div className="sticky top-8 flex flex-col gap-8">

              {/* Cover card */}
              <div className="w-full rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.18)] bg-white">
                <img
                  src={book.image_url ? `http://localhost:3000/images/${book.image_url}` : getPlaceholder(book.title)}
                  alt={`Cover of ${book.title}`}
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>

              {/* Status + Category badges */}
              <div className="flex flex-wrap gap-2">
                {isAvailable ? (
                  <div className="flex items-center gap-2 rounded-full bg-green-100 border border-green-200 px-4 py-1.5 text-green-700">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Available</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-1.5 text-red-600">
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Unavailable</span>
                  </div>
                )}
                {book.category && (
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200 px-4 py-1.5 text-slate-600">
                    <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                    <span className="text-xs font-bold uppercase tracking-wider">{book.category}</span>
                  </div>
                )}
              </div>

              {/* Library Info card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-7 py-5 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Library Info</h4>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex justify-between items-center px-7 py-4 text-sm">
                    <span className="text-slate-500">Copies Available</span>
                    <span className="font-bold text-slate-800">{book.available_quantity} of {book.total_quantity} copies</span>
                  </div>
                  <div className="flex justify-between items-center px-7 py-4 text-sm">
                    <span className="text-slate-500">Total in Library</span>
                    <span className="font-bold text-slate-800">{book.total_quantity}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Right: Book Details ── */}
          <div className="flex-1 flex flex-col gap-8 min-w-0">

            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
              <Link to="/catalog" className="hover:text-primary transition-colors">Home</Link>
              <span className="material-symbols-outlined text-[15px] text-slate-300">chevron_right</span>
              {book.category && (
                <>
                  <Link to="/catalog" className="hover:text-primary transition-colors">{book.category}</Link>
                  <span className="material-symbols-outlined text-[15px] text-slate-300">chevron_right</span>
                </>
              )}
              <span className="text-slate-800 font-medium truncate">{book.title}</span>
            </div>

            {/* Title + Author */}
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-slate-900">
                {book.title}
              </h1>
              <p className="text-xl font-medium text-slate-600">
                by{" "}
                <span className="text-primary underline underline-offset-4 decoration-primary/30 cursor-pointer">
                  {book.author}
                </span>
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col sm:flex-row gap-4">
                {!isAdmin() && (isAvailable ? (
                  <button
                    onClick={handleBorrow}
                    disabled={borrowing || borrowSuccess}
                    className={`flex flex-1 items-center justify-center gap-2 px-8 py-5 rounded-xl font-bold text-lg transition-all active:scale-[0.98] ${
                      borrowSuccess
                        ? "bg-green-500 text-white cursor-default"
                        : borrowing
                        ? "bg-primary/70 text-white cursor-not-allowed"
                        : "bg-primary text-white hover:shadow-lg hover:bg-primary/90"
                    }`}
                  >
                    {borrowing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                        Borrowing…
                      </>
                    ) : borrowSuccess ? (
                      <>
                        <span className="material-symbols-outlined">check_circle</span>
                        Borrowed Successfully
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">book</span>
                        Borrow Book
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleReserve}
                    disabled={reserving || reserveSuccess}
                    className={`flex flex-1 items-center justify-center gap-2 px-8 py-5 rounded-xl font-bold text-lg transition-all active:scale-[0.98] ${
                      reserveSuccess
                        ? "bg-green-500 text-white cursor-default"
                        : reserving
                        ? "bg-primary/70 text-white cursor-not-allowed"
                        : "bg-primary text-white hover:shadow-lg hover:bg-primary/90"
                    }`}
                  >
                    {reserving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                        Reserving…
                      </>
                    ) : reserveSuccess ? (
                      <>
                        <span className="material-symbols-outlined">check_circle</span>
                        Reservation Confirmed
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">calendar_today</span>
                        Reserve Book
                      </>
                    )}
                  </button>
                ))}
                {!isAdmin() && (
                  <button
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                    className={`flex items-center justify-center gap-2 px-8 py-5 rounded-xl font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      isWishlisted
                        ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {wishlistLoading ? (
                      <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}>
                        favorite
                      </span>
                    )}
                    {isWishlisted ? "Wishlisted" : "Wishlist"}
                  </button>
                )}
              </div>

              {/* Wishlist feedback */}
              {wishlistMsg && (
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm font-medium">
                  <span className="material-symbols-outlined text-[18px] text-rose-500">favorite</span>
                  {wishlistMsg}
                </div>
              )}

              {/* Feedback messages */}
              {borrowSuccess && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Book borrowed successfully! Due date in 14 days. View it in your dashboard.
                </div>
              )}
              {borrowError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {borrowError}
                </div>
              )}
              {reserveSuccess && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Your reservation has been created successfully. You can view it in your dashboard.
                </div>
              )}
              {reserveError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {reserveError}
                </div>
              )}
            </div>

            {/* Metadata Grid — real backend data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-slate-200">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Copies</span>
                <span className="text-base font-semibold">{book.total_quantity} copies</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available</span>
                <span className={`text-base font-semibold ${isAvailable ? "text-green-600" : "text-red-500"}`}>
                  {book.available_quantity} copies
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</span>
                <span className="text-base font-semibold">{book.category || "—"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
                <span className={`text-base font-semibold ${isAvailable ? "text-green-600" : "text-red-500"}`}>
                  {isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>

            {/* About the Book */}
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl font-bold text-slate-900">About the Book</h3>
              {book.description ? (
                <p className="text-slate-600 leading-[1.9] text-lg">{book.description}</p>
              ) : (
                <p className="text-slate-400 italic text-base">No description available for this title.</p>
              )}
            </div>

            {/* Categories & Tags */}
            {book.category && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Categories &amp; Tags</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
                    {book.category}
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 px-6 lg:px-40 bg-white mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-slate-400">
            <span className="material-symbols-outlined">menu_book</span>
            <p className="text-sm font-medium">© 2024 LibraryConnect. All library resources reserved.</p>
          </div>
          <div className="flex gap-8">
            <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
