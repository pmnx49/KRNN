import React, { useState, useEffect } from 'react';

const RENDER_HOST = 'krn-0s8n.onrender.com'; 
// ИСПОЛЬЗУЕМ СТАБИЛЬНУЮ ССЫЛКУ ИЛИ ТВОЮ (ЗАМЕНИ ЕСЛИ ЕСТЬ НОВАЯ ПРЯМАЯ ССЫЛКА)
const PAW_ICON = 'https://img.icons8.com/papercut/60/pet-commands-summon.png'; 

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
  const SERVER_URL = getBaseUrl();

  const [settings, setSettings] = useState({
    name: 'NONA', avatar: '', bg: '#050505', accent: '#ff2d55', 
    adminPass: 'Ll653211', friendPass: '777', wallPaper: ''
  });

  const [petals] = useState(() =>
    [...Array(15)].map(() => ({
      left: Math.random() * 100, delay: Math.random() * 10, duration: 7 + Math.random() * 7, size: 15 + Math.random() * 10
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
    const res = await fetch(`${SERVER_URL}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: f })
    });
    const data = await res.json();
    if (action === 'toggle-like') setLikedFiles(data);
    if (action === 'toggle-archive') setArchivedFiles(data);
    fetchData();
  };

  const handleUpload = async (e) => {
    setLoading(true);
    const fd = new FormData();
    for (let f of e.target.files) fd.append('files', f);
    const res = await fetch(`${SERVER_URL}/upload`, { method: 'POST', body: fd });
    const uploaded = await res.json();
    if (viewMode === 'favorites' && Array.isArray(uploaded)) {
      for (let f of uploaded) await toggleAction(f, 'toggle-like');
    }
    fetchData();
    setLoading(false);
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

  if (!role) return (
    <div className="layout login-page" style={{ background: settings.bg, backgroundImage: `url(${settings.wallPaper})`, backgroundSize: 'cover' }}>
      <div className="sakura-box">{petals.map((p, i) => <div key={i} className="petal" style={{left:p.left+'vw', animationDelay:p.delay+'s', animationDuration:p.duration+'s', fontSize:p.size+'px'}}>🌸</div>)}</div>
      <div className="login-card" style={{ border: `2px solid ${settings.accent}` }}>
        <h1 style={{ color: settings.accent }}>KRN SYSTEM</h1>
        <div className="login-form">
          <input type="password" placeholder="ENTER CODE" onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button style={{ background: settings.accent }} onClick={handleLogin}>INITIALIZE</button>
        </div>
        <div className="guest-btn" onClick={() => setRole('guest')}>GUEST ACCESS</div>
      </div>
      <style>{CSS(settings)}</style>
    </div>
  );

  return (
    <div className="layout" style={{ background: settings.bg, backgroundImage: `url(${settings.wallPaper})`, backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <div className="sakura-box">{petals.map((p, i) => <div key={i} className="petal" style={{left:p.left+'vw', animationDelay:p.delay+'s', animationDuration:p.duration+'s', fontSize:p.size+'px'}}>🌸</div>)}</div>
      
      <div className="sticky-top">
        <header className="navbar">
          <div className="logo" onClick={() => setRole(null)}>⛩️</div>
          <div className="nav-right">
            <div className="pill" onClick={() => setSortOrder(sortOrder === 'new' ? 'old' : 'new')} style={{ border: `1px solid ${settings.accent}`, color: settings.accent }}>{sortOrder}</div>
            <div className="prof" onClick={() => setShowSettings(!showSettings)} style={{ border: `1px solid ${settings.accent}`, backgroundImage: `url(${settings.avatar})`, backgroundSize:'cover' }}>{!settings.avatar && '⚙️'}</div>
            {role === 'admin' && (
              <label className="add" style={{ background: settings.accent }}>{viewMode === 'favorites' ? '🔒' : '+'}<input type="file" multiple onChange={handleUpload} hidden /></label>
            )}
          </div>
        </header>

        <div className="tabs">
          <div onClick={() => setViewMode('all')} style={{ color: viewMode === 'all' ? settings.accent : '#555', borderBottom: viewMode === 'all' ? `2px solid ${settings.accent}` : 'none' }}>STREAM</div>
          {(role === 'admin' || role === 'friend') && (
            <div onClick={() => setViewMode('favorites')} style={{ color: viewMode === 'favorites' ? settings.accent : '#555', borderBottom: viewMode === 'favorites' ? `2px solid ${settings.accent}` : 'none' }}>
               PRIVATE <img src={PAW_ICON} className="tab-paw" />
            </div>
          )}
          {role === 'admin' && (
             <div onClick={() => setViewMode('archive')} style={{ color: viewMode === 'archive' ? '#888' : '#333', borderBottom: viewMode === 'archive' ? `2px solid #888` : 'none' }}>ARCHIVE</div>
          )}
        </div>

        {viewMode === 'favorites' && (
          <div className="fav-filters no-s">
            {['all', 'photo', 'video', 'audio'].map(f => (
              <span key={f} onClick={() => setFavFilter(f)} style={{ background: favFilter === f ? settings.accent : 'transparent', border: `1px solid ${settings.accent}` }}>{f}</span>
            ))}
          </div>
        )}
      </div>

      <main className="feed">
        {loading && <div className="loader" style={{color: settings.accent}}>PROCESSING...</div>}
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
            <div key={idx} className="card" style={{ border: `1px solid ${settings.accent}20` }}>
              <div className="card-top"><b>{settings.name}</b></div>
              <div className="scroll no-s">
                {items.map((file, i) => (
                  <div key={i} className="slide">
                    <MediaItem file={file} />
                    {role === 'admin' && (
                      <div className="admin-actions">
                         <div className={`paw-container ${likedFiles.includes(file) ? 'active' : ''}`} onClick={() => toggleAction(file, 'toggle-like')}>
                            <img src={PAW_ICON} className="paw-img" />
                         </div>
                         <div className="arc-btn" onClick={() => toggleAction(file, 'toggle-archive')}>{archivedFiles.includes(file) ? '♻️' : '🗑️'}</div>
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
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ border: `1px solid ${settings.accent}` }}>
            <h3>SYSTEM CONTROL</h3>
            <input type="text" placeholder="Admin Pass" value={settings.adminPass} onChange={e => setSettings({...settings, adminPass: e.target.value})} />
            <input type="text" placeholder="Friend Pass" value={settings.friendPass} onChange={e => setSettings({...settings, friendPass: e.target.value})} />
            <input type="text" placeholder="Wallpaper URL" value={settings.wallPaper} onChange={e => setSettings({...settings, wallPaper: e.target.value})} />
            <div className="colors">
              <label>Accent <input type="color" value={settings.accent} onChange={e => setSettings({...settings, accent: e.target.value})} /></label>
              <label>BG <input type="color" value={settings.bg} onChange={e => setSettings({...settings, bg: e.target.value})} /></label>
            </div>
            <button style={{ background: settings.accent }} onClick={() => {saveGlobalSettings(settings); setShowSettings(false)}}>APPLY TO ALL</button>
          </div>
        </div>
      )}
      {zoomImg && <div className="zoom" onClick={() => setZoomImg(null)}><img src={zoomImg} alt="" /></div>}
      <style>{CSS(settings)}</style>
    </div>
  );
}

const CSS = (u) => `
  * { box-sizing: border-box; transition: 0.3s; }
  body { margin: 0; background: #000; font-family: -apple-system, system-ui, sans-serif; color: #fff; overflow: hidden; }
  
  .layout { height: 100vh; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; position: relative; }
  .no-s::-webkit-scrollbar { display: none; }

  /* ДИЗАЙН ВХОДА */
  .login-page { justify-content: center; align-items: center; background-position: center; background-size: cover; }
  .login-card { width: 90%; max-width: 320px; padding: 40px 30px; background: rgba(0,0,0,0.8); border-radius: 30px; text-align: center; backdrop-filter: blur(15px); }
  .login-card h1 { margin: 0 0 30px; font-size: 24px; letter-spacing: 3px; font-weight: 900; }
  .login-form { display: flex; flex-direction: column; gap: 15px; }
  .login-card input { padding: 14px; border-radius: 12px; border: 1px solid #333; background: #000; color: #fff; text-align: center; font-size: 16px; }
  .login-card button { padding: 14px; border: none; border-radius: 12px; color: #fff; font-weight: bold; cursor: pointer; letter-spacing: 1px; }
  .guest-btn { margin-top: 25px; font-size: 11px; opacity: 0.5; cursor: pointer; text-decoration: underline; }

  /* ШАПКА И ВКЛАДКИ */
  .sticky-top { position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
  .navbar { display: flex; justify-content: space-between; padding: 12px 20px; align-items: center; }
  .nav-right { display: flex; gap: 10px; }
  .prof, .add { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .tabs { display: flex; }
  .tabs div { flex: 1; padding: 15px; text-align: center; font-size: 11px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .tab-paw { width: 14px; height: 14px; }

  /* ЛЕНТА И КАРТОЧКИ */
  .feed { flex: 1; padding: 20px 0; display: flex; flex-direction: column; align-items: center; z-index: 5; }
  .card { width: 94%; background: rgba(255,255,255,0.03); border-radius: 24px; overflow: hidden; margin-bottom: 25px; backdrop-filter: blur(10px); }
  .card-top { padding: 12px 18px; font-size: 12px; opacity: 0.7; }
  .scroll { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
  .slide { min-width: 100%; position: relative; scroll-snap-align: start; }
  .m-el { width: 100%; display: block; min-height: 300px; object-fit: cover; }

  /* АНИМИРОВАННАЯ ЛАПКА */
  .admin-actions { position: absolute; bottom: 20px; right: 20px; display: flex; gap: 12px; align-items: center; }
  .paw-container { width: 50px; height: 50px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .paw-img { width: 100%; height: 100%; filter: grayscale(1) brightness(0.5); transform: scale(0.9); transition: 0.3s; }
  .active .paw-img { filter: grayscale(0) brightness(1.2); animation: paw-pulse 1.5s infinite ease-in-out; transform: scale(1.1); }
  
  @keyframes paw-pulse {
    0% { transform: scale(1); filter: drop-shadow(0 0 2px ${u.accent}); }
    50% { transform: scale(1.2); filter: drop-shadow(0 0 10px ${u.accent}); }
    100% { transform: scale(1); filter: drop-shadow(0 0 2px ${u.accent}); }
  }

  .arc-btn { background: rgba(0,0,0,0.5); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; cursor: pointer; font-size: 18px; }
  
  /* САКУРА */
  .sakura-box { position: fixed; inset: 0; pointer-events: none; z-index: 1; }
  .petal { position: absolute; top: -100px; animation: fall linear infinite; }
  @keyframes fall { to { transform: translateY(115vh) rotate(360deg); } }

  .fav-filters { display: flex; gap: 8px; padding: 12px 15px; overflow-x: auto; }
  .fav-filters span { padding: 6px 14px; border-radius: 20px; font-size: 10px; font-weight: bold; border: 1px solid; text-transform: uppercase; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
  .modal-card { background: #000; width: 300px; padding: 25px; border-radius: 25px; display: flex; flex-direction: column; gap: 15px; }
  .modal-card input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #222; background: #000; color: #fff; }
  .zoom { position: fixed; inset: 0; background: #000; z-index: 3000; display: flex; align-items: center; justify-content: center; }
  .zoom img { max-width: 100%; max-height: 100%; }
`;

export default App;