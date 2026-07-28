import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-soft shadow-slate-200">
      <div className="relative min-h-[520px] overflow-hidden rounded-[2rem]">
        {/* Bus photo background — save the new photo as public/bus-photo.jpg.
            object-cover fills the whole card edge-to-edge (no letterboxing);
            scale-x-[-1] mirrors it to face the opposite direction. */}
        <div className="absolute inset-0">
          <img
            src="/bus-photo.jpg"
            alt=""
            className="h-full w-full scale-x-[-1] object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.05) 35%, rgba(6,78,44,0.55) 100%)',
            }}
          />
        </div>

        {/* Content sits on top of the photo: welcome message top, price card in
            the middle, services card + CTA at the bottom */}
        <div className="relative flex min-h-[520px] flex-col justify-between p-8 sm:p-10 lg:p-12">
          <div className="max-w-xl space-y-4 text-left" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-300">
              Achina luwe
            </p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              Mpoto Ride
            </h1>
            <p className="max-w-md text-lg text-white/90">
              Travel with Mpoto Ride for comfortable student transport and fast online booking.
            </p>
          </div>

          <div className="mx-auto w-full max-w-xs rounded-3xl bg-white/60 p-5 text-center shadow-sm backdrop-blur-sm">
            <p className="text-sm text-slate-600">Seat price</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">MWK 10,000</p>
          </div>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="rounded-3xl bg-white/60 p-5 shadow-sm backdrop-blur-sm">
              <p className="text-sm text-slate-600">On board</p>
              <ul className="mt-2 space-y-1">
                <li className="text-lg font-semibold text-slate-900">Comfortable seat</li>
                <li className="text-lg font-semibold text-slate-900">Charging ports</li>
                <li className="text-lg font-semibold text-slate-900">Snacks</li>
              </ul>
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