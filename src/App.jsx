import React, { useState, useEffect } from 'react';

const RENDER_HOST = 'krn-0s8n.onrender.com'; 

const PawIcon = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 11C14.2 11 16 12.8 16 15C16 17.2 14.2 19 12 19C9.8 19 8 17.2 8 15C8 12.8 9.8 11 12 11Z" />
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
  const SERVER_URL = getBaseUrl();

  const [settings, setSettings] = useState({
    name: 'NONA', avatar: '', bg: '#050505', accent: '#ff2d55', 
    adminPass: 'Ll653211', friendPass: '777', wallPaper: ''
  });

  const [petals] = useState(() =>
    [...Array(15)].map(() => ({
      left: Math.random() * 100, delay: Math.random() * 10, duration: 7 + Math.random() * 7, size: 12 + Math.random() * 10
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
    fetchData();
  };

  const toggleAction = async (f, action) => {
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

  const dynamicBg = settings.wallPaper ? { backgroundImage: `url(${settings.wallPaper})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: settings.bg };

  if (!role) return (
    <div className="layout login-page" style={dynamicBg}>
      <div className="sakura-box">{petals.map((p, i) => <div key={i} className="petal" style={{left:p.left+'vw', animationDelay:p.delay+'s', animationDuration:p.duration+'s', fontSize:p.size+'px'}}>🌸</div>)}</div>
      <div className="login-card" style={{ border: `1px solid ${settings.accent}` }}>
        <h1 style={{ color: settings.accent }}>KRN SYSTEM</h1>
        <div className="login-form">
          <input type="password" placeholder="CODE" onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button style={{ background: settings.accent }} onClick={handleLogin}>INIT</button>
        </div>
        <div className="guest-btn" onClick={() => setRole('guest')}>GUEST ACCESS</div>
      </div>
      <style>{CSS(settings)}</style>
    </div>
  );

  return (
    <div className="layout" style={{ ...dynamicBg, backgroundAttachment: 'fixed' }}>
      <div className="sakura-box">{petals.map((p, i) => <div key={i} className="petal" style={{left:p.left+'vw', animationDelay:p.delay+'s', animationDuration:p.duration+'s', fontSize:p.size+'px'}}>🌸</div>)}</div>
      
      <div className="sticky-top">
        <header className="navbar">
          <div className="logo" onClick={() => setRole(null)}>⛩️</div>
          <div className="nav-btns">
            <div className="pill" onClick={() => setSortOrder(sortOrder === 'new' ? 'old' : 'new')} style={{ border: `1px solid ${settings.accent}`, color: settings.accent }}>{sortOrder}</div>
            <div className="prof-btn" onClick={() => setShowSettings(!showSettings)} style={{ border: `1px solid ${settings.accent}`, backgroundImage: `url(${settings.avatar})`, backgroundSize:'cover' }}>{!settings.avatar && '⚙️'}</div>
            {role === 'admin' && (
              <label className="add-btn" style={{ background: settings.accent }}>
                {viewMode === 'favorites' ? '🔒' : '+'}
                <input type="file" multiple onChange={handleUpload} hidden />
              </label>
            )}
          </div>
        </header>

        <nav className="tabs">
          <div onClick={() => setViewMode('all')} style={{ color: viewMode === 'all' ? settings.accent : '#666', borderBottom: viewMode === 'all' ? `2px solid ${settings.accent}` : 'none' }}>STREAM</div>
          {(role === 'admin' || role === 'friend') && (
            <div onClick={() => setViewMode('favorites')} style={{ color: viewMode === 'favorites' ? settings.accent : '#666', borderBottom: viewMode === 'favorites' ? `2px solid ${settings.accent}` : 'none' }}>
               PRIVATE <PawIcon color={viewMode === 'favorites' ? settings.accent : '#666'} />
            </div>
          )}
          {role === 'admin' && (
             <div onClick={() => setViewMode('archive')} style={{ color: viewMode === 'archive' ? settings.accent : '#666', borderBottom: viewMode === 'archive' ? `2px solid ${settings.accent}` : 'none' }}>ARCHIVE</div>
          )}
        </nav>

        {viewMode === 'favorites' && (
          <div className="fav-filters no-s">
            {['all', 'photo', 'video', 'audio'].map(f => (
              <span key={f} onClick={() => setFavFilter(f)} style={{ background: favFilter === f ? settings.accent : 'transparent', border: `1px solid ${settings.accent}`, color: favFilter === f ? '#fff' : settings.accent }}>{f}</span>
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
            <div key={idx} className="card" style={{ border: `1px solid ${settings.accent}15` }}>
              <div className="card-top"><b>{settings.name}</b></div>
              <div className="scroll no-s">
                {items.map((file, i) => (
                  <div key={i} className="slide">
                    <MediaItem file={file} />
                    {role === 'admin' && (
                      <div className="actions">
                         <div className={`paw-box ${likedFiles.includes(file) ? 'active' : ''}`} onClick={() => toggleAction(file, 'toggle-like')}>
                            <PawIcon color={likedFiles.includes(file) ? settings.accent : '#555'} />
                         </div>
                         <div className="trash-btn" onClick={() => toggleAction(file, 'toggle-archive')} style={{ border: `1px solid ${settings.accent}50` }}>
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
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-card" style={{ border: `1px solid ${settings.accent}` }}>
            <h3>SYSTEM</h3>
            <input type="text" placeholder="Admin Pass" value={settings.adminPass} onChange={e => setSettings({...settings, adminPass: e.target.value})} />
            <input type="text" placeholder="Friend Pass" value={settings.friendPass} onChange={e => setSettings({...settings, friendPass: e.target.value})} />
            <input type="text" placeholder="Wallpaper URL" value={settings.wallPaper} onChange={e => setSettings({...settings, wallPaper: e.target.value})} />
            <div className="color-row">
              <label>Accent <input type="color" value={settings.accent} onChange={e => setSettings({...settings, accent: e.target.value})} /></label>
              <label>BG <input type="color" value={settings.bg} onChange={e => setSettings({...settings, bg: e.target.value})} /></label>
            </div>
            <button style={{ background: settings.accent }} onClick={() => {saveGlobalSettings(settings); setShowSettings(false)}}>SAVE FOR ALL</button>
          </div>
        </div>
      )}
      {zoomImg && <div className="zoom" onClick={() => setZoomImg(null)}><img src={zoomImg} alt="" /></div>}
      <style>{CSS(settings)}</style>
    </div>
  );
}

const CSS = (u) => `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: #000; font-family: -apple-system, sans-serif; color: #fff; overflow: hidden; }
  .layout { height: 100vh; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; position: relative; }
  .no-s::-webkit-scrollbar { display: none; }

  .login-page { justify-content: center; align-items: center; }
  .login-card { width: 280px; padding: 30px; background: rgba(0,0,0,0.9); border-radius: 20px; text-align: center; backdrop-filter: blur(10px); }
  .login-form { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
  .login-card input { padding: 12px; border-radius: 10px; border: 1px solid #222; background: #000; color: #fff; text-align: center; }
  .login-card button { padding: 12px; border-radius: 10px; color: #fff; font-weight: bold; border: none; }

  .sticky-top { position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); width: 100%; }
  .navbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; }
  .nav-btns { display: flex; gap: 8px; align-items: center; }
  .prof-btn, .add-btn { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .pill { font-size: 9px; padding: 5px 10px; border-radius: 15px; font-weight: 800; text-transform: uppercase; }

  .tabs { display: flex; width: 100%; }
  .tabs div { flex: 1; padding: 15px; text-align: center; font-size: 11px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; }

  .fav-filters { display: flex; gap: 8px; padding: 10px 15px; overflow-x: auto; }
  .fav-filters span { padding: 5px 12px; border-radius: 20px; font-size: 9px; font-weight: bold; border: 1px solid; }

  .sakura-box { position: fixed; inset: 0; pointer-events: none; z-index: 1; }
  .petal { position: absolute; top: -50px; animation: fall linear infinite; }
  @keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }

  .feed { flex: 1; padding: 10px 0; display: flex; flex-direction: column; align-items: center; z-index: 5; }
  .card { width: 94%; background: rgba(255,255,255,0.03); border-radius: 22px; overflow: hidden; margin-bottom: 20px; backdrop-filter: blur(10px); }
  .card-top { padding: 10px 15px; font-size: 11px; opacity: 0.5; }
  .scroll { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
  .slide { min-width: 100%; position: relative; scroll-snap-align: start; }
  .m-el { width: 100%; display: block; min-height: 280px; object-fit: cover; }

  .actions { position: absolute; bottom: 15px; right: 15px; display: flex; gap: 10px; align-items: center; }
  .paw-box { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: rgba(0,0,0,0.3); border-radius: 50%; }
  .active svg { animation: pulse 1.5s infinite; filter: drop-shadow(0 0 5px ${u.accent}); }
  @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
  .trash-btn { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(0,0,0,0.5); font-size: 14px; cursor: pointer; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; }
  .modal-card { background: #000; width: 300px; padding: 25px; border-radius: 20px; display: flex; flex-direction: column; gap: 12px; }
  .modal-card input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #222; background: #000; color: #fff; font-size: 13px; }
  .color-row { display: flex; justify-content: space-between; font-size: 11px; }

  .zoom { position: fixed; inset: 0; background: #000; z-index: 3000; display: flex; align-items: center; justify-content: center; }
  .zoom img { max-width: 100%; max-height: 100%; }
`;

export default App;