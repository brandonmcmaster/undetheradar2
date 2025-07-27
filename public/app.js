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
      <Link className="hover:underline" to="/browse">Browse</Link>
      <Link className="hover:underline" to="/media">Media</Link>
      <Link className="hover:underline" to="/messages">Messages</Link>
      <Link className="hover:underline" to="/board">Board</Link>
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
  const [profileType, setProfileType] = React.useState('user');
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
      body: JSON.stringify({
        name: username,
        username,
        password,
        is_artist: profileType === 'artist'
      })
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
      <div className="space-x-2">
        <label>
          <input
            type="radio"
            name="ptype"
            value="user"
            checked={profileType === 'user'}
            onChange={() => setProfileType('user')}
          />{' '}
          User
        </label>
        <label>
          <input
            type="radio"
            name="ptype"
            value="artist"
            checked={profileType === 'artist'}
            onChange={() => setProfileType('artist')}
          />{' '}
          Artist
        </label>
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
  const [avatarFile, setAvatarFile] = React.useState(null);
  const nav = useNavigate();
  React.useEffect(() => {
    if (!auth.token || !auth.userId) return;
    fetch(`/users/${auth.userId}`)
      .then(r => r.json())
      .then(setProfile);
  }, [auth]);

  const uploadAvatar = () => {
    if (!avatarFile) return;
    const data = new FormData();
    data.append('avatar', avatarFile);
    fetch('/users/avatar', { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` }, body: data })
      .then(r => r.json())
      .then(p => setProfile(prev => ({ ...prev, avatar_id: p.avatar_id })));
  };

  if (!auth.token) return <div className="p-4">Please sign in.</div>;
  if (!profile) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col items-center space-y-2">
        {profile.avatar_id ? (
          <img className="w-32 h-32 object-cover rounded-full" src={`/media/${profile.avatar_id}`} alt="avatar" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center">No Image</div>
        )}
        <input type="file" onChange={e => setAvatarFile(e.target.files[0])} />
        <button className="bg-blue-600 text-white px-2 py-1" onClick={uploadAvatar}>Upload Avatar</button>
        <div className="text-xl font-bold">{profile.name}</div>
        <div className="text-sm">@{profile.username}</div>
        <div>Email: {profile.email || 'N/A'}</div>
        <div>Bio: {profile.bio || 'N/A'}</div>
        <button className="bg-gray-300 px-2 py-1" onClick={() => nav('/profile/edit')}>Edit Profile</button>
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

function EditProfile({ auth }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [social, setSocial] = React.useState('');
  const nav = useNavigate();

  React.useEffect(() => {
    if (!auth.token || !auth.userId) return;
    fetch(`/users/${auth.userId}`)
      .then(r => r.json())
      .then(u => {
        setName(u.name || '');
        setEmail(u.email || '');
        setBio(u.bio || '');
        setSocial(u.social || '');
      });
  }, [auth]);

  const save = () => {
    fetch('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`
      },
      body: JSON.stringify({ name, email, bio, social })
    }).then(() => nav('/profile'));
  };

  if (!auth.token) return <div className="p-4">Please sign in.</div>;

  return (
    <div className="p-4 space-y-2 max-w-xl mx-auto">
      <div>
        <label className="block">Name</label>
        <input className="border p-1 w-full" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label className="block">Email</label>
        <input className="border p-1 w-full" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="block">Bio</label>
        <textarea className="border p-1 w-full" value={bio} onChange={e => setBio(e.target.value)} />
      </div>
      <div>
        <label className="block">Social</label>
        <input className="border p-1 w-full" value={social} onChange={e => setSocial(e.target.value)} />
      </div>
      <button className="bg-blue-600 text-white px-2 py-1" onClick={save}>Save</button>
    </div>
  );
}

function Browse({ defaultTab = 'artist' }) {
  const [tab, setTab] = React.useState(defaultTab);
  const [users, setUsers] = React.useState([]);
  React.useEffect(() => {
    fetch(`/users?type=${tab}`)
      .then(r => r.json())
      .then(setUsers);
  }, [tab]);
  const base = tab === 'artist' ? '/artists/' : '/users/';
  return (
    <div className="p-4">
      <div className="mb-4 space-x-2">
        <button
          className={`px-2 py-1 ${tab === 'artist' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          onClick={() => setTab('artist')}
        >
          Artists
        </button>
        <button
          className={`px-2 py-1 ${tab === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          onClick={() => setTab('user')}
        >
          Users
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(u => (
          <Link
            key={u.id}
            to={`${base}${u.id}`}
            className="border p-2 bg-white flex items-center space-x-2 hover:bg-gray-100"
          >
            {u.avatar_id ? (
              <img className="w-12 h-12 object-cover rounded-full" src={`/media/${u.avatar_id}`} alt="avatar" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-sm">N/A</div>
            )}
            <div>
              <div className="font-bold">{u.name}</div>
              <div className="text-sm">@{u.username}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Artists() {
  return <Browse defaultTab="artist" />;
}

function UsersPage() {
  return <Browse defaultTab="user" />;
}

function UserDetail() {
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
      <Link className="text-blue-600 underline" to="/users">Back to users</Link>
      <div className="flex items-center space-x-4">
        {user.avatar_id ? (
          <img className="w-20 h-20 object-cover rounded-full" src={`/media/${user.avatar_id}`} alt="avatar" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-sm">N/A</div>
        )}
        <div>
          <div className="text-xl font-bold">{user.name}</div>
          <div className="text-sm mb-2">@{user.username}</div>
        </div>
      </div>
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
      <div className="flex items-center space-x-4">
        {user.avatar_id ? (
          <img className="w-20 h-20 object-cover rounded-full" src={`/media/${user.avatar_id}`} alt="avatar" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-sm">N/A</div>
        )}
        <div>
          <div className="text-xl font-bold">{user.name}</div>
          <div className="text-sm mb-2">@{user.username}</div>
        </div>
      </div>
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

function Board({ auth }) {
  const [posts, setPosts] = React.useState([]);
  const [content, setContent] = React.useState('');
  const [expanded, setExpanded] = React.useState(null);
  const [comments, setComments] = React.useState({});

  const load = () => {
    fetch('/board')
      .then(r => r.json())
      .then(setPosts);
  };

  React.useEffect(load, []);

  const loadComments = id => {
    fetch(`/board/${id}/comments`)
      .then(r => r.json())
      .then(c => setComments(prev => ({ ...prev, [id]: c })));
  };

  const submit = () => {
    if (!content || !auth.token) return alert('Sign in and enter content');
    fetch('/board', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`
      },
      body: JSON.stringify({ content })
    })
      .then(r => r.json())
      .then(() => {
        setContent('');
        load();
      });
  };

  const react = (id, type) => {
    if (!auth.token) return alert('Sign in first');
    fetch(`/board/${id}/${type}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` }
    }).then(load);
  };

  const addComment = (id, text) => {
    if (!auth.token || !text) return alert('Sign in and enter a comment');
    fetch(`/board/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`
      },
      body: JSON.stringify({ content: text })
    })
      .then(r => r.json())
      .then(() => loadComments(id));
  };

  return (
    <div className="p-4 space-y-2">
      {auth.token && (
        <div>
          <input
            className="border p-1 mr-2"
            placeholder="New post"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-2 py-1" onClick={submit}>
            Post
          </button>
        </div>
      )}
      <div className="space-y-2">
        {posts.map(p => (
          <div key={p.id} className="border p-2 bg-white">
            <div
              className="text-sm text-gray-600 cursor-pointer"
              onClick={() => {
                setExpanded(expanded === p.id ? null : p.id);
                if (expanded !== p.id) loadComments(p.id);
              }}
            >
              {p.username} - {new Date(p.created_at).toLocaleString()}
            </div>
            <div>{p.content}</div>
            <div className="space-x-2 text-sm mt-1">
              <button className="text-blue-600" onClick={() => react(p.id, 'like')}>
                Like ({p.likes})
              </button>
              <button className="text-red-600" onClick={() => react(p.id, 'dislike')}>
                Dislike ({p.dislikes})
              </button>
              <span>Comments: {p.comments}</span>
            </div>
            {expanded === p.id && (
              <div className="mt-2 space-y-1">
                {(comments[p.id] || []).map(c => (
                  <div key={c.id} className="border-t pt-1 text-sm">
                    <span className="font-bold mr-1">{c.username}:</span>
                    {c.content}
                  </div>
                ))}
                {auth.token && (
                  <CommentForm onAdd={text => addComment(p.id, text)} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentForm({ onAdd }) {
  const [text, setText] = React.useState('');
  return (
    <div className="mt-1 flex">
      <input
        className="border p-1 flex-grow mr-2"
        placeholder="Add comment"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button
        className="bg-green-600 text-white px-2"
        onClick={() => {
          onAdd(text);
          setText('');
        }}
      >
        Comment
      </button>
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
          <Route path="/profile/edit" element={<EditProfile auth={auth} />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artists/:id" element={<ArtistDetail />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/messages" element={<Messages auth={auth} />} />
          <Route path="/media" element={<Media auth={auth} />} />
          <Route path="/board" element={<Board auth={auth} />} />
          <Route path="/shows" element={<Placeholder text="Show calendar" />} />
          <Route path="/merch" element={<Placeholder text="Merch shop" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
