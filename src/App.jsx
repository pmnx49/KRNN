import React, { useState, useEffect } from 'react';

// ТВОЯ ССЫЛКА ОТ RENDER (уже вставил)
const RENDER_HOST = 'krn-0s8n.onrender.com'; 

function App() {
  const [role, setRole] = useState(null);
  const [passInput, setPassInput] = useState('');
  const [posts, setPosts] = useState([]);
  const [likedFiles, setLikedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState('all'); 
  const [sortOrder, setSortOrder] = useState('new');
  const [zoomImg, setZoomImg] = useState(null);

  // Логика выбора сервера: если ты дома на localhost - работает локально, если в сети - через Render
  const getBaseUrl = () => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://localhost:3000`;
    }
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

  const MediaItem = ({ file }) => {
    const url = `${SERVER_URL}/uploads/${file}`;
    const ext = file.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'mov'].includes(ext)) return <video src={url} controls className="m-el" playsInline />;
    if (['mp3', 'wav', 'm4a'].includes(ext)) return <div className="a-box"><audio src={url} controls /></div>;
    return <img src={url} className="m-el" alt="" onClick={() => setZoomImg(url)} />;
  };

  if (!role) return (
    <div className="layout login-page" style={{ background: user.bg }}>
      <div className="sakura-box">{petals.map((p, i) => <div key={i} className="petal" style={{left:p.left+'vw', animationDelay:p.delay+'s', animationDuration:p.duration+'s', fontSize:p.size+'px'}}>🌸</div>)}</div>
      <div className="login-card" style={{ border: `2px solid ${user.accent}` }}>
        <h1 style={{ color: user.accent }}>KRN SYSTEM</h1>
        <input type="password" placeholder="ENTER CODE" onChange={e => setPassInput(e.target.value)} />
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
            <label className="add" style={{ background: user.accent }}>ADD<input type="file" multiple onChange={(e)=>{
              setLoading(true); const fd = new FormData(); for(let f of e.target.files) fd.append('files', f);
              fetch(`${SERVER_URL}/upload`, {method:'POST', body:fd}).then(()=>{fetchData(); setLoading(false);});
            }} hidden /></label>
          )}
        </div>
      </header>
      <div className="tabs">
        <div onClick={() => setViewMode('all')} style={{ color: viewMode === 'all' ? user.accent : '#555', borderBottom: viewMode === 'all' ? `3px solid ${user.accent}` : 'none' }}>STREAM</div>
        <div onClick={() => setViewMode('favorites')} style={{ color: viewMode === 'favorites' ? user.accent : '#555', borderBottom: viewMode === 'favorites' ? `3px solid ${user.accent}` : 'none' }}>PRIVATE ❤️</div>
      </div>
      <main className="feed">
        {posts.map((post, idx) => {
          let items = post.items.filter(f => viewMode === 'favorites' ? likedFiles.includes(f) : true);
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
  * { box-sizing: border-box; }
  body { margin: 0; background: #000; font-family: sans-serif; overflow: hidden; color: #fff; }
  .layout { height: 100vh; width: 100vw; overflow-y: auto; overflow-x: hidden; position: relative; display: flex; flex-direction: column; align-items: center; }
  .login-page { justify-content: center; }
  .no-s::-webkit-scrollbar { display: none; }
  .sakura-box { position: fixed; inset: 0; pointer-events: none; z-index: 1; }
  .petal { position: absolute; top: -100px; animation: fall linear infinite; }
  @keyframes fall { to { transform: translateY(115vh) rotate(360deg); } }
  .login-card { width: 90%; max-width: 320px; padding: 40px; background: rgba(0,0,0,0.9); border-radius: 30px; text-align: center; z-index: 10; backdrop-filter: blur(10px); }
  .login-card input { width: 100%; padding: 12px; margin-bottom: 20px; border-radius: 10px; border: 1px solid #333; background: #000; color: #fff; text-align: center; }
  .login-card button { width: 100%; padding: 12px; border: none; border-radius: 10px; color: #fff; font-weight: bold; cursor: pointer; }
  .guest { margin-top: 20px; color: #444; font-size: 11px; cursor: pointer; }
  .navbar { position: sticky; top: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px); padding: 12px 20px; width: 100%; max-width: 800px; display: flex; justify-content: space-between; align-items: center; z-index: 100; border-bottom: 1px solid #111; }
  .nav-right { display: flex; gap: 15px; align-items: center; }
  .prof { width: 35px; height: 35px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; background-color: #111; }
  .pill { font-size: 10px; padding: 5px 10px; border-radius: 15px; cursor: pointer; font-weight: bold; }
  .add { padding: 7px 15px; border-radius: 8px; color: #fff; font-size: 11px; font-weight: bold; cursor: pointer; }
  .tabs { width: 100%; max-width: 800px; background: rgba(0,0,0,0.5); display: flex; text-align: center; font-weight: bold; font-size: 13px; }
  .tabs div { flex: 1; padding: 15px; cursor: pointer; }
  .feed { width: 100%; max-width: 600px; padding: 20px 0; display: flex; flex-direction: column; align-items: center; z-index: 5; }
  .card { width: 95%; background: rgba(255,255,255,0.03); border-radius: 25px; overflow: hidden; margin-bottom: 30px; }
  .card-top { padding: 12px 20px; color: #fff; font-size: 14px; }
  .scroll { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
  .slide { min-width: 100%; scroll-snap-align: start; position: relative; }
  .m-el { width: 100%; display: block; }
  .a-box { padding: 40px 20px; background: #111; } audio { width: 100%; }
  .like { position: absolute; top: 15px; right: 15px; font-size: 32px; cursor: pointer; filter: drop-shadow(0 0 10px #000); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 3000; display: flex; align-items: center; justify-content: center; }
  .modal-card { background: #111; width: 90%; max-width: 320px; padding: 30px; border-radius: 25px; display: flex; flex-direction: column; gap: 15px; text-align: center; }
  .modal-card input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #333; background: #000; color: #fff; }
  .colors { display: flex; justify-content: space-around; font-size: 12px; }
  .zoom { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 4000; display: flex; align-items: center; justify-content: center; }
  .zoom img { max-width: 100%; max-height: 100%; object-fit: contain; }
`;

export default App;