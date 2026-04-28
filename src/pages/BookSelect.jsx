import BookCard from "../components/BookCard.jsx";

export default function BookSelect({ books, onOverview, onStudy }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black">选择词库</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">先选定学习范围，再进入总览或开始一轮练习。</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {books.map((book) => (
          <BookCard key={book.id} book={book} onOverview={onOverview} onStudy={onStudy} />
        ))}
      </div>
    </main>
  );
}
