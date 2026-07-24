import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <section className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-soft shadow-slate-200">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <span className="inline-flex rounded-full bg-secondary/20 px-3 py-1 text-sm font-semibold text-primary">
            Student Ride Registration
          </span>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900">
            MUST Ride Registration
          </h2>
          <p className="mt-4 max-w-xl text-slate-600">
            Register for your next MUST Ride trip in minutes and pay securely online. Manage your trip details, seat selection, and payment with a modern, responsive registration flow.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-slate-900"
            >
              Register Now
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-primary hover:text-primary"
            >
              admin dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-6 shadow-inner shadow-slate-100">
          <div className="space-y-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Trip detail</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">MUST Ride</p>
              <p className="mt-2 text-slate-500">Comfortable student transport with verified pickup and safe routes.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200">
                <p className="text-sm text-slate-500">Seat price</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">MWK 100</p>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200">
                <p className="text-sm text-slate-500">Secure payment</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">PayChangu</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingPage;
