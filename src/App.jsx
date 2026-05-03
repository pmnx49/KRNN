import React, { useState, useEffect } from 'react';

// ТВОЯ ССЫЛКА ОТ RENDER
const RENDER_HOST = 'krn-0s8n.onrender.com'; 

function App() {
  const [role, setRole] = useState(null);
  const [passInput, setPassInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [likedFiles, setLikedFiles] = useState([]);
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

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('krn_user');
    return saved ? JSON.parse(saved) : {
      name: 'NONA', avatar: '', bg: '#050505', accent: '#ff2d55', adminPass: 'Ll653211', friendPass: '777'
    };
  });

  const [petals] = useState(() =>
    [...Array(20)].map(() => ({
      left: Math.random() * 100, delay: Math.random() * 10, duration: 7 + Math.random() * 7, size: 15 + Math.random() * 10
    }))
  );

  useEffect(() => { localStorage.setItem('krn_user', JSON.stringify(user)); }, [user]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/files`);
      const data = await res.json();
      setLikedFiles(data.likes || []);
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
    if (passInput === user.adminPass) setRole('admin');
    else if (passInput === user.friendPass) setRole('friend');
    else if (passInput !== "") alert('DENIED');
  };

  const toggleLike = async (f) => {
    const res = await fetch(`${SERVER_URL}/toggle-like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: f })
    });
    const newLikes = await res.json();
    setLikedFiles(newLikes);
  };

  const handleUpload = async (e) => {
    setLoading(true);
    const files = e.target.files;
    const fd = new FormData();
    for (let f of files) fd.append('files', f);

    try {
      const res = await fetch(`${SERVER_URL}/upload`, { method: 'POST', body: fd });
      const uploadedFiles = await res.json(); 
      
      if (viewMode === 'favorites' && Array.isArray(uploadedFiles)) {
        for (let fileName of uploadedFiles) {
          await toggleLike(fileName);
        }
      }
      await fetchData();
    } catch (err) {
      console.error("Upload failed", err);
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

  if (!role) return (
    <div className="layout login-page" style={{ background: user.bg }}>
      <div className="sakura-box">{petals.map((p, i) => <div key={i} className="petal" style={{left:p.left+'vw', animationDelay:p.delay+'s', animationDuration:p.duration+'s', fontSize:p.size+'px'}}>🌸</div>)}</div>
      <div className="login-card" style={{ border: `2px solid ${user.accent}` }}>
        <h1 style={{ color: user.accent }}>KRN SYSTEM</h1>
        <input type="password" placeholder="ENTER CODE" onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        <button style={{ background: user.accent }} onClick={handleLogin}>INITIALIZE</button>
        <div className="guest" onClick={() => setRole('guest')}>GUEST ACCESS</div>
      </div>
      <style>{CSS(user)}</style>
    </div>
  );

  return (
    <div className="layout" style={{ background: user.bg }}>
      <div className="sakura-box">{petals.map((p, i) => <div key={i} className="petal" style={{left:p.left+'vw', animationDelay:p.delay+'s', animationDuration:p.duration+'s', fontSize:p.size+'px'}}>🌸</div>)}</div>
      
      <div className="sticky-top">
        <header className="navbar" style={{ borderBottom: `1px solid ${user.accent}40` }}>
          <div className="logo" onClick={() => setRole(null)}>⛩️</div>
          <div className="nav-right">
            <div className="pill" onClick={() => setSortOrder(sortOrder === 'new' ? 'old' : 'new')} style={{ border: `1px solid ${user.accent}`, color: user.accent }}>
              {sortOrder === 'new' ? 'NEW' : 'OLD'}
            </div>
            <div className="prof" onClick={() => setShowSettings(!showSettings)} style={{ border: `1px solid ${user.accent}`, backgroundImage: `url(${user.avatar})`, backgroundSize:'cover' }}>
              {!user.avatar && '⚙️'}
            </div>
            {role === 'admin' && (
              <label className="add" style={{ background: user.accent }}>
                {viewMode === 'favorites' ? '🔒+' : '+'}
                <input type="file" multiple onChange={handleUpload} hidden />
              </label>
            )}
          </div>
        </header>

        <div className="tabs">
          <div onClick={() => setViewMode('all')} style={{ color: viewMode === 'all' ? user.accent : '#555', borderBottom: viewMode === 'all' ? `2px solid ${user.accent}` : 'none' }}>STREAM</div>
          {(role === 'admin' || role === 'friend') && (
            <div onClick={() => setViewMode('favorites')} style={{ color: viewMode === 'favorites' ? user.accent : '#555', borderBottom: viewMode === 'favorites' ? `2px solid ${user.accent}` : 'none' }}>PRIVATE ❤️</div>
          )}
        </div>

        {viewMode === 'favorites' && (
          <div className="fav-filters no-s">
            {['all', 'photo', 'video', 'audio'].map(f => (
              <span key={f} onClick={() => setFavFilter(f)} style={{ background: favFilter === f ? user.accent : 'transparent', border: `1px solid ${user.accent}`, color: favFilter === f ? '#fff' : user.accent }}>
                {f.toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      <main className="feed">
        {loading && <div className="loader" style={{color: user.accent}}>UPLOADING...</div>}
        {posts.map((post, idx) => {
          let items = post.items.filter(f => {
            const isLiked = likedFiles.includes(f);
            if (viewMode === 'favorites') {
              return isLiked && (favFilter === 'all' || getFileType(f) === favFilter);
            }
            return !isLiked;
          });

          if (items.length === 0) return null;

          return (
            <div key={idx} className="card" style={{ border: `1px solid ${user.accent}20` }}>
              <div className="card-top"><b>{user.name}</b></div>
              <div className="scroll no-s">
                {items.map((file, i) => (
                  <div key={i} className="slide">
                    <MediaItem file={file} />
                    {/* ЛАЙКИ ТЕПЕРЬ ТОЛЬКО ДЛЯ АДМИНА */}
                    {role === 'admin' && (
                      <div className={`like ${likedFiles.includes(file) ? 'active' : ''}`} onClick={() => toggleLike(file)} style={{ color: likedFiles.includes(file) ? user.accent : '#fff' }}>
                        {likedFiles.includes(file) ? '❤️' : '🤍'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ border: `1px solid ${user.accent}` }}>
            <h3>SETTINGS</h3>
            <input type="text" placeholder="Name" value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
            <input type="text" placeholder="Avatar URL" value={user.avatar} onChange={e => setUser({...user, avatar: e.target.value})} />
            <div className="colors">
              <label>Accent <input type="color" value={user.accent} onChange={e => setUser({...user, accent: e.target.value})} /></label>
              <label>BG <input type="color" value={user.bg} onChange={e => setUser({...user, bg: e.target.value})} /></label>
            </div>
            <button style={{ background: user.accent }} onClick={() => setShowSettings(false)}>SAVE</button>
          </div>
        </div>
      )}
      {zoomImg && <div className="zoom" onClick={() => setZoomImg(null)}><img src={zoomImg} alt="" /></div>}
      <style>{CSS(user)}</style>
    </div>
  );
}

const CSS = (u) => `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; transition: 0.2s; }
  body { margin: 0; background: #000; font-family: -apple-system, system-ui, sans-serif; color: #fff; overflow: hidden; }
  .layout { height: 100vh; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; position: relative; }
  .no-s::-webkit-scrollbar { display: none; }
  .sticky-top { position: sticky; top: 0; z-index: 100; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); width: 100%; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .navbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; }
  .nav-right { display: flex; gap: 8px; align-items: center; }
  .logo { font-size: 20px; cursor: pointer; }
  .pill { font-size: 9px; padding: 5px 10px; border-radius: 10px; font-weight: bold; text-transform: uppercase; cursor: pointer; }
  .prof { width: 34px; height: 34px; border-radius: 10px; background: #111; display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer; }
  .add { padding: 8px 14px; border-radius: 10px; color: #fff; font-size: 13px; font-weight: bold; cursor: pointer; }
  .tabs { display: flex; }
  .tabs div { flex: 1; padding: 14px; text-align: center; font-size: 11px; font-weight: 900; letter-spacing: 1px; cursor: pointer; }
  .fav-filters { display: flex; gap: 8px; padding: 12px 15px; overflow-x: auto; white-space: nowrap; }
  .fav-filters span { padding: 6px 14px; border-radius: 18px; font-size: 9px; font-weight: bold; flex-shrink: 0; cursor: pointer; }
  .sakura-box { position: fixed; inset: 0; pointer-events: none; z-index: 1; }
  .petal { position: absolute; top: -100px; animation: fall linear infinite; }
  @keyframes fall { to { transform: translateY(115vh) rotate(360deg); } }
  .feed { flex: 1; padding: 15px 0; display: flex; flex-direction: column; align-items: center; z-index: 5; }
  .card { width: 94%; background: rgba(255,255,255,0.03); border-radius: 24px; overflow: hidden; margin-bottom: 25px; backdrop-filter: blur(5px); }
  .card-top { padding: 12px 18px; font-size: 12px; font-weight: 600; }
  .scroll { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
  .slide { min-width: 100%; scroll-snap-align: start; position: relative; }
  .m-el { width: 100%; display: block; object-fit: cover; min-height: 250px; background: #000; cursor: pointer; }
  .a-box { padding: 50px 20px; background: #050505; display: flex; justify-content: center; }
  audio { width: 100%; filter: invert(1) hue-rotate(180deg); opacity: 0.6; }
  .like { position: absolute; bottom: 20px; right: 20px; font-size: 26px; cursor: pointer; filter: drop-shadow(0 0 8px rgba(0,0,0,0.4)); }
  .login-page { justify-content: center; align-items: center; height: 100vh; }
  .login-card { width: 290px; padding: 35px; background: #000; border-radius: 28px; text-align: center; z-index: 10; backdrop-filter: blur(10px); }
  .login-card h1 { margin-bottom: 25px; font-size: 22px; letter-spacing: 2px; }
  .login-card input { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 10px; border: 1px solid #222; background: #000; color: #fff; text-align: center; font-size: 16px; }
  .login-card button { width: 100%; padding: 12px; border: none; border-radius: 10px; color: #fff; font-weight: bold; cursor: pointer; letter-spacing: 1px; }
  .guest { margin-top: 20px; font-size: 10px; opacity: 0.4; cursor: pointer; text-decoration: underline; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(15px); }
  .modal-card { background: #000; width: 85%; max-width: 300px; padding: 25px; border-radius: 24px; display: flex; flex-direction: column; gap: 15px; }
  .modal-card input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #222; background: #000; color: #fff; font-size: 13px; }
  .colors { display: flex; justify-content: space-between; font-size: 11px; align-items: center; }
  .zoom { position: fixed; inset: 0; background: #000; z-index: 3000; display: flex; align-items: center; justify-content: center; }
  .zoom img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .loader { padding: 30px; font-size: 11px; font-weight: bold; letter-spacing: 3px; animation: pulse 1s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
`;

export default App;