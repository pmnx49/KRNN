import React, { useState, useEffect } from 'react';

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
  const [sortOrder, setSortOrder] = useState('new');
  const [zoomImg, setZoomImg] = useState(null);

  const SERVER_URL = 'https://krnn.onrender.com';

  const [settings, setSettings] = useState({
    name: 'NONA', avatar: '', bg: '#050505', accent: '#ff2d55', 
    adminPass: 'Ll653211', friendPass: '777', wallPaper: ''
  });

  const fetchData = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/files?t=${Date.now()}`);
      const data = await res.json();
      
      if (data.settings) setSettings(data.settings);
      setLikedFiles(data.likes || []);
      setArchivedFiles(data.archive || []);
      
      let rawFiles = Array.isArray(data) ? data : (data.files || []);
      let validFiles = rawFiles.filter(f => typeof f === 'object' && f !== null && f.id);
      
      validFiles.sort((a, b) => (sortOrder === 'new' ? b.id - a.id : a.id - b.id));
      
      const grouped = [];
      validFiles.forEach(f => {
        const ts = f.id; 
        const last = grouped[grouped.length - 1];
        // Группируем файлы, загруженные в интервале 5 секунд
        if (last && Math.abs(last.time - ts) < 5000) last.items.push(f);
        else grouped.push({ time: ts, items: [f] });
      });
      setPosts(grouped);
    } catch (e) { 
      console.error('Ошибка соединения:', e); 
    }
  };

  useEffect(() => { if (role) fetchData(); }, [role, sortOrder]);

  const handleLogin = () => {
    if (passInput === settings.adminPass) setRole('admin');
    else if (passInput === settings.friendPass) setRole('friend');
    else alert('ACCESS DENIED');
  };

  const toggleAction = async (fileName, action) => {
    // Мгновенное обновление UI
    if (action === 'toggle-like') {
       setLikedFiles(prev => prev.includes(fileName) ? prev.filter(x => x !== fileName) : [...prev, fileName]);
    }
    if (action === 'toggle-archive') {
       setArchivedFiles(prev => prev.includes(fileName) ? prev.filter(x => x !== fileName) : [...prev, fileName]);
    }

    // Сохранение на сервер
    try {
      await fetch(`${SERVER_URL}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, action })
      });
    } catch (e) {
      console.error("Ошибка сохранения на бэкенд:", e);
    }
  };

  const handleUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setLoading(true);
    const fd = new FormData();
    for (let f of e.target.files) fd.append('file', f); 

    try {
      const res = await fetch(`${SERVER_URL}/upload`, { method: 'POST', body: fd });
      if (res.ok) await fetchData();
    } catch (error) {
      console.error("Сбой при отправке:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (fileObj) => {
    const name = fileObj.name || '';
    if (name.match(/\.(mp4|webm|mov)$/i)) return 'video';
    if (name.match(/\.(mp3|wav|m4a)$/i)) return 'audio';
    return 'photo';
  };

  const MediaItem = ({ file }) => {
    const type = getFileType(file);
    if (type === 'video') return <video src={file.url} controls className="m-el" playsInline />;
    if (type === 'audio') return <div className="a-box"><audio src={file.url} controls /></div>;
    return <img src={file.url} className="m-el" alt="" onClick={() => setZoomImg(file.url)} />;
  };

  const dynamicBg = settings.wallPaper 
    ? { backgroundImage: `url(${settings.wallPaper})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } 
    : { background: settings.bg };

  if (!role) return (
    <div className="layout login-page" style={dynamicBg}>
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
    <div className="layout" style={dynamicBg}>
      <div className="sticky-header">
        <header className="navbar">
          <div className="logo" onClick={() => setRole(null)}>⛩️</div>
          <div className="nav-controls">
            <div className="pill-btn" onClick={() => setSortOrder(sortOrder === 'new' ? 'old' : 'new')} style={{ border: `1px solid ${settings.accent}`, color: settings.accent }}>{sortOrder}</div>
            {role === 'admin' && (
              <label className="circle-btn" style={{ background: settings.accent }}>
                + <input type="file" multiple onChange={handleUpload} hidden />
              </label>
            )}
            <div className="circle-btn" onClick={() => setShowSettings(!showSettings)} style={{ border: `1px solid ${settings.accent}`, backgroundImage: `url(${settings.avatar})`, backgroundSize:'cover' }}>{!settings.avatar && '⚙️'}</div>
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
      </div>

      <main className="content-feed">
        {loading && <div className="status-msg" style={{color: settings.accent}}>UPLOADING...</div>}
        {posts.map((post, idx) => {
          let visibleItems = post.items.filter(f => {
            const isLiked = likedFiles.includes(f.name);
            const isArchived = archivedFiles.includes(f.name);
            
            if (viewMode === 'archive') return isArchived;
            if (isArchived) return false;
            
            if (viewMode === 'favorites') return isLiked;
            
            // Если гость - скрываем лайкнутые (приватные)
            if (role === 'guest' && isLiked) return false;
            
            return true;
          });
          
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="post-card" style={{ border: `1px solid ${settings.accent}20` }}>
              <div className="card-user"><b>{settings.name}</b> • {visibleItems.length} items</div>
              <div className="media-scroll no-s">
                {visibleItems.map((file, i) => (
                  <div key={i} className="media-slide">
                    <MediaItem file={file} />
                    {role === 'admin' && (
                      <div className="floating-actions">
                         <div className={`action-paw ${likedFiles.includes(file.name) ? 'active' : ''}`} onClick={() => toggleAction(file.name, 'toggle-like')}>
                            <PawIcon color={likedFiles.includes(file.name) ? settings.accent : '#fff'} size={28} />
                         </div>
                         <div className="action-trash" onClick={() => toggleAction(file.name, 'toggle-archive')} style={{ background: archivedFiles.includes(file.name) ? settings.accent : 'rgba(0,0,0,0.5)' }}>
                           {archivedFiles.includes(file.name) ? '♻️' : '🗑️'}
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
            <button style={{ background: settings.accent }} onClick={() => setShowSettings(false)}>CLOSE</button>
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
  body { margin: 0; background: #000; font-family: -apple-system, sans-serif; color: #fff; overflow-x: hidden; }
  .layout { min-height: 100vh; display: flex; flex-direction: column; position: relative; }
  .no-s::-webkit-scrollbar { display: none; }
  .login-page { justify-content: center; align-items: center; }
  .login-card { width: 280px; padding: 35px; background: rgba(0,0,0,0.85); border-radius: 25px; text-align: center; backdrop-filter: blur(15px); }
  .login-form { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
  .login-card input { padding: 12px; border-radius: 10px; border: 1px solid #333; background: #000; color: #fff; text-align: center; }
  .login-card button { padding: 12px; border-radius: 10px; color: #fff; font-weight: bold; border: none; cursor: pointer; }
  .guest-btn { margin-top: 20px; font-size: 10px; opacity: 0.5; text-decoration: underline; cursor: pointer; }
  .sticky-header { position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); width: 100%; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .navbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; }
  .nav-controls { display: flex; gap: 10px; align-items: center; }
  .circle-btn { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); }
  .pill-btn { font-size: 10px; padding: 6px 12px; border-radius: 20px; font-weight: bold; text-transform: uppercase; cursor: pointer; }
  .main-tabs { display: flex; width: 100%; }
  .main-tabs div { flex: 1; padding: 16px; text-align: center; font-size: 11px; font-weight: 900; cursor: pointer; color: #666; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .main-tabs div.active { color: var(--clr); border-bottom: 2px solid var(--clr); }
  .content-feed { flex: 1; padding: 15px 0; display: flex; flex-direction: column; align-items: center; }
  .post-card { width: 94%; max-width: 500px; background: rgba(0,0,0,0.6); border-radius: 22px; overflow: hidden; margin-bottom: 25px; backdrop-filter: blur(10px); }
  .card-user { padding: 12px 18px; font-size: 12px; opacity: 0.6; }
  
  /* Слайдер */
  .media-scroll { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
  .media-slide { min-width: 100%; position: relative; scroll-snap-align: start; }
  .m-el { width: 100%; display: block; min-height: 300px; object-fit: contain; background: #000; }
  
  .floating-actions { position: absolute; bottom: 18px; right: 18px; display: flex; gap: 12px; align-items: center; z-index: 10; }
  .action-paw { cursor: pointer; transition: 0.2s; filter: drop-shadow(0 0 5px rgba(0,0,0,0.5)); }
  .action-paw.active { transform: scale(1.1); filter: drop-shadow(0 0 8px ${u.accent}); }
  .action-trash { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 16px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); }
  .a-box { padding: 45px 20px; background: #080808; display: flex; justify-content: center; }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
  .modal { background: #000; width: 300px; padding: 25px; border-radius: 24px; display: flex; flex-direction: column; gap: 12px; }
  .modal input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #222; background: #000; color: #fff; font-size: 13px; }
  .color-grid { display: flex; justify-content: space-between; font-size: 11px; align-items: center; }
  .zoom-view { position: fixed; inset: 0; background: #000; z-index: 3000; display: flex; align-items: center; justify-content: center; }
  .zoom-view img { max-width: 100%; max-height: 100%; }
  .status-msg { padding: 20px; font-weight: bold; font-size: 11px; letter-spacing: 2px; }
`;

export default App;