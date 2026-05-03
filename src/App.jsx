import React, { useState, useEffect } from 'react';

// ТВОЯ ССЫЛКА ОТ RENDER
const RENDER_HOST = 'krn-0s8n.onrender.com'; 

function App() {
  const [role, setRole] = useState(null); // null, 'admin', 'friend', 'guest'
  const [passInput, setPassInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [likedFiles, setLikedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all' или 'favorites'
  const [favFilter, setFavFilter] = useState('all'); // 'all', 'photo', 'video', 'audio'
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
    setLikedFiles(await res.json());
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
      
      <header className="navbar" style={{ borderBottom: `2px solid ${user.accent}` }}>
        <div className="logo" onClick={() => setRole(null)}>⛩️</div>
        <div className="nav-right">
          <div className="pill" onClick={() => setSortOrder(sortOrder === 'new' ? 'old' : 'new')} style={{ border: `1px solid ${user.accent}`, color: user.accent }}>{sortOrder === 'new' ? 'NEW' : 'OLD'}</div>
          <div className="prof" onClick={() => setShowSettings(!showSettings)} style={{ border: `1px solid ${user.accent}`, backgroundImage: `url(${user.avatar})`, backgroundSize:'cover' }}>{!user.avatar && '⚙️'}</div>
          {role === 'admin' && (
            <label className="add" style={{ background: user.accent }}>+<input type="file" multiple onChange={(e)=>{
              setLoading(true); const fd = new FormData(); for(let f of e.target.files) fd.append('files', f);
              fetch(`${SERVER_URL}/upload`, {method:'POST', body:fd}).then(()=>{fetchData(); setLoading(false);});
            }} hidden /></label>
          )}
        </div>
      </header>

      <div className="tabs">
        <div onClick={() => setViewMode('all')} style={{ color: viewMode === 'all' ? user.accent : '#555', borderBottom: viewMode === 'all' ? `3px solid ${user.accent}` : 'none' }}>STREAM</div>
        {/* СКРЫВАЕМ ВКЛАДКУ ОТ ГОСТЯ */}
        {(role === 'admin' || role === 'friend') && (
          <div onClick={() => setViewMode('favorites')} style={{ color: viewMode === 'favorites' ? user.accent : '#555', borderBottom: viewMode === 'favorites' ? `3px solid ${user.accent}` : 'none' }}>PRIVATE ❤️</div>
        )}
      </div>

      {/* ФИЛЬТРЫ ДЛЯ ИЗБРАННОГО */}
      {viewMode === 'favorites' && (
        <div className="fav-filters">
          {['all', 'photo', 'video', 'audio'].map(f => (
            <span key={f} onClick={() => setFavFilter(f)} style={{ background: favFilter === f ? user.accent : 'transparent', border: `1px solid ${user.accent}` }}>
              {f.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      <main className="feed">
        {loading && <div className="loader" style={{color: user.accent}}>UPLOADING...</div>}
        {posts.map((post, idx) => {
          let items = post.items.filter(f => {
            if (viewMode === 'favorites') {
              const isLiked = likedFiles.includes(f);
              const typeMatch = favFilter === 'all' || getFileType(f) === favFilter;
              return isLiked && typeMatch;
            }
            return true;
          });

          if (items.length === 0) return null;

          return (
            <div key={idx} className="card" style={{ border: `1px solid ${user.accent}20` }}>
              <div className="card-top"><b>{user.name}</b></div>
              <div className="scroll no-s">
                {items.map((file, i) => (
                  <div key={i} className="slide">
                    <MediaItem file={file} />
                    {(role === 'admin' || role === 'friend') && (
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
              <label>Accent: <input type="color" value={user.accent} onChange={e => setUser({...user, accent: e.target.value})} /></label>
              <label>BG: <input type="color" value={user.bg} onChange={e => setUser({...user, bg: e.target.value})} /></label>
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
  * { box-sizing: border-box; transition: 0.3s; }
  body { margin: 0; background: #000; font-family: 'Segoe UI', sans-serif; overflow: hidden; color: #fff; }
  .layout { height: 100vh; width: 100vw; overflow-y: auto; overflow-x: hidden; position: relative; display: flex; flex-direction: column; align-items: center; }
  .login-page { justify-content: center; }
  .no-s::-webkit-scrollbar { display: none; }
  .sakura-box { position: fixed; inset: 0; pointer-events: none; z-index: 1; }
  .petal { position: absolute; top: -100px; animation: fall linear infinite; }
  @keyframes fall { to { transform: translateY(115vh) rotate(360deg); } }
  
  .login-card { width: 90%; max-width: 320px; padding: 40px; background: rgba(0,0,0,0.9); border-radius: 30px; text-align: center; z-index: 10; backdrop-filter: blur(10px); }
  .login-card input { width: 100%; padding: 12px; margin-bottom: 20px; border-radius: 10px; border: 1px solid #333; background: #000; color: #fff; text-align: center; font-size: 16px; }
  .login-card button { width: 100%; padding: 12px; border: none; border-radius: 10px; color: #fff; font-weight: bold; cursor: pointer; letter-spacing: 2px; }
  
  .navbar { position: sticky; top: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(15px); padding: 12px 20px; width: 100%; max-width: 800px; display: flex; justify-content: space-between; align-items: center; z-index: 100; }
  .nav-right { display: flex; gap: 12px; align-items: center; }
  .prof { width: 38px; height: 38px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; background-color: #111; border: 1px solid #222; }
  .add { width: 38px; height: 38px; border-radius: 12px; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; cursor: pointer; }
  
  .tabs { width: 100%; max-width: 800px; display: flex; justify-content: center; background: rgba(0,0,0,0.3); }
  .tabs div { flex: 1; padding: 18px; cursor: pointer; text-align: center; font-size: 12px; letter-spacing: 1px; font-weight: 800; }
  
  .fav-filters { display: flex; gap: 10px; padding: 15px; width: 100%; max-width: 600px; justify-content: center; overflow-x: auto; }
  .fav-filters span { padding: 6px 15px; border-radius: 20px; font-size: 10px; font-weight: bold; cursor: pointer; white-space: nowrap; }

  .feed { width: 100%; max-width: 600px; padding: 10px 0; z-index: 5; }
  .card { width: 95%; background: rgba(255,255,255,0.02); border-radius: 25px; overflow: hidden; margin: 0 auto 25px auto; backdrop-filter: blur(5px); }
  .card-top { padding: 15px 20px; font-size: 13px; letter-spacing: 1px; }
  .scroll { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
  .slide { min-width: 100%; scroll-snap-align: start; position: relative; }
  .m-el { width: 100%; display: block; min-height: 200px; object-fit: cover; }
  .a-box { padding: 50px 20px; background: #0a0a0a; display: flex; justify-content: center; }
  audio { filter: invert(1); width: 90%; opacity: 0.7; }
  
  .like { position: absolute; bottom: 20px; right: 20px; font-size: 28px; cursor: pointer; filter: drop-shadow(0 0 10px rgba(0,0,0,0.5)); z-index: 2; }
  .loader { text-align: center; padding: 20px; font-weight: bold; font-size: 12px; animation: pulse 1s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 3000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
  .modal-card { background: #000; width: 90%; max-width: 320px; padding: 30px; border-radius: 30px; display: flex; flex-direction: column; gap: 15px; }
  .modal-card input { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #222; background: #0a0a0a; color: #fff; }
  
  .zoom { position: fixed; inset: 0; background: rgba(0,0,0,0.98); z-index: 4000; display: flex; align-items: center; justify-content: center; }
  .zoom img { max-width: 95%; max-height: 90%; border-radius: 10px; }
`;

export default App;