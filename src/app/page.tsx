import Link from 'next/link';

const SPORTS = [
  { icon: '⚽', name: 'Soccer' },
  { icon: '🏉', name: 'Rugby' },
  { icon: '🏏', name: 'Cricket' },
  { icon: '🥅', name: 'Netball' },
  { icon: '🏑', name: 'Hockey' },
  { icon: '🏃', name: 'Athletics' },
  { icon: '🏊', name: 'Swimming' },
  { icon: '🎾', name: 'Tennis' },
  { icon: '🏀', name: 'Basketball' },
  { icon: '🏐', name: 'Volleyball' },
  { icon: '🤸', name: 'Gymnastics' },
  { icon: '🏅', name: 'Multi-sport' },
];

const SCHOOL_FEATURES = [
  {
    icon: '📋',
    title: 'Post a vacancy in 5 minutes',
    desc: 'Sport, age group, date, pay — done. Qualified coaches apply the same day.',
  },
  {
    icon: '🔍',
    title: 'Browse and invite coaches',
    desc: 'Filter by sport, province and experience. Invite coaches you like directly — no middleman.',
  },
  {
    icon: '🚨',
    title: 'Emergency cover',
    desc: 'Coach cancelled last minute? Hit Emergency and nearby coaches get an instant alert. First to accept is confirmed.',
  },
  {
    icon: '❤️',
    title: 'Build your staff pool',
    desc: 'Save coaches you trust. One tap to invite them back for the next fixture.',
  },
];

const COACH_FEATURES = [
  {
    icon: '🏅',
    title: 'A professional profile that does the work',
    desc: 'List your sports, qualifications, experience and availability. Schools find you — you don\'t have to chase them.',
  },
  {
    icon: '📍',
    title: 'Jobs near you, in your sport',
    desc: 'Browse open vacancies filtered by sport, province and schedule. Apply in one tap.',
  },
  {
    icon: '🚨',
    title: 'First to accept emergency jobs wins',
    desc: 'When a school needs urgent cover, available coaches get an alert. Fast responses build your reputation.',
  },
];

const STEPS = [
  {
    n: '1',
    school: { label: 'Head of Sport', title: 'Post your vacancy', desc: 'Sport, age group, date, pay. Done in 5 minutes.' },
    coach:  { label: 'Coach', title: 'Build your profile', desc: 'Sports, qualifications, availability. Schools find you.' },
    color:  'bg-blue-600',
  },
  {
    n: '2',
    school: { label: 'Head of Sport', title: 'Review applicants', desc: 'Coaches apply with a message. Compare profiles side by side.' },
    coach:  { label: 'Coach', title: 'Browse and apply', desc: 'Filter by sport and location. Apply in one tap with a message.' },
    color:  'bg-green-600',
  },
  {
    n: '3',
    school: { label: 'Head of Sport', title: 'Accept and message', desc: 'Confirm your coach and chat — all inside the platform.' },
    coach:  { label: 'Coach', title: 'Get confirmed and go', desc: 'Accepted? Message the school, show up, get paid.' },
    color:  'bg-purple-600',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">C</div>
            <span className="font-extrabold text-lg text-gray-900">CoachConnect</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link href="/register?role=school"
              className="text-sm font-bold border-2 border-gray-200 hover:border-green-400 text-gray-700 px-4 py-2 rounded-xl transition-colors hidden sm:block">
              I&apos;m a school
            </Link>
            <Link href="/register?role=coach"
              className="text-sm font-bold bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors">
              Join as a coach
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-8 border border-green-100">
          🇿🇦 Built for South African schools
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
          Sports staffing<br />
          <span className="text-green-600">without the chaos.</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-lg mx-auto mb-10 leading-relaxed">
          CoachConnect connects schools with qualified coaches, referees and officials across South Africa.
          No more WhatsApp groups. No more last-minute panic.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link href="/register?role=school"
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-700 text-white font-extrabold px-8 py-4 rounded-2xl text-sm transition-colors">
            I&apos;m a Head of Sport →
          </Link>
          <Link href="/register?role=coach"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-extrabold px-8 py-4 rounded-2xl text-sm transition-colors shadow-lg shadow-green-200">
            I&apos;m a Coach →
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Free to join. No credit card required.</p>
      </section>

      {/* ── Emergency Feature — the killer ── */}
      <section className="bg-gray-950 py-20 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 gap-12 items-center">

            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full mb-6 border border-red-500/30">
                🚨 New — Emergency Cover
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">
                Coach cancelled.<br />
                <span className="text-red-400">Replaced in 10 minutes.</span>
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Hit the Emergency button. Nearby coaches receive an instant alert with the job details and pay.
                First to accept is confirmed. School gets notified immediately.
              </p>
              <ul className="space-y-3">
                {[
                  'One tap posts an urgent job to all available coaches',
                  'Real-time alerts — coaches respond within minutes',
                  'First to accept locks the job — no double-booking',
                  'School receives instant confirmation with coach details',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="text-green-400 font-extrabold mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-75" />
                {/* Phone shell */}
                <div className="relative w-64 bg-gray-800 rounded-[2.8rem] p-3 shadow-2xl border border-white/10">
                  {/* Notch */}
                  <div className="flex justify-center mb-2">
                    <div className="w-20 h-1.5 bg-gray-700 rounded-full" />
                  </div>
                  {/* Screen */}
                  <div className="bg-gray-50 rounded-[2rem] overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-white px-4 pt-3 pb-2 flex justify-between items-center border-b border-gray-100">
                      <span className="text-[9px] font-extrabold text-gray-900">CoachConnect</span>
                      <span className="text-[9px] text-gray-400">9:41 AM</span>
                    </div>
                    {/* Emergency card */}
                    <div className="bg-red-600 m-2 rounded-2xl p-3 text-white shadow-lg">
                      <div className="text-[8px] font-extrabold bg-white/20 rounded-full px-2 py-0.5 inline-block mb-1.5">🚨 URGENT COVER NEEDED</div>
                      <p className="text-xs font-extrabold leading-tight">Soccer Coach</p>
                      <p className="text-[9px] text-red-200 mt-0.5">Umhlanga Ridge Primary · Today</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] bg-white/15 px-1.5 py-0.5 rounded-md font-bold">🕐 Starts 2:00 PM</span>
                        <span className="text-[9px] bg-white/15 px-1.5 py-0.5 rounded-md font-bold">💰 R350</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[8px] text-red-300 font-bold">Expires in 23 min</span>
                      </div>
                      <button className="w-full mt-2.5 bg-white text-red-600 text-[9px] font-extrabold py-2 rounded-xl">
                        ✋ Accept — I&apos;ll be there
                      </button>
                    </div>
                    {/* Skeleton content below */}
                    <div className="px-3 py-2 space-y-2">
                      <div className="h-2 bg-gray-200 rounded-full w-4/5" />
                      <div className="h-2 bg-gray-200 rounded-full w-3/5" />
                      <div className="h-10 bg-gray-100 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sports strip ── */}
      <section className="border-b border-gray-100 py-10 overflow-hidden">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-6">12 sports supported</p>
        <div className="flex gap-3 overflow-x-auto pb-2 px-6 justify-start sm:justify-center scrollbar-none flex-wrap sm:flex-nowrap max-w-4xl mx-auto">
          {SPORTS.map(s => (
            <div key={s.name} className="flex items-center gap-2 bg-gray-50 border border-gray-100 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap shrink-0">
              <span className="text-base">{s.icon}</span>
              {s.name}
            </div>
          ))}
        </div>
      </section>

      {/* ── For Schools ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center text-lg">🏫</div>
          <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">For Heads of Sport</span>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          Fill every gap in your sports programme.
        </h2>
        <p className="text-gray-500 text-sm mb-10 max-w-xl">
          From a weekly coaching slot to emergency cover on match day — CoachConnect handles it.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {SCHOOL_FEATURES.map(f => (
            <div key={f.title} className="bg-white border-2 border-gray-100 hover:border-blue-200 rounded-2xl p-6 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-extrabold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/register?role=school"
            className="inline-block bg-gray-900 hover:bg-gray-700 text-white font-extrabold px-8 py-3.5 rounded-2xl text-sm transition-colors">
            Post your first vacancy →
          </Link>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-3">How it works</h2>
          <p className="text-gray-500 text-sm text-center mb-12">Three steps for schools. Three steps for coaches.</p>

          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map(s => (
              <div key={s.n} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center font-extrabold text-white text-lg mb-5`}>
                  {s.n}
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">{s.school.label}</span>
                    <p className="text-sm font-extrabold text-gray-900 mt-0.5">{s.school.title}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.school.desc}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <span className="text-[10px] font-extrabold text-green-600 uppercase tracking-widest">{s.coach.label}</span>
                    <p className="text-sm font-extrabold text-gray-900 mt-0.5">{s.coach.title}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.coach.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Coaches ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center text-lg">🏅</div>
          <span className="text-xs font-extrabold text-green-600 uppercase tracking-widest">For Coaches</span>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
          Turn your coaching skills into steady work.
        </h2>
        <p className="text-gray-500 text-sm mb-10 max-w-xl">
          Schools are looking for qualified coaches right now. Get found, get hired, build your reputation.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {COACH_FEATURES.map(f => (
            <div key={f.title} className="bg-white border-2 border-gray-100 hover:border-green-200 rounded-2xl p-6 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-extrabold text-gray-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href="/register?role=coach"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-extrabold px-8 py-3.5 rounded-2xl text-sm transition-colors shadow-lg shadow-green-200">
            Create your coach profile →
          </Link>
        </div>
      </section>

      {/* ── Coverage ── */}
      <section className="bg-gray-950 py-16 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-6">Coverage</p>
          <h2 className="text-3xl font-extrabold text-white mb-4">All 9 provinces. 12 sports.</h2>
          <p className="text-gray-400 text-sm mb-8">
            From Cape Town to Johannesburg to Durban — CoachConnect works wherever SA schools need coaches.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape'].map(p => (
              <span key={p} className="text-xs font-bold bg-white/10 text-gray-300 px-3 py-1.5 rounded-xl border border-white/10">
                📍 {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
          Ready to fix your sports staffing?
        </h2>
        <p className="text-gray-500 text-sm mb-10 max-w-md mx-auto">
          Join schools and coaches already on CoachConnect. Free to start, no contract, cancel anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register?role=school"
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-700 text-white font-extrabold px-10 py-4 rounded-2xl text-sm transition-colors">
            I&apos;m a Head of Sport →
          </Link>
          <Link href="/register?role=coach"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-extrabold px-10 py-4 rounded-2xl text-sm transition-colors shadow-lg shadow-green-200">
            I&apos;m a Coach →
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-5">
          Questions? WhatsApp{' '}
          <a href="https://wa.me/27636732844" className="font-bold text-green-600 hover:underline">
            Jason
          </a>
          {' '}directly.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center text-white font-extrabold text-xs">C</div>
            <span className="text-sm font-extrabold text-gray-700">CoachConnect</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Connecting South African schools with sports professionals
          </p>
          <div className="flex gap-4">
            <Link href="/login"    className="text-xs text-gray-400 hover:text-gray-700 font-semibold transition-colors">Sign in</Link>
            <Link href="/register" className="text-xs text-gray-400 hover:text-gray-700 font-semibold transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
