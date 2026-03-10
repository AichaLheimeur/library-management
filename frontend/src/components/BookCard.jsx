export default function BookCard({ title, author, genre, status, image }) {
  const statusStyle = {
    AVAILABLE: "bg-green-100 text-green-700",
    BORROWED: "bg-red-100 text-red-700",
    RESERVED: "bg-amber-100 text-amber-700",
  };

  const isAvailable = status === "AVAILABLE";

  return (
    <div className={`group flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 ${!isAvailable ? "opacity-80" : ""}`}>
      <div className="aspect-[3/4] overflow-hidden relative">
        {isAvailable && (
          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center gap-2">
            <button className="bg-white text-primary p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">visibility</span>
            </button>
            <button className="bg-white text-primary p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
        )}
        {!isAvailable && (
          <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle[status]}`}>
            {status}
          </div>
        )}
        <img
          className={`w-full h-full object-cover ${isAvailable ? "group-hover:scale-105 transition-transform duration-500" : ""}`}
          src={image}
          alt={`Cover of book ${title}`}
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{title}</h3>
          {isAvailable && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusStyle[status]}`}>
              {status}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-3">{author}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">{genre}</span>
          <span className="material-symbols-outlined text-xs text-slate-400">more_horiz</span>
        </div>
      </div>
    </div>
  );
}
