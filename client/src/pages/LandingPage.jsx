import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-soft shadow-slate-200">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white sm:p-10 lg:p-12">
          <div className="space-y-5 text-left">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Achina luwe</p>
            <h1 className="text-4xl font-semibold sm:text-5xl">Mpoto Ride</h1>
            <p className="max-w-xl text-lg text-slate-200">Travel with Mpoto Ride for comfortable student transport and fast online booking.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-slate-200">Seat price</p>
              <p className="mt-2 text-3xl font-semibold text-white">MWK 50</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-slate-200">Comfort</p>
              <p className="mt-2 text-3xl font-semibold text-white">Comfortable seat</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:w-auto">
            <Link
              to="/register"
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-slate-900 sm:w-auto"
            >
              Register Now
            </Link>
          </div>
        </div>

        <div className="m-4 rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-inner shadow-slate-200 sm:m-6 lg:m-8">
          <div className="relative h-full min-h-[360px] overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-slate-100 via-white to-slate-200">
            <img
              src="/bus-illustration.svg"
              alt="Mpoto Ride bus illustration"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingPage;
