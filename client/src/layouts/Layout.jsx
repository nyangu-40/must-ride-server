import { Link } from 'react-router-dom';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-surface py-6 px-4 sm:px-6 lg:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between rounded-3xl bg-white/80 px-6 py-5 shadow-soft shadow-slate-200 backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">MUST Ride Registration</h1>
          <p className="text-sm text-slate-500">Safe student trips with fast online payment.</p>
        </div>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          <Link className="hover:text-primary" to="/">Home</Link>
          <Link className="hover:text-primary" to="/register">Register</Link>
          <Link className="hover:text-primary" to="/admin">Admin</Link>
        </nav>
      </header>

      <main className="mx-auto mt-8 max-w-6xl">{children}</main>
    </div>
  );
}

export default Layout;
