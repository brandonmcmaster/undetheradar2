// React front-end for Under the Radar
// Uses React and Tailwind from CDNs. Retro fonts via style.css.

const { BrowserRouter, Routes, Route, Link, useNavigate, useParams } = ReactRouterDOM;

function useToken() {
  const [token, setToken] = React.useState(localStorage.getItem('token') || '');
  const [userId, setUserId] = React.useState(localStorage.getItem('userId') || '');
  const saveToken = (t, id) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userId', id);
    setToken(t);
    setUserId(id);
  };
  const clear = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken('');
    setUserId('');
  };
  return { token, userId, saveToken, clear };
}

function Nav({ auth }) {
  return (
    <nav className="bg-blue-800 text-white p-2 flex flex-wrap space-x-4">
      <Link className="hover:underline" to="/">Home</Link>
      <Link className="hover:underline" to="/artists">Artists</Link>
      <Link className="hover:underline" to="/media">Media</Link>
      <Link className="hover:underline" to="/messages">Messages</Link>
      <Link className="hover:underline" to="/shows">Shows</Link>
      <Link className="hover:underline" to="/merch">Merch</Link>
      {auth.token ? (
        <React.Fragment>
          <Link className="hover:underline" to="/profile">Profile</Link>
          <button className="ml-auto" onClick={auth.clear}>Logout</button>
        </React.Fragment>
      ) : (
        <Link className="ml-auto hover:underline" to="/signin">Sign In</Link>
      )}
    </nav>
  );
}

function Home() {
  return (
    <div className="p-4 space-y-2">
      <div className="text-xl font-bold">Under the Radar</div>
      <p>A home for underground musicians to share their art without algorithms.</p>
      <p>Create a profile, upload your tracks and photos, list shows and sell merch directly to fans.</p>
    </div>
  );
}

function SignIn({ auth }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const nav = useNavigate();

  const login = async () => {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
      auth.saveToken(data.token, data.id);
      nav('/profile');
    } else {
      alert('Login failed');
    }
  };

  const register = async () => {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: username, username, password })
    });
    const data = await res.json();
    if (data.token) {
      auth.saveToken(data.token, data.id);
      nav('/profile');
    } else {
      alert('Registration failed');
    }
  };

  return (
    <div className="p-4 space-y-2">
      <div>
        <input className="border p-1 mr-2" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="border p-1 mr-2" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      </div>
      <div>
        <button className="bg-green-600 text-white px-2 py-1 mr-2" onClick={login}>Login</button>
        <button className="bg-blue-600 text-white px-2 py-1" onClick={register}>Register</button>
      </div>
    </div>
  );
}

function Profile({ auth }) {
  const [profile, setProfile] = React.useState(null);
  React.useEffect(() => {
    if (!auth.token || !auth.userId) return;
    fetch(`/users/${auth.userId}`)
      .then(r => r.json())
      .then(setProfile);
  }, [auth]);

  if (!auth.token) return <div className="p-4">Please sign in.</div>;
  if (!profile) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-1">
        <div>Name: {profile.name}</div>
        <div>Username: {profile.username}</div>
        <div>Email: {profile.email || 'N/A'}</div>
        <div>Bio: {profile.bio || 'N/A'}</div>
      </div>
      <div>
        <div className="font-bold mb-1">Media</div>
        <MediaGallery userId={auth.userId} />
      </div>
      <div>
        <div className="font-bold mb-1">Merch</div>
        <MerchSection userId={auth.userId} />
      </div>
      <div>
        <div className="font-bold mb-1">Upcoming Shows</div>
        <ShowsSection userId={auth.userId} />
      </div>
    </div>
  );
}

function Artists() {
  const [users, setUsers] = React.useState([]);
  React.useEffect(() => {
    fetch('/users')
      .then(r => r.json())
      .then(setUsers);
  }, []);
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {users.map(u => (
        <Link key={u.id} to={`/artists/${u.id}`} className="border p-2 bg-white block hover:bg-gray-100">
          <div className="font-bold">{u.name}</div>
          <div className="text-sm">@{u.username}</div>
        </Link>
      ))}
    </div>
  );
}

function ArtistDetail() {
  const { id } = useParams();
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    fetch(`/users/${id}`)
      .then(r => r.json())
      .then(setUser);
  }, [id]);
  if (!user) return <div className="p-4">Loading...</div>;
  return (
    <div className="p-4 space-y-4">
      <Link className="text-blue-600 underline" to="/artists">Back to artists</Link>
      <div className="text-xl font-bold">{user.name}</div>
      <div className="text-sm mb-2">@{user.username}</div>
      <div>Email: {user.email || 'N/A'}</div>
      <div>Bio: {user.bio || 'N/A'}</div>
      <div>Social: {user.social || 'N/A'}</div>
      <div>
        <div className="font-bold mb-1">Media</div>
        <MediaGallery userId={id} />
      </div>
      <div>
        <div className="font-bold mb-1">Merch</div>
        <MerchSection userId={id} />
      </div>
      <div>
        <div className="font-bold mb-1">Upcoming Shows</div>
        <ShowsSection userId={id} />
      </div>
    </div>
  );
}

function Messages({ auth }) {
  const [inbox, setInbox] = React.useState([]);
  const [content, setContent] = React.useState('');
  const [receiver, setReceiver] = React.useState('');

  const loadInbox = () => {
    if (!auth.token) return;
    fetch('/messages/inbox', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.json())
      .then(setInbox);
  };

  const sendMessage = () => {
    if (!auth.token) return alert('Sign in first');
    fetch('/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ receiver_id: receiver, content })
    })
      .then(r => r.json())
      .then(() => { setContent(''); setReceiver(''); loadInbox(); });
  };

  React.useEffect(loadInbox, [auth.token]);

  if (!auth.token) return <div className="p-4">Please sign in.</div>;

  return (
    <div className="p-4 space-y-2">
      <div>
        <input className="border p-1 mr-2" type="number" placeholder="Receiver ID" value={receiver} onChange={e => setReceiver(e.target.value)} />
        <input className="border p-1 mr-2" placeholder="Message" value={content} onChange={e => setContent(e.target.value)} />
        <button className="bg-blue-600 text-white px-2 py-1" onClick={sendMessage}>Send</button>
      </div>
      <div className="space-y-1">
        {inbox.map(m => (
          <div key={m.id} className="border p-2 bg-white">
            From {m.sender_id}: {m.content}
          </div>
        ))}
      </div>
    </div>
  );
}

function Media({ auth }) {
  const [files, setFiles] = React.useState([]);
  const [file, setFile] = React.useState(null);

  const loadMedia = () => {
    fetch('/media')
      .then(r => r.json())
      .then(setFiles);
  };

  const upload = () => {
    if (!file || !auth.token) return alert('Select file and sign in');
    const data = new FormData();
    data.append('file', file);
    fetch('/media', { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` }, body: data })
      .then(r => r.json())
      .then(loadMedia);
  };

  React.useEffect(loadMedia, []);

  return (
    <div className="p-4 space-y-2">
      <div>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button className="bg-blue-600 text-white px-2 py-1 ml-2" onClick={upload}>Upload</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {files.map(f => (
          <div key={f.id} className="border p-2 bg-white flex flex-col">
            <span>{f.original_name}</span>
            <a className="text-blue-600 underline" href={`/media/${f.id}`}>View</a>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaGallery({ userId }) {
  const [files, setFiles] = React.useState([]);
  React.useEffect(() => {
    fetch('/media')
      .then(r => r.json())
      .then(data => setFiles(data.filter(f => f.user_id == userId)));
  }, [userId]);
  if (!files.length) return <div>No media yet.</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {files.map(f => (
        <div key={f.id} className="border p-2 bg-white">
          {f.mime_type && f.mime_type.startsWith('image') && (
            <img className="max-w-full" src={`/media/${f.id}`} alt={f.original_name} />
          )}
          {f.mime_type === 'audio/mpeg' && (
            <audio controls src={`/media/${f.id}`} className="w-full" />
          )}
        </div>
      ))}
    </div>
  );
}

function MerchSection({ userId }) {
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    fetch(`/merch/user/${userId}`)
      .then(r => r.json())
      .then(setItems);
  }, [userId]);
  if (!items.length) return <div>No merch yet.</div>;
  return (
    <div className="space-y-2">
      {items.map(m => (
        <div key={m.id} className="border p-2 bg-white">
          <div className="font-bold">{m.product_name}</div>
          <div>${Number(m.price).toFixed(2)}</div>
          <div>In stock: {m.stock}</div>
        </div>
      ))}
    </div>
  );
}

function ShowsSection({ userId }) {
  const [shows, setShows] = React.useState([]);
  React.useEffect(() => {
    fetch(`/shows/user/${userId}`)
      .then(r => r.json())
      .then(setShows);
  }, [userId]);
  if (!shows.length) return <div>No upcoming shows.</div>;
  return (
    <div className="space-y-2">
      {shows.map(s => (
        <div key={s.id} className="border p-2 bg-white">
          <div className="font-bold">{s.venue}</div>
          <div>{new Date(s.date).toLocaleDateString()}</div>
          <div>{s.description}</div>
        </div>
      ))}
    </div>
  );
}

function Placeholder({ text }) {
  return <div className="p-4">{text} coming soon!</div>;
}

function App() {
  const auth = useToken();
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-retro">
        <Nav auth={auth} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn auth={auth} />} />
          <Route path="/profile" element={<Profile auth={auth} />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artists/:id" element={<ArtistDetail />} />
          <Route path="/messages" element={<Messages auth={auth} />} />
          <Route path="/media" element={<Media auth={auth} />} />
          <Route path="/shows" element={<Placeholder text="Show calendar" />} />
          <Route path="/merch" element={<Placeholder text="Merch shop" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
