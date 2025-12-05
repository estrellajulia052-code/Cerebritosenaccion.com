import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate
} from 'react-router-dom';

// Cerebritos en acción — Proyecto React (single-file)
// --------------------------------------------------
// Este archivo es un prototipo listo para pegar en un proyecto Create React App / Vite.
// Requisitos (sugeridos):
// - React 18+, react-router-dom
// - TailwindCSS (opcional — se añaden clases Tailwind en el marcado). Si no usas Tailwind, el HTML seguirá funcionando pero tendrás que añadir estilos CSS.
// - En producción: sustituir almacenamiento local por servidor seguro, añadir autenticación parental real y moderación.

// Estructura incluida:
// - Rutas: / (inicio), /juegos, /contenido, /recursos, /creatividad, /campus, /login, /admin
// - Autenticación simulada para padres/maestros (PIN) con almacenamiento en localStorage
// - Persistencia de perfil y progreso en localStorage (simula una base de datos)
// - Componentes: navegación accesible, perfil, juegos básicos (sumas), lector, colorear, panel administrativo
// - Seguridad: áreas protegidas por rol (admin/parent)
// - Notas dentro del archivo sobre qué mejorar para producción (filtros, moderación, privacidad)

// ---------------------- Utilities ----------------------
const STORAGE_KEY = 'cerebritos_v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function useAppState() {
  const [state, setState] = useState(() => {
    const s = loadState();
    if (s) return s;
    const initial = {
      users: {
        // ejemplo: parent account
        parent: { role: 'parent', pin: '1234' }
      },
      profiles: {
        child1: { id: 'child1', name: 'Amiguito', avatar: '🦊', level: 1, points: 0, badges: [] }
      },
      sessions: { currentUser: null, currentProfileId: 'child1' }
    };
    saveState(initial);
    return initial;
  });

  useEffect(()=>{ saveState(state); }, [state]);

  function updateProfile(id, patch){
    setState(s => ({ ...s, profiles: { ...s.profiles, [id]: { ...s.profiles[id], ...patch } } }));
  }

  function awardPoints(profileId, points){
    setState(s => {
      const p = s.profiles[profileId];
      if (!p) return s;
      const newPoints = p.points + points;
      const newBadges = [...p.badges];
      if (newPoints >= 20 && !newBadges.includes('Bronce')) newBadges.push('Bronce');
      if (newPoints >= 50 && !newBadges.includes('Plata')) newBadges.push('Plata');
      if (newPoints >= 100 && !newBadges.includes('Oro')) newBadges.push('Oro');
      return { ...s, profiles: { ...s.profiles, [profileId]: { ...p, points: newPoints, badges: newBadges } } };
    });
  }

  function loginAsParent(pin){
    const found = Object.entries(state.users).find(([k,v])=> v.role === 'parent' && v.pin === pin);
    if (found) {
      setState(s => ({ ...s, sessions: { ...s.sessions, currentUser: found[0] } }));
      return true;
    }
    return false;
  }

  function logout(){
    setState(s => ({ ...s, sessions: { ...s.sessions, currentUser: null } }));
  }

  return { state, updateProfile, awardPoints, loginAsParent, logout, setState };
}

// ---------------------- SEO ----------------------
import { Helmet } from 'react-helmet';

// ---------------------- App ----------------------
export default function App(){
  const app = useAppState();
  return (
    <Router>
      <Helmet>
        <title>Cerebritos en Acción — Plataforma Educativa Infantil</title>
        <meta name="description" content="Juegos educativos, actividades, lectura, creatividad y campus virtual para niños. Plataforma segura para el aprendizaje." />
        <meta name="keywords" content="educación, niños, juegos educativos, matemáticas, lectura, creatividad" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-indigo-100 to-yellow-50 text-gray-800 p-4">
        <Header app={app} />
        <main className="max-w-6xl mx-auto mt-6">
          <Routes>
            <Route path="/" element={<Home app={app} />} />
            <Route path="/juegos" element={<Juegos app={app} />} />
            <Route path="/contenido" element={<Contenido app={app} />} />
            <Route path="/recursos" element={<Recursos app={app} />} />
            <Route path="/creatividad" element={<Creatividad app={app} />} />
            <Route path="/campus" element={<Campus app={app} />} />
            <Route path="/login" element={<Login app={app} />} />
            <Route path="/admin" element={<Protected app={app}><Admin app={app} /></Protected>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <footer className="max-w-6xl mx-auto mt-6 text-center text-sm text-gray-600">Diseñado para niños: colores vivos, interacción simple y sin publicidad invasiva. Prototipo.</footer>
      </div>
    </Router>
  );
}

// ---------------------- Header ----------------------
function Header({ app }){
  const profile = app.state.profiles[app.state.sessions.currentProfileId];
  const navigate = useNavigate();
  return (
    <header className="max-w-6xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-2xl font-extrabold">Cerebritos en acción</Link>
        <nav className="hidden md:flex gap-2 ml-4">
          <NavLink to="/juegos">Juegos</NavLink>
          <NavLink to="/contenido">Contenido</NavLink>
          <NavLink to="/creatividad">Creatividad</NavLink>
          <NavLink to="/campus">Campus</NavLink>
          <NavLink to="/recursos">Recursos</NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {profile && (
          <div className="rounded-full w-12 h-12 bg-yellow-100 flex items-center justify-center text-2xl">{profile.avatar}</div>
        )}
        <div className="text-sm">
          <div className="font-semibold">{profile?.name ?? 'Invitado'}</div>
          <div className="text-xs text-gray-600">Nivel {profile?.level ?? '-'} · {profile?.points ?? 0} pts</div>
        </div>
        <div>
          {app.state.sessions.currentUser ? (
            <button onClick={()=>{ app.logout(); navigate('/'); }} className="px-3 py-2 rounded bg-gray-200">Salir</button>
          ) : (
            <Link to="/login" className="px-3 py-2 rounded bg-indigo-200">Panel Padre</Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, children }){
  return <Link to={to} className="px-3 py-1 rounded hover:bg-indigo-100">{children}</Link>;
}

// ---------------------- Protected route ----------------------
function Protected({ app, children }){
  if (!app.state.sessions.currentUser) return <Navigate to="/login" />;
  return children;
}

// ---------------------- Pages ----------------------

function PuzzleGame({ award }){
  const [tiles, setTiles] = React.useState(()=>shuffle([...Array(9).keys()]));
  const img = 'https://picsum.photos/300';

  function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }

  function swap(i){
    // very simple swap puzzle: swap clicked tile with first tile
    setTiles(t => {
      const copy = [...t];
      const temp = copy[0];
      copy[0] = copy[i];
      copy[i] = temp;
      // check solved
      const solved = copy.every((v,i)=>v===i);
      if (solved) award(8);
      return copy;
    });
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white to-gray-50">
      <div className="font-semibold">Rompecabezas</div>
      <p className="text-sm text-gray-600 mt-1">Ordena las piezas hasta formar la imagen</p>
      <div className="grid grid-cols-3 gap-1 mt-3 w-48 h-48">
        {tiles.map((t,i)=>(
          <div
            key={i}
            onClick={()=>swap(i)}
            className="cursor-pointer bg-gray-200"
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: '300px 300px',
              backgroundPosition: `${-(t%3)*100}px ${-Math.floor(t/3)*100}px`
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------- Pages ----------------------
function Home({ app }){
  const profile = app.state.profiles[app.state.sessions.currentProfileId];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold">¡Hola {profile?.name ?? 'Amiguito'}!</h2>
        <p className="mt-2">Escoge una actividad: Juegos, Lectura, Creatividad o visita el Campus Virtual.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard title="Juegos y Actividades" to="/juegos" desc="Matemáticas, lectura y memoria" emoji="🎮" />
          <FeatureCard title="Contenido por Materia" to="/contenido" desc="Libros interactivos y videos" emoji="📚" />
          <FeatureCard title="Creatividad" to="/creatividad" desc="Colorear, manualidades" emoji="🎨" />
          <FeatureCard title="Campus Virtual" to="/campus" desc="Cursos cortos y seguimiento" emoji="🏫" />
        </div>
      </div>

      <aside className="bg-white rounded-2xl shadow p-6">
        <h3 className="font-semibold">Progreso rápido</h3>
        <div className="mt-3">Nivel: {profile?.level}</div>
        <div>Puntos: {profile?.points}</div>
        <div className="mt-2">Insignias: {profile?.badges.join(', ') || '—'}</div>
      </aside>
    </div>
  );
}

function FeatureCard({ title, to, desc, emoji }){
  return (
    <Link to={to} className="p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md flex items-center gap-4 hover:scale-102 transition-transform">
      <div className="text-3xl">{emoji}</div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-600">{desc}</div>
      </div>
    </Link>
  );
}

function Juegos({ app }){
  const profileId = app.state.sessions.currentProfileId;
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Juegos y Actividades</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MathGame award={(n)=>app.awardPoints(profileId, n)} />
        <ReadingMini award={(n)=>app.awardPoints(profileId, n)} />
        <MemoryPlaceholder />
        <PuzzleGame award={(n)=>app.awardPoints(profileId, n)} />
        <div className="p-4 rounded-xl bg-indigo-50">Más juegos se pueden añadir aquí (puzzles visuales, fonética, emparejar parejas).</div>
      </div>
    </div>
  );
}

function MathGame({ award }){
  const [[a, b], setAB] = useState(randomPair(5));
  const [correct, setCorrect] = useState(null);
  function next(difficulty=10){ const [na, nb] = randomPair(difficulty); setAB([na,nb]); setCorrect(null); }
  function check(val){ const is = val === a + b; setCorrect(is); if (is) award(5); }
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white to-gray-50">
      <div className="font-semibold text-lg">Matemáticas — Sumas</div>
      <div className="mt-2 text-xl">¿Cuánto es {a} + {b} ?</div>
      <div className="mt-3 flex gap-2 flex-wrap">
        {Array.from({length:12}).map((_,i)=>(
          <button key={i} onClick={()=>check(i+1)} className="px-3 py-2 rounded bg-indigo-100">{i+1}</button>
        ))}
      </div>
      {correct === true && <div className="mt-3 text-green-700 font-bold">¡Correcto! +5 pts</div>}
      {correct === false && <div className="mt-3 text-red-600 font-bold">Intenta otra vez</div>}
      <div className="mt-3 flex gap-2">
        <button onClick={()=>next(10)} className="px-3 py-2 rounded bg-yellow-200">Siguiente</button>
        <button onClick={()=>next(20)} className="px-3 py-2 rounded bg-yellow-200">Más difícil</button>
      </div>
    </div>
  );
}

function randomPair(max){
  const a = Math.floor(Math.random()*max)+1;
  const b = Math.floor(Math.random()*max)+1;
  return [a,b];
}

function ReadingMini({ award }){
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white to-gray-50">
      <div className="font-semibold">Lectura — Mini cuento</div>
      <p className="mt-2">El conejito Valiente va al bosque y encuentra una sorpresa. (Texto corto y claro — añadir audio en producción)</p>
      <div className="mt-3 flex gap-2">
        <button onClick={()=>award(2)} className="px-3 py-2 rounded bg-green-200">Leer en voz alta</button>
        <button onClick={()=>award(1)} className="px-3 py-2 rounded bg-green-200">Marcar como leído</button>
      </div>
    </div>
  );
}

function MemoryPlaceholder(){
  return (
    <div className="p-4 rounded-xl bg-indigo-50">Juego de memoria - placeholder (implementar tablero visual con tarjetas grandes)</div>
  );
}

function Contenido({ app }){
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Contenido por Materia</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Subject title="Matemáticas" items={["Juegos de suma","Contar con objetos","Problemas visuales"]} />
        <Subject title="Lectura" items={["Libros interactivos","Fonética","Audiocuentos"]} />
        <Subject title="Ciencias" items={["Experimentos seguros","Videos cortos","Observación"]} />
      </div>
    </div>
  );
}

function Subject({ title, items }){
  return (
    <div className="p-4 rounded-xl bg-indigo-50">
      <div className="font-semibold">{title}</div>
      <ul className="list-disc list-inside mt-2">
        {items.map((it,i)=>(<li key={i}>{it}</li>))}
      </ul>
    </div>
  );
}

function Recursos(){
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Recursos para Padres y Maestros</h2>
      <ul className="list-disc list-inside">
        <li>Plantillas de seguimiento (descargables)</li>
        <li>Guías paso a paso para adaptar actividades</li>
        <li>Consejos para control parental y filtros</li>
      </ul>
    </div>
  );
}

function Creatividad({ app }){
  const profileId = app.state.sessions.currentProfileId;
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Creatividad</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Coloring award={(n)=>app.awardPoints(profileId, n)} />
        <div className="p-4 rounded-xl bg-indigo-50">
          <div className="font-semibold">Manualidades</div>
          <ol className="list-decimal list-inside mt-2">
            <li>Marionetas con calcetines</li>
            <li>Tarjetas de agradecimiento</li>
            <li>Collares de pasta (supervisado)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Coloring({ award }){
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#ff0000');
  const [brush, setBrush] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(()=>{
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.width = 800; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff8ea';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  },[]);

  function start(e){ setIsDrawing(true); draw(e); }
  function end(){ setIsDrawing(false); }
  function draw(e){ if (!isDrawing) return; const c = canvasRef.current; const rect = c.getBoundingClientRect(); const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left; const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top; const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x,y,brush,0,Math.PI*2); ctx.fill(); }
  function clearCanvas(){ const c = canvasRef.current; const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); ctx.fillStyle = '#fff8ea'; ctx.fillRect(0,0,c.width,c.height); }

  function finish(){ award(10); alert('¡Obra terminada! +10 puntos'); }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-white to-gray-50">
      <div className="font-semibold">Colorear</div>
      <div className="mt-2 flex gap-2 items-center">
        <input type="color" value={color} onChange={e=>setColor(e.target.value)} aria-label="color" />
        <label className="text-sm">Tamaño</label>
        <input type="range" min="1" max="30" value={brush} onChange={e=>setBrush(Number(e.target.value))} />
        <button onClick={clearCanvas} className="px-2 py-1 rounded bg-gray-100">Borrar</button>
        <button onClick={finish} className="px-2 py-1 rounded bg-green-200">Terminar</button>
      </div>
      <div className="mt-2 border rounded-lg overflow-hidden">
        <canvas ref={canvasRef} style={{width:'100%', height:300}} onMouseDown={start} onMouseUp={end} onMouseMove={draw} onTouchStart={start} onTouchEnd={end} onTouchMove={draw} />
      </div>
    </div>
  );
}

function Campus(){
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Campus Virtual</h2>
      <p>Área con cursos cortos, seguimiento y foros controlados para padres y docentes. En producción: foros moderados y roles separados.</p>
    </div>
  );
}

// ---------------------- Login / Admin ----------------------
function Login({ app }){
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  function submit(){
    const ok = app.loginAsParent(pin);
    if (ok){ navigate('/admin'); } else { setError('PIN incorrecto'); }
  }
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Acceso parental</h2>
      <p className="text-sm text-gray-600">Introduce el PIN para acceder al panel de padres/maestros.</p>
      <input className="mt-3 p-2 border rounded w-full" placeholder="PIN" value={pin} onChange={e=>setPin(e.target.value)} />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <div className="mt-3 flex gap-2">
        <button onClick={submit} className="px-3 py-2 rounded bg-indigo-200">Entrar</button>
        <Link to="/" className="px-3 py-2 rounded bg-gray-100">Volver</Link>
      </div>
    </div>
  );
}

function Admin({ app }){
  const profiles = Object.values(app.state.profiles);
  const users = app.state.users;
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Panel de padres / administración</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-indigo-50">
          <div className="font-semibold">Perfiles</div>
          {profiles.map(p => (
            <div key={p.id} className="mt-2 border-b pb-2">
              <div className="font-medium">{p.name} {p.avatar}</div>
              <div className="text-sm text-gray-600">Puntos: {p.points} · Nivel: {p.level} · Insignias: {p.badges.join(', ')}</div>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-xl bg-indigo-50">
          <div className="font-semibold">Cuentas</div>
          <div className="text-sm mt-2">Usuarios configurados: {Object.keys(users).length}</div>
          <div className="mt-3">En producción aquí podrías: crear cuentas parentales, revisar actividad, aprobar contenido y configurar filtros.</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------- Montaje (para entornos que peguen este archivo en index.js) ----------------------
if (typeof document !== 'undefined'){
  try{
    const container = document.getElementById('root');
    if (container) {
      const root = createRoot(container);
      root.render(<App />);
    }
  } catch(e){ /* ignoring for embedding scenarios */ }
}

/*
IMPLEMENTACIÓN / SUGERENCIAS PARA PRODUCCIÓN
- Autenticación y privacidad:
  * Implementar OAuth o sistema de cuentas con verificación parental. Guardar datos en servidor con cifrado.
  * Obtener consentimiento parental antes de recolectar datos del menor.
- Contenido y moderación:
  * Revisar todo el contenido con especialistas educativos.
  * Si hay comunicación entre usuarios (mensajes/foros) usar moderación automática y humana + filtros.
- Seguridad técnica:
  * No usar localStorage para datos sensibles. Usar backend con tokens y expiración.
  * Limitar tamaño y tipos de archivos subidos.
- Gamificación responsable:
  * Diseñar puntos e insignias que refuercen aprendizaje, no adicción. Evitar compras in-app y publicidad invasiva.
- Accesibilidad:
  * Añadir soporte para lector de pantalla, contrastes altos, texto escalable y controles simples.
- Tests y pilots:
  * Hacer pruebas con usuarios reales y profesionales antes de lanzar.
*/
