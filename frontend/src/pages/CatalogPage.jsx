import BookCard from "../components/BookCard";

const BOOKS = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "FICTION",
    status: "AVAILABLE",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD1KnLs3UgfP8FeRIaoggsb97VfRn1jHMxCq_argAjbaSDIp02sPy0soWYYYhWksyS69Phy-QAFJsL_v1tOF5oO2uwPb2Gcz4S5-dSN_HNvazwaabDkDsCYkj3CbCD9PabvQKb1spejUyyq7s38U7XtHmsiUKmdD55FYCMXvr8OSVM6fzUpkssnICY4-YOeVcbZg-HjKpnSCPXPvou8ApL7n32kkBHIeYBp4uugqtnqUN-Ax5kr1DkDws3vvG10q6q0Z7lQ80ELqdM",
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "CLASSIC",
    status: "BORROWED",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgZoQSqeVADst0Yv1FXTdT7L0PAVRcr23IH1wssW2xfnWHIvfTPKiyUXaGUn1_u6Lzx7yTAqS77mSJ19ySP0eBaNHy5p55TLirkSwG_JmO8es7xHj1Un37oTt4X1PcxzJVntwqo5BJLk6Wx1U0rF_gzlKRxPv-qtZBfsroqR-tLLQ5REwJshBG2GT0hVN-vljWJ6uOBruuiHJtV3t_G-rWYn3zHeGTPsdRPWWE75LOOu38kYSAj25B48TD6ipeWdlaCUwFRyRunGk",
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    genre: "DYSTOPIAN",
    status: "RESERVED",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhweEqpMa31us2vagovZk-B4UhC8OuKQCWctCkwj6P418CQDZTdHnLbUXxaJ-RQ5KE8B5LVL-SFKRVTNDDtsfUQj3Kf49rapVH9gJS0s_qiuamDLsHdr59MQY5iaivqV-7o1e-msxYypmQRRFx6DMOIfHiIJfYGdWCPt61FJGUvUUXTRNfs4pcLrZ-AluMA4BHY363pb05Yb-s8-JUrwm7xAwxmNU_ROJYqw5ewFgpo7pAY5nkWxCOVxnfd8OuXQUHaoDs9qDtV8c",
  },
  {
    id: 4,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "FANTASY",
    status: "AVAILABLE",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-UWaA3pzBfQi5mNlHwzehIjcs42bLXt8P8vx1dLll22Lp04XJSMEd2Rrj99COifPSdOyFyETmdRRlSgt8ywgFcbaG0LrP7kPFTHLUI6LRSaULaq9NS07ap1BwKIhGevXUeE4N2TE33WInMCXutuEVArQDyEKVYUMCoTbxK7mrsxJnQ50Pz7brn5h8aHbZ5NxqDwAwCas_Nz8bl7vV-s8IsBtUH11wn30baYEk6H8xD_KTelfzG_dosH13t37AZdkCdfa9GYdOubw",
  },
  {
    id: 5,
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    genre: "MYSTERY",
    status: "AVAILABLE",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJMSF76GydB9RV68TkjzIbNFT6Zq--rxKEEf1Rg26ghpvZpU_tipuTdfmLEiV_umYGhMPu2RvFxItaVZpSid0xAOE-Gvhdd1vDutWxUUqsmAuEXcvvCzgTCDodHQwOlFitn0lOeMHelPBLdPsM2q5XJOcuAT3nvrkCyIFoKUPouR5Sk1okwluTjFr4759yOVgr1xNfLEfZusxCax100RCP-SP5mTy9h3z4nZq_DeXC85B-qt2OQuButIPdi4Z9cAvvX2QAHgWFWao",
  },
  {
    id: 6,
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    genre: "HISTORY",
    status: "AVAILABLE",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEiquP-EVRasnxewwMsnVob9w1gpms7V_8_UpOmQlRQFocM1a85-Glmgr_gbR5AH8HZCxmX9vWZRpyJpqtTdv-W5cM2I0yJdnHT33LtKLLwX0_JvSi2ux-coOpBvnvEiZYo_K8yGLWPTE_XUYhQgsmjnT3quJuTaxAbJ0H3prUlhn8RipYHj51UzpKnwOv3wf4OThO3Dp9MdwD_7rVfTn3E9ylfMVcJl9RW-PQv75gCykppKM9L_0zzHY5VA9fOeMzlZ3h57uw0ig",
  },
  {
    id: 7,
    title: "Atomic Habits",
    author: "James Clear",
    genre: "SELF-HELP",
    status: "BORROWED",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9QavKKBQ5tUzx1z1gGH0keBF1wXeHSpOMNBjT-3OrMZQrTMwkneSEU-lZD2-Fkk1G2ndTo-4rA7lrgVL9gJL2osFtGAa2vx0YxrvVFHmp2cbqsEdZzz4VQWOg7N5vcnOb3EGJY-J7Lw1dKtYSg5ZZTKu9qxOXRusPGeScKkpbDWSpEWIzy70O6XvRtmKZ_TYVZCI7BKkVFDO_js6xZc35k6oLydJ-5Aw9QXc0qGeMLKeQ-K6_jjN71WANXbWutcsnKGdaQeyq3-0",
  },
  {
    id: 8,
    title: "Dune",
    author: "Frank Herbert",
    genre: "SCI-FI",
    status: "AVAILABLE",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDcOKytn4Suh2TUKT9ohlZSELJx6BbBx3ANuYawYrqEbCiUB0Z2BWoYm6K5HBnL0cl50mEzlfFNxY9oV1X6Pn921ak1ZGVuB1N0h1cCMWZcAS8vqqb1joc5E_s4njrVBGK6c1qX1yCDoFut_CRt_Gc1HldznwFNiKus7lW8jRcBozipUgIn4iCIBD553QW6HwByDG2RQwXYWeIYHt4zd57PTdvgEkrfc5aE2S8vGFNK4XdYKIb1hY2Es4Na27UWPyK8r63U-y1Oi8Q",
  },
  {
    id: 9,
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    genre: "PSYCHOLOGY",
    status: "AVAILABLE",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCr-ZP6GrmHe-yMKNeSXzpY4lqN1HmbcVGUQqAxBUO45gTYfes7AT7Ytdjromwyxf0__tAyQnT3IeWasopAMURY5ff_d_D3j2SxBZ7TesSp8_8RSOAvYrWgziNv6ZdC7rHxVq1INUwk_ldQo7YpxLEf-XH2l0kOyBKT3WdVXt67Hst4UocEC6uEDApEe26IHInGr93Gy3STyba70Rz3RFcTWh4yge5m4yav1xvtOql2lTBVB4nh8MOGXXC51lepwSPRptNmS_Oagwo",
  },
  {
    id: 10,
    title: "Little Women",
    author: "Louisa May Alcott",
    genre: "CLASSIC",
    status: "AVAILABLE",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEPRYFgJH9KKg-P3P5s0Yr8pUzWQd-nLQvZces1SbanvWzp-39tmuHr98hlqXg9xjiXKmOcmGBbfKyK7kTNDV8tPtfnyFAnxpYZ_cFmyZqhhzi9BnhfMD8VH-UxypcI5hf-hP9zNaE-0dshgeXQURuB5-SrvPkcijrJQkEaiRUYCx8NQlfrxMT1fMliPq7AsloRoA5Mah6VRAxaI6_YAAOvBJ7F5TA8gib-Jb2kI3h1A1Xe4l05fPTQp3mJvAeuLr5keslr1x5VXs",
  },
];

const CATEGORIES = [
  { label: "All Books", icon: "category" },
  { label: "Fiction", icon: "menu_book" },
  { label: "Science", icon: "biotech" },
  { label: "History", icon: "history_edu" },
  { label: "Art & Design", icon: "palette" },
  { label: "Philosophy", icon: "psychology" },
];

export default function CatalogPage() {
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
                {CATEGORIES.map((cat, i) => (
                  <li key={cat.label}>
                    <a
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base ${
                        i === 0
                          ? "bg-primary/10 text-primary font-semibold"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      href="#"
                    >
                      <span className="material-symbols-outlined text-base">{cat.icon}</span>
                      {cat.label}
                    </a>
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

          {/* Header + Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold">Explore Catalog</h2>
              <p className="text-slate-500 text-sm">Showing 1,240 results in all categories</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                Title <span className="material-symbols-outlined text-xs">expand_more</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                Author <span className="material-symbols-outlined text-xs">expand_more</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                Year <span className="material-symbols-outlined text-xs">expand_more</span>
              </button>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <button className="p-2 bg-primary text-white rounded-lg">
                <span className="material-symbols-outlined text-sm">grid_view</span>
              </button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <span className="material-symbols-outlined text-sm">list</span>
              </button>
            </div>
          </div>

          {/* Book Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-12">
            {BOOKS.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                author={book.author}
                genre={book.genre}
                status={book.status}
                image={book.image}
              />
            ))}
          </div>

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
