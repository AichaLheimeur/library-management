import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function getPlaceholder(title) {
  return `https://placehold.co/300x400/1a2b3d/ffffff?text=${encodeURIComponent(title)}`;
}

export default function WishlistPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin } = useAuth();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [bookToRemove, setBookToRemove] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    if (isAdmin()) {
      navigate("/admin");
      return;
    }
    const fetchWishlist = async () => {
      try {
        const res = await api.get("/api/wishlist");
        setWishlist(res.data);
      } catch (err) {
        console.error("fetchWishlist error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const handleRemove = async () => {
    if (!bookToRemove) return;
    const bookId = bookToRemove.book_id;
    setRemoving(bookId);
    setBookToRemove(null);
    try {
      await api.delete(`/api/wishlist/${bookId}`);
      setWishlist((prev) => prev.filter((item) => item.book_id !== bookId));
      setSuccessMsg("Book removed from your wishlist.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error("removeFromWishlist error:", err);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-65px)] bg-background-light">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-slate-200 border-t-primary"></div>
          <p className="text-sm font-medium tracking-wide">Loading your wishlist…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-[calc(100vh-65px)]">
      <main className="max-w-[1400px] mx-auto py-12 lg:py-20 px-4 md:px-8 lg:px-16">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight flex items-center gap-3">
            <span
              className="material-symbols-outlined text-rose-500 text-[40px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            My Wishlist
          </h1>
          <p className="text-slate-500 mt-2 text-base">
            {wishlist.length > 0
              ? `${wishlist.length} book${wishlist.length > 1 ? "s" : ""} saved`
              : "Books you've saved for later"}
          </p>
        </div>

        {/* Empty state */}
        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-slate-400">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
              <span
                className="material-symbols-outlined text-5xl text-slate-300"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-slate-600 mb-1">Your wishlist is empty</p>
              <p className="text-sm text-slate-400">Browse the catalog and save books you'd like to read.</p>
            </div>
            <Link
              to="/catalog"
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">auto_stories</span>
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {wishlist.map((item) => {
              const isAvailable = item.available_quantity > 0;
              return (
                <div
                  key={item.book_id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Cover */}
                  <div className="w-full aspect-[3/4] overflow-hidden bg-slate-100 relative">
                    <img
                      src={item.image_url ? `http://localhost:3000/images/${item.image_url}` : getPlaceholder(item.title)}
                      alt={`Cover of ${item.title}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold shadow-sm">
                          <span className="material-symbols-outlined text-[11px]">check_circle</span>
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 text-white text-[10px] font-bold shadow-sm">
                          <span className="material-symbols-outlined text-[11px]">cancel</span>
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-1 gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-base leading-tight line-clamp-2 text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{item.author}</p>
                      {item.category && (
                        <span className="inline-block mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        to={`/books/${item.book_id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        View Details
                      </Link>
                      <button
                        onClick={() => setBookToRemove(item)}
                        disabled={removing === item.book_id}
                        className="flex items-center justify-center px-3 py-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove from wishlist"
                      >
                        {removing === item.book_id ? (
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-rose-400 rounded-full animate-spin"></div>
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Success Toast ── */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-white px-5 py-4 rounded-xl shadow-lg">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {bookToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setBookToRemove(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col gap-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 mx-auto">
              <span
                className="material-symbols-outlined text-rose-500 text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                favorite
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Remove from Wishlist</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-slate-800">"{bookToRemove.title}"</span>{" "}
                from your wishlist?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBookToRemove(null)}
                className="flex-1 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 px-5 py-3 rounded-xl bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
