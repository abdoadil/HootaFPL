import { useState, useEffect } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('pitch'); 
  const WORKER_URL = 'https://fpl-proxy.sokar8893.workers.dev'; // ⚠️ تأكد من الرابط الخاص بك
  
  // ⚠️ الحصول على المسار الصحيح للمشروع لحل مشكلة الصور
  const BASE_URL = import.meta.env.BASE_URL;

  // --- States ---
  const [teamId, setTeamId] = useState('');
  const [leagueId, setLeagueId] = useState('');
  
  const [pitchData, setPitchData] = useState({ name: '', gwPoints: 0, totalPoints: 0, starting: {1:[], 2:[], 3:[], 4:[]}, bench: [], loading: false, aiLoading: false, analyzed: false, aiText: '' });
  const [radarData, setRadarData] = useState({ differentials: [], risers: [], loading: false });
  const [fixturesData, setFixturesData] = useState({ teams: [], loading: false });
  const [leagueData, setLeagueData] = useState({ name: '', standings: [], loading: false, stats: null });
  const [hitCalc, setHitCalc] = useState({ pointsOut: 0, pointsIn: 0 });

  // --- Simulator States ---
  const [simTeamId, setSimTeamId] = useState('');
  const [simSquad, setSimSquad] = useState({ 1: [], 2: [], 3: [], 4: [] });
  const [simBank, setSimBank] = useState(0.0);
  const [allPlayers, setAllPlayers] = useState([]);
  const [marketFilters, setMarketFilters] = useState({ search: '', position: 0, sort: 'transfers_in_event' });
  const [simLoading, setSimLoading] = useState(false);
  const [activeChip, setActiveChip] = useState(null);

  // نصوص التحميل التفاعلية
  const [aiLoadingText, setAiLoadingText] = useState('');
  useEffect(() => {
    let interval;
    if (pitchData.aiLoading) {
      const messages = ["يقرأ أفكار بيب جوارديولا...", "يحلل الكوارث الدفاعية لتشكيلتك...", "يحسب xG لمعرفة من خذلك...", "يُجهز لك وصفة سحرية للجولة القادمة..."];
      let step = 0;
      setAiLoadingText(messages[0]);
      interval = setInterval(() => { step = (step + 1) % messages.length; setAiLoadingText(messages[step]); }, 1800);
    }
    return () => clearInterval(interval);
  }, [pitchData.aiLoading]);

  // 1. المساعد الذكي
  const fetchPitchAndAnalyze = async () => {
    if (!teamId) return alert("أدخل رقم الفريق");
    setPitchData(prev => ({ ...prev, loading: true, aiLoading: false, analyzed: false, aiText: '' }));
    try {
      const boot = await fetch(`${WORKER_URL}/api/bootstrap`).then(r => r.json());
      const team = await fetch(`${WORKER_URL}/api/team-picks/${teamId}`).then(r => r.json());
      const live = await fetch(`${WORKER_URL}/api/live/${team.event}`).then(r => r.json());
      let starting = { 1: [], 2: [], 3: [], 4: [] }; let bench = []; let startingNames = []; let benchNames = [];
      team.picks.forEach((pick, index) => {
        const pInfo = boot.elements.find(p => p.id === pick.element);
        const lInfo = live.find(l => l.id === pick.element);
        let pts = lInfo ? lInfo.stats.total_points : 0;
        if(pick.is_captain) pts *= pick.multiplier;
        const obj = { id: pInfo.id, name: pInfo.web_name, teamCode: pInfo.team_code, type: pInfo.element_type, points: pts, isCap: pick.is_captain, isVice: pick.is_vice_captain };
        if (index < 11) { starting[pInfo.element_type].push(obj); startingNames.push(`${pInfo.web_name} (${pts}ن)`); } 
        else { bench.push(obj); benchNames.push(`${pInfo.web_name} (${pts}ن)`); }
      });
      setPitchData({ name: team.name, gwPoints: team.summary_event_points, totalPoints: team.summary_overall_points, starting, bench, loading: false, aiLoading: true, analyzed: true, aiText: '' });
      const prompt = `أنت مساعد فانتسي (FPL) مرح جداً، ساخر أحياناً ولكنك خبير عبقري. اسم فريق المستخدم: "${team.name}". نقاطه هذه الجولة: ${team.summary_event_points}. تشكيلته: ${startingNames.join("، ")}. دكته: ${benchNames.join("، ")}. قدم: 1. ردة فعلك 2. التشخيص 3. النصيحة الذهبية. بالعربية وبأسلوب ممتع!`;
      const ai = await fetch(`${WORKER_URL}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt }) }).then(r => r.json());
      setPitchData(prev => ({ ...prev, aiLoading: false, aiText: ai.ai_text }));
    } catch (e) { setPitchData(prev => ({ ...prev, loading: false, aiLoading: false, aiText: 'حدث خطأ. تأكد من الرقم والرابط.' })); }
  };

  // دوال أخرى (نفسها تماماً)
  const fetchRadar = async () => { setRadarData(prev => ({ ...prev, loading: true })); try { const boot = await fetch(`${WORKER_URL}/api/bootstrap`).then(r => r.json()); const diffs = boot.elements.filter(p => parseFloat(p.selected_by_percent) < 10 && p.status === 'a').sort((a, b) => b.form - a.form).slice(0, 8); const risers = boot.elements.sort((a, b) => b.transfers_in_event - a.transfers_in_event).slice(0, 8); setRadarData({ differentials: diffs, risers, loading: false }); } catch (e) { setRadarData(prev => ({ ...prev, loading: false })); } };
  const fetchFixtures = async () => { setFixturesData(prev => ({ ...prev, loading: true })); try { const boot = await fetch(`${WORKER_URL}/api/bootstrap`).then(r => r.json()); setFixturesData({ teams: boot.teams, loading: false }); } catch (e) { setFixturesData(prev => ({ ...prev, loading: false })); } };
  const fetchLeague = async () => { if (!leagueId) return alert("أدخل رقم الدوري"); setLeagueData(prev => ({ ...prev, loading: true })); try { const res = await fetch(`${WORKER_URL}/api/league/${leagueId}`).then(r => r.json()); const standings = res.standings.results.slice(0, 20); let highestGW = standings[0]; let lowestGW = standings[0]; standings.forEach(team => { if (team.event_total > highestGW.event_total) highestGW = team; if (team.event_total < lowestGW.event_total) lowestGW = team; }); const stats = { topScorerGW: highestGW, lowScorerGW: lowestGW, gap: standings[0].total - standings[1]?.total || 0 }; setLeagueData({ name: res.league.name, standings, stats, loading: false }); } catch (e) { setLeagueData(prev => ({ ...prev, loading: false })); } };
  const fetchSimSquad = async () => { if (!simTeamId) return alert("أدخل رقم الفريق"); setSimLoading(true); try { const boot = await fetch(`${WORKER_URL}/api/bootstrap`).then(r => r.json()); setAllPlayers(boot.elements); const team = await fetch(`${WORKER_URL}/api/team-picks/${simTeamId}`).then(r => r.json()); let loadedSquad = { 1: [], 2: [], 3: [], 4: [] }; team.picks.forEach((pick) => { const pInfo = boot.elements.find(p => p.id === pick.element); loadedSquad[pInfo.element_type].push({ ...pInfo, now_cost: pInfo.now_cost }); }); setSimSquad(loadedSquad); setSimBank(0.0); setActiveChip(null); setSimLoading(false); } catch (e) { setSimLoading(false); alert("خطأ في جلب الفريق"); } };
  const sellPlayer = (player) => { let newSquad = { ...simSquad }; newSquad[player.element_type] = newSquad[player.element_type].filter(p => p.id !== player.id); setSimSquad(newSquad); setSimBank(prev => prev + (player.now_cost / 10)); };
  const buyPlayer = (player) => { const limits = { 1: 2, 2: 5, 3: 5, 4: 3 }; if (simSquad[player.element_type].length >= limits[player.element_type]) return alert("المركز ممتلئ!"); if (simBank < (player.now_cost / 10)) return alert("الميزانية لا تكفي!"); let teamCount = 0; Object.values(simSquad).flat().forEach(p => { if (p.team === player.team) teamCount++; }); if (teamCount >= 3) return alert("الحد الأقصى 3 لاعبين من نفس النادي!"); let newSquad = { ...simSquad }; newSquad[player.element_type].push(player); setSimSquad(newSquad); setSimBank(prev => prev - (player.now_cost / 10)); };
  const activateWildcard = () => { if(window.confirm("سيتم تفعيل الـ Wildcard وإفراغ تشكيلتك. هل أنت متأكد؟")) { setActiveChip('WC'); let refund = 0; Object.values(simSquad).flat().forEach(p => refund += (p.now_cost / 10)); setSimBank(prev => prev + refund); setSimSquad({ 1: [], 2: [], 3: [], 4: [] }); } };
  const getFilteredMarket = () => { let filtered = allPlayers; if (marketFilters.search) filtered = filtered.filter(p => p.web_name.toLowerCase().includes(marketFilters.search.toLowerCase())); if (marketFilters.position > 0) filtered = filtered.filter(p => p.element_type === marketFilters.position); const currentIds = Object.values(simSquad).flat().map(p => p.id); filtered = filtered.filter(p => !currentIds.includes(p.id)); filtered.sort((a, b) => b[marketFilters.sort] - a[marketFilters.sort]); return filtered.slice(0, 50); };

  // UI Components
  const PlayerShirt = ({ p, isGkp, onSell }) => {
    if (!p) return <div className="w-16 h-20 md:w-20 md:h-24 bg-white/20 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center text-white/50 text-xs text-center backdrop-blur-sm shadow-inner relative z-20">مكان فارغ</div>;
    const shirtUrl = `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.teamCode || p.team_code}${isGkp ? '_1' : ''}-66.webp`;
    return (
      <div className="flex flex-col items-center justify-center relative w-16 md:w-20 group transform transition hover:scale-110 cursor-pointer z-20">
        {onSell && <button onClick={() => onSell(p)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-7 h-7 z-30 flex items-center justify-center font-black text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">X</button>}
        <div className="relative">
           <img src={shirtUrl} alt={p.name || p.web_name} className="w-12 h-16 md:w-16 md:h-20 drop-shadow-xl" />
           {p.isCap && <div className="absolute -top-2 -right-2 bg-black text-white text-[10px] md:text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">C</div>}
           {p.isVice && <div className="absolute -top-2 -right-2 bg-gray-300 text-black text-[10px] md:text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">V</div>}
        </div>
        <div className="bg-fpl-purple text-white text-[10px] md:text-xs font-bold px-1 py-1 rounded w-full text-center truncate mt-1 shadow-md">{p.name || p.web_name}</div>
        <div className="bg-white text-fpl-purple font-black text-[10px] md:text-sm px-1 rounded-b w-full text-center shadow-md">{p.points !== undefined ? p.points : `£${(p.now_cost/10).toFixed(1)}`}</div>
      </div>
    );
  };

  // المكون الجديد: نمط العلامة المائية للوجو في أطراف الملعب 
  const PitchWatermarks = () => (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* تم إزالة الفلاتر المعتمة ورفع الشفافية إلى 40% وتكبير الحجم جداً */}
      <img src={`${BASE_URL}logo.png`} className="absolute top-10 left-10 w-36 h-36 md:w-56 md:h-56 object-contain opacity-40" alt="" />
      <img src={`${BASE_URL}logo.png`} className="absolute top-10 right-10 w-36 h-36 md:w-56 md:h-56 object-contain opacity-40" alt="" />
      <img src={`${BASE_URL}logo.png`} className="absolute bottom-20 left-10 w-36 h-36 md:w-56 md:h-56 object-contain opacity-40" alt="" />
      <img src={`${BASE_URL}logo.png`} className="absolute bottom-20 right-10 w-36 h-36 md:w-56 md:h-56 object-contain opacity-40" alt="" />
    </div>
  );

  const navTabs = [
    { id: 'pitch', icon: 'fa-solid fa-robot', label: 'المساعد الذكي (الرئيسية)' },
    { id: 'radar', icon: 'fa-solid fa-crosshairs', label: 'رادار الأسعار', action: fetchRadar },
    { id: 'fdr', icon: 'fa-solid fa-calendar-days', label: 'جدول الصعوبة', action: fetchFixtures },
    { id: 'league', icon: 'fa-solid fa-trophy', label: 'تحليل الدوريات' },
    { id: 'sim', icon: 'fa-solid fa-laptop-code', label: 'المحاكي التفاعلي' },
    { id: 'hit', icon: 'fa-solid fa-calculator', label: 'حاسبة السالب' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-tajawal">
      
      {/* الرأس مع اللوجو المصحح */}
      <header className="bg-fpl-purple py-6 shadow-lg w-full text-center">
        <h1 className="text-3xl md:text-5xl font-black text-white flex items-center justify-center gap-4">
           {/* ⚠️ استخدام BASE_URL لحل مشكلة الصورة المكسورة ⚠️ */}
           <img src={`${BASE_URL}logo.png`} alt="Logo" className="w-20 h-20 md:w-28 md:h-28 rounded-full shadow-2xl border-4 border-fpl-green object-contain bg-white p-1" />
           HootaFPL
        </h1>
      </header>

      <main className="flex-grow w-full px-2 lg:px-8 xl:px-12 mt-8 pb-12">
        <div className="flex flex-wrap md:flex-nowrap gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto w-full">
          {navTabs.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.action) tab.action(); }}
              className={`flex-1 min-w-[130px] py-4 px-2 rounded-xl text-md lg:text-lg font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap
                ${activeTab === tab.id ? 'bg-fpl-purple text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-200'}`}>
              <i className={`${tab.icon} ${activeTab === tab.id ? 'text-fpl-green' : 'text-gray-400'}`}></i> {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 md:p-8 min-h-[600px] w-full">
          
          {/* 1. المساعد الذكي */}
          {activeTab === 'pitch' && (
            <div className="w-full xl:w-3/4 mx-auto animate-fade-in">
              <h2 className="text-3xl font-bold text-fpl-purple mb-8 text-center">أدخل فريقك لتبدأ سحر التحليل</h2>
              <div className="flex flex-col sm:flex-row gap-4 mb-10 max-w-2xl mx-auto">
                <input type="text" placeholder="رقم الفريق (Team ID)" className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-fpl-purple text-xl bg-gray-50 text-center" value={teamId} onChange={e => setTeamId(e.target.value)} />
                <button onClick={fetchPitchAndAnalyze} disabled={pitchData.loading} className="bg-fpl-green text-fpl-purple font-black px-10 py-4 rounded-xl text-xl flex items-center justify-center gap-3 shadow-md hover:bg-green-400 transition-colors">
                  {pitchData.loading ? <span className="loader border-fpl-purple"></span> : <i className="fa-solid fa-wand-magic-sparkles"></i>} حلل تشكيلتي
                </button>
              </div>

              {pitchData.analyzed && (
                <div className="animate-fade-in mb-10">
                  <div className="bg-fpl-purple text-white p-6 rounded-t-3xl flex justify-between items-center shadow-lg">
                    <h3 className="text-2xl md:text-3xl font-black flex items-center gap-2"><i className="fa-solid fa-shield-halved text-fpl-green"></i> {pitchData.name}</h3>
                    <div className="text-right bg-black/30 px-6 py-2 rounded-xl border border-white/10">
                      <div className="text-sm text-gray-300 font-bold">نقاط الجولة: <span className="text-fpl-green font-black text-3xl ml-2">{pitchData.gwPoints}</span></div>
                    </div>
                  </div>
                  <div className="bg-green-600 py-10 px-2 rounded-b-3xl border-4 border-green-800 relative overflow-hidden shadow-inner" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(0,0,0,0.05) 10%, rgba(0,0,0,0.05) 20%)' }}>
                    
                    {/* ⚠️ إضافة اللوجوهات الأربعة في الملعب ⚠️ */}
                    <PitchWatermarks />

                    <div className="flex flex-col gap-10 relative z-10 w-full max-w-3xl mx-auto">
                      <div className="flex justify-center gap-4">{pitchData.starting[1]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={true} />)}</div>
                      <div className="flex justify-center gap-2 md:gap-4">{pitchData.starting[2]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={false} />)}</div>
                      <div className="flex justify-center gap-2 md:gap-4">{pitchData.starting[3]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={false} />)}</div>
                      <div className="flex justify-center gap-6">{pitchData.starting[4]?.map(p => <PlayerShirt key={p.id} p={p} isGkp={false} />)}</div>
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-100 p-6 rounded-3xl border border-gray-200 shadow-inner">
                    <h4 className="text-center font-bold text-gray-400 mb-4 text-xl">دكة البدلاء</h4>
                    <div className="flex justify-center gap-6">{pitchData.bench?.map(p => <PlayerShirt key={p.id} p={p} isGkp={p.type === 1} />)}</div>
                  </div>
                </div>
              )}

              {pitchData.analyzed && (
                <div className="mt-8 animate-fade-in">
                  {pitchData.aiLoading ? (
                    <div className="bg-purple-50 p-12 rounded-3xl border border-purple-100 text-center shadow-sm">
                       <i className="fa-solid fa-robot text-7xl text-fpl-purple mb-6 icon-bounce animate-pulse drop-shadow-md"></i>
                       <h3 className="text-3xl font-black text-fpl-purple">{aiLoadingText}</h3>
                    </div>
                  ) : (
                    <div className="bg-white p-8 md:p-10 rounded-3xl border-r-[12px] border-fpl-green shadow-xl text-2xl text-gray-700 leading-relaxed whitespace-pre-line relative overflow-hidden">
                      <div className="absolute opacity-5 -top-10 -left-10"><i className="fa-solid fa-robot text-[250px]"></i></div>
                      <div className="font-black text-fpl-purple mb-8 flex items-center gap-3 text-4xl relative z-10 border-b-2 border-gray-100 pb-4">
                         <i className="fa-solid fa-comment-dots text-fpl-green"></i> تشخيص المدرب الذكي:
                      </div>
                      <div className="relative z-10 font-medium text-gray-800">{pitchData.aiText}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. الرادار */}
          {activeTab === 'radar' && (
            <div className="animate-fade-in w-full">
              <h2 className="text-3xl font-bold text-fpl-purple mb-8 text-center">رادار اللاعبين وتوقعات السوق</h2>
              {radarData.loading ? <div className="text-center py-20"><span className="loader border-fpl-purple w-16 h-16"></span></div> : (
                <div className="grid lg:grid-cols-2 gap-8 w-full">
                  <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm">
                    <h3 className="text-2xl font-black text-blue-800 mb-6 border-b-2 border-blue-200 pb-4 flex items-center gap-3"><i className="fa-solid fa-user-secret text-3xl"></i> ديفرينشالز (أقل من 10%)</h3>
                    <div className="space-y-4">
                      {radarData.differentials.map((p, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm hover:scale-105 transition-transform cursor-pointer border border-blue-50">
                          <span className="text-2xl font-bold text-gray-800">{p.web_name} <span className="text-gray-400 text-lg">£{(p.now_cost/10).toFixed(1)}m</span></span>
                          <span className="text-xl font-black text-blue-600 bg-blue-100 px-4 py-2 rounded-xl shadow-inner">{p.selected_by_percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 shadow-sm">
                    <h3 className="text-2xl font-black text-rose-800 mb-6 border-b-2 border-rose-200 pb-4 flex items-center gap-3"><i className="fa-solid fa-arrow-trend-up text-3xl"></i> المتوقع ارتفاع أسعارهم</h3>
                    <div className="space-y-4">
                      {radarData.risers.map((p, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm hover:scale-105 transition-transform cursor-pointer border border-rose-50">
                          <span className="text-2xl font-bold text-gray-800">{p.web_name}</span>
                          <span className="text-xl font-black text-rose-600 bg-rose-100 px-4 py-2 rounded-xl shadow-inner"><i className="fa-solid fa-plus"></i> {(p.transfers_in_event/1000).toFixed(1)}k شراء</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. FDR */}
          {activeTab === 'fdr' && (
            <div className="animate-fade-in w-full max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-fpl-purple mb-8 text-center">مؤشر صعوبة المباريات المتطور (FDR)</h2>
              {fixturesData.loading ? <div className="text-center py-20"><span className="loader border-fpl-purple w-16 h-16"></span></div> : (
                <div className="table-container rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-center">
                    <thead className="bg-fpl-purple text-white text-xl">
                      <tr><th className="p-6">النادي</th><th className="p-6">صعوبة الهجوم</th><th className="p-6">صعوبة الدفاع</th><th className="p-6">التقييم العام</th></tr>
                    </thead>
                    <tbody className="bg-white">
                      {fixturesData.teams.sort((a,b) => a.strength - b.strength).map(team => (
                        <tr key={team.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-5 flex items-center justify-center gap-4">
                            <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${team.code}-66.webp`} alt={team.name} className="w-10 h-12 drop-shadow-md" />
                            <span className="font-black text-2xl text-gray-800">{team.name}</span>
                          </td>
                          <td className="p-5"><span className={`px-6 py-2 rounded-xl font-bold text-white shadow-sm ${team.strength_attack_home > 1150 ? 'bg-red-500' : team.strength_attack_home < 1050 ? 'bg-green-500' : 'bg-yellow-500'}`}>{team.strength_attack_home > 1150 ? 'صعب' : team.strength_attack_home < 1050 ? 'سهل' : 'متوسط'}</span></td>
                          <td className="p-5"><span className={`px-6 py-2 rounded-xl font-bold text-white shadow-sm ${team.strength_defence_home > 1150 ? 'bg-red-500' : team.strength_defence_home < 1050 ? 'bg-green-500' : 'bg-yellow-500'}`}>{team.strength_defence_home > 1150 ? 'صعب' : team.strength_defence_home < 1050 ? 'سهل' : 'متوسط'}</span></td>
                          <td className="p-5 font-black text-4xl drop-shadow-sm" style={{color: team.strength < 1080 ? '#22c55e' : team.strength > 1120 ? '#ef4444' : '#eab308'}}>{team.strength}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. الدوريات */}
          {activeTab === 'league' && (
            <div className="animate-fade-in w-full max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-fpl-purple mb-8 text-center">تقارير الدوريات المصغرة</h2>
              <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
                <input type="text" placeholder="أدخل رقم الدوري (League ID)" className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-fpl-purple text-xl bg-gray-50 text-center" value={leagueId} onChange={e => setLeagueId(e.target.value)} />
                <button onClick={fetchLeague} disabled={leagueData.loading} className="bg-fpl-purple text-white font-black px-10 py-4 rounded-xl text-xl flex items-center justify-center gap-3 shadow-md hover:bg-purple-900 transition-colors">
                  {leagueData.loading ? <span className="loader border-white"></span> : <i className="fa-solid fa-trophy"></i>} استعرض
                </button>
              </div>

              {leagueData.name && (
                <div className="mt-8 animate-fade-in">
                  <h3 className="text-4xl font-black text-fpl-purple mb-8 text-center bg-purple-50 py-6 rounded-2xl border border-purple-100 shadow-sm">🏆 {leagueData.name}</h3>
                  <div className="table-container rounded-3xl shadow-lg border border-gray-200 overflow-hidden mb-10">
                    <table className="w-full text-right">
                      <thead className="bg-fpl-purple text-white text-xl">
                        <tr><th className="p-6">#</th><th className="p-6">الفريق والمدرب</th><th className="p-6">نقاط الجولة</th><th className="p-6">الإجمالي</th></tr>
                      </thead>
                      <tbody className="bg-white">
                        {leagueData.standings.map((team, i) => (
                          <tr key={team.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-6 w-24"><span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-black text-xl shadow-md ${i===0?'bg-yellow-400 text-yellow-900':i===1?'bg-gray-300 text-gray-800':i===2?'bg-amber-600 text-white':'bg-gray-100 text-gray-600'}`}>{team.rank}</span></td>
                            <td className="p-6"><div className="font-black text-2xl text-fpl-purple mb-1">{team.entry_name}</div><div className="text-gray-500 font-bold text-lg">{team.player_name}</div></td>
                            <td className="p-6 text-3xl font-bold text-green-600">{team.event_total}</td>
                            <td className="p-6 text-3xl font-black text-fpl-purple">{team.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {leagueData.stats && (
                    <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                      <div className="bg-green-50 p-8 rounded-3xl border border-green-200 text-center shadow-md hover:scale-105 transition-transform cursor-default">
                        <i className="fa-solid fa-fire text-5xl text-green-500 mb-4 block drop-shadow-sm"></i>
                        <h4 className="text-xl font-bold text-green-800 mb-3">نجم الجولة</h4>
                        <div className="font-black text-3xl text-green-900 mb-2">{leagueData.stats.topScorerGW.player_name}</div>
                        <div className="text-green-700 font-bold text-2xl">بـ {leagueData.stats.topScorerGW.event_total} نقطة 🔥</div>
                      </div>
                      <div className="bg-yellow-50 p-8 rounded-3xl border border-yellow-200 text-center shadow-md hover:scale-105 transition-transform cursor-default">
                        <i className="fa-solid fa-ruler-horizontal text-5xl text-yellow-500 mb-4 block drop-shadow-sm"></i>
                        <h4 className="text-xl font-bold text-yellow-800 mb-3">فارق الصدارة</h4>
                        <div className="font-black text-5xl text-yellow-900 my-4 drop-shadow-sm">{leagueData.stats.gap} نقطة</div>
                        <div className="text-yellow-700 font-bold text-xl">بين الأول والثاني ⚡</div>
                      </div>
                      <div className="bg-red-50 p-8 rounded-3xl border border-red-200 text-center shadow-md hover:scale-105 transition-transform cursor-default">
                        <i className="fa-solid fa-face-frown-open text-5xl text-red-500 mb-4 block drop-shadow-sm"></i>
                        <h4 className="text-xl font-bold text-red-800 mb-3">الأقل حظاً بالجولة</h4>
                        <div className="font-black text-3xl text-red-900 mb-2">{leagueData.stats.lowScorerGW.player_name}</div>
                        <div className="text-red-700 font-bold text-2xl">بـ {leagueData.stats.lowScorerGW.event_total} نقطة فقط 🤕</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. المحاكي التفاعلي */}
          {activeTab === 'sim' && (
            <div className="animate-fade-in w-full">
              <h2 className="text-3xl font-bold text-fpl-purple mb-8 text-center">سوق الانتقالات ومحاكي الخواص (Live Planner)</h2>
              {!allPlayers.length ? (
                <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-2xl mx-auto">
                  <input type="text" placeholder="أدخل رقم الفريق لتخطيط تبديلاته" className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-200 focus:border-fpl-purple text-xl bg-gray-50 text-center" value={simTeamId} onChange={e => setSimTeamId(e.target.value)} />
                  <button onClick={fetchSimSquad} disabled={simLoading} className="bg-fpl-green text-fpl-purple font-black px-10 py-4 rounded-xl text-xl flex items-center justify-center gap-3 shadow-md hover:bg-green-400 transition-colors">
                    {simLoading ? <span className="loader border-fpl-purple"></span> : <i className="fa-solid fa-download"></i>} استيراد وبدء التخطيط
                  </button>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-8 w-full">
                  <div className="w-full lg:w-3/5 xl:w-2/3">
                    <div className="bg-fpl-purple text-white p-6 rounded-t-3xl flex flex-wrap justify-between items-center shadow-lg gap-4">
                      <button onClick={activateWildcard} className={`px-6 py-3 rounded-xl font-black text-lg transition-colors shadow-md ${activeChip === 'WC' ? 'bg-fpl-green text-fpl-purple' : 'bg-white/10 hover:bg-white/20 border border-white/20'}`}>
                        <i className="fa-solid fa-wand-magic-sparkles mr-2"></i> تفعيل Wildcard
                      </button>
                      <div className="text-right bg-black/40 px-6 py-3 rounded-xl border border-white/10">
                        <div className="text-sm text-gray-300 font-bold mb-1">الرصيد الحر:</div>
                        <div className="text-fpl-green font-black text-3xl">£{simBank.toFixed(1)}m</div>
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

                  <div className="w-full lg:w-2/5 xl:w-1/3 bg-gray-50 border-2 border-gray-200 rounded-3xl flex flex-col h-[850px] overflow-hidden shadow-xl">
                    <div className="bg-gray-800 text-white p-6 font-black text-2xl flex items-center gap-3 shadow-md z-10">
                      <i className="fa-solid fa-store text-fpl-green"></i> سوق اللاعبين
                    </div>
                    <div className="p-6 bg-white border-b border-gray-200 flex flex-col gap-4 shadow-sm z-10">
                      <input type="text" placeholder="ابحث بالاسم..." className="w-full p-4 border-2 rounded-xl bg-gray-50 focus:border-fpl-purple outline-none font-bold text-lg" value={marketFilters.search} onChange={e => setMarketFilters({...marketFilters, search: e.target.value})} />
                      <div className="flex gap-3">
                        <select className="flex-1 p-3 border-2 rounded-xl bg-gray-50 font-bold outline-none cursor-pointer" value={marketFilters.position} onChange={e => setMarketFilters({...marketFilters, position: Number(e.target.value)})}>
                          <option value={0}>المراكز</option><option value={1}>حراس</option><option value={2}>دفاع</option><option value={3}>وسط</option><option value={4}>هجوم</option>
                        </select>
                        <select className="flex-1 p-3 border-2 rounded-xl bg-gray-50 font-bold outline-none cursor-pointer" value={marketFilters.sort} onChange={e => setMarketFilters({...marketFilters, sort: e.target.value})}>
                          <option value="transfers_in_event">شراء</option><option value="now_cost">السعر</option><option value="total_points">النقاط</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                      {getFilteredMarket().map(p => (
                        <div key={p.id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-fpl-green hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <img src={`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${p.team_code}-66.webp`} className="w-10 h-12 drop-shadow-sm" alt="shirt" />
                            <div>
                              <div className="font-black text-gray-800 text-lg mb-1">{p.web_name}</div>
                              <div className="text-sm text-gray-500 font-bold bg-gray-100 inline-block px-2 py-1 rounded"><i className="fa-solid fa-star text-yellow-500"></i> {p.total_points} ن</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-black text-fpl-purple text-xl">£{(p.now_cost/10).toFixed(1)}</span>
                            <button onClick={() => buyPlayer(p)} className="bg-fpl-green text-fpl-purple w-12 h-12 rounded-full flex items-center justify-center font-black hover:bg-green-400 hover:scale-110 shadow-md text-2xl transition-transform"><i className="fa-solid fa-plus"></i></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. حاسبة السالب */}
          {activeTab === 'hit' && (
             <div className="animate-fade-in max-w-4xl mx-auto">
               <h2 className="text-3xl font-bold text-fpl-purple mb-4 text-center">حاسبة جدوى التبديلات (-4)</h2>
               <p className="text-xl text-gray-500 text-center mb-10">أدخل توقعاتك لترى هل التبديل الإضافي يستحق خصم النقاط أم لا.</p>
               <div className="bg-gray-50 p-10 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="grid sm:grid-cols-2 gap-10 mb-10">
                    <div>
                      <label className="block text-2xl font-bold text-gray-700 mb-4 text-center"><i className="fa-solid fa-arrow-right-from-bracket text-red-500 mr-2"></i> نقاط اللاعب المُباع:</label>
                      <input type="number" className="w-full px-6 py-5 rounded-2xl border-2 border-gray-200 text-3xl font-black text-center bg-white focus:border-fpl-purple outline-none" value={hitCalc.pointsOut} onChange={e => setHitCalc({...hitCalc, pointsOut: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-2xl font-bold text-gray-700 mb-4 text-center"><i className="fa-solid fa-arrow-right-to-bracket text-green-500 mr-2"></i> نقاط اللاعب الجديد:</label>
                      <input type="number" className="w-full px-6 py-5 rounded-2xl border-2 border-gray-200 text-3xl font-black text-center bg-white focus:border-fpl-purple outline-none" value={hitCalc.pointsIn} onChange={e => setHitCalc({...hitCalc, pointsIn: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className={`p-10 rounded-3xl text-center border-4 transition-colors ${((hitCalc.pointsIn - 4) - hitCalc.pointsOut) > 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                    <h3 className="text-3xl font-bold text-gray-600 mb-4">الصافي (بعد خصم 4 نقاط)</h3>
                    <div className={`text-8xl font-black mb-6 drop-shadow-sm ${((hitCalc.pointsIn - 4) - hitCalc.pointsOut) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {((hitCalc.pointsIn - 4) - hitCalc.pointsOut) > 0 ? '+' : ''}{((hitCalc.pointsIn - 4) - hitCalc.pointsOut)}
                    </div>
                    <div className={`text-3xl font-bold ${((hitCalc.pointsIn - 4) - hitCalc.pointsOut) > 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {((hitCalc.pointsIn - 4) - hitCalc.pointsOut) > 0 ? <><i className="fa-solid fa-check-circle mr-2"></i> تبديل ناجح رياضياً!</> : <><i className="fa-solid fa-circle-xmark mr-2"></i> تبديل فاشل رياضياً!</>}
                    </div>
                  </div>
               </div>
             </div>
          )}

        </div>
      </main>

      {/* ⚠️ حقوق النشر المطورة ⚠️ */}
      <footer className="w-full py-8 text-center mt-auto border-t border-gray-200 bg-white">
        <p className="text-gray-500 font-bold text-lg mb-2">
          © {new Date().getFullYear()} HootaFPL Super App. All rights reserved.
        </p>
        <p className="text-gray-600 text-lg font-bold">
          developed with <i className="fa-solid fa-heart text-red-500 mx-1 animate-pulse"></i> by <span className="text-fpl-green bg-fpl-purple px-3 py-1 rounded-lg ml-1 border border-fpl-purple shadow-sm">Abdalmahmoud Adil Alnoor</span>
        </p>
      </footer>
    </div>
  )
}

export default App
