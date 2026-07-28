import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-soft shadow-slate-200">
      <div className="relative min-h-[520px] overflow-hidden rounded-[2rem]">
        {/* Photo banner: sits only in the upper portion of the card, full width
            edge-to-edge, with clear space between it and the text below. */}
        <div className="relative h-56 w-full overflow-hidden sm:h-64 lg:h-72">
          <img
            src="/bus-photo.jpg"
            alt=""
            className="h-full w-full scale-x-[-1] object-cover"
          />
        </div>

        {/* Text + cards zone: separate from the photo, centered */}
        <div className="flex flex-col items-center gap-8 p-8 text-center sm:p-10 lg:p-12">
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-700">
              Achina luwe
            </p>
            <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">
              Mpoto Ride
            </h1>
            <p className="mx-auto max-w-md text-lg text-slate-700">
              Travel with Mpoto Ride for comfortable student transport and fast online booking.
            </p>
          </div>

          <div className="w-full max-w-xs rounded-3xl bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm text-slate-600">Seat price</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">MWK 10,000</p>
          </div>

          <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <div className="rounded-3xl bg-emerald-50 p-5 shadow-sm">
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