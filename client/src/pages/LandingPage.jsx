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
      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-[2rem]">
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
            fades into. Content starts right at the top of this section
            instead of centering, so there's no extra empty space to scroll
            past. */}
        <div className="flex flex-1 flex-col items-center gap-8 bg-emerald-700 px-8 pb-10 pt-6 text-center sm:px-10 sm:pt-8 lg:px-12">
          <div
            ref={headline.ref}
            className={`max-w-xl space-y-4 transition-all duration-700 ease-out ${
              headline.visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
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

          <div
            ref={priceCard.ref}
            className={`w-full max-w-xs rounded-3xl bg-white/90 p-5 shadow-sm transition-all duration-700 ease-out delay-150 ${
              priceCard.visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <p className="text-sm text-slate-500">Seat price</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">MWK 10,000</p>
          </div>

          <div
            ref={servicesRow.ref}
            className={`flex w-full flex-col items-center gap-6 transition-all duration-700 ease-out delay-300 sm:flex-row sm:justify-center ${
              servicesRow.visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
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