import { Link } from "react-router-dom";

export default function BookCard({ id, title, author, genre, status, image, isBorrowed }) {
  const isAvailable = status === "AVAILABLE";

  return (
    <Link
      to={`/books/${id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Cover */}
      <div className="aspect-[3/4] overflow-hidden relative bg-slate-100">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={image}
          alt={`Cover of ${title}`}
        />
        {/* Borrowed badge */}
        {isBorrowed && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm">
              <span className="material-symbols-outlined text-[11px]">book</span>
              Borrowed
            </span>
          </div>
        )}
        {/* Status badge — masqué si l'utilisateur a emprunté ce livre */}
        {!isBorrowed && (
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
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
          <span className="bg-white text-primary rounded-full p-1.5 shadow-md">
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-slate-500 mt-1">{author}</p>
        <div className="mt-auto pt-3">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{genre}</span>
        </div>
      </div>
    </Link>
  );
}
