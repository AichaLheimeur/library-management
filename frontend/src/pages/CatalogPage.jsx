import { useState, useEffect } from "react";
import BookCard from "../components/BookCard";
import api from "../api/axios";

function getStatus(book) {
  if (book.available_quantity > 0) return "AVAILABLE";
  return "BORROWED";
}

function getPlaceholder(title) {
  return `https://placehold.co/300x400/1a2b3d/ffffff?text=${encodeURIComponent(title)}`;
}

export default function CatalogPage() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("title");
  const [activeCategory, setActiveCategory] = useState("All Books");

  // Fetch categories once on mount from real data
  useEffect(() => {
    api.get("/api/books").then((res) => {
      const unique = [...new Set(res.data.map((b) => b.category).filter(Boolean))];
      setCategories(unique);
    });
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (search.trim()) params[searchField] = search.trim();
        if (activeCategory !== "All Books") params.category = activeCategory;

        const res = await api.get("/api/books", { params });
        setBooks(res.data);
      } catch (err) {
        setError("Failed to load books. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchBooks, 300);
    return () => clearTimeout(delay);
  }, [search, searchField, activeCategory]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 flex flex-col min-h-[calc(100vh-65px)]">
      <div className="flex flex-1 w-full">

        {/* Sidebar Filters */}
        <aside className="w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 p-6 hidden lg:block min-h-[calc(100vh-65px)] sticky top-[65px] overflow-y-auto">
          <div className="space-y-8">

            {/* Categories */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Categories</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveCategory("All Books")}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-left ${
                      activeCategory === "All Books"
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">category</span>
                    All Books
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base text-left ${
                        activeCategory === cat
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">menu_book</span>
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Filter by Status */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Filter By Status</h3>
              <div className="space-y-3 px-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input className="rounded text-primary focus:ring-primary/20 border-slate-300" type="checkbox" />
                  <span className="text-sm">Available Now</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input className="rounded text-primary focus:ring-primary/20 border-slate-300" type="checkbox" />
                  <span className="text-sm">Recently Added</span>
                </label>
              </div>
            </div>

            {/* Language */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Language</h3>
              <select className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
              </select>
            </div>

          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10">

          {/* Header + Search + Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold">Explore Catalog</h2>
              <p className="text-slate-500 text-sm">
                {loading ? "Loading..." : `Showing ${books.length} result${books.length !== 1 ? "s" : ""}${activeCategory !== "All Books" ? ` in ${activeCategory}` : ""}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Search bar */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold text-slate-500 py-2 pl-3 pr-1 focus:ring-0 cursor-pointer"
                >
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                </select>
                <span className="text-slate-300 text-xs">|</span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchField === "title" ? "Search by title..." : "Search by author..."}
                    className="bg-transparent border-none py-2 pl-8 pr-4 text-sm focus:ring-0 w-44"
                  />
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <button className="p-2 bg-primary text-white rounded-lg">
                <span className="material-symbols-outlined text-sm">grid_view</span>
              </button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <span className="material-symbols-outlined text-sm">list</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-center py-12 text-red-500">
              <span className="material-symbols-outlined text-4xl block mb-2">error</span>
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-12">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-pulse">
                  <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-700" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && books.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-5xl block mb-3">menu_book</span>
              <p className="text-lg font-medium">No books found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          )}

          {/* Book Grid */}
          {!loading && !error && books.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-12">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author}
                  genre={book.category?.toUpperCase() || "BOOK"}
                  status={getStatus(book)}
                  image={getPlaceholder(book.title)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">3</button>
            <span className="px-2 text-slate-400">...</span>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">12</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-primary/5 border-t border-slate-200 dark:border-slate-800 py-8 px-6 mt-12">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-primary dark:text-slate-300">
            <span className="material-symbols-outlined">auto_stories</span>
            <span className="font-bold">LibraryConnect</span>
            <span className="text-xs ml-4 text-slate-500">© 2024 Digital Library Inc.</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500">
            <a className="hover:text-primary" href="#">Privacy Policy</a>
            <a className="hover:text-primary" href="#">Terms of Service</a>
            <a className="hover:text-primary" href="#">API Documentation</a>
          </div>
          <div className="flex gap-4">
            <a className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-primary hover:text-white transition-colors" href="#">
              <span className="material-symbols-outlined text-base">public</span>
            </a>
            <a className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-primary hover:text-white transition-colors" href="#">
              <span className="material-symbols-outlined text-base">mail</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
