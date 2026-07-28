import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-soft shadow-slate-200">
      <div className="flex min-h-[520px] flex-col overflow-hidden rounded-[2rem]">
        {/* Photo section: roughly half the card, full width. A gradient at its
            base fades into the same green used below, so the transition from
            photo to color is seamless rather than a hard cut. */}
        <div className="relative flex-1 overflow-hidden">
          <img
            src="/bus-photo.jpg"
            alt=""
            className="h-full w-full scale-x-[-1] object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(4,120,87,0) 55%, rgba(4,120,87,1) 100%)',
            }}
          />
        </div>

        {/* Text + cards section: solid green, continuing the color the photo
            fades into. White text sits directly on it. */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-emerald-700 p-8 text-center sm:p-10 lg:p-12">
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-100">
              Achina luwe
            </p>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              Mpoto Ride
            </h1>
            <p className="mx-auto max-w-md text-lg text-emerald-50">
              Travel with Mpoto Ride for comfortable student transport and fast online booking.
            </p>
          </div>

          <div className="w-full max-w-xs rounded-3xl bg-white/90 p-5 shadow-sm">
            <p className="text-sm text-slate-500">Seat price</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">MWK 10,000</p>
          </div>

          <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <div className="rounded-3xl bg-white/90 p-5 shadow-sm">
              <p className="text-sm text-slate-500">On board</p>
              <ul className="mt-2 space-y-1">
                <li className="text-lg font-semibold text-slate-900">Comfortable seat</li>
                <li className="text-lg font-semibold text-slate-900">Charging ports</li>
                <li className="text-lg font-semibold text-slate-900">Snacks</li>
              </ul>
            </div>

            <Link
              to="/register"
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-4 text-base font-semibold text-emerald-700 shadow-lg transition hover:bg-emerald-50 sm:w-auto"
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