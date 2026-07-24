import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-soft shadow-slate-200">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Achina luwe</p>
          <h1 className="text-4xl font-semibold text-slate-900">Mpoto Ride</h1>
          <p className="text-lg text-slate-600">Travel with Mpoto Ride for comfortable student transport and fast online booking.</p>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5 text-center shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Seat price</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">MWK 100</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 text-center shadow-sm shadow-slate-200">
            <p className="text-sm text-slate-500">Comfort</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">Comfortable seat</p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5 text-center shadow-sm shadow-slate-200 w-full">
          <p className="text-sm text-slate-500">Fast student trips</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">Mpoto Ride</p>
        </div>

        <Link
          to="/register"
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-slate-900 sm:w-auto"
        >
          Register Now
        </Link>
      </div>
    </section>
  );
}

export default LandingPage;
