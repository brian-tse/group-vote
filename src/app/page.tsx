export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy-500">
      <h1 className="text-4xl font-bold text-white">ACAMG Voting</h1>
      <p className="mt-2 text-lg text-white/70">
        Anesthesia Care Associates Medical Group
      </p>
      <a
        href="/login"
        className="mt-8 rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-700"
      >
        Sign In
      </a>
    </main>
  );
}
