import React, { useState, useEffect } from 'react';

const RENDER_HOST = 'localhost:3000';

// SVG Кошачья лапка
const PawIcon = ({ color, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 11C14.2 11 16 12.8 16 15C16 17.2 14.2 19 12 19C9.8 19 8 17.2 8 15C8 12.7909 9.8 11 12 11Z" />
    <circle cx="7" cy="8" r="2.2" />
    <circle cx="10.5" cy="5.5" r="2.2" />
    <circle cx="14.5" cy="5.5" r="2.2" />
    <circle cx="18" cy="8" r="2.2" />
  </svg>
);

function App() {
  const [role, setRole] = useState(null);
  const [passInput, setPassInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [likedFiles, setLikedFiles] = useState([]);
  const [archivedFiles, setArchivedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState('all'); 
  const [favFilter, setFavFilter] = useState('all'); 
  const [sortOrder, setSortOrder] = useState('new');
  const [zoomImg, setZoomImg] = useState(null);

  const getBaseUrl = () => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return `http://localhost:3000`;
    return `https://${RENDER_HOST}`;
  };
 // Пока что поставь ссылку-заглушку. 
// Когда загрузишь сервер на Render, вставишь сюда реальную ссылку, которую он тебе даст!
const SERVER_URL = 'https://krnn.onrender.com';

  const [settings, setSettings] = useState({
    name: 'NONA', avatar: '', bg: '#050505', accent: '#ff2d55', 
    adminPass: 'Ll653211', friendPass: '777', wallPaper: ''
  });

  // Анимированные лапки-лепестки
  const [paws] = useState(() =>
    [...Array(12)].map(() => ({
      left: Math.random() * 100, 
      delay: Math.random() * 10, 
      duration: 8 + Math.random() * 10, 
      size: 15 + Math.random() * 15,
      rotate: Math.random() * 360
    }))
  );

  const fetchData = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/files`);
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      setLikedFiles(data.likes || []);
      setArchivedFiles(data.archive || []);
      let allFiles = data.files || [];
      allFiles.sort((a, b) => (sortOrder === 'new' ? parseInt(b) - parseInt(a) : parseInt(a) - parseInt(b)));
      const grouped = [];
      allFiles.forEach(f => {
        const ts = parseInt(f);
        const last = grouped[grouped.length - 1];
        if (last && Math.abs(last.time - ts) < 2000) last.items.push(f);
        else grouped.push({ time: ts, items: [f] });
      });
      setPosts(grouped);
    } catch { console.log('Connect error'); }
  };

  useEffect(() => { if (role) fetchData(); }, [role, sortOrder]);

  const handleLogin = () => {
    if (passInput === settings.adminPass) setRole('admin');
    else if (passInput === settings.friendPass) setRole('friend');
    else alert('ACCESS DENIED');
  };

  const saveGlobalSettings = async (newSettings) => {
    setSettings(newSettings);
    await fetch(`${SERVER_URL}/update-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
  };

  const toggleAction = async (f, action) => {
    // Оптимистичное обновление для мгновенной реакции
    if (action === 'toggle-archive') {
       setArchivedFiles(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
    }
    
    try {
      const res = await fetch(`${SERVER_URL}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: f })
      });
      const data = await res.json();
      if (action === 'toggle-like') setLikedFiles(data);
      if (action === 'toggle-archive') setArchivedFiles(data);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleUpload = async (e) => {
  setLoading(true);
  const fd = new FormData();
  
  // ИСПРАВЛЕНО: 'file' без буквы 's' на конце!
  for (let f of e.target.files) fd.append('file', f); 

  try {
    const res = await fetch(`${SERVER_URL}/upload`, { method: 'POST', body: fd });
    
    // ИСПРАВЛЕНО: читаем как текст, а не как json!
    const resultText = await res.text(); 
    console.log("Ответ от сервера:", resultText);

    fetchData(); // Обновляем данные на сайте
  } catch (error) {
    console.error("Сбой при отправке фото:", error);
  } finally {
    setLoading(false);
  }
};

  const getFileType = (file) => {
    const ext = file.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'm4a'].includes(ext)) return 'audio';
    return 'photo';
  };

  const MediaItem = ({ file }) => {
    const url = `${SERVER_URL}/uploads/${file}`;
    const type = getFileType(file);
    if (type === 'video') return <video src={url} controls className="m-el" playsInline />;
    if (type === 'audio') return <div className="a-box"><audio src={url} controls /></div>;
    return <img src={url} className="m-el" alt="" onClick={() => setZoomImg(url)} />;
  };

  const dynamicBg = settings.wallPaper 
    ? { backgroundImage: `url(${settings.wallPaper})`, backgroundSize: 'cover', backgroundPosition: 'center' } 
    : { background: settings.bg };

  if (!role) return (
    <div className="layout login-page" style={dynamicBg}>
      <div className="paw-rain">{paws.map((p, i) => <div key={i} className="falling-paw" style={{left:p.left+'vw', animationDelay:p.delay+'s', animationDuration:p.duration+'s'}}><PawIcon color={settings.accent+'40'} size={p.size} /></div>)}</div>
      <div className="login-card" style={{ border: `2px solid ${settings.accent}` }}>
        <h1 style={{ color: settings.accent }}>KRN SYSTEM</h1>
        <div className="login-form">
          <input type="password" placeholder="CODE" onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button style={{ background: settings.accent }} onClick={handleLogin}>INITIALIZE</button>
        </div>
        <div className="guest-btn" onClick={() => setRole('guest')}>GUEST ACCESS</div>
      </div>
      <style>{CSS(settings)}</style>
    </div>
  );

  return (
    <div className="layout" style={{ ...dynamicBg, backgroundAttachment: 'fixed' }}>
      <div className="paw-rain">{paws.map((p, i) => <div key={i} className="falling-paw" style={{left:p.left+'vw', animationDelay:p.delay+'s', animationDuration:p.duration+'s'}}><PawIcon color={settings.accent+'20'} size={p.size} /></div>)}</div>
      
      <div className="sticky-header">
        <header className="navbar">
          <div className="logo" onClick={() => setRole(null)}>⛩️</div>
          <div className="nav-controls">
            <div className="pill-btn" onClick={() => setSortOrder(sortOrder === 'new' ? 'old' : 'new')} style={{ border: `1px solid ${settings.accent}`, color: settings.accent }}>{sortOrder}</div>
            <div className="circle-btn" onClick={() => setShowSettings(!showSettings)} style={{ border: `1px solid ${settings.accent}`, backgroundImage: `url(${settings.avatar})`, backgroundSize:'cover' }}>{!settings.avatar && '⚙️'}</div>
            {role === 'admin' && (
              <label className="circle-btn add-btn" style={{ background: settings.accent }}>
                {viewMode === 'favorites' ? '🔒' : '+'}
                <input type="file" multiple onChange={handleUpload} hidden />
              </label>
            )}
          </div>
        </header>

        <nav className="main-tabs">
          <div onClick={() => setViewMode('all')} className={viewMode === 'all' ? 'active' : ''} style={{ '--clr': settings.accent }}>STREAM</div>
          {(role === 'admin' || role === 'friend') && (
            <div onClick={() => setViewMode('favorites')} className={viewMode === 'favorites' ? 'active' : ''} style={{ '--clr': settings.accent }}>
               PRIVATE <PawIcon color={viewMode === 'favorites' ? settings.accent : '#555'} size={14} />
            </div>
          )}
          {role === 'admin' && (
             <div onClick={() => setViewMode('archive')} className={viewMode === 'archive' ? 'active' : ''} style={{ '--clr': settings.accent }}>ARCHIVE</div>
          )}
        </nav>

        {viewMode === 'favorites' && (
          <div className="filter-bar no-s">
            {['all', 'photo', 'video', 'audio'].map(f => (
              <span key={f} onClick={() => setFavFilter(f)} style={{ 
                background: favFilter === f ? settings.accent : 'transparent', 
                border: `1px solid ${settings.accent}`,
                color: favFilter === f ? '#fff' : settings.accent 
              }}>{f}</span>
            ))}
          </div>
        )}
      </div>

      <main className="content-feed">
        {loading && <div className="status-msg" style={{color: settings.accent}}>UPLOADING...</div>}
        {posts.map((post, idx) => {
          let items = post.items.filter(f => {
            const isLiked = likedFiles.includes(f);
            const isArchived = archivedFiles.includes(f);
            if (viewMode === 'archive') return isArchived;
            if (isArchived) return false;
            if (viewMode === 'favorites') return isLiked && (favFilter === 'all' || getFileType(f) === favFilter);
            return !isLiked;
          });
          if (items.length === 0) return null;

          return (
            <div key={idx} className="post-card" style={{ border: `1px solid ${settings.accent}20` }}>
              <div className="card-user"><b>{settings.name}</b></div>
              <div className="media-scroll no-s">
                {items.map((file, i) => (
                  <div key={i} className="media-slide">
                    <MediaItem file={file} />
                    {role === 'admin' && (
                      <div className="floating-actions">
                         <div className={`action-paw ${likedFiles.includes(file) ? 'active' : ''}`} onClick={() => toggleAction(file, 'toggle-like')}>
                            <PawIcon color={likedFiles.includes(file) ? settings.accent : '#fff'} size={28} />
                         </div>
                         <div className="action-trash" onClick={() => toggleAction(file, 'toggle-archive')} style={{ background: archivedFiles.includes(file) ? settings.accent : 'rgba(0,0,0,0.5)' }}>
                           {archivedFiles.includes(file) ? '♻️' : '🗑️'}
                         </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      {showSettings && role === 'admin' && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" style={{ border: `1px solid ${settings.accent}` }} onClick={e => e.stopPropagation()}>
            <h3>SYSTEM CONTROL</h3>
            <input type="text" placeholder="Admin Pass" value={settings.adminPass} onChange={e => setSettings({...settings, adminPass: e.target.value})} />
            <input type="text" placeholder="Friend Pass" value={settings.friendPass} onChange={e => setSettings({...settings, friendPass: e.target.value})} />
            <input type="text" placeholder="Wallpaper URL" value={settings.wallPaper} onChange={e => setSettings({...settings, wallPaper: e.target.value})} />
            <div className="color-grid">
              <label>Accent <input type="color" value={settings.accent} onChange={e => setSettings({...settings, accent: e.target.value})} /></label>
              <label>BG <input type="color" value={settings.bg} onChange={e => setSettings({...settings, bg: e.target.value})} /></label>
            </div>
            <button style={{ background: settings.accent }} onClick={() => {saveGlobalSettings(settings); setShowSettings(false)}}>APPLY GLOBAL</button>
          </div>
        </div>
      )}
      {zoomImg && <div className="zoom-view" onClick={() => setZoomImg(null)}><img src={zoomImg} alt="" /></div>}
      <style>{CSS(settings)}</style>
    </div>
  );
}

const CSS = (u) => `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: #000; font-family: -apple-system, sans-serif; color: #fff; overflow: hidden; }
  .layout { height: 100vh; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; position: relative; }
  .no-s::-webkit-scrollbar { display: none; }

  /* АНИМАЦИЯ ПАДАЮЩИХ ЛАПОК */
  .paw-rain { position: fixed; inset: 0; pointer-events: none; z-index: 1; }
  .falling-paw { position: absolute; top: -50px; animation: fall-anim linear infinite; opacity: 0.6; }
  @keyframes fall-anim { 
    to { transform: translateY(110vh) rotate(360deg); } 
  }

  /* ВХОД */
  .login-page { justify-content: center; align-items: center; }
  .login-card { width: 280px; padding: 35px; background: rgba(0,0,0,0.85); border-radius: 25px; text-align: center; backdrop-filter: blur(15px); z-index: 10; }
  .login-form { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
  .login-card input { padding: 12px; border-radius: 10px; border: 1px solid #333; background: #000; color: #fff; text-align: center; }
  .login-card button { padding: 12px; border-radius: 10px; color: #fff; font-weight: bold; border: none; cursor: pointer; }
  .guest-btn { margin-top: 20px; font-size: 10px; opacity: 0.5; text-decoration: underline; cursor: pointer; }

  /* ШАПКА */
  .sticky-header { position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); width: 100%; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .navbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; }
  .nav-controls { display: flex; gap: 10px; align-items: center; }
  .circle-btn { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .pill-btn { font-size: 10px; padding: 6px 12px; border-radius: 20px; font-weight: bold; text-transform: uppercase; cursor: pointer; }

  /* ТАБЫ */
  .main-tabs { display: flex; width: 100%; }
  .main-tabs div { flex: 1; padding: 16px; text-align: center; font-size: 11px; font-weight: 900; cursor: pointer; color: #666; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .main-tabs div.active { color: var(--clr); border-bottom: 2px solid var(--clr); }

  /* ФИЛЬТРЫ */
  .filter-bar { display: flex; gap: 10px; padding: 12px 18px; overflow-x: auto; }
  .filter-bar span { padding: 6px 14px; border-radius: 20px; font-size: 10px; font-weight: bold; border: 1px solid; text-transform: uppercase; flex-shrink: 0; }

  /* ЛЕНТА */
  .content-feed { flex: 1; padding: 15px 0; display: flex; flex-direction: column; align-items: center; z-index: 5; }
  .post-card { width: 94%; background: rgba(0,0,0,0.6); border-radius: 22px; overflow: hidden; margin-bottom: 25px; backdrop-filter: blur(10px); }
  .card-user { padding: 12px 18px; font-size: 12px; opacity: 0.6; }
  .media-scroll { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
  .media-slide { min-width: 100%; position: relative; scroll-snap-align: start; }
  .m-el { width: 100%; display: block; min-height: 280px; object-fit: cover; }

  /* КНОПКИ ВНУТРИ КАРТОЧКИ */
  .floating-actions { position: absolute; bottom: 18px; right: 18px; display: flex; gap: 12px; align-items: center; z-index: 10; }
  .action-paw { cursor: pointer; transition: 0.2s; }
  .action-paw.active { animation: paw-jump 1.5s infinite; filter: drop-shadow(0 0 8px ${u.accent}); }
  @keyframes paw-jump { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
  .action-trash { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(0,0,0,0.4); font-size: 16px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); }
  
  .a-box { padding: 45px 20px; background: #080808; display: flex; justify-content: center; }
  audio { width: 90%; filter: invert(1) hue-rotate(180deg); opacity: 0.6; }

  /* МОДАЛКА */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
  .modal { background: #000; width: 300px; padding: 25px; border-radius: 24px; display: flex; flex-direction: column; gap: 12px; }
  .modal input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #222; background: #000; color: #fff; font-size: 13px; }
  .color-grid { display: flex; justify-content: space-between; font-size: 11px; align-items: center; }

  .zoom-view { position: fixed; inset: 0; background: #000; z-index: 3000; display: flex; align-items: center; justify-content: center; }
  .zoom-view img { max-width: 100%; max-height: 100%; }
  .status-msg { padding: 20px; font-weight: bold; font-size: 11px; letter-spacing: 2px; }
`;

export default App;