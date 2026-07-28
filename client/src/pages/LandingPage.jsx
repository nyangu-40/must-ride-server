import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-soft shadow-slate-200">
      <div className="relative min-h-[520px] overflow-hidden rounded-[2rem]">
        {/* Bus photo background — replace public/bus-photo.jpg with a real photo.
            Until then this gradient stands in so the layout still reads correctly. */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 35%, rgba(6,42,26,0.85) 100%), url('/bus-photo.jpg')`,
            backgroundColor: '#e9f5ee', // soft green fallback while the photo loads or is missing
          }}
        />

        {/* Content sits on top of the photo */}
        <div className="relative flex min-h-[520px] flex-col justify-between p-8 sm:p-10 lg:p-12">
          <div className="max-w-xl space-y-4 text-left">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-700">
              Achina luwe
            </p>
            <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
              Mpoto Ride
            </h1>
            <p className="max-w-md text-lg text-slate-700">
              Travel with Mpoto Ride for comfortable student transport and fast online booking.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-sm text-slate-500">Seat price</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-700">MWK 10,000</p>
              </div>
              <div className="rounded-3xl bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-sm text-slate-500">Comfort</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">Comfortable seat</p>
              </div>
            </div>

            <Link
              to="/register"
              className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:w-auto"
            >
              Register Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingPage;