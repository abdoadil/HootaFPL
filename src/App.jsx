import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// 🔔 Toast Notification System (replaces window.alert everywhere)
// ============================================================
let toastId = 0;
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);
  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  return { toasts, push, dismiss };
}

function ToastContainer({ toasts, dismiss }) {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info', warn: 'fa-triangle-exclamation' };
  const colors = { success: 'bg-fpl-green text-fpl-purple', error: 'bg-red-500 text-white', info: 'bg-fpl-purple text-white', warn: 'bg-amber-500 text-white' };
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 items-center w-[92%] max-w-md pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} onClick={() => dismiss(t.id)}
          className={`${colors[t.type] || colors.info} px-5 py-3.5 rounded-2xl shadow-2xl font-bold flex items-center gap-3 w-full pointer-events-auto animate-toast-in cursor-pointer text-sm md:text-base`}>
          <i className={`fa-solid ${icons[t.type] || icons.info}`}></i>
          <span className="flex-1">{t.message}</span>
          <i className="fa-solid fa-xmark opacity-60 hover:opacity-100"></i>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// ✨ Small reusable UI helpers
// ============================================================
function SkeletonBox({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200/80 rounded-xl ${className}`}></div>;
}

function OwnershipBar({ percent, colorClass = 'bg-fpl-green' }) {
  const pct = Math.min(100, Math.max(0, parseFloat(percent) || 0));
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-1.5">
      <div className={`h-full ${colorClass} rounded-full transition-all duration-700 ease-out`} style={{ width: `${pct}%` }}></div>
    </div>
  );
}

function BackToTop({ show }) {
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-fpl-purple text-fpl-green shadow-2xl flex items-center justify-center text-xl hover:scale-110 hover:bg-purple-900 active:scale-95 transition-all duration-300 animate-fade-in border-2 border-fpl-green/40"
      aria-label="العودة للأعلى">
      <i className="fa-solid fa-arrow-up"></i>
    </button>
  );
}

// ============================================================
// ❓ الأسئلة الشائعة (تُستخدم في شات بوت المساعدة السريع)
// ============================================================
const FAQ_ITEMS = [
  { q: 'كيف أحصل على رقم فريقي (Team ID)؟', a: 'سجّل دخولك في موقع الفانتسي الرسمي، ثم افتح صفحة "Pick Team" أو "Points". رقمك موجود في رابط الصفحة بين entry/ و history/، انسخه من هناك.' },
  { q: 'كيف تعمل الـ Wildcard؟', a: 'الـ Wildcard تسمح لك بتغيير تشكيلتك بالكامل دون خصم أي نقاط. تمتلك اثنتين في الموسم، واحدة في النصف الأول وواحدة في النصف الثاني.' },
  { q: 'متى أستخدم Free Hit؟', a: 'استخدمها في جولة واحدة فقط بها ظروف استثنائية (بلانك جولة أو دبل جولة)، لأن تشكيلتك تعود تلقائياً كما كانت في الجولة التالية.' },
  { q: 'كيف تُحسب نقاط الكابتن؟', a: 'يحصل الكابتن على ضعف نقاطه في تلك الجولة (x2)، وإذا فعّلت شريحة Triple Captain تصبح نقاطه x3.' },
  { q: 'ما الفرق بين Bench Boost و Triple Captain؟', a: 'Bench Boost تُضيف نقاط لاعبي دكة البدلاء لإجمالي نقاطك في تلك الجولة، أما Triple Captain فتُضاعف نقاط الكابتن 3 مرات بدلاً من مرتين.' },
  { q: 'كيف تتغير أسعار اللاعبين؟', a: 'تتغير الأسعار يومياً بناءً على حجم عمليات الشراء والبيع لكل لاعب مقارنة بباقي اللاعبين، ولا تتغير الأسعار إطلاقاً قبل انطلاق الجولة الأولى من الموسم.' },
  { q: 'ما هو خصم الـ -4 (Hit)؟', a: 'كل تبديل إضافي بعد التبديل المجاني الأول يكلفك 4 نقاط تُخصم من رصيدك في تلك الجولة. استخدم حاسبة السالب في الموقع لمعرفة هل التبديل يستحق ذلك.' },
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const WORKER_URL = 'https://fpl-proxy.sokar8893.workers.dev'; // ⚠️ تأكد من الرابط الخاص بك
  const BASE_URL = import.meta.env.BASE_URL;

  // --- Toasts (replaces alert()) ---
  const { toasts, push: notify, dismiss } = useToasts();

  // --- Dark mode ---
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('hootafpl_dark') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('hootafpl_dark', darkMode ? '1' : '0'); } catch {}
  }, [darkMode]);

  // --- Scroll state (for back-to-top + shrinking header) ---
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // --- States (with persistence so users don't retype IDs every visit) ---
  const [teamId, setTeamId] = useState(() => { try { return localStorage.getItem('hootafpl_teamId') || ''; } catch { return ''; } });
  const [leagueId, setLeagueId] = useState(() => { try { return localStorage.getItem('hootafpl_leagueId') || ''; } catch { return ''; } });

  useEffect(() => { try { if (teamId) localStorage.setItem('hootafpl_teamId', teamId); } catch {} }, [teamId]);
  useEffect(() => { try { if (leagueId) localStorage.setItem('hootafpl_leagueId', leagueId); } catch {} }, [leagueId]);

  const [homeData, setHomeData] = useState({
    loading: true, error: false, currentGWName: '', gwNumber: '', transfersMade: 0,
    chips: { wc: 0, fh: 0, bb: 0, tc: 0 },
    mostIn: null, mostOut: null, mostCap: null,
    top10In: [], top10Out: [], kingsOfGw: [], standings: [],
    deadline: null, templateTeam: { 1: [], 2: [], 3: [], 4: [] }
  });

  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [newsIndex, setScoutNewsIndex] = useState(0);
  const [kingIndex, setKingIndex] = useState(0);

  const [pitchData, setPitchData] = useState({ name: '', gwPoints: 0, totalPoints: 0, starting: {1:[], 2:[], 3:[], 4:[]}, bench: [], loading: false, aiLoading: false, analyzed: false, aiText: '' });
  const [radarData, setRadarData] = useState({ fallers: [], risers: [], loading: false });
  const [fixturesData, setFixturesData] = useState({ teams: [], loading: false });
  const [leagueData, setLeagueData] = useState({ name: '', standings: [], loading: false, stats: null });
  const [hitCalc, setHitCalc] = useState({ pointsOut: 0, pointsIn: 0 });

  const [simTeamId, setSimTeamId] = useState(() => { try { return localStorage.getItem('hootafpl_simTeamId') || ''; } catch { return ''; } });
  useEffect(() => { try { if (simTeamId) localStorage.setItem('hootafpl_simTeamId', simTeamId); } catch {} }, [simTeamId]);

  const [simSquad, setSimSquad] = useState({ 1: [], 2: [], 3: [], 4: [] });
  const [simBank, setSimBank] = useState(0.0);
  const [allPlayers, setAllPlayers] = useState([]);
  const [marketFilters, setMarketFilters] = useState({ search: '', position: 0, sort: 'transfers_in_event' });
  const [simLoading, setSimLoading] = useState(false);
  const [activeChip, setActiveChip] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchHighlight, setSearchHighlight] = useState(0);

  const chatEndRef = useRef(null);
  const searchRef = useRef(null);
  const chatInputRef = useRef(null);
  const isFetchingHome = useRef(false);

  const titleColors = ['text-white', 'text-fpl-green', 'text-yellow-400', 'text-blue-400', 'text-pink-400'];
  const [titleColorIndex, setTitleColorIndex] = useState(0);

  // --- شرح جدول الأندية ---
  const [showTableLegend, setShowTableLegend] = useState(false);

  // --- فقاعات أخبار الكشافة (The Scout) ---
  const [scoutBubbles, setScoutBubbles] = useState({ items: [], loading: true, activeItem: null });

  // --- جدول المباريات الحي ---
  const [fixturesFull, setFixturesFull] = useState({ loading: true, error: false, gw: null, gwStart: null, gwEnd: null, matches: [] });
  const [fixturesGwOverride, setFixturesGwOverride] = useState(null);

  // --- شات بوت الأسئلة الشائعة (يظهر تلقائياً) ---
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqTeaser, setFaqTeaser] = useState(false);
  const [faqMessages, setFaqMessages] = useState([{ role: 'assistant', text: 'أهلاً بك! 👋 أنا مساعدك السريع في HootaFPL، اختر سؤالاً جاهزاً أو اكتب سؤالك الخاص.' }]);
  const [faqInput, setFaqInput] = useState('');
  const [faqLoading, setFaqLoading] = useState(false);
  const faqEndRef = useRef(null);

  const socialLinks = [
    { icon: 'fa-brands fa-instagram', url: 'https://www.instagram.com/abdo_adil/' },
    { icon: 'fa-brands fa-facebook', url: 'https://www.facebook.com/hoota2002/' },
    { icon: 'fa-brands fa-linkedin', url: 'https://www.linkedin.com/in/abdalmahmoud-adil/' },
    { icon: 'fa-solid fa-globe', url: 'https://abdoadil.github.io/' }
  ];

  const scoutNewsList = [
    { title: "انطلاق رسمياً موسم الفانتسي 2026/2027! 🚀", tag: "موسم جديد", bg: "bg-fpl-green text-fpl-purple", content: "تم إطلاق الموقع الرسمي للفانتسي لموسم 2026/2027! يمكنك الآن تسجيل فريقك الجديد واختيار تشكيلتك المبدئية بميزانية 100 مليون قبل الموعد النهائي للجولة الأولى." },
    { title: "تحديثات أسعار نجوم البريميرليج 💰", tag: "أسعار اللاعبين", bg: "bg-blue-500", content: "استكشف أسعار اللاعبين الجدد والمنتقلين حديثاً للبريميرليج. استخدم محاكي التبديلات في موقعنا لتخطيط تشكيلة الموسم واختبار الخواص المتاحة." },
    { title: "تحديث أرقام الفرق (Team ID) 🆔", tag: "تنبيه هام", bg: "bg-red-500", content: "يرجى العلم أن أرقام الفرق للموسم الماضي قد تغيرت. يرجى الحصول على رقم فريقك الجديد لموسم 2026/2027 من صفحة Points/Pick Team ليتسنى للذكاء الاصطناعي تحليل تشكيلتك." }
  ];

  const siteServices = [
    { id: 'home', name: 'الرئيسية', icon: 'fa-house' },
    { id: 'pitch', name: 'المساعد الذكي', icon: 'fa-robot' },
    { id: 'radar', name: 'رادار الأسعار', icon: 'fa-crosshairs' },
    { id: 'league', name: 'تحليل الدوريات الخاصة', icon: 'fa-trophy' },
    { id: 'sim', name: 'محاكي التبديلات', icon: 'fa-laptop-code' },
    { id: 'hit', name: 'حاسبة سالب التبديلات', icon: 'fa-calculator' }
  ];

  const filteredServices = siteServices.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearch(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation for the header search (↑ ↓ Enter Esc)
  const handleSearchKeyDown = (e) => {
    if (!showSearch || filteredServices.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchHighlight(prev => (prev + 1) % filteredServices.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchHighlight(prev => (prev - 1 + filteredServices.length) % filteredServices.length); }
    else if (e.key === 'Enter') { e.preventDefault(); const svc = filteredServices[searchHighlight]; if (svc) { setActiveTab(svc.id); setShowSearch(false); setSearchQuery(''); } }
    else if (e.key === 'Escape') { setShowSearch(false); }
  };
  useEffect(() => { setSearchHighlight(0); }, [searchQuery]);

  useEffect(() => {
    const timer = setInterval(() => { setScoutNewsIndex((prev) => (prev + 1) % scoutNewsList.length); }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (homeData.kingsOfGw.length > 0) {
      const kingTimer = setInterval(() => {
        setKingIndex((prev) => (prev + 1) % homeData.kingsOfGw.length);
      }, 3500);
      return () => clearInterval(kingTimer);
    }
  }, [homeData.kingsOfGw]);

  // Countdown Timer engine
  useEffect(() => {
    if (!homeData.deadline) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(homeData.deadline).getTime();
      const diff = target - now;
      if (diff > 0) {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((diff % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [homeData.deadline]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, isChatLoading]);
  useEffect(() => { faqEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [faqMessages, faqLoading]);

  // إظهار فقاعة الشات بوت تلقائياً بعد ثوانٍ من الدخول (مرة واحدة في الجلسة)
  useEffect(() => {
    const shown = sessionStorage.getItem('hootafpl_faq_teased');
    if (shown) return;
    const t = setTimeout(() => { setFaqTeaser(true); sessionStorage.setItem('hootafpl_faq_teased', '1'); }, 6000);
    return () => clearTimeout(t);
  }, []);

  // ============================================================
  // 📰 أخبار الكشافة (The Scout) — تحديث كل 12 ساعة مع حفظ محلي
  // ============================================================
  const fetchScoutNews = async (force = false) => {
    try {
      const cacheRaw = localStorage.getItem('hootafpl_news_cache');
      const cache = cacheRaw ? JSON.parse(cacheRaw) : null;
      const twelveHours = 12 * 60 * 60 * 1000;
      if (!force && cache && (Date.now() - cache.ts) < twelveHours && cache.items?.length) {
        setScoutBubbles({ items: cache.items, loading: false, activeItem: null });
        return;
      }
      setScoutBubbles(prev => ({ ...prev, loading: true }));
      // ⚠️ يفترض وجود مسار /api/news في الـ Worker يقوم بجلب وتحليل أخبار The Scout من الموقع الرسمي
      // وترتيبها حسب الأحدث أولاً. إن لم يتوفر المسار بعد، نستخدم نشرة احتياطية محلية.
      let items = [];
      try {
        const res = await fetch(`${WORKER_URL}/api/news`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length) {
            items = data.map((n, i) => ({
              id: n.id || i, title: n.title, image: n.image || `${BASE_URL}logo.png`,
              content: n.summary || n.content || '', date: n.date || new Date().toISOString(), link: n.link || null
            })).sort((a, b) => new Date(b.date) - new Date(a.date));
          }
        }
      } catch (err) { /* الـ Worker لا يدعم المسار بعد، سيتم استخدام النشرة الاحتياطية */ }

      if (!items.length) {
        items = scoutNewsList.map((n, i) => ({ id: i, title: n.title, image: `${BASE_URL}logo.png`, content: n.content, date: new Date(Date.now() - i * 3600000).toISOString(), tag: n.tag, bg: n.bg }));
      }

      localStorage.setItem('hootafpl_news_cache', JSON.stringify({ ts: Date.now(), items }));
      setScoutBubbles({ items, loading: false, activeItem: null });
    } catch (e) {
      setScoutBubbles({ items: scoutNewsList.map((n, i) => ({ id: i, title: n.title, image: `${BASE_URL}logo.png`, content: n.content, date: new Date().toISOString() })), loading: false, activeItem: null });
    }
  };

  useEffect(() => {
    fetchScoutNews();
    const newsInterval = setInterval(() => fetchScoutNews(true), 12 * 60 * 60 * 1000);
    return () => clearInterval(newsInterval);
  }, []);

  // ============================================================
  // 📅 جدول المباريات الحي — يتحدّث تلقائياً وينتقل للجولة التالية بمفرده
  // ============================================================
  const fetchFixturesFull = async (gwOverride = null) => {
    setFixturesFull(prev => ({ ...prev, loading: prev.matches.length === 0, error: false }));
    try {
      const boot = await fetch(`${WORKER_URL}/api/bootstrap`).then(r => r.json());
      const fixRes = await fetch(`${WORKER_URL}/api/fixtures`).then(r => r.json());
      const events = boot.events || [];
      const currentEvent = events.find(e => e.is_current) || events.find(e => e.is_next) || events[0];
      const targetGw = gwOverride || currentEvent.id;
      const gwFixtures = (Array.isArray(fixRes) ? fixRes : []).filter(f => f.event === targetGw).sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time));
      const kickoffs = gwFixtures.map(f => f.kickoff_time && new Date(f.kickoff_time)).filter(Boolean);
      const gwStart = kickoffs.length ? new Date(Math.min(...kickoffs)) : null;
      const gwEnd = kickoffs.length ? new Date(Math.max(...kickoffs)) : null;
      const matches = gwFixtures.map(f => ({
        id: f.id,
        home: boot.teams.find(t => t.id === f.team_h),
        away: boot.teams.find(t => t.id === f.team_a),
        kickoff: f.kickoff_time,
        started: f.started, finished: f.finished, finishedProvisional: f.finished_provisional,
        homeScore: f.team_h_score, awayScore: f.team_a_score, minutes: f.minutes
      }));
      setFixturesFull({ loading: false, error: false, gw: targetGw, gwStart, gwEnd, matches, totalGws: events.length, isAuto: !gwOverride });
    } catch (e) { setFixturesFull(prev => ({ ...prev, loading: false, error: true })); }
  };

  useEffect(() => {
    if (activeTab !== 'fixtures') return;
    fetchFixturesFull(fixturesGwOverride);
    const interval = setInterval(() => fetchFixturesFull(fixturesGwOverride), 45000);
    return () => clearInterval(interval);
  }, [activeTab, fixturesGwOverride]);

  const [aiLoadingText, setAiLoadingText] = useState('');
  useEffect(() => {
    let interval;
    if (pitchData.aiLoading) {
      const messages = ["يقرأ أفكار بيب جوارديولا...", "يحلل الكوارث الدفاعية لتشكيلتك...", "يحسب xG لمعرفة من خذلك...", "يُجهز لك تقريراً احترافياً وموسعاً..."];
      let step = 0; setAiLoadingText(messages[0]);
      interval = setInterval(() => { step = (step + 1) % messages.length; setAiLoadingText(messages[step]); }, 1800);
    }
    return () => clearInterval(interval);
  }, [pitchData.aiLoading]);

  useEffect(() => {
    fetchHomeData(true);
    const liveInterval = setInterval(() => { fetchHomeData(false); }, 60000);
    return () => clearInterval(liveInterval);
  }, []);

  const fetchHomeData = async (initialLoad = false) => {
    if (isFetchingHome.current) return;
    isFetchingHome.current = true;

    if (initialLoad) setHomeData(prev => ({ ...prev, loading: true, error: false }));

    try {
      const bootRes = await fetch(`${WORKER_URL}/api/bootstrap`);
      if (!bootRes.ok) throw new Error("API Limit");
      const boot = await bootRes.json();

      if (!boot || !boot.elements) throw new Error("Invalid Data");

      const currentEvent = boot.events.find(e => e.is_current) || boot.events.find(e => e.is_next) || boot.events[0];

      let wcCount = 0, fhCount = 0, bbCount = 0, tcCount = 0;
      if(currentEvent.chip_plays && currentEvent.chip_plays.length > 0) {
        currentEvent.chip_plays.forEach(c => {
           if(c.chip_name === 'wildcard') wcCount = c.num_played;
           if(c.chip_name === 'freehit') fhCount = c.num_played;
           if(c.chip_name === 'bbench') bbCount = c.num_played;
           if(c.chip_name === '3xc') tcCount = c.num_played;
        });
      }

      const elements = boot.elements;
      const sortedByOwnership = [...elements].sort((a,b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent));
      const sortedByCost = [...elements].sort((a,b) => b.now_cost - a.now_cost);

      let mostInPlayer = sortedByOwnership[0] || null;
      let mostOutPlayer = sortedByOwnership[1] || null;
      const mostPopularCap = sortedByCost[0] || null;

      let gwKings = [];
      const pastEvents = boot.events.filter(e => e.finished || e.is_current);
      pastEvents.forEach(event => {
        if (event.top_element_info) {
          const kingPlayer = elements.find(el => el.id === event.top_element_info.id);
          if (kingPlayer) {
            gwKings.push({ gw: `الجولة ${event.id}`, playerInfo: kingPlayer, points: event.top_element_info.points });
          }
        }
      });

      if (gwKings.length === 0) {
        gwKings = sortedByOwnership.slice(0, 6).map((p, idx) => ({
           gw: `نجم مُقترح ${idx + 1}`, playerInfo: p, points: `£${(p.now_cost/10).toFixed(1)}m`
        }));
      }

      const gks = sortedByOwnership.filter(e => e.element_type === 1).slice(0, 1);
      const defs = sortedByOwnership.filter(e => e.element_type === 2).slice(0, 3);
      const mids = sortedByOwnership.filter(e => e.element_type === 3).slice(0, 4);
      const fwds = sortedByOwnership.filter(e => e.element_type === 4).slice(0, 3);

      const template11 = {
        1: gks.map(p => ({...p, isCap: p.id === mostInPlayer.id})),
        2: defs.map(p => ({...p, isCap: p.id === mostInPlayer.id})),
        3: mids.map(p => ({...p, isCap: p.id === mostInPlayer.id})),
        4: fwds.map(p => ({...p, isCap: p.id === mostInPlayer.id}))
      };

      let realStandings = [...boot.teams].sort((a,b) => a.name.localeCompare(b.name)).map((t, i) => ({
         id: t.id, name: t.name, code: t.code, played: 0, win: 0, draw: 0, loss: 0, goal_difference: 0, points: 0
      }));

      setHomeData({
        loading: false, error: false, currentGWName: currentEvent.name || 'GW1', gwNumber: currentEvent.id || 1, transfersMade: currentEvent.transfers_made || 0,
        chips: { wc: wcCount, fh: fhCount, bb: bbCount, tc: tcCount }, mostIn: mostInPlayer, mostOut: mostOutPlayer, mostCap: mostPopularCap,
        top10In: sortedByOwnership.slice(0, 10), top10Out: sortedByCost.slice(0, 10), kingsOfGw: gwKings, standings: realStandings,
        deadline: currentEvent.deadline_time, templateTeam: template11
      });
    } catch (e) {
      if (initialLoad) setHomeData(prev => ({ ...prev, loading: false, error: true }));
    } finally {
      isFetchingHome.current = false;
    }
  };

  const fetchPitchAndAnalyze = async () => {
    if (!teamId) return notify("أدخل رقم الفريق الجديد لموسم 2026/2027", "warn");
    setPitchData(prev => ({ ...prev, loading: true, aiLoading: false, analyzed: false, aiText: '' }));
    try {
      const boot = await fetch(`${WORKER_URL}/api/bootstrap`).then(r => r.json());
      const team = await fetch(`${WORKER_URL}/api/team-picks/${teamId}`).then(r => r.json());
      const live = await fetch(`${WORKER_URL}/api/live/${team.event || 1}`).then(r => r.json()).catch(() => []);

      let starting = { 1: [], 2: [], 3: [], 4: [] }; let bench = []; let startingNames = []; let benchNames = [];
      team.picks.forEach((pick, index) => {
        const pInfo = boot.elements.find(p => p.id === pick.element);
        const lInfo = Array.isArray(live) ? live.find(l => l.id === pick.element) : null;
        let pts = lInfo ? lInfo.stats.total_points : 0;
        if(pick.is_captain) pts *= pick.multiplier;
        const obj = { id: pInfo.id, name: pInfo.web_name, teamCode: pInfo.team_code, type: pInfo.element_type, points: pts, isCap: pick.is_captain, isVice: pick.is_vice_captain, now_cost: pInfo.now_cost };
        if (index < 11) { starting[pInfo.element_type].push(obj); startingNames.push(`${pInfo.web_name}`); }
        else { bench.push(obj); benchNames.push(`${pInfo.web_name}`); }
      });

      setPitchData({ name: team.name || "فريقك للموسم الجديد", gwPoints: team.summary_event_points || 0, totalPoints: team.summary_overall_points || 0, starting, bench, loading: false, aiLoading: true, analyzed: true, aiText: '' });
      setChatMessages([{ role: 'assistant', text: 'أهلاً بك في الموسم الجديد 2026/2027! 🤖 لقد قمت بفحص تشكيلتك المبدئية، كيف يمكنني مساعدتك اليوم؟' }]);
      notify("تم تحليل تشكيلتك بنجاح ✅", "success");

      const prompt = `أنت خبير فانتسي عبقري لموسم 2026/2027. اسم فريق المستخدم: "${team.name}".
      التشكيلة المبدئية المختارة: ${startingNames.join("، ")}. دكة البدلاء: ${benchNames.join("، ")}.
      المطلوب: اكتب تحليلاً استراتيجياً مشجعاً للتشكيلة المبدئية قبل انطلاق الجولة الأولى، وعلق على تنوع الخيارات والميزانية بأسلوب عربي فصيح وممتع بدون عناوين صريحة.`;

      const ai = await fetch(`${WORKER_URL}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt }) }).then(r => r.json());
      setPitchData(prev => ({ ...prev, aiLoading: false, aiText: ai.ai_text }));
    } catch (e) {
      setPitchData(prev => ({ ...prev, loading: false, aiLoading: false, aiText: 'تأكد من إدخال Team ID الصحيح للموسم الجديد 2026/2027.' }));
      notify("تعذر جلب بيانات الفريق، تأكد من رقم الفريق", "error");
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput; const newMessages = [...chatMessages, { role: 'user', text: userMsg }];
    setChatMessages(newMessages); setChatInput(''); setIsChatLoading(true);
    const contextSquad = pitchData.starting ? Object.values(pitchData.starting).flat().map(p => p.name).join(', ') : 'غير معروف';
    const prompt = `أنت HootaFPL Assistant لموسم 2026/2027. تشكيلة المستخدم: ${contextSquad}. سؤال المستخدم: "${userMsg}". أجب باحترافية ومتعة كصديق خبير باللغة العربية.`;
    try {
      const ai = await fetch(`${WORKER_URL}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt }) }).then(r => r.json());
      setChatMessages([...newMessages, { role: 'assistant', text: ai.ai_text }]);
    } catch (e) { setChatMessages([...newMessages, { role: 'assistant', text: 'عذراً، هناك ضغط على السيرفر. حاول مجدداً.' }]); }
    setIsChatLoading(false);
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const askFaq = (item) => {
    setFaqMessages(prev => [...prev, { role: 'user', text: item.q }, { role: 'assistant', text: item.a }]);
  };

  const sendFaqFreeText = async () => {
    if (!faqInput.trim()) return;
    const userMsg = faqInput; const newMsgs = [...faqMessages, { role: 'user', text: userMsg }];
    setFaqMessages(newMsgs); setFaqInput(''); setFaqLoading(true);
    const prompt = `أنت مساعد سريع لموقع HootaFPL لموسم 2026/2027. أجب بإيجاز ووضوح (3-4 أسطر كحد أقصى) وبالعربية على سؤال المستخدم التالي المتعلق بالفانتسي: "${userMsg}"`;
    try {
      const ai = await fetch(`${WORKER_URL}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) }).then(r => r.json());
      setFaqMessages([...newMsgs, { role: 'assistant', text: ai.ai_text || 'عذراً، لم أستطع الإجابة الآن، جرّب أحد الأسئلة الجاهزة.' }]);
    } catch (e) { setFaqMessages([...newMsgs, { role: 'assistant', text: 'عذراً، هناك ضغط على السيرفر حالياً. جرّب أحد الأسئلة الجاهزة بالأسفل 👇' }]); }
    setFaqLoading(false);
  };

  const fmtMatchTime = (iso) => {
    if (!iso) return { day: 'TBC', time: '--:--' };
    const d = new Date(iso);
    return {
      day: d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const fetchRadar = async () => {
    setRadarData({ fallers: [], risers: [], loading: true });
    try {
      const bootRes = await fetch(`${WORKER_URL}/api/bootstrap`);
      const boot = await bootRes.json();
      const elements = boot.elements || [];
      const risers = [...elements].sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent)).slice(0, 12);
      const fallers = [...elements].sort((a, b) => parseFloat(a.selected_by_percent) - parseFloat(b.selected_by_percent)).slice(0, 12);
      setRadarData({ fallers, risers, loading: false });
    } catch (e) { setRadarData({ fallers: [], risers: [], loading: false }); }
  };

  const fetchFixtures = async () => {
    setFixturesData({ teams: [], loading: true });
    try {
      const bootRes = await fetch(`${WORKER_URL}/api/bootstrap`);
      const boot = await bootRes.json();
      let upcomingFixtures = [];
      try {
        const fixRes = await fetch(`${WORKER_URL}/api/fixtures`);
        if (fixRes.ok) {
           const fixData = await fixRes.json();
           if (Array.isArray(fixData)) upcomingFixtures = fixData.filter(f => f.event != null && f.finished === false).sort((a,b) => a.event - b.event);
        }
      } catch (err) { console.warn("Fixtures API Failed"); }

      const teamsWithNextMatch = boot.teams.map(team => {
        let nextOpponent = null; let nextOpponentCode = null; let isHome = false;
        if (upcomingFixtures.length > 0) {
          const nextMatch = upcomingFixtures.find(f => f.team_a === team.id || f.team_h === team.id);
          if (nextMatch) {
            isHome = nextMatch.team_h === team.id;
            const opponentId = isHome ? nextMatch.team_a : nextMatch.team_h;
            const opponentTeam = boot.teams.find(t => t.id === opponentId);
            if (opponentTeam) { nextOpponent = opponentTeam.short_name; nextOpponentCode = opponentTeam.code; }
          }
        }
        return { ...team, nextOpponent, nextOpponentCode, isHome };
      });
      setFixturesData({ teams: teamsWithNextMatch, loading: false });
    } catch (e) { setFixturesData({ teams: [], loading: false }); notify("حدث خطأ في جلب بيانات الصعوبة.", "error"); }
  };

  const fetchLeague = async () => {
    if (!leagueId) return notify("أدخل رقم الدوري", "warn");
    setLeagueData(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`${WORKER_URL}/api/league/${leagueId}`).then(r => r.json());
      const standings = res.standings.results.slice(0, 20);
      setLeagueData({ name: res.league.name, standings, stats: null, loading: false });
      notify(`تم تحميل دوري ${res.league.name} ✅`, "success");
    } catch (e) { setLeagueData(prev => ({ ...prev, loading: false })); notify("تعذر العثور على الدوري، تأكد من الرقم", "error"); }
  };

  const fetchSimSquad = async () => {
    if (!simTeamId) return notify("أدخل رقم الفريق للموسم الجديد", "warn");
    setSimLoading(true);
    try {
      const boot = await fetch(`${WORKER_URL}/api/bootstrap`).then(r => r.json());
      setAllPlayers(boot.elements);
      const team = await fetch(`${WORKER_URL}/api/team-picks/${simTeamId}`).then(r => r.json());
      let loadedSquad = { 1: [], 2: [], 3: [], 4: [] };
      team.picks.forEach((pick) => { const pInfo = boot.elements.find(p => p.id === pick.element); loadedSquad[pInfo.element_type].push({ ...pInfo, now_cost: pInfo.now_cost }); });
      setSimSquad(loadedSquad); setSimBank(0.0); setActiveChip(null); setSimLoading(false);
      notify("تم استيراد فريقك بنجاح، ابدأ التخطيط 🛠️", "success");
    } catch (e) { setSimLoading(false); notify("خطأ في جلب الفريق، تأكد من الرقم", "error"); }
  };

  const sellPlayer = (player) => { let newSquad = { ...simSquad }; newSquad[player.element_type] = newSquad[player.element_type].filter(p => p.id !== player.id); setSimSquad(newSquad); setSimBank(prev => prev + (player.now_cost / 10)); notify(`تم بيع ${player.web_name}`, "info"); };
  const buyPlayer = (player) => {
    const limits = { 1: 2, 2: 5, 3: 5, 4: 3 };
    if (simSquad[player.element_type].length >= limits[player.element_type]) return notify("المركز ممتلئ!", "warn");
    if (simBank < (player.now_cost / 10)) return notify("الميزانية لا تكفي!", "warn");
    let teamCount = 0; Object.values(simSquad).flat().forEach(p => { if (p.team === player.team) teamCount++; });
    if (teamCount >= 3) return notify("الحد الأقصى 3 لاعبين من نفس النادي!", "warn");
    let newSquad = { ...simSquad }; newSquad[player.element_type].push(player); setSimSquad(newSquad); setSimBank(prev => prev - (player.now_cost / 10));
    notify(`تم ضم ${player.web_name} 🟢`, "success");
  };
  const activateWildcard = () => {
    if(window.confirm("سيتم تفعيل الـ Wildcard وإفراغ تشكيلتك. هل أنت متأكد؟")) {
      setActiveChip('WC'); let refund = 0; Object.values(simSquad).flat().forEach(p => refund += (p.now_cost / 10));
      setSimBank(prev => prev + refund); setSimSquad({ 1: [], 2: [], 3: [], 4: [] });
      notify("تم تفعيل الـ Wildcard، فريقك فارغ وجاهز لإعادة البناء ✨", "info");
    }
  };
  const getFilteredMarket = () => { let filtered = allPlayers; if (marketFilters.search) filtered = filtered.filter(p => p.web_name.toLowerCase().includes(marketFilters.search.toLowerCase())); if (marketFilters.position > 0) filtered = filtered.filter(p => p.element_type === marketFilters.position); const currentIds = Object.values(simSquad).flat().map(p => p.id); filtered = filtered.filter(p => !currentIds.includes(p.id)); filtered.sort((a, b) => b[marketFilters.sort] - a[marketFilters.sort]); return filtered.slice(0, 50); };

  const totalSimSpend = Object.values(simSquad).flat().reduce((s, p) => s + (p.now_cost / 10), 0);
  const squadCount = Object.values(simSquad).flat().length;

  const PlayerShirt = ({ p, isGkp, onSell }) => {
    if (!p) return <div className="w-16 h-20 md:w-20 md:h-24 bg-white/20 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center text-white/50 text-xs text-center backdrop-blur-sm shadow-inner relative z-20 hover:bg-white/30 transition-colors duration-300">فارغ</div>;
    const shirtUrl = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.teamCode || p.team_code}${isGkp ? '_1' : ''}-66.webp`;
    return (
      <div className="flex flex-col items-center justify-center relative w-16 md:w-20 group transform transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:-rotate-3 cursor-pointer z-20">
        {onSell && <button onClick={() => onSell(p)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 z-30 flex items-center justify-center font-black text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 active:scale-90">X</button>}
        <div className="relative drop-shadow-xl group-hover:drop-shadow-2xl transition-all duration-300">
           <img src={shirtUrl} alt={p.name || p.web_name} className="w-12 h-16 md:w-16 md:h-20" loading="lazy" />
           {p.isCap && <div className="absolute -top-2 -right-2 bg-black text-white text-[10px] md:text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-pulse shadow-[0_0_10px_white]">C</div>}
           {p.isVice && <div className="absolute -top-2 -right-2 bg-gray-300 text-black text-[10px] md:text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">V</div>}
        </div>
        <div className="bg-fpl-purple text-white text-[10px] md:text-xs font-bold px-1 py-1 rounded w-full text-center truncate mt-1 shadow-md group-hover:bg-purple-900 transition-colors duration-300">{p.name || p.web_name}</div>
        <div className="bg-white text-fpl-purple font-black text-[10px] md:text-sm px-1 rounded-b w-full text-center shadow-md group-hover:bg-gray-100 transition-colors duration-300">{p.points !== undefined && p.points > 0 ? p.points : `£${(p.now_cost/10).toFixed(1)}`}</div>
      </div>
    );
  };

  const PitchWatermarks = () => (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <img src={`${BASE_URL}logo.png`} className="absolute top-2 left-2 md:top-10 md:left-10 w-16 h-16 md:w-48 md:h-48 object-contain opacity-[0.12] md:opacity-20 animate-float" alt="" />
      <img src={`${BASE_URL}logo.png`} className="absolute top-2 right-2 md:top-10 md:right-10 w-16 h-16 md:w-48 md:h-48 object-contain opacity-[0.12] md:opacity-20 animate-float" style={{ animationDelay: '1s' }} alt="" />
      <img src={`${BASE_URL}logo.png`} className="absolute bottom-16 left-2 md:bottom-20 md:left-10 w-16 h-16 md:w-48 md:h-48 object-contain opacity-[0.12] md:opacity-20 animate-float" style={{ animationDelay: '2s' }} alt="" />
      <img src={`${BASE_URL}logo.png`} className="absolute bottom-16 right-2 md:bottom-20 md:right-10 w-16 h-16 md:w-48 md:h-48 object-contain opacity-[0.12] md:opacity-20 animate-float" style={{ animationDelay: '3s' }} alt="" />
    </div>
  );

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-tajawal selection:bg-fpl-green selection:text-fpl-purple overflow-x-hidden relative transition-colors duration-500`}>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <BackToTop show={scrolled} />

      {/* 🤖 شات بوت الأسئلة الشائعة السريع */}
      <div className="fixed bottom-6 left-6 z-[95] flex flex-col items-start gap-3">
        {faqTeaser && !faqOpen && (
          <div className="bg-white rounded-2xl rounded-bl-sm shadow-2xl border border-gray-100 p-4 max-w-[220px] animate-fade-in relative">
            <button onClick={() => setFaqTeaser(false)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs hover:bg-gray-300"><i className="fa-solid fa-xmark"></i></button>
            <p className="text-sm font-bold text-gray-700">👋 عندك سؤال عن الفانتسي؟ أنا هنا لمساعدتك بسرعة!</p>
            <button onClick={() => { setFaqOpen(true); setFaqTeaser(false); }} className="mt-2 text-fpl-purple text-sm font-black underline underline-offset-2">اسأل الآن</button>
          </div>
        )}

        {faqOpen && (
          <div className="bg-white w-[92vw] max-w-sm h-[500px] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-toast-in">
            <div className="bg-fpl-purple text-white p-4 flex items-center justify-between shadow-md flex-none">
              <span className="font-black text-lg flex items-center gap-2"><i className="fa-solid fa-headset text-fpl-green"></i> مساعدة سريعة</span>
              <button onClick={() => setFaqOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50">
              {faqMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none' : 'bg-fpl-purple text-white rounded-tr-none'}`}>{m.text}</div>
                </div>
              ))}
              {faqLoading && <div className="flex justify-end"><div className="bg-fpl-purple text-white p-3 rounded-2xl rounded-tr-none"><span className="loader border-white w-4 h-4"></span></div></div>}
              <div ref={faqEndRef}></div>
            </div>
            <div className="p-3 bg-white border-t border-gray-100 flex-none">
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar mb-2">
                {FAQ_ITEMS.map((item, i) => (
                  <button key={i} onClick={() => askFaq(item)} className="flex-none text-xs font-bold bg-fpl-green/10 text-fpl-purple border border-fpl-green/30 px-3 py-1.5 rounded-full hover:bg-fpl-green/20 transition-colors whitespace-nowrap">{item.q}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="اكتب سؤالك..." className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-fpl-purple outline-none text-sm font-bold transition-colors" value={faqInput} onChange={e => setFaqInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendFaqFreeText()} />
                <button onClick={sendFaqFreeText} disabled={faqLoading || !faqInput.trim()} className="bg-fpl-green text-fpl-purple w-10 h-10 rounded-xl flex items-center justify-center shadow-md hover:bg-green-400 active:scale-90 transition-all disabled:opacity-50 flex-none"><i className="fa-solid fa-paper-plane"></i></button>
              </div>
            </div>
          </div>
        )}

        {!faqOpen && (
          <button onClick={() => { setFaqOpen(true); setFaqTeaser(false); }} className="w-16 h-16 rounded-full bg-fpl-purple text-fpl-green shadow-2xl flex items-center justify-center text-2xl hover:scale-110 hover:bg-purple-900 active:scale-95 transition-all duration-300 border-2 border-fpl-green/40 relative">
            <i className="fa-solid fa-comment-dots"></i>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
          </button>
        )}
      </div>

      <header className={`bg-fpl-purple shadow-2xl w-full text-center relative z-40 transition-all duration-700 ease-in-out ${activeTab === 'home' ? 'pt-28 pb-12 md:pt-32 md:pb-16' : 'py-6 md:py-8'}`}>

        <div className="absolute top-4 left-0 right-0 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center z-50 pointer-events-none gap-4">
          <div className="pointer-events-auto relative w-full max-w-[250px] md:max-w-[300px]" ref={searchRef}>
            <div className="relative group w-full">
              <input type="text" placeholder="ابحث عن خدمة..." className="w-full bg-white/10 text-white placeholder-white/60 border border-white/20 px-5 py-2.5 rounded-full outline-none focus:bg-white focus:text-fpl-purple transition-all duration-300 shadow-md font-bold text-center md:text-right"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                onKeyDown={handleSearchKeyDown} />
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-white/60 group-focus-within:text-fpl-purple transition-colors"></i>
            </div>
            {showSearch && searchQuery && (
              <div className="absolute top-full mt-2 left-0 right-0 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-fade-in z-50">
                {filteredServices.length > 0 ? filteredServices.map((service, idx) => (
                  <button key={service.id} onClick={() => { setActiveTab(service.id); setShowSearch(false); setSearchQuery(''); }}
                    className={`px-5 py-3 text-right font-bold transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0 ${idx === searchHighlight ? 'bg-fpl-green/20 text-fpl-purple' : 'text-gray-800 hover:bg-fpl-green/10 hover:text-fpl-purple'}`}>
                    <i className={`fa-solid ${service.icon} text-fpl-green`}></i> {service.name}
                  </button>
                )) : <div className="p-4 text-gray-500 font-bold text-center">لا توجد نتائج</div>}
              </div>
            )}
          </div>

          <div className="pointer-events-auto flex justify-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} title="تبديل الوضع الليلي" className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-fpl-green hover:text-fpl-purple hover:scale-110 transition-all duration-300 shadow-md">
              <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
            </button>
            {socialLinks.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-fpl-green hover:text-fpl-purple hover:scale-110 transition-all duration-300 shadow-md"><i className={`${link.icon} text-lg md:text-xl`}></i></a>
            ))}
          </div>
        </div>

        <h1 onClick={() => setTitleColorIndex((prev) => (prev + 1) % titleColors.length)} className={`font-black ${titleColors[titleColorIndex]} flex items-center justify-center gap-3 md:gap-4 transition-all duration-700 ease-in-out cursor-pointer select-none hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${activeTab === 'home' ? 'text-3xl sm:text-4xl md:text-6xl flex-col md:flex-row mt-24 md:mt-0' : 'text-2xl sm:text-3xl md:text-4xl mt-24 md:mt-0'}`} title="اضغط لتغيير اللون!">
           <img src={`${BASE_URL}logo.png`} alt="Logo" className={`rounded-full shadow-2xl border-4 border-fpl-green object-cover hover:rotate-12 transition-all duration-700 ease-in-out ${activeTab === 'home' ? 'w-20 h-20 md:w-32 md:h-32' : 'w-12 h-12 md:w-16 md:h-16'}`} />
           <span className="leading-tight">HootaFPL<br className="md:hidden"/></span>
        </h1>

        <div className={`transition-all duration-700 ease-in-out overflow-hidden ${activeTab === 'home' ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0'}`}>
          <p className="text-gray-300 max-w-4xl mx-auto text-base md:text-xl leading-loose font-medium px-6 drop-shadow-md">مرحباً بك في <span className="text-fpl-green font-bold">HootaFPL</span>، منصتك الشاملة للسيطرة على الفانتسي! 🚀<br/>نقدم لك تحليلات دقيقة بالذكاء الاصطناعي لموسم 2026/2027، راداراً لاكتشاف الأسعار، ومحاكياً تفاعلياً لتخطط لموسمك باحترافية عالية.</p>
        </div>
      </header>

      <main className="flex-grow w-full px-2 lg:px-8 xl:px-12 mt-8 pb-12 relative z-10">
        <div className="flex gap-3 mb-8 bg-white p-3 rounded-2xl shadow-lg border border-gray-100 overflow-x-auto custom-scrollbar whitespace-nowrap w-full">
          {siteServices.filter(s => !['about','privacy','contact'].includes(s.id)).map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if(tab.action) tab.action(); }}
              className={`flex-none min-w-[150px] py-4 px-4 rounded-xl text-sm sm:text-md lg:text-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95
                ${activeTab === tab.id ? 'bg-fpl-purple text-white shadow-lg translate-y-[-2px]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-fpl-purple hover:-translate-y-1 hover:shadow-md'}`}>
              <i className={`fa-solid ${tab.icon} transition-transform duration-300 ${activeTab === tab.id ? 'text-fpl-green scale-110' : 'text-gray-400 group-hover:scale-110'}`}></i> {tab.name}
            </button>
          ))}
        </div>

        <div key={activeTab} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 md:p-8 min-h-[600px] w-full relative transition-all duration-500 hover:shadow-2xl animate-tab-in">

          {/* 1. الصفحة الرئيسية */}
          {activeTab === 'home' && (
            <div className="animate-fade-in w-full">

              <div className="bg-gradient-to-r from-fpl-purple via-purple-900 to-fpl-purple text-white p-6 md:p-8 rounded-3xl shadow-xl mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                   <span className="bg-fpl-green/10 text-fpl-green border border-fpl-green text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider mb-3 flex items-center gap-2 w-max shadow">
                     <span className="w-2 h-2 bg-fpl-green rounded-full animate-ping"></span> انطلاق الموسم 2026/2027 ⚡
                   </span>
                   <h2 className="text-3xl md:text-5xl font-black">حالة الجولة الأولى (GW1)</h2>
                </div>
              </div>

              {homeData.deadline && (
                 <div className="bg-white border-2 border-fpl-purple/20 p-8 rounded-3xl shadow-2xl mb-10 text-center relative overflow-hidden group hover:border-fpl-purple transition-colors">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-fpl-green via-fpl-purple to-blue-500 animate-pulse"></div>
                    <h3 className="text-2xl font-black text-gray-600 mb-6 flex items-center justify-center gap-3">
                       <i className="fa-solid fa-stopwatch text-3xl text-fpl-purple animate-bounce"></i> العد التنازلي للموعد النهائي (Deadline)
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8 dir-ltr">
                       <div className="flex flex-col items-center"><div className="w-20 h-24 md:w-28 md:h-32 bg-gray-100 text-fpl-purple font-black text-5xl md:text-7xl flex items-center justify-center rounded-2xl shadow-inner border border-gray-200">{timeLeft.d}</div><span className="text-gray-500 font-bold mt-2 text-lg">أيام</span></div>
                       <div className="text-4xl md:text-6xl text-gray-300 font-black mt-4 animate-pulse">:</div>
                       <div className="flex flex-col items-center"><div className="w-20 h-24 md:w-28 md:h-32 bg-gray-100 text-fpl-purple font-black text-5xl md:text-7xl flex items-center justify-center rounded-2xl shadow-inner border border-gray-200">{timeLeft.h.toString().padStart(2, '0')}</div><span className="text-gray-500 font-bold mt-2 text-lg">ساعات</span></div>
                       <div className="text-4xl md:text-6xl text-gray-300 font-black mt-4 animate-pulse">:</div>
                       <div className="flex flex-col items-center"><div className="w-20 h-24 md:w-28 md:h-32 bg-gray-100 text-fpl-purple font-black text-5xl md:text-7xl flex items-center justify-center rounded-2xl shadow-inner border border-gray-200">{timeLeft.m.toString().padStart(2, '0')}</div><span className="text-gray-500 font-bold mt-2 text-lg">دقائق</span></div>
                       <div className="text-4xl md:text-6xl text-gray-300 font-black mt-4 animate-pulse">:</div>
                       <div className="flex flex-col items-center"><div className="w-20 h-24 md:w-28 md:h-32 bg-fpl-purple text-fpl-green font-black text-5xl md:text-7xl flex items-center justify-center rounded-2xl shadow-lg border-2 border-fpl-green">{timeLeft.s.toString().padStart(2, '0')}</div><span className="text-fpl-purple font-black mt-2 text-lg">ثانية</span></div>
                    </div>
                 </div>
              )}

              {homeData.loading && !homeData.mostIn && !homeData.error ? (
                 <div className="space-y-8 animate-fade-in">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                     {[0,1,2,3].map(i => <SkeletonBox key={i} className="h-28" />)}
                   </div>
                   <div className="grid md:grid-cols-3 gap-6">
                     {[0,1,2].map(i => <SkeletonBox key={i} className="h-32" />)}
                   </div>
                   <SkeletonBox className="h-96" />
                   <p className="text-center font-bold text-gray-400"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i> جاري جلب الإحصائيات المباشرة...</p>
                 </div>
              ) : homeData.error && !homeData.mostIn ? (
                 <div className="text-center py-32 text-red-500 font-bold text-2xl">
                   <i className="fa-solid fa-triangle-exclamation text-5xl mb-4 block"></i>
                   تعذر جلب الإحصائيات مؤقتاً بسبب ضغط الخوادم.
                   <button onClick={() => fetchHomeData(true)} className="block mx-auto mt-6 bg-fpl-purple text-white text-lg px-8 py-3 rounded-xl hover:bg-purple-900 active:scale-95 transition-all shadow-lg"><i className="fa-solid fa-rotate-right mr-2"></i> إعادة المحاولة الآن</button>
                 </div>
              ) : (
                 <div className="space-y-12 animate-fade-in">

                    {homeData.templateTeam && homeData.templateTeam[1].length > 0 && (
                      <div className="bg-white border-2 border-gray-100 rounded-3xl p-6 md:p-8 shadow-xl">
                         <h3 className="text-2xl md:text-3xl font-black text-fpl-purple mb-6 flex items-center justify-center gap-3 border-b-2 border-gray-100 pb-4">
                            <i className="fa-solid fa-users-viewfinder text-fpl-green text-4xl"></i> تشكيلة الإجماع (Template Team)
                         </h3>
                         <p className="text-center text-gray-500 font-bold mb-8">التشكيلة المكونة من الـ 11 لاعباً الأكثر امتلاكاً في العالم حالياً.</p>

                         <div className="bg-green-600 py-10 px-2 rounded-3xl border-4 border-green-800 relative overflow-hidden shadow-inner max-w-4xl mx-auto" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(0,0,0,0.05) 10%, rgba(0,0,0,0.05) 20%)' }}>
                            <PitchWatermarks />
                            <div className="flex flex-col gap-10 relative z-10 w-full max-w-3xl mx-auto">
                              <div className="flex justify-center gap-4">{homeData.templateTeam[1]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={true} />)}</div>
                              <div className="flex justify-center gap-2 md:gap-4">{homeData.templateTeam[2]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={false} />)}</div>
                              <div className="flex justify-center gap-2 md:gap-4">{homeData.templateTeam[3]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={false} />)}</div>
                              <div className="flex justify-center gap-6">{homeData.templateTeam[4]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={false} />)}</div>
                            </div>
                         </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                       <div className="bg-fpl-purple text-white p-6 rounded-3xl shadow-lg hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group"><i className="fa-solid fa-right-left absolute -right-6 -top-6 text-[100px] opacity-10 group-hover:rotate-12 transition-transform duration-500"></i><div className="text-sm md:text-base font-bold text-gray-300 mb-2 relative z-10">إجمالي التغييرات</div><div className="text-2xl md:text-4xl font-black text-fpl-green relative z-10">{homeData.transfersMade?.toLocaleString()}</div></div>
                       <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-3xl shadow-lg hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group"><i className="fa-solid fa-wand-magic-sparkles absolute -right-6 -top-6 text-[100px] opacity-10 group-hover:rotate-12 transition-transform duration-500"></i><div className="text-sm md:text-base font-bold text-blue-200 mb-2 relative z-10">وايلد كارد (WC)</div><div className="text-2xl md:text-4xl font-black relative z-10">{homeData.chips.wc?.toLocaleString()}</div></div>
                       <div className="bg-gradient-to-br from-rose-600 to-rose-800 text-white p-6 rounded-3xl shadow-lg hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group"><i className="fa-solid fa-rotate absolute -right-6 -top-6 text-[100px] opacity-10 group-hover:rotate-12 transition-transform duration-500"></i><div className="text-sm md:text-base font-bold text-rose-200 mb-2 relative z-10">فري هيت (FH)</div><div className="text-2xl md:text-4xl font-black relative z-10">{homeData.chips.fh?.toLocaleString()}</div></div>
                       <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-6 rounded-3xl shadow-lg hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group"><i className="fa-solid fa-users absolute -right-6 -top-6 text-[100px] opacity-10 group-hover:rotate-12 transition-transform duration-500"></i><div className="text-sm md:text-base font-bold text-amber-200 mb-2 relative z-10">بنش بوست (BB)</div><div className="text-2xl md:text-4xl font-black relative z-10">{homeData.chips.bb?.toLocaleString()}</div></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                       <div className="bg-green-50 border border-green-200 p-6 rounded-3xl flex items-center justify-between shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                          <div className="z-10 w-full"><div className="text-sm font-bold text-green-800 bg-green-200 px-3 py-1 rounded-lg inline-block mb-3 shadow-sm">الأكثر شراءً 📈</div><div className="text-2xl font-black text-gray-800 mb-1">{homeData.mostIn?.web_name || '-'}</div><div className="text-sm font-bold text-gray-500 flex items-center gap-2">{homeData.mostIn?.team_code && <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${homeData.mostIn.team_code}-66.webp`} className="w-5 h-6" alt="shirt" />}{homeData.mostIn?.transfers_in_event > 0 ? `${homeData.mostIn.transfers_in_event.toLocaleString()} تبديل` : homeData.mostIn?.now_cost ? `£${(homeData.mostIn.now_cost/10).toFixed(1)}m` : '0.0m'}</div>
                          {homeData.mostIn?.selected_by_percent && <OwnershipBar percent={homeData.mostIn.selected_by_percent} colorClass="bg-green-500" />}
                          </div>
                          {homeData.mostIn && <img src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${homeData.mostIn.code}.png`} className="w-24 h-28 object-cover drop-shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" alt="player" onError={(e) => { e.target.onerror = null; e.target.src = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${homeData.mostIn.team_code}-66.webp`; }}/>}
                       </div>
                       <div className="bg-red-50 border border-red-200 p-6 rounded-3xl flex items-center justify-between shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                          <div className="z-10 w-full"><div className="text-sm font-bold text-red-800 bg-red-200 px-3 py-1 rounded-lg inline-block mb-3 shadow-sm">الأكثر مبيعاً 📉</div><div className="text-2xl font-black text-gray-800 mb-1">{homeData.mostOut?.web_name || '-'}</div><div className="text-sm font-bold text-gray-500 flex items-center gap-2">{homeData.mostOut?.team_code && <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${homeData.mostOut.team_code}-66.webp`} className="w-5 h-6" alt="shirt" />}{homeData.mostOut?.transfers_out_event > 0 ? `${homeData.mostOut.transfers_out_event.toLocaleString()} تبديل` : homeData.mostOut?.now_cost ? `£${(homeData.mostOut.now_cost/10).toFixed(1)}m` : '0.0m'}</div>
                          {homeData.mostOut?.selected_by_percent && <OwnershipBar percent={homeData.mostOut.selected_by_percent} colorClass="bg-red-500" />}
                          </div>
                          {homeData.mostOut && <img src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${homeData.mostOut.code}.png`} className="w-24 h-28 object-cover drop-shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" alt="player" onError={(e) => { e.target.onerror = null; e.target.src = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${homeData.mostOut.team_code}-66.webp`; }}/>}
                       </div>
                       <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-3xl flex items-center justify-between shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                          <div className="z-10 w-full"><div className="text-sm font-bold text-indigo-800 bg-indigo-200 px-3 py-1 rounded-lg inline-block mb-3 shadow-sm">الأعلى ملكية 👑</div><div className="text-2xl font-black text-gray-800 mb-1">{homeData.mostCap?.web_name || '-'}</div><div className="text-sm font-bold text-gray-500 flex items-center gap-2">{homeData.mostCap?.team_code && <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${homeData.mostCap.team_code}-66.webp`} className="w-5 h-6" alt="shirt" />}{homeData.mostCap?.selected_by_percent || '0'}% من المدربين</div>
                          {homeData.mostCap?.selected_by_percent && <OwnershipBar percent={homeData.mostCap.selected_by_percent} colorClass="bg-indigo-500" />}
                          </div>
                          {homeData.mostCap && <img src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${homeData.mostCap.code}.png`} className="w-24 h-28 object-cover drop-shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" alt="player" onError={(e) => { e.target.onerror = null; e.target.src = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${homeData.mostCap.team_code}-66.webp`; }}/>}
                       </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                       <div className="bg-white border border-gray-200 shadow-xl rounded-3xl p-6 md:p-8 hover:shadow-2xl transition-shadow duration-300">
                          <h3 className="text-2xl font-black text-green-600 mb-6 flex items-center gap-3 border-b-2 border-gray-100 pb-4"><i className="fa-solid fa-arrow-right-to-bracket text-3xl"></i> أعلى 10 صفقات شراء (IN)</h3>
                          <div className="space-y-4">
                             {homeData.top10In.length > 0 ? homeData.top10In.map((p, i) => (
                                <div key={p.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl hover:bg-green-50 transition-all duration-300 cursor-default group">
                                   <div className="flex items-center gap-4"><span className="font-black text-gray-400 w-6 text-xl">{i+1}</span><img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.team_code}-66.webp`} className="w-10 h-12 drop-shadow-sm group-hover:scale-110 transition-transform duration-300" alt="shirt"/><div><div className="font-bold text-gray-800 text-lg">{p.web_name}</div><div className="text-sm font-bold text-gray-500">£{(p.now_cost/10).toFixed(1)}m</div></div></div>
                                   <div className="font-black text-green-600 text-lg flex items-center gap-2"><i className="fa-solid fa-arrow-up text-sm"></i> {p.transfers_in_event > 0 ? p.transfers_in_event?.toLocaleString() : `${p.total_points} ن`}</div>
                                </div>
                             )) : <div className="text-center font-bold text-gray-400">جاري جلب البيانات...</div>}
                          </div>
                       </div>

                       <div className="bg-white border border-gray-200 shadow-xl rounded-3xl p-6 md:p-8 hover:shadow-2xl transition-shadow duration-300">
                          <h3 className="text-2xl font-black text-red-600 mb-6 flex items-center gap-3 border-b-2 border-gray-100 pb-4"><i className="fa-solid fa-arrow-right-from-bracket text-3xl"></i> أعلى 10 صفقات بيع (OUT)</h3>
                          <div className="space-y-4">
                             {homeData.top10Out.length > 0 ? homeData.top10Out.map((p, i) => (
                                <div key={p.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl hover:bg-red-50 hover:shadow-md transition-all duration-300 cursor-default group">
                                   <div className="flex items-center gap-4"><span className="font-black text-gray-400 w-6 text-xl">{i+1}</span><img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.team_code}-66.webp`} className="w-10 h-12 drop-shadow-sm group-hover:scale-110 transition-transform duration-300" alt="shirt"/><div><div className="font-bold text-gray-800 text-lg">{p.web_name}</div><div className="text-sm font-bold text-gray-500">£{(p.now_cost/10).toFixed(1)}m</div></div></div>
                                   <div className="font-black text-red-600 text-lg flex items-center gap-2"><i className="fa-solid fa-arrow-down text-sm"></i> {p.transfers_out_event > 0 ? p.transfers_out_event?.toLocaleString() : `${p.selected_by_percent}%`}</div>
                                </div>
                             )) : <div className="text-center font-bold text-gray-400">جاري جلب البيانات...</div>}
                          </div>
                       </div>
                    </div>

                    <div className="bg-gradient-to-br from-fpl-purple via-purple-900 to-fpl-purple rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden border border-purple-800">
                       <div className="flex justify-between items-center mb-8 relative z-10 flex-wrap gap-4">
                          <h3 className="text-3xl font-black text-fpl-green flex items-center gap-3"><i className="fa-solid fa-eye animate-pulse"></i> أخبار الكشافة المباشرة (The Scout)</h3>
                          <div className="flex gap-2">
                            {scoutNewsList.map((_, idx) => (
                              <button key={idx} onClick={() => setScoutNewsIndex(idx)} className={`w-4 h-4 rounded-full transition-all ${idx === newsIndex ? 'bg-fpl-green w-8' : 'bg-white/30'}`}></button>
                            ))}
                          </div>
                       </div>
                       <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl transition-all duration-500 relative z-10 animate-fade-in shadow-xl">
                          <span className={`${scoutNewsList[newsIndex].bg} text-xs font-black px-4 py-1.5 rounded-full inline-block mb-4 shadow text-white`}>{scoutNewsList[newsIndex].tag}</span>
                          <h4 className="text-2xl md:text-3xl font-black text-white mb-4 leading-snug">{scoutNewsList[newsIndex].title}</h4>
                          <p className="text-gray-200 text-lg md:text-xl leading-relaxed font-medium">{scoutNewsList[newsIndex].content}</p>
                       </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                       <div className="flex justify-between items-center mb-8 relative z-10 flex-wrap gap-4">
                          <h3 className="text-2xl md:text-3xl font-black text-fpl-purple flex items-center gap-3">
                            <i className="fa-solid fa-star text-yellow-400 animate-pulse"></i> نجوم للمراقبة (Top Players)
                          </h3>
                          {homeData.kingsOfGw.length > 0 && (
                              <div className="flex gap-2">
                                {homeData.kingsOfGw.map((_, idx) => (
                                  <button key={idx} onClick={() => setKingIndex(idx)} className={`h-3 rounded-full transition-all ${idx === kingIndex ? 'bg-fpl-green w-8' : 'bg-gray-300 w-3'}`}></button>
                                ))}
                              </div>
                          )}
                       </div>

                       {homeData.kingsOfGw.length > 0 ? (
                          <div className="bg-white p-6 md:p-8 rounded-3xl transition-all duration-500 relative z-10 animate-fade-in shadow-md border border-gray-100 flex flex-col items-center justify-center text-center">
                             <span className="bg-fpl-purple text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4 shadow">{homeData.kingsOfGw[kingIndex].gw}</span>
                             <div className="relative mb-4">
                               <img
                                  src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${homeData.kingsOfGw[kingIndex].playerInfo.code}.png`}
                                  className="w-32 h-36 object-cover drop-shadow-xl"
                                  alt="player"
                                  onError={(e) => { e.target.onerror = null; e.target.src = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${homeData.kingsOfGw[kingIndex].playerInfo.team_code}-66.webp`; }}
                               />
                               <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${homeData.kingsOfGw[kingIndex].playerInfo.team_code}-66.webp`} className="w-10 h-12 absolute -bottom-3 -right-3 drop-shadow-md" alt="shirt" />
                             </div>
                             <h4 className="text-3xl font-black text-gray-800 mb-2">{homeData.kingsOfGw[kingIndex].playerInfo.web_name}</h4>
                             <div className="text-fpl-purple font-black text-2xl bg-fpl-green/20 px-6 py-2 rounded-xl mt-2">{homeData.kingsOfGw[kingIndex].points}</div>
                          </div>
                       ) : <div className="text-gray-500 font-bold w-full text-center py-4">جاري التحميل...</div>}

                       <div className="mt-6 text-center text-sm font-bold text-gray-400 bg-gray-50 py-3 rounded-lg border border-gray-100">
                          <i className="fa-solid fa-crown text-yellow-400 mr-2"></i> يعرض هذا القسم أبرز خيارات التشكيلة لموسم 2026/2027 الجاري إطلاقها.
                       </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl">
                       <h3 className="text-3xl font-black text-fpl-purple mb-6 flex items-center justify-between border-b-2 border-gray-100 pb-4 flex-wrap gap-4">
                          <span className="flex items-center gap-3"><i className="fa-solid fa-trophy text-yellow-500 text-3xl"></i> جدول ترتيب أندية الدوري الإنجليزي 2026/2027</span>
                       </h3>
                       <div className="overflow-x-auto custom-scrollbar pb-4">
                          <table className="w-full text-center min-w-[750px] mb-6">
                             <thead className="bg-fpl-purple text-white text-lg">
                                <tr>
                                   <th className="p-4 rounded-r-2xl">#</th><th className="p-4 text-right">النادي</th><th className="p-4">لعب</th><th className="p-4">فاز</th><th className="p-4">تعادل</th><th className="p-4">خسر</th><th className="p-4">الفارق (+/-)</th><th className="p-4 rounded-l-2xl">النقاط</th>
                                </tr>
                             </thead>
                             <tbody className="bg-white font-bold text-lg">
                                {homeData.standings.map((team, index) => (
                                   <tr key={team.id || index} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                                      <td className="p-4"><span className="w-8 h-8 rounded-full inline-flex items-center justify-center font-black text-sm bg-gray-100 text-gray-700">{index + 1}</span></td>
                                      <td className="p-4 text-right flex items-center gap-4">{team.code && <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${team.code}-66.webp`} className="w-8 h-10 drop-shadow-sm" alt="shirt" />}<span className="font-black text-gray-800 text-xl">{team.name}</span></td>
                                      <td className="p-4 text-gray-600">0</td><td className="p-4 text-green-600">0</td><td className="p-4 text-gray-500">0</td><td className="p-4 text-red-500">0</td><td className="p-4 text-gray-700">0</td><td className="p-4 font-black text-2xl text-fpl-purple">0</td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>

                       {/* ℹ️ شرح تفاعلي لأعمدة الجدول */}
                       <div className="text-center">
                          <button onClick={() => setShowTableLegend(!showTableLegend)} className="inline-flex items-center gap-2 text-fpl-purple font-black bg-purple-50 hover:bg-purple-100 px-5 py-2.5 rounded-full transition-all duration-300 active:scale-95">
                             <i className={`fa-solid fa-circle-info transition-transform duration-300 ${showTableLegend ? 'rotate-180 text-fpl-green' : ''}`}></i>
                             {showTableLegend ? 'إخفاء شرح الجدول' : 'اضغط لمعرفة ماذا تعني أعمدة الجدول'}
                          </button>
                          {showTableLegend && (
                             <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in text-right">
                                {[
                                  { k: 'لعب', v: 'عدد المباريات التي خاضها النادي حتى الآن في الدوري.' },
                                  { k: 'فاز / تعادل / خسر', v: 'نتائج النادي التراكمية في كل مباراة لعبها.' },
                                  { k: 'الفارق (+/-)', v: 'الفرق بين الأهداف التي سجّلها الفريق والأهداف التي استقبلها.' },
                                  { k: 'النقاط', v: 'الفوز = 3 نقاط، التعادل = نقطة واحدة، الخسارة = صفر.' },
                                ].map((item, i) => (
                                  <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:border-fpl-green hover:shadow-md transition-all duration-300">
                                     <div className="font-black text-fpl-purple mb-1">{item.k}</div>
                                     <div className="text-sm text-gray-500 font-bold leading-relaxed">{item.v}</div>
                                  </div>
                                ))}
                             </div>
                          )}
                       </div>
                    </div>

                    {/* 🗞️ فقاعات أخبار الكشافة (The Scout) — تُحدَّث كل 12 ساعة */}
                    <div className="bg-gradient-to-br from-purple-50 via-white to-green-50 border border-purple-100 rounded-3xl p-6 md:p-8 shadow-xl">
                       <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                          <h3 className="text-2xl md:text-3xl font-black text-fpl-purple flex items-center gap-3">
                             <i className="fa-solid fa-newspaper text-fpl-green"></i> أخبار الكشافة (The Scout)
                          </h3>
                          <span className="text-xs md:text-sm font-bold text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm"><i className="fa-solid fa-clock-rotate-left mr-1"></i> تحديث تلقائي كل 12 ساعة</span>
                       </div>

                       {scoutBubbles.loading ? (
                          <div className="flex gap-4 overflow-x-auto pb-2">{[0,1,2].map(i => <SkeletonBox key={i} className="w-64 h-40 flex-none" />)}</div>
                       ) : (
                          <div className="flex gap-5 overflow-x-auto pb-3 custom-scrollbar snap-x snap-mandatory">
                             {scoutBubbles.items.map((item) => (
                                <button key={item.id} onClick={() => setScoutBubbles(prev => ({ ...prev, activeItem: item }))}
                                   className="group flex-none w-64 md:w-72 bg-white rounded-3xl border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden text-right snap-start">
                                   <div className="h-32 w-full overflow-hidden relative">
                                      <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.target.onerror = null; e.target.src = `${BASE_URL}logo.png`; }} />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                      <span className="absolute bottom-2 right-3 text-white text-xs font-bold">{new Date(item.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                                   </div>
                                   <div className="p-4">
                                      <div className="font-black text-gray-800 text-md leading-snug line-clamp-2 group-hover:text-fpl-purple transition-colors">{item.title}</div>
                                      <div className="mt-2 text-fpl-purple text-xs font-bold flex items-center gap-1"><i className="fa-solid fa-circle-info"></i> اضغط للتفاصيل</div>
                                   </div>
                                </button>
                             ))}
                          </div>
                       )}
                    </div>

                    {/* نافذة تفاصيل الخبر — تظهر فوق الصفحة دون الانتقال لأي مكان */}
                    {scoutBubbles.activeItem && (
                       <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-fade-in" onClick={() => setScoutBubbles(prev => ({ ...prev, activeItem: null }))}>
                          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-toast-in custom-scrollbar" onClick={e => e.stopPropagation()}>
                             <div className="relative h-52 w-full">
                                <img src={scoutBubbles.activeItem.image} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = `${BASE_URL}logo.png`; }} />
                                <button onClick={() => setScoutBubbles(prev => ({ ...prev, activeItem: null }))} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"><i className="fa-solid fa-xmark"></i></button>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                <div className="absolute bottom-4 right-5 left-5 text-white font-black text-xl md:text-2xl leading-snug">{scoutBubbles.activeItem.title}</div>
                             </div>
                             <div className="p-6 md:p-8 text-right">
                                <div className="text-xs font-bold text-gray-400 mb-4"><i className="fa-solid fa-calendar mr-1"></i> {new Date(scoutBubbles.activeItem.date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                <p className="text-lg text-gray-700 leading-loose font-medium whitespace-pre-line">{scoutBubbles.activeItem.content}</p>
                                {scoutBubbles.activeItem.link && <a href={scoutBubbles.activeItem.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-6 text-fpl-purple font-black hover:underline">المصدر الرسمي <i className="fa-solid fa-arrow-up-left-from-square"></i></a>}
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              )}
            </div>
          )}

          {/* 2. المساعد الذكي للتشكيلة */}
          {activeTab === 'pitch' && (
            <div className="w-full xl:w-3/4 mx-auto animate-fade-in">
              <h2 className="text-3xl font-bold text-fpl-purple mb-6 text-center hover:scale-105 transition-transform duration-300">أدخل رقم فريقك الجديد لموسم 2026/2027 ✨</h2>

              <div className="bg-blue-100 text-blue-800 text-center font-bold p-3 rounded-xl mb-6 shadow-sm mx-auto max-w-lg">
                ℹ️ هذه الأداة يمكن استخدامها من الجولة الثانية فصاعداً فقط
              </div>

              {!pitchData.analyzed && !pitchData.loading && (
                <div className="mb-8 max-w-2xl mx-auto bg-blue-50 border-r-4 border-blue-400 rounded-2xl p-5 md:p-6 text-gray-700 shadow-sm animate-fade-in transform hover:-translate-y-1 transition-transform duration-300">
                  <h4 className="font-bold text-blue-800 text-xl mb-3 flex items-center gap-2"><i className="fa-solid fa-circle-info animate-bounce"></i> كيف تحصل على رقم فريقك لموسم 2026/2027؟</h4>
                  <p className="text-base md:text-lg leading-relaxed font-medium">سجل دخولك في موقع الفانتسي الرسمي بعد إنشائك لتشيكلة الموسم الجديد، ثم ادخل لصفحة <strong>"Pick Team"</strong> أو <strong>"Points"</strong> ورابِط الصفحة في المتصفح سيحوي رقمك الجديد بين <span className="font-mono text-fpl-purple bg-blue-100 px-2 py-0.5 rounded text-sm mx-1">/entry/</span> و <span className="font-mono text-fpl-purple bg-blue-100 px-2 py-0.5 rounded text-sm mx-1">/history/</span>. هذا الرقم هو الـ Team ID الخاص بك! انسخه والصقه هنا.</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-4 mb-10 max-w-2xl mx-auto group">
                <input type="text" placeholder="رقم الفريق الجديد (Team ID)" className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-fpl-purple focus:ring-4 focus:ring-fpl-purple/20 text-xl bg-gray-50 text-center transition-all duration-300 outline-none" value={teamId} onChange={e => setTeamId(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPitchAndAnalyze()} />
                <button onClick={fetchPitchAndAnalyze} disabled={pitchData.loading} className="bg-fpl-green text-fpl-purple font-black px-10 py-4 rounded-xl text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-green-400/50 hover:-translate-y-1 active:scale-95 glow-on-hover transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0">
                  {pitchData.loading ? <span className="loader border-fpl-purple"></span> : <i className="fa-solid fa-wand-magic-sparkles hover:rotate-12 transition-transform duration-300"></i>} حلل تشكيلتي
                </button>
              </div>

              {pitchData.analyzed && (
                <div className="animate-fade-in mb-10 transform transition-all duration-500 hover:shadow-2xl rounded-3xl">
                  <div className="bg-fpl-purple text-white p-6 rounded-t-3xl flex justify-between items-center shadow-lg flex-wrap gap-4">
                    <h3 className="text-2xl md:text-3xl font-black flex items-center gap-2"><i className="fa-solid fa-shield-halved text-fpl-green animate-pulse"></i> {pitchData.name}</h3>
                    <div className="flex gap-3 text-sm md:text-base">
                      <span className="bg-white/10 px-4 py-2 rounded-xl font-bold">نقاط الجولة: <span className="text-fpl-green font-black">{pitchData.gwPoints}</span></span>
                      <span className="bg-white/10 px-4 py-2 rounded-xl font-bold">الإجمالي: <span className="text-fpl-green font-black">{pitchData.totalPoints}</span></span>
                    </div>
                  </div>
                  <div className="bg-green-600 py-10 px-2 rounded-b-3xl border-4 border-green-800 relative overflow-hidden shadow-inner" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(0,0,0,0.05) 10%, rgba(0,0,0,0.05) 20%)' }}>
                    <PitchWatermarks />
                    <div className="flex flex-col gap-10 relative z-10 w-full max-w-3xl mx-auto">
                      <div className="flex justify-center gap-4">{pitchData.starting[1]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={true} />)}</div>
                      <div className="flex justify-center gap-2 md:gap-4">{pitchData.starting[2]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={false} />)}</div>
                      <div className="flex justify-center gap-2 md:gap-4">{pitchData.starting[3]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={false} />)}</div>
                      <div className="flex justify-center gap-6">{pitchData.starting[4]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={false} />)}</div>
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-100 p-6 rounded-3xl border border-gray-200 shadow-inner hover:shadow-md transition-shadow duration-300"><h4 className="text-center font-bold text-gray-400 mb-4 text-xl"><i className="fa-solid fa-chair mr-2"></i> دكة البدلاء</h4><div className="flex justify-center gap-6">{pitchData.bench?.map(p => <PlayerShirt key={p.id} p={p} isGkp={p.type === 1} />)}</div></div>
                </div>
              )}

              {pitchData.analyzed && (
                <div className="mt-8 animate-fade-in">
                  {pitchData.aiLoading ? (
                    <div className="bg-purple-50 p-12 rounded-3xl border border-purple-100 text-center shadow-md"><i className="fa-solid fa-robot text-7xl text-fpl-purple mb-6 animate-bounce drop-shadow-lg"></i><h3 className="text-3xl font-black text-fpl-purple">{aiLoadingText}</h3></div>
                  ) : (
                    <div className="bg-white p-8 md:p-10 rounded-3xl border-r-[12px] border-fpl-green shadow-2xl text-2xl text-gray-700 leading-relaxed whitespace-pre-line relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                      <div className="absolute opacity-5 -top-10 -left-10 group-hover:scale-110 transition-transform duration-700"><i className="fa-solid fa-robot text-[250px]"></i></div>
                      <div className="font-black text-fpl-purple mb-8 flex items-center gap-3 text-4xl relative z-10 border-b-2 border-gray-100 pb-4"><i className="fa-solid fa-file-contract text-fpl-green animate-pulse"></i> التقرير الفني للمدرب الذكي:</div>
                      <div className="relative z-10 font-medium text-gray-800 text-xl md:text-2xl leading-loose">{pitchData.aiText}</div>
                    </div>
                  )}
                </div>
              )}

              {/* 💬 مساعد الدردشة الذكي */}
              {pitchData.analyzed && (
                <div className="mt-10 bg-gray-50 border-2 border-gray-200 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[500px] animate-fade-in">
                  <div className="bg-fpl-purple text-white p-5 font-black text-xl flex items-center gap-3 shadow-md"><i className="fa-solid fa-comments text-fpl-green"></i> اسأل مساعد HootaFPL</div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl font-medium text-lg leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none' : 'bg-fpl-purple text-white rounded-tr-none'}`}>{m.text}</div>
                      </div>
                    ))}
                    {isChatLoading && <div className="flex justify-end"><div className="bg-fpl-purple text-white p-4 rounded-2xl rounded-tr-none"><span className="loader border-white w-5 h-5"></span></div></div>}
                    <div ref={chatEndRef}></div>
                  </div>
                  <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
                    <input ref={chatInputRef} type="text" placeholder="اكتب سؤالك هنا..." className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-fpl-purple outline-none font-bold transition-colors" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={handleChatKeyDown} />
                    <button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()} className="bg-fpl-green text-fpl-purple w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-md hover:bg-green-400 active:scale-90 transition-all disabled:opacity-50"><i className="fa-solid fa-paper-plane"></i></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. رادار الأسعار */}
          {activeTab === 'radar' && (
            <div className="animate-fade-in w-full">
              <h2 className="text-3xl font-bold text-fpl-purple mb-6 text-center hover:scale-105 transition-transform duration-300">رادار اللاعبين ونسب الملكية 🎯</h2>

              <div className="bg-yellow-100 text-yellow-800 text-center font-bold p-3 rounded-xl mb-6 shadow-sm mx-auto max-w-lg">
                ⚠️ الأسعار لا تتغير قبل الجولة الأولى
              </div>

              {!radarData.risers.length && !radarData.loading && (
                <div className="text-center mb-8">
                  <button onClick={fetchRadar} className="bg-fpl-purple text-white font-black px-10 py-4 rounded-xl text-xl shadow-lg hover:bg-purple-900 active:scale-95 transition-all"><i className="fa-solid fa-crosshairs mr-2"></i> تشغيل الرادار</button>
                </div>
              )}

              {radarData.loading ? (
                <div className="grid lg:grid-cols-2 gap-8">
                  {[0,1].map(c => (
                    <div key={c} className="space-y-4">{[...Array(5)].map((_, i) => <SkeletonBox key={i} className="h-20" />)}</div>
                  ))}
                </div>
              ) : radarData.risers.length > 0 && (
                <div className="animate-fade-in">
                  <div className="grid lg:grid-cols-2 gap-8 w-full mb-10">
                    <div className="bg-gradient-to-br from-green-50 to-white p-6 md:p-8 rounded-3xl border border-green-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <h3 className="text-2xl font-black text-green-800 mb-6 border-b-2 border-green-200 pb-4 flex items-center gap-3"><i className="fa-solid fa-arrow-trend-up text-3xl animate-bounce"></i> الأكثر اختياراً في التشكيلات</h3>
                      <div className="space-y-4">
                        {radarData.risers.map((p, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-green-300 transition-all duration-300 cursor-default border border-green-50 group">
                            <div className="flex items-center gap-4">
                              <img src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.code}.png`} className="w-12 h-14 object-cover drop-shadow-sm group-hover:scale-110 transition-transform" alt="player" onError={(e) => { e.target.onerror = null; e.target.src = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.team_code}-66.webp`; }} />
                              <div><div className="text-xl font-bold text-gray-800">{p.web_name}</div><div className="text-sm font-bold text-gray-400">£{(p.now_cost/10).toFixed(1)}m</div></div>
                            </div>
                            <span className="text-lg font-black text-green-600 bg-green-100 px-3 py-1.5 rounded-xl shadow-inner">{p.selected_by_percent}% ملكية</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-white p-6 md:p-8 rounded-3xl border border-red-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <h3 className="text-2xl font-black text-red-800 mb-6 border-b-2 border-red-200 pb-4 flex items-center gap-3"><i className="fa-solid fa-arrow-trend-down text-3xl animate-pulse"></i> خيارات التفاضل (Low Owned)</h3>
                      <div className="space-y-4">
                        {radarData.fallers.map((p, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-red-300 transition-all duration-300 cursor-default border border-red-50 group">
                            <div className="flex items-center gap-4">
                              <img src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.code}.png`} className="w-12 h-14 object-cover drop-shadow-sm group-hover:scale-110 transition-transform" alt="player" onError={(e) => { e.target.onerror = null; e.target.src = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.team_code}-66.webp`; }} />
                              <div><div className="text-xl font-bold text-gray-800">{p.web_name}</div><div className="text-sm font-bold text-gray-400">£{(p.now_cost/10).toFixed(1)}m</div></div>
                            </div>
                            <span className="text-lg font-black text-red-600 bg-red-100 px-3 py-1.5 rounded-xl shadow-inner">{p.selected_by_percent}% ملكية</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border-r-4 border-blue-500 p-6 rounded-2xl text-gray-700 shadow-sm animate-fade-in">
                     <h4 className="font-black text-blue-900 text-xl mb-3 flex items-center gap-2"><i className="fa-solid fa-circle-question"></i> كيف تعمل تغيرات الأسعار؟</h4>
                     <p className="text-lg leading-relaxed font-medium">في لعبة الفانتسي، ترتفع وتنخفض أسعار اللاعبين بناءً على خوارزمية معقدة تعتمد بشكل أساسي على حجم عمليات الشراء والبيع (Transfers) من قبل المدربين خلال الجولة.<br/>الرادار في الأعلى يراقب نبض السوق اللحظي؛ إذا رأيت لاعباً تمتلكه في قائمة "المتوقع هبوطهم"، فكّر جدياً ببيعه قبل أن تفقد قيمته المالية (Value).</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. جدول المباريات الحي */}
          {activeTab === 'fixtures' && (
            <div className="animate-fade-in w-full">
              <h2 className="text-3xl font-bold text-fpl-purple mb-2 text-center hover:scale-105 transition-transform duration-300">جدول مباريات الجولة 📅</h2>
              <p className="text-center text-gray-400 font-bold mb-8 text-sm md:text-base"><i className="fa-solid fa-tower-broadcast text-red-500 animate-pulse mr-1"></i> يتحدّث تلقائياً كل 45 ثانية، وينتقل للجولة القادمة بمفرده فور انتهاء الجولة الحالية</p>

              {fixturesFull.loading && !fixturesFull.matches.length ? (
                <div className="space-y-4 max-w-3xl mx-auto">{[...Array(5)].map((_, i) => <SkeletonBox key={i} className="h-20" />)}</div>
              ) : fixturesFull.error && !fixturesFull.matches.length ? (
                <div className="text-center py-20 text-red-500 font-bold text-xl">
                  <i className="fa-solid fa-triangle-exclamation text-4xl mb-3 block"></i> تعذر جلب جدول المباريات حالياً.
                  <button onClick={() => fetchFixturesFull(fixturesGwOverride)} className="block mx-auto mt-5 bg-fpl-purple text-white px-6 py-2.5 rounded-xl hover:bg-purple-900 transition-all"><i className="fa-solid fa-rotate-right mr-2"></i> إعادة المحاولة</button>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  {/* رأس الجولة مع التنقل */}
                  <div className="bg-gradient-to-r from-fpl-purple via-purple-900 to-fpl-purple text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 flex items-center justify-between gap-4">
                    <button onClick={() => setFixturesGwOverride(prev => (prev || fixturesFull.gw) - 1)} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-90 flex-none"><i className="fa-solid fa-chevron-right"></i></button>
                    <div className="text-center">
                      <div className="text-fpl-green font-black text-2xl md:text-3xl flex items-center justify-center gap-2">
                        الجولة {fixturesFull.gw}
                        {fixturesFull.isAuto && <span className="text-[10px] bg-fpl-green text-fpl-purple px-2 py-0.5 rounded-full font-black">مباشر تلقائي</span>}
                      </div>
                      {fixturesFull.gwStart && fixturesFull.gwEnd && (
                        <div className="text-gray-300 text-xs md:text-sm font-bold mt-1">
                          {fixturesFull.gwStart.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} ← {fixturesFull.gwEnd.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                        </div>
                      )}
                      {!fixturesFull.isAuto && (
                        <button onClick={() => setFixturesGwOverride(null)} className="text-[11px] text-fpl-green underline underline-offset-2 mt-1.5 font-bold">العودة للجولة الحالية</button>
                      )}
                    </div>
                    <button onClick={() => setFixturesGwOverride(prev => (prev || fixturesFull.gw) + 1)} className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-90 flex-none"><i className="fa-solid fa-chevron-left"></i></button>
                  </div>

                  {/* قائمة المباريات */}
                  <div className="space-y-4">
                    {fixturesFull.matches.length === 0 ? (
                      <div className="text-center text-gray-400 font-bold py-16"><i className="fa-solid fa-calendar-xmark text-4xl mb-3 block"></i> لا توجد مباريات مجدولة لهذه الجولة بعد</div>
                    ) : fixturesFull.matches.map(m => {
                      const { day, time } = fmtMatchTime(m.kickoff);
                      const isLive = m.started && !m.finished;
                      return (
                        <div key={m.id} className={`bg-white rounded-2xl border-2 p-5 shadow-md hover:shadow-xl transition-all duration-300 ${isLive ? 'border-red-400 shadow-red-100' : 'border-gray-100 hover:border-fpl-purple/30'}`}>
                          <div className="text-center text-xs font-bold text-gray-400 mb-3">{day}</div>
                          <div className="grid grid-cols-3 items-center gap-2">
                            <div className="flex items-center justify-end gap-3">
                              <span className="font-black text-gray-800 text-sm md:text-lg truncate">{m.home?.name}</span>
                              {m.home?.code && <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${m.home.code}-66.webp`} className="w-8 h-10 md:w-10 md:h-12 drop-shadow-sm flex-none" alt="" />}
                            </div>
                            <div className="flex flex-col items-center justify-center">
                              {m.started ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl md:text-3xl font-black text-fpl-purple">{m.homeScore ?? 0} - {m.awayScore ?? 0}</span>
                                </div>
                              ) : (
                                <span className="text-lg md:text-xl font-black text-gray-700 bg-gray-50 px-4 py-1.5 rounded-xl border border-gray-100">{time}</span>
                              )}
                              {isLive && <span className="mt-1 text-[10px] md:text-xs font-black text-red-500 flex items-center gap-1 animate-pulse"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> مباشر · {m.minutes}'</span>}
                              {m.finished && <span className="mt-1 text-[10px] md:text-xs font-black text-gray-400">انتهت المباراة</span>}
                            </div>
                            <div className="flex items-center justify-start gap-3">
                              {m.away?.code && <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${m.away.code}-66.webp`} className="w-8 h-10 md:w-10 md:h-12 drop-shadow-sm flex-none" alt="" />}
                              <span className="font-black text-gray-800 text-sm md:text-lg truncate">{m.away?.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. الدوريات */}
          {activeTab === 'league' && (
            <div className="animate-fade-in w-full max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-fpl-purple mb-6 text-center hover:scale-105 transition-transform duration-300">تقارير الدوريات المصغرة 🏆</h2>

              <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
                <input type="text" placeholder="أدخل رقم الدوري (League ID)" className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-fpl-purple focus:ring-4 focus:ring-fpl-purple/20 text-xl bg-gray-50 text-center transition-all duration-300 outline-none" value={leagueId} onChange={e => setLeagueId(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchLeague()} />
                <button onClick={fetchLeague} disabled={leagueData.loading} className="bg-fpl-purple text-white font-black px-10 py-4 rounded-xl text-xl flex items-center justify-center gap-3 shadow-lg hover:bg-purple-900 active:scale-95 transition-all duration-300 disabled:opacity-60">
                  {leagueData.loading ? <span className="loader border-white"></span> : <i className="fa-solid fa-trophy hover:rotate-12 transition-transform duration-300"></i>} استعرض
                </button>
              </div>

              {leagueData.loading && (
                <div className="space-y-3 max-w-3xl mx-auto">{[...Array(6)].map((_, i) => <SkeletonBox key={i} className="h-16" />)}</div>
              )}

              {leagueData.name && (
                <div className="mt-8 animate-fade-in">
                  <h3 className="text-4xl font-black text-fpl-purple mb-8 text-center bg-purple-50 py-6 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow duration-300">🏆 {leagueData.name}</h3>
                  <div className="table-container rounded-3xl shadow-xl border border-gray-200 overflow-x-auto mb-10 hover:-translate-y-1 transition-transform duration-300 custom-scrollbar">
                    <table className="w-full text-right min-w-[700px]">
                      <thead className="bg-fpl-purple text-white text-xl">
                        <tr><th className="p-6">#</th><th className="p-6">الفريق والمدرب</th><th className="p-6">نقاط الجولة</th><th className="p-6">الإجمالي</th></tr>
                      </thead>
                      <tbody className="bg-white">
                        {leagueData.standings.map((team, i) => (
                          <tr key={team.id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors duration-200">
                            <td className="p-6 w-24"><span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-black text-xl shadow-md transform hover:scale-110 transition-transform ${i===0?'bg-yellow-400 text-yellow-900':i===1?'bg-gray-300 text-gray-800':i===2?'bg-amber-600 text-white':'bg-gray-100 text-gray-600'}`}>{team.rank}</span></td>
                            <td className="p-6"><div className="font-black text-2xl text-fpl-purple mb-1">{team.entry_name}</div><div className="text-gray-500 font-bold text-lg">{team.player_name}</div></td>
                            <td className="p-6 text-3xl font-bold text-green-600">{team.event_total}</td>
                            <td className="p-6 text-3xl font-black text-fpl-purple">{team.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. المحاكي التفاعلي */}
          {activeTab === 'sim' && (
            <div className="animate-fade-in w-full">
              <h2 className="text-3xl font-bold text-fpl-purple mb-8 text-center hover:scale-105 transition-transform duration-300">سوق الانتقالات ومحاكي الخواص (Live Planner) 🛒</h2>
              {!allPlayers.length ? (
                <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
                  <input type="text" placeholder="أدخل رقم الفريق لتخطيط تبديلاته" className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-fpl-purple focus:ring-4 focus:ring-fpl-purple/20 text-xl bg-gray-50 text-center transition-all duration-300 outline-none" value={simTeamId} onChange={e => setSimTeamId(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchSimSquad()} />
                  <button onClick={fetchSimSquad} disabled={simLoading} className="bg-fpl-green text-fpl-purple font-black px-10 py-4 rounded-xl text-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-green-400/50 hover:-translate-y-1 active:scale-95 glow-on-hover transition-all duration-300 disabled:opacity-60">
                    {simLoading ? <span className="loader border-fpl-purple"></span> : <i className="fa-solid fa-download hover:-translate-y-1 transition-transform"></i>} استيراد وبدء التخطيط
                  </button>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-8 w-full">
                  <div className="w-full lg:w-3/5 xl:w-2/3">
                    <div className="bg-fpl-purple text-white p-6 rounded-t-3xl flex flex-wrap justify-between items-center shadow-2xl gap-4">
                      <button onClick={activateWildcard} className={`px-6 py-3 rounded-xl font-black text-lg transition-all duration-300 shadow-md active:scale-95 ${activeChip === 'WC' ? 'bg-fpl-green text-fpl-purple scale-105' : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:shadow-xl hover:-translate-y-1'}`}>
                        <i className={`fa-solid fa-wand-magic-sparkles mr-2 ${activeChip === 'WC' ? 'animate-spin' : ''}`}></i> تفعيل Wildcard
                      </button>
                      <div className="flex gap-3">
                        <div className="text-right bg-black/40 px-6 py-3 rounded-xl border border-white/10 hover:bg-black/60 transition-colors duration-300 cursor-default">
                          <div className="text-sm text-gray-300 font-bold mb-1">عدد اللاعبين:</div>
                          <div className="text-white font-black text-2xl">{squadCount}/15</div>
                        </div>
                        <div className="text-right bg-black/40 px-6 py-3 rounded-xl border border-white/10 hover:bg-black/60 transition-colors duration-300 cursor-default">
                          <div className="text-sm text-gray-300 font-bold mb-1">الرصيد الحر:</div>
                          <div className="text-fpl-green font-black text-3xl">£{simBank.toFixed(1)}m</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-600 py-10 px-2 rounded-b-3xl border-4 border-green-800 relative overflow-hidden shadow-inner" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(0,0,0,0.05) 10%, rgba(0,0,0,0.05) 20%)' }}>
                      <PitchWatermarks />
                      <div className="flex flex-col gap-10 relative z-10 w-full max-w-3xl mx-auto">
                        <div className="flex justify-center gap-6">{[0, 1].map(i => <PlayerShirt key={`gk-${i}`} p={simSquad[1][i]} isGkp={true} onSell={sellPlayer} />)}</div>
                        <div className="flex justify-center gap-2 md:gap-4">{[0, 1, 2, 3, 4].map(i => <PlayerShirt key={`def-${i}`} p={simSquad[2][i]} isGkp={false} onSell={sellPlayer} />)}</div>
                        <div className="flex justify-center gap-2 md:gap-4">{[0, 1, 2, 3, 4].map(i => <PlayerShirt key={`mid-${i}`} p={simSquad[3][i]} isGkp={false} onSell={sellPlayer} />)}</div>
                        <div className="flex justify-center gap-6">{[0, 1, 2].map(i => <PlayerShirt key={`fwd-${i}`} p={simSquad[4][i]} isGkp={false} onSell={sellPlayer} />)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-2/5 xl:w-1/3 bg-gray-50 border-2 border-gray-200 rounded-3xl flex flex-col h-[850px] overflow-hidden shadow-2xl hover:shadow-purple-900/10 transition-shadow duration-500">
                    <div className="bg-gray-800 text-white p-6 font-black text-2xl flex items-center gap-3 shadow-md z-10">
                      <i className="fa-solid fa-store text-fpl-green animate-pulse"></i> سوق اللاعبين
                    </div>
                    <div className="p-6 bg-white border-b border-gray-200 flex flex-col gap-4 shadow-sm z-10">
                      <input type="text" placeholder="ابحث بالاسم..." className="w-full p-4 border-2 rounded-xl bg-gray-50 focus:border-fpl-purple focus:ring-4 focus:ring-fpl-purple/20 transition-all duration-300 outline-none font-bold text-lg" value={marketFilters.search} onChange={e => setMarketFilters({...marketFilters, search: e.target.value})} />
                      <div className="flex gap-3">
                        <select className="flex-1 p-3 border-2 rounded-xl bg-gray-50 font-bold outline-none cursor-pointer focus:border-fpl-purple hover:bg-gray-100 transition-colors duration-300" value={marketFilters.position} onChange={e => setMarketFilters({...marketFilters, position: Number(e.target.value)})}>
                          <option value={0}>المراكز</option><option value={1}>حراس</option><option value={2}>دفاع</option><option value={3}>وسط</option><option value={4}>هجوم</option>
                        </select>
                        <select className="flex-1 p-3 border-2 rounded-xl bg-gray-50 font-bold outline-none cursor-pointer focus:border-fpl-purple hover:bg-gray-100 transition-colors duration-300" value={marketFilters.sort} onChange={e => setMarketFilters({...marketFilters, sort: e.target.value})}>
                          <option value="transfers_in_event">شراء</option><option value="now_cost">السعر</option><option value="total_points">النقاط</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 custom-scrollbar">
                      {getFilteredMarket().length === 0 ? (
                        <div className="text-center text-gray-400 font-bold py-10"><i className="fa-solid fa-magnifying-glass text-3xl mb-3 block"></i> لا يوجد لاعبون مطابقون</div>
                      ) : getFilteredMarket().map(p => (
                        <div key={p.id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-fpl-green hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
                          <div className="flex items-center gap-4">
                            <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.team_code}-66.webp`} className="w-10 h-12 drop-shadow-sm hover:scale-110 transition-transform duration-300" alt="shirt" />
                            <div>
                              <div className="font-black text-gray-800 text-lg mb-1">{p.web_name}</div>
                              <div className="text-sm text-gray-500 font-bold bg-gray-100 inline-block px-2 py-1 rounded shadow-inner"><i className="fa-solid fa-star text-yellow-500"></i> {p.total_points} ن</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-black text-fpl-purple text-xl">£{(p.now_cost/10).toFixed(1)}</span>
                            <button onClick={() => buyPlayer(p)} className="bg-fpl-green text-fpl-purple w-12 h-12 rounded-full flex items-center justify-center font-black hover:bg-green-400 hover:scale-110 active:scale-90 shadow-md text-2xl transition-all duration-300"><i className="fa-solid fa-plus"></i></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. حاسبة السالب */}
          {activeTab === 'hit' && (
             <div className="animate-fade-in max-w-4xl mx-auto">
               <h2 className="text-3xl font-bold text-fpl-purple mb-4 text-center hover:scale-105 transition-transform duration-300">حاسبة جدوى التبديلات (-4)</h2>
               <p className="text-xl text-gray-500 text-center mb-10">أدخل توقعاتك لترى هل التبديل الإضافي يستحق خصم النقاط أم لا.</p>
               <div className="bg-gray-50 p-10 rounded-3xl border border-gray-200 shadow-xl hover:shadow-2xl transition-shadow duration-500">
                  <div className="grid sm:grid-cols-2 gap-10 mb-10">
                    <div className="group">
                      <label className="block text-2xl font-bold text-gray-700 mb-4 text-center group-hover:text-red-600 transition-colors duration-300"><i className="fa-solid fa-arrow-right-from-bracket text-red-500 mr-2 group-hover:-translate-x-2 transition-transform duration-300"></i> نقاط اللاعب المُباع:</label>
                      <input type="number" className="w-full px-6 py-5 rounded-2xl border-2 border-gray-200 text-3xl font-black text-center bg-white focus:border-fpl-purple focus:ring-4 focus:ring-fpl-purple/20 outline-none transition-all duration-300 hover:shadow-md" value={hitCalc.pointsOut} onChange={e => setHitCalc({...hitCalc, pointsOut: Number(e.target.value)})} />
                    </div>
                    <div className="group">
                      <label className="block text-2xl font-bold text-gray-700 mb-4 text-center group-hover:text-green-600 transition-colors duration-300"><i className="fa-solid fa-arrow-right-to-bracket text-green-500 mr-2 group-hover:translate-x-2 transition-transform duration-300"></i> نقاط اللاعب الجديد:</label>
                      <input type="number" className="w-full px-6 py-5 rounded-2xl border-2 border-gray-200 text-3xl font-black text-center bg-white focus:border-fpl-purple focus:ring-4 focus:ring-fpl-purple/20 outline-none transition-all duration-300 hover:shadow-md" value={hitCalc.pointsIn} onChange={e => setHitCalc({...hitCalc, pointsIn: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className={`p-10 rounded-3xl text-center border-4 transition-all duration-500 transform hover:scale-105 ${((hitCalc.pointsIn - 4) - hitCalc.pointsOut) > 0 ? 'bg-gradient-to-b from-green-50 to-white border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.3)]' : 'bg-gradient-to-b from-red-50 to-white border-red-400 shadow-[0_0_30px_rgba(248,113,113,0.3)]'}`}>
                    <h3 className="text-3xl font-bold text-gray-600 mb-4">الصافي (بعد خصم 4 نقاط)</h3>
                    <div className={`text-8xl font-black mb-6 drop-shadow-md ${((hitCalc.pointsIn - 4) - hitCalc.pointsOut) > 0 ? 'text-green-600 animate-pulse' : 'text-red-600'}`}>
                      {((hitCalc.pointsIn - 4) - hitCalc.pointsOut) > 0 ? '+' : ''}{((hitCalc.pointsIn - 4) - hitCalc.pointsOut)}
                    </div>
                    <div className={`text-3xl font-bold ${((hitCalc.pointsIn - 4) - hitCalc.pointsOut) > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {((hitCalc.pointsIn - 4) - hitCalc.pointsOut) > 0 ? <><i className="fa-solid fa-check-circle mr-2"></i> تبديل ناجح رياضياً!</> : <><i className="fa-solid fa-circle-xmark mr-2"></i> تبديل فاشل رياضياً!</>}
                    </div>
                  </div>
               </div>
             </div>
          )}

          {/* 8. صفحة من نحن */}
          {activeTab === 'about' && (
            <div className="animate-fade-in w-full max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black text-fpl-purple mb-8 flex items-center justify-center gap-4"><i className="fa-solid fa-circle-info text-fpl-green"></i> من نحن؟</h2>
              <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl text-right space-y-6">
                <div className="flex justify-center mb-6"><img src={`${BASE_URL}logo.png`} alt="Logo" className="w-32 h-32 object-contain bg-fpl-purple p-2 rounded-full shadow-lg" /></div>
                <p className="text-xl leading-loose font-medium text-gray-700"><span className="text-2xl font-black text-fpl-purple">HootaFPL</span> هو منصتك العربية الشاملة والمصممة خصيصاً لعشاق لعبة الفانتسي بريميرليج (FPL). تم بناء هذا الموقع بشغف لتقديم أدوات متقدمة تفوق الخيال لموسم 2026/2027 تجمع بين دقة الإحصائيات وسحر الذكاء الاصطناعي.</p>
                <h3 className="text-2xl font-black text-fpl-purple mt-8 border-r-4 border-fpl-green pr-3">المطور</h3>
                <p className="text-xl leading-loose font-medium text-gray-700">تم تطوير هذا المشروع بالكامل بواسطة المهندس والمطور <span className="font-black text-fpl-purple">Abdalmahmoud Adil Alnoor</span>.</p>
              </div>
            </div>
          )}

          {/* 9. صفحة سياسة الخصوصية */}
          {activeTab === 'privacy' && (
            <div className="animate-fade-in w-full max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black text-fpl-purple mb-8 flex items-center justify-center gap-4"><i className="fa-solid fa-shield-halved text-fpl-green"></i> سياسة الخصوصية</h2>
              <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl text-right space-y-6">
                <h3 className="text-2xl font-black text-fpl-purple border-r-4 border-fpl-green pr-3">حماية بياناتك هي أولويتنا</h3>
                <p className="text-xl leading-loose font-medium text-gray-700">في HootaFPL، نحن نحترم خصوصيتك بالكامل. جميع البيانات تتم معالجتها بأعلى معايير الأمان والشفافية. نحن لا نقوم بتخزين أو تسجيل أرقام الفرق الخاصة بك في أي قواعد بيانات.</p>
              </div>
            </div>
          )}

          
        </div>
      </main>

      <footer className="w-full py-10 text-center mt-auto border-t border-gray-200 bg-white relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-8 border-b border-gray-100 pb-8">
           <button onClick={() => { setActiveTab('about'); window.scrollTo(0,0); }} className="text-gray-600 hover:text-fpl-purple font-black text-lg transition-colors flex items-center gap-2"><i className="fa-solid fa-circle-info"></i> من نحن</button>
           <button onClick={() => { setActiveTab('privacy'); window.scrollTo(0,0); }} className="text-gray-600 hover:text-fpl-purple font-black text-lg transition-colors flex items-center gap-2"><i className="fa-solid fa-shield-halved"></i> سياسة الخصوصية</button>
                   </div>
        <p className="text-gray-500 font-bold text-lg mb-3">© {new Date().getFullYear()} HootaFPL. All rights reserved</p>
        <p dir="ltr" className="text-gray-600 text-lg font-bold flex items-center justify-center gap-1 flex-wrap">
          Developed with <i className="fa-solid fa-heart text-red-500 mx-1 animate-pulse hover:scale-125 transition-transform cursor-pointer"></i> by
          <a href="https://abdoadil.github.io/" target="_blank" rel="noreferrer" className="text-gray-800 hover:text-fpl-purple transition-colors duration-300 hover:underline underline-offset-4 ml-1">Abdalmahmoud Adil Alnoor</a>
        </p>
        <div className="flex justify-center gap-5 mt-6">
          {socialLinks.map((link, idx) => (
            <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-fpl-purple hover:scale-125 transition-all duration-300 text-2xl"><i className={link.icon}></i></a>
          ))}
        </div>
      </footer>
    </div>
  )
}

export default App
