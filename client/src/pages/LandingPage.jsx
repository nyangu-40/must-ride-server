import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

// Small helper: fades + slides an element up into place the first time it
// scrolls into view, instead of animating on every scroll pass.
function useRevealOnScroll() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function LandingPage() {
  const headline = useRevealOnScroll();
  const priceCard = useRevealOnScroll();
  const servicesRow = useRevealOnScroll();

  return (
    <section className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-soft shadow-slate-200">
      <div className="flex flex-col overflow-hidden rounded-[2rem]">
        {/* Photo section: fixed height now (not flex-1), so it doesn't stretch
            to fill extra space. The headline sits directly on the photo. */}
        <div className="relative h-64 overflow-hidden sm:h-72 lg:h-80">
          <img
            src="/bus-photo.jpg"
            alt=""
            className="h-full w-full scale-x-[-1] object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(5,150,105,0) 40%, rgba(5,150,105,0.8) 100%)',
            }}
          />
          <div
            ref={headline.ref}
            className={`absolute inset-x-0 bottom-0 space-y-2 p-5 text-center transition-all duration-700 ease-out sm:p-6 ${
              headline.visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-emerald-100">
              Achina luwe
            </p>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">
              Mpoto Ride
            </h1>
            <p className="mx-auto max-w-md text-base text-emerald-50 sm:text-lg">
              Travel with Mpoto Ride for comfortable student transport and fast online booking.
            </p>
          </div>
        </div>

        {/* Cards section: sized to its content only (no flex-1, no forced
            min-height), with tighter padding and gaps, so it sits snug right
            beneath the photo instead of spreading down the page. */}
        <div className="flex flex-col items-center gap-3 bg-emerald-600/80 px-6 py-4 text-center sm:px-8 sm:py-5">
          <div
            ref={priceCard.ref}
            className={`w-full max-w-xs rounded-3xl bg-white/90 p-4 shadow-sm transition-all duration-700 ease-out delay-150 ${
              priceCard.visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <p className="text-sm text-slate-500">Seat price</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">MWK 10,000</p>
          </div>

          <div
            ref={servicesRow.ref}
            className={`flex w-full flex-col items-center gap-3 transition-all duration-700 ease-out delay-300 sm:flex-row sm:justify-center ${
              servicesRow.visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <div className="rounded-3xl bg-white/90 p-4 shadow-sm">
              <p className="text-sm text-slate-500">On board</p>
              <ul className="mt-1 space-y-0.5">
                <li className="text-base font-semibold text-slate-900">Comfortable seat</li>
                <li className="text-base font-semibold text-slate-900">Charging ports</li>
                <li className="text-base font-semibold text-slate-900">Snacks</li>
              </ul>
            </div>

            <Link
              to="/register"
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-emerald-700 shadow-lg transition hover:bg-emerald-50 sm:w-auto"
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