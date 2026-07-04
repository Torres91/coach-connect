import Link from 'next/link';

const STATS = [
  { value: '5 min', label: 'to post a job' },
  { value: '24 hr', label: 'average hire time' },
  { value: '9', label: 'provinces covered' },
  { value: '12+', label: 'sports supported' },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Create your profile', desc: 'Schools list their sports programme. Coaches upload qualifications and set availability.' },
  { step: '2', title: 'Post or browse',       desc: 'Schools post a vacancy in under 5 minutes. Coaches see open jobs filtered by sport and location.' },
  { step: '3', title: 'Apply and connect',    desc: 'Coaches apply with a message. Schools review, accept, and chat — all in one place.' },
];

const FEATURES = [
  { icon: '⚽', title: 'Post a vacancy in minutes', desc: 'Specify sport, date, age group and pay. Qualified coaches apply instantly.' },
  { icon: '🔍', title: 'Smart coach matching', desc: 'Filtered by sport, location, experience and availability — no WhatsApp groups needed.' },
  { icon: '💬', title: 'Built-in messaging', desc: 'Chat directly with coaches through the platform. No exchanging numbers until you\'re ready.' },
  { icon: '✅', title: 'Verified professionals', desc: 'Coaches upload qualifications. Schools can confirm who\'s coming to their campus.' },
];

const ROLES = [
  {
    role: 'Head of Sport / School',
    desc: 'Post vacancies, browse verified coaches, and fill your sports programme without the chaos.',
    cta: 'Post a job',
    href: '/register?role=school',
    colour: 'from-blue-600 to-indigo-600',
    icon: '🏫',
  },
  {
    role: 'Sports Coach',
    desc: 'Create a professional profile, browse schools near you, and pick up coaching work that fits your schedule.',
    cta: 'Join as a coach',
    href: '/register?role=coach',
    colour: 'from-green-600 to-emerald-600',
    icon: '🏅',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">C</div>
          <span className="font-extrabold text-lg text-gray-900">CoachConnect</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="text-sm font-bold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-green-200">
          🇿🇦 Built for South African schools
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          Find qualified sports coaches<br />
          <span className="text-green-600">in hours, not days.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          CoachConnect connects schools with vetted coaches, referees and officials across South Africa.
          Post a vacancy, browse matches, fill the slot.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register?role=school"
            className="bg-green-600 hover:bg-green-700 text-white font-extrabold px-8 py-4 rounded-2xl text-sm transition-colors shadow-lg shadow-green-200">
            I&apos;m a Head of Sport →
          </Link>
          <Link href="/register?role=coach"
            className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold px-8 py-4 rounded-2xl text-sm transition-colors">
            I&apos;m a Coach →
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Free to start. No credit card required.</p>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-green-700">{s.value}</p>
              <p className="text-xs text-gray-500 font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role cards */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-4">
          {ROLES.map(r => (
            <div key={r.role} className={`bg-gradient-to-br ${r.colour} rounded-3xl p-6 text-white`}>
              <div className="text-4xl mb-4">{r.icon}</div>
              <h3 className="font-extrabold text-lg mb-2">{r.role}</h3>
              <p className="text-sm opacity-85 leading-relaxed mb-5">{r.desc}</p>
              <Link href={r.href}
                className="inline-block bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors border border-white/30">
                {r.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map(h => (
            <div key={h.step} className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center font-extrabold text-white text-xl mx-auto mb-4">{h.step}</div>
              <h3 className="font-extrabold text-gray-900 mb-2">{h.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">
            Replace WhatsApp groups with a proper workflow
          </h2>
          <p className="text-center text-gray-500 text-sm mb-12">Everything you need to staff your sports programme.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-extrabold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Ready to simplify sports staffing?</h2>
        <p className="text-gray-500 text-sm mb-8">Join schools and coaches already using CoachConnect.</p>
        <Link href="/register"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-extrabold px-10 py-4 rounded-2xl text-sm transition-colors shadow-lg shadow-green-200">
          Get started free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        CoachConnect · South Africa · Connecting schools with sports professionals
      </footer>
    </div>
  );
}
