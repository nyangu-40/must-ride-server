import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-soft shadow-slate-200">
      <div className="relative min-h-[520px] overflow-hidden rounded-[2rem]">
        {/* Bus photo fills the whole card. A light wash up top keeps the bus
            visible while letting dark centered text sit on it; a green wash
            at the bottom sits behind the price/services cards. */}
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
                'linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 30%, rgba(6,78,44,0.35) 65%, rgba(6,78,44,0.6) 100%)',
            }}
          />
        </div>

        {/* Text + cards sit on top of the photo, centered */}
        <div className="relative flex min-h-[520px] flex-col items-center justify-center gap-8 p-8 text-center sm:p-10 lg:p-12">
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-800">
              Achina luwe
            </p>
            <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
              Mpoto Ride
            </h1>
            <p className="mx-auto max-w-md text-lg text-slate-800">
              Travel with Mpoto Ride for comfortable student transport and fast online booking.
            </p>
          </div>

          <div className="w-full max-w-xs rounded-3xl bg-white/60 p-5 shadow-sm backdrop-blur-sm">
            <p className="text-sm text-slate-600">Seat price</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">MWK 10,000</p>
          </div>

          <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-center">
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