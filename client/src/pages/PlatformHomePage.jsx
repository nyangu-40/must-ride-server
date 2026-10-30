import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, BarChart3, BusFront, Check, CreditCard, QrCode, ShieldCheck, TicketCheck, WalletCards } from 'lucide-react';
import { Accordion, Badge, Button, Card, PageContainer } from '../components/ui.jsx';

const features = [
  { icon: BusFront, title: 'Your own branded page', text: 'Give every operator a memorable booking link that carries their name and brand.' },
  { icon: TicketCheck, title: 'A clear seat map', text: 'Let passengers choose available seats, with temporary checkout holds to prevent clashes.' },
  { icon: CreditCard, title: 'Mobile money and card payments', text: 'Take online payments through PayChangu with server-verified payment confirmation.' },
  { icon: WalletCards, title: 'A transparent wallet', text: 'See paid bookings and withdrawals in an internal ledger with balances derived from transactions.' },
  { icon: BarChart3, title: 'Reports and operations', text: 'Manage trips, bookings, payouts, and reports from one organizer workspace.' },
  { icon: QrCode, title: 'Share in a scan', text: 'Put your booking page on posters, messages, and counters with a shareable QR code.' },
];

const faqs = [
  { title: 'Who can apply?', content: 'Bus operators, tour providers, and trip organizers can apply. The platform team reviews each application before a booking page becomes active.' },
  { title: 'How do passengers pay?', content: 'Passengers choose seats and pay through the hosted PayChangu checkout. The server verifies payment status, amount, and currency before confirming a booking.' },
  { title: 'Can I use my own branding?', content: 'Yes. After approval, set your organization name, logo, accent colour, and contact details for your public booking page.' },
  { title: 'How are wallet balances calculated?', content: 'Balances come from the internal transaction ledger. A paid registration creates one sale entry; platform commissions and fee rows are not used.' },
];

function PlatformHomePage() {
  return <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <PageContainer className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-950"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-800 text-white"><BusFront size={20} /></span>Must Ride</Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          <a href="#features" className="hover:text-emerald-900">Features</a><a href="#how-it-works" className="hover:text-emerald-900">How it works</a><a href="#faq" className="hover:text-emerald-900">FAQ</a><Link to="/login" className="hover:text-emerald-900">Sign in</Link><Link to="/become-organizer" className="rounded-full bg-emerald-800 px-4 py-2.5 font-semibold text-white hover:bg-emerald-900">Become an organizer</Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden"><Link to="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700">Sign in</Link><Link to="/become-organizer" className="rounded-full bg-emerald-800 px-3 py-2 text-sm font-semibold text-white">Apply</Link></div>
      </PageContainer>
    </header>

    <main>
      <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:px-8 sm:py-24">
        <div aria-hidden="true" className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-700/20 blur-3xl" />
        <PageContainer className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <Badge variant="success" className="bg-emerald-100 text-emerald-950">Booking tools for trip operators</Badge>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Your trips. Your brand. Booked online.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Let passengers choose seats and pay online through your own branded booking page—while you manage trips, bookings, and wallet activity in one place.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/become-organizer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-600">Become an organizer <ArrowRight size={18} /></Link>
              <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-500 px-6 py-3 font-semibold text-white hover:bg-slate-900">See how it works <ArrowDown size={18} /></a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-200"><span className="inline-flex items-center gap-2"><Check size={17} className="text-emerald-300" /> Branded organizer pages</span><span className="inline-flex items-center gap-2"><Check size={17} className="text-emerald-300" /> Verified payments</span></div>
          </div>
          <div className="mx-auto w-full max-w-lg rotate-1 rounded-3xl border border-white/10 bg-white p-3 text-slate-900 shadow-2xl sm:p-5">
            <div className="rounded-2xl bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-800 text-white"><BusFront size={22} /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Organizer page</p><p className="font-semibold">Lakeview Express</p></div><Badge variant="success" className="ml-auto">Secure</Badge></div>
              <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-600">Mzuzu <span aria-hidden="true">→</span> Blantyre</p><p className="mt-1 text-lg font-semibold">Friday · 8:30 AM</p><div className="mt-4 flex items-end justify-between"><div><p className="text-xs text-slate-600">From per seat</p><p className="text-2xl font-bold text-emerald-900">MWK 18,000</p></div><span className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">Choose seats</span></div></div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-600"><span className="inline-flex items-center gap-1"><ShieldCheck size={15} /> Payment verified</span><span>Seats held during checkout</span></div>
            </div>
          </div>
        </PageContainer>
      </section>

      <section aria-label="Platform benefits" className="border-b border-slate-200 bg-slate-50 px-5 py-6 sm:px-8"><PageContainer className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-slate-700"><span>Built for local trip operators</span><span>One seat map per trip</span><span>Secure payment checks</span><span>Tenant-isolated workspaces</span></PageContainer></section>

      <section id="features" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20"><PageContainer>
        <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-emerald-900">Everything in one platform</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Make booking simpler from first click to trip day</h2><p className="mt-4 leading-7 text-slate-700">A clear, practical workspace for operators and a smooth booking flow for passengers.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <Card key={title} className="p-6"><span className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-900"><Icon size={22} /></span><h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{text}</p></Card>)}</div>
      </PageContainer></section>

      <section id="how-it-works" className="scroll-mt-24 bg-slate-50 px-5 py-16 sm:px-8 sm:py-20"><PageContainer>
        <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-emerald-900">Getting started</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Three steps to your booking link</h2></div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">{[['01', 'Apply', 'Tell us about your organization and the trips you run.'], ['02', 'Get approved', 'Our team reviews your details and activates your organizer workspace.'], ['03', 'Share your link', 'Create trips, set your seat prices, and share your branded booking page.']].map(([number, title, text]) => <li key={number}><Card className="h-full p-6"><span className="text-sm font-bold tracking-widest text-emerald-900">{number}</span><h3 className="mt-4 text-xl font-semibold text-slate-950">{title}</h3><p className="mt-2 leading-6 text-slate-700">{text}</p></Card></li>)}</ol>
      </PageContainer></section>

      <section className="px-5 py-16 sm:px-8 sm:py-20"><PageContainer className="grid gap-8 rounded-3xl bg-emerald-950 p-7 text-white sm:p-10 lg:grid-cols-[.8fr_1.2fr]">
        <div><p className="text-sm font-bold uppercase tracking-widest text-emerald-200">Trust at every step</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Safer bookings, clearer records</h2><p className="mt-4 leading-7 text-emerald-50">The platform verifies payments before confirming a booking and keeps organizer data separated by account.</p></div>
        <ul className="grid gap-4 sm:grid-cols-3">{[['Verified payments', 'Payment status, amount, and currency are checked before confirmation.'], ['One booking record', 'A paid registration creates one sale entry in the internal ledger.'], ['Private organizer data', 'Tenant queries are scoped to the authenticated organizer.']].map(([title, text]) => <li key={title} className="rounded-2xl border border-white/15 bg-white/5 p-4"><ShieldCheck size={20} className="text-emerald-200" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-emerald-50">{text}</p></li>)}</ul>
      </PageContainer></section>

      <section id="faq" className="scroll-mt-24 bg-slate-50 px-5 py-16 sm:px-8 sm:py-20"><PageContainer className="max-w-3xl">
        <div className="mb-8 text-center"><h2 className="text-3xl font-bold tracking-tight text-slate-950">Frequently asked questions</h2><p className="mt-3 text-slate-700">A few quick answers before you apply.</p></div>
        <Accordion items={faqs} />
      </PageContainer></section>

      <section className="px-5 py-16 text-center sm:px-8"><PageContainer><div className="mx-auto max-w-3xl"><h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Ready to put your next trip online?</h2><p className="mt-4 text-lg text-slate-700">Apply today and get a branded page for your passengers.</p><Link to="/become-organizer" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-800 px-6 py-3 font-semibold text-white hover:bg-emerald-900">Become an organizer <ArrowRight size={18} /></Link></div></PageContainer></section>
    </main>
    <footer className="border-t border-slate-200 bg-white px-5 py-6 text-sm text-slate-700 sm:px-8"><PageContainer className="flex flex-col items-center justify-between gap-3 sm:flex-row"><span>© {new Date().getFullYear()} Must Ride</span><div className="flex gap-5"><Link to="/login" className="hover:text-emerald-900">Sign in</Link><Link to="/become-organizer" className="hover:text-emerald-900">Become an organizer</Link></div></PageContainer></footer>
  </div>;
}

export default PlatformHomePage;
