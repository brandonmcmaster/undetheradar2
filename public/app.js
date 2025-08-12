// React front-end for Under the Radar
// Uses React and Tailwind from CDNs. Retro fonts via style.css.

const { BrowserRouter, Routes, Route, Link, useNavigate, useParams } = ReactRouterDOM;

function useAuth() {
  const [token, setToken] = React.useState(localStorage.getItem('token') || '');
  const [userId, setUserId] = React.useState(localStorage.getItem('userId') || '');
  const [isArtist, setIsArtist] = React.useState(localStorage.getItem('isArtist') === 'true');
  const saveAuth = (t, id, artist) => {
    localStorage.setItem('token', t);
    localStorage.setItem('userId', id);
    localStorage.setItem('isArtist', artist ? 'true' : 'false');
    setToken(t);
    setUserId(id);
    setIsArtist(artist);
  };
  const clear = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('isArtist');
    setToken('');
    setUserId('');
    setIsArtist(false);
  };
  return { token, userId, isArtist, saveAuth, clear };
}

function Nav({ auth, unread }) {
  const [avatar, setAvatar] = React.useState(null);
  const [username, setUsername] = React.useState('');

  React.useEffect(() => {
    if (!auth.token || !auth.userId) {
      setAvatar(null);
      setUsername('');
      return;
    }
    fetch(`/users/${auth.userId}`)
      .then(r => r.json())
      .then(u => {
        setAvatar(u.avatar_id || null);
        setUsername(u.username);
      });
  }, [auth.token, auth.userId]);

  return (
    <nav className="bg-blue-800 text-white p-2 flex items-center space-x-4">
      {auth.token ? (
        <div className="flex items-center space-x-2">
          <Link to="/profile">
            {avatar ? (
              <img className="w-8 h-8 rounded-full" src={`/media/${avatar}`} alt="avatar" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">N/A</div>
            )}
          </Link>
          <span className="text-sm">@{username}</span>
          <button className="flex items-center" onClick={auth.clear}>
            <span className="mr-1" role="img" aria-label="logout">🚪</span>
            Logout
          </button>
        </div>
      ) : (
        <Link className="hover:underline flex items-center" to="/signin">
          <span className="mr-1" role="img" aria-label="sign in">🔐</span>
          Sign In
        </Link>
      )}
      <Link className="hover:underline flex items-center" to="/">
        <span className="mr-1" role="img" aria-label="home">🏠</span>
        Home
      </Link>
      <Link className="hover:underline flex items-center" to="/browse">
        <span className="mr-1" role="img" aria-label="browse">🔍</span>
        Browse
      </Link>
      <Link className="hover:underline flex items-center" to="/media">
        <span className="mr-1" role="img" aria-label="media">🖼️</span>
        Media
      </Link>
      <Link className="hover:underline flex items-center" to="/messages">
        <span className="mr-1" role="img" aria-label="messages">✉️</span>
        Messages
      </Link>
      <Link className="hover:underline relative flex items-center" to="/notifications">
        <span className="mr-1" role="img" aria-label="notifications">🔔</span>
        Notifications
        {unread > 0 && (
          <span className="ml-1 bg-red-600 text-white rounded-full px-1 text-xs">{unread}</span>
        )}
      </Link>
      <Link className="hover:underline flex items-center" to="/board">
        <span className="mr-1" role="img" aria-label="board">📝</span>
        Board
      </Link>
      <Link className="hover:underline flex items-center" to="/shows">
        <span className="mr-1" role="img" aria-label="shows">🎸</span>
        Shows
      </Link>
      <Link className="hover:underline flex items-center" to="/merch">
        <span className="mr-1" role="img" aria-label="merch">🛍️</span>
        Merch
      </Link>
      {/* profile editing moved to the profile page */}
    </nav>
  );
}

function TrendingPosts({ auth }) {
  if (!auth || !auth.token) {
    return null;
  }
  const [posts, setPosts] = React.useState([]);
  React.useEffect(() => {
    fetch('/board/feed', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
      .then(r => r.json())
      .then(d => {
        const top = d.sort((a, b) => b.likes - a.likes).slice(0, 3);
        setPosts(top);
      });
  }, [auth.token]);
  if (posts.length === 0) {
    return null;
  }
  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-4">
      <h2 className="text-xl font-bold text-center">Highlights from artists you follow.</h2>
      {posts.map(p => (
        <div key={p.id} className="bg-white shadow p-4">
          <h3 className="font-bold">{p.headline}</h3>
          <p className="text-sm">
            {p.content.slice(0, 100)}{p.content.length > 100 ? '...' : ''}
          </p>
          <div className="text-xs text-gray-600 mt-2">{p.likes} likes</div>
        </div>
      ))}
    </div>
  );
}

function GuestLanding() {
  return (
    <React.Fragment>
      <section className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-20 hero-section">
        <h1 className="text-4xl font-bold mb-4 hero-title">Under the Radar</h1>
        <p className="text-lg mb-2">A home for underground musicians to share their art without algorithms.</p>
        <p className="mb-6">Create a profile, upload your tracks and photos, list shows and sell merch directly to fans.</p>
        <Link className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100" to="/signin">
          Get Started
        </Link>
      </section>
    </React.Fragment>
  );
}

function ArtistLanding({ auth }) {
  return (
    <React.Fragment>
      <section className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-20 hero-section">
        <h1 className="text-4xl font-bold mb-4 hero-title">Welcome back!</h1>
        <p className="mb-6">Share new posts and connect with your fans.</p>
        <Link className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100" to="/profile">
          Go to Profile
        </Link>
      </section>
      <TrendingPosts auth={auth} />
    </React.Fragment>
  );
}

function UserLanding({ auth }) {
  return (
    <React.Fragment>
      <section className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-20 hero-section">
        <h1 className="text-4xl font-bold mb-4 hero-title">Welcome back!</h1>
        <p className="mb-6">Discover new artists and posts from the community.</p>
        <Link className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100" to="/browse">
          Browse Artists
        </Link>
      </section>
      <TrendingPosts auth={auth} />
    </React.Fragment>
  );
}

function Home({ auth }) {
  if (!auth.token) {
    return <GuestLanding />;
  }
  return auth.isArtist ? <ArtistLanding auth={auth} /> : <UserLanding auth={auth} />;
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
      auth.saveAuth(data.token, data.id, data.is_artist);
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
      auth.saveAuth(data.token, data.id, data.is_artist);
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
  }, [auth.token, auth.userId]);

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
    <div className={`p-4 space-y-6 max-w-3xl mx-auto ${profile.profile_theme || 'theme-default'}`}>
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
        {profile.custom_html && (
          <div dangerouslySetInnerHTML={{ __html: profile.custom_html }} />
        )}
        <button className="bg-gray-300 px-2 py-1" onClick={() => nav('/profile/edit')}>Edit Profile</button>
      </div>
      <div>
        <div className="font-bold mb-1">Media</div>
        <MediaGallery userId={auth.userId} auth={auth} />
      </div>
      <div>
        <div className="font-bold mb-1">Merch</div>
      </div>
    </div>
  );
}

function EditProfile({ auth }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [bio, setBio] = React.useState('');
  const [social, setSocial] = React.useState('');
  const [customHtml, setCustomHtml] = React.useState('');
  const [theme, setTheme] = React.useState('default');
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
        setCustomHtml(u.custom_html || '');
        setTheme(u.profile_theme || 'default');
      });
  }, [auth.token, auth.userId]);

  const save = () => {
    fetch('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        name,
        email,
        bio,
        social,
        custom_html: customHtml,
        profile_theme: theme
      })
    })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || 'Update failed');
        return r.json();
      })
      .then(() => nav('/profile'))
      .catch(err => alert(err.message));
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
      <div>
        <label className="block">Theme</label>
        <select className="border p-1 w-full" value={theme} onChange={e => setTheme(e.target.value)}>
          <option value="default">Default</option>
          <option value="dark">Dark</option>
          <option value="ocean">Ocean</option>
        </select>
      </div>
      <div>
        <label className="block">Custom HTML</label>
        <textarea className="border p-1 w-full" value={customHtml} onChange={e => setCustomHtml(e.target.value)} />
      </div>
      <button className="bg-blue-600 text-white px-2 py-1" onClick={save}>Save</button>
    </div>
  );
}

function Browse({ defaultTab = 'artist' }) {
  const [tab, setTab] = React.useState(defaultTab);
  const [users, setUsers] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [letter, setLetter] = React.useState('');
  const load = () => {
    let url = `/users?type=${tab}`;
    if (query) url += `&q=${encodeURIComponent(query)}`;
    if (letter) url += `&letter=${letter}`;
    fetch(url)
      .then(r => r.json())
      .then(setUsers);
  };
  React.useEffect(load, [tab, query, letter]);
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
      <div className="mb-2">
        <input
          className="border p-1 mr-2"
          placeholder="Search..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="border px-2 py-1" onClick={() => setQuery('')}>Clear</button>
      </div>
      <div className="mb-4 flex flex-wrap space-x-1">
        <button
          className={`px-2 py-1 ${letter === '' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          onClick={() => setLetter('')}
        >
          All
        </button>
        {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(l => (
          <button
            key={l}
            className={`px-2 py-1 ${letter === l ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            onClick={() => setLetter(l)}
          >
            {l}
          </button>
        ))}
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
  const token = localStorage.getItem('token') || '';
  const viewerId = localStorage.getItem('userId') || '';
  const [following, setFollowing] = React.useState(false);
  React.useEffect(() => {
    fetch(`/users/${id}`)
      .then(r => r.json())
      .then(setUser);
    if (token) {
      fetch(`/follow/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setFollowing(!!d.following));
    }
  }, [id]);
  const toggle = () => {
    if (!token) return alert('Sign in first');
    const method = following ? 'DELETE' : 'POST';
    fetch(`/follow/${id}`, { method, headers: { Authorization: `Bearer ${token}` } })
      .then(() => setFollowing(!following));
  };
  if (!user) return <div className="p-4">Loading...</div>;
  return (
    <div className={`p-4 space-y-4 ${user.profile_theme || 'theme-default'}`}>
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
          {token && localStorage.getItem('userId') != id && (
            <button className="text-blue-600" onClick={toggle}>
              {following ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </div>
      <div>Email: {user.email || 'N/A'}</div>
      <div>Bio: {user.bio || 'N/A'}</div>
      {user.custom_html && (
        <div dangerouslySetInnerHTML={{ __html: user.custom_html }} />
      )}
      <div>Social: {user.social || 'N/A'}</div>
      <div>
        <div className="font-bold mb-1">Media</div>
        <MediaGallery userId={id} auth={{ token, userId: viewerId }} />
      </div>
      <div>
        <div className="font-bold mb-1">Merch</div>
      </div>
    </div>
  );
}

function ArtistDetail() {
  const { id } = useParams();
  const [user, setUser] = React.useState(null);
  const token = localStorage.getItem('token') || '';
  const viewerId = localStorage.getItem('userId') || '';
  const [following, setFollowing] = React.useState(false);
  React.useEffect(() => {
    fetch(`/users/${id}`)
      .then(r => r.json())
      .then(setUser);
    if (token) {
      fetch(`/follow/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setFollowing(!!d.following));
    }
  }, [id]);
  const toggle = () => {
    if (!token) return alert('Sign in first');
    const method = following ? 'DELETE' : 'POST';
    fetch(`/follow/${id}`, { method, headers: { Authorization: `Bearer ${token}` } })
      .then(() => setFollowing(!following));
  };
  if (!user) return <div className="p-4">Loading...</div>;
  return (
    <div className={`p-4 space-y-4 ${user.profile_theme || 'theme-default'}`}>
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
          {token && localStorage.getItem('userId') != id && (
            <button className="text-blue-600" onClick={toggle}>
              {following ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </div>
      <div>Email: {user.email || 'N/A'}</div>
      <div>Bio: {user.bio || 'N/A'}</div>
      {user.custom_html && (
        <div dangerouslySetInnerHTML={{ __html: user.custom_html }} />
      )}
      <div>Social: {user.social || 'N/A'}</div>
      <div>
        <div className="font-bold mb-1">Media</div>
        <MediaGallery userId={id} auth={{ token, userId: viewerId }} />
      </div>
      <div>
        <div className="font-bold mb-1">Merch</div>

        <MerchSection userId={id} auth={{ token, userId: viewerId }} following={viewerId == id || following} />
      </div>
      <div>
        <div className="font-bold mb-1">Upcoming Shows</div>
        <ShowsSection userId={id} auth={{ token, userId: viewerId }} following={viewerId == id || following} />
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

function Notifications({ auth, refreshUnread }) {
  const [items, setItems] = React.useState([]);
  const load = () => {
    if (!auth.token) return;
    fetch('/notifications', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.json())
      .then(arr => {
        setItems(arr);
        if (refreshUnread) refreshUnread();
      });
  };
  const mark = id => {
    fetch(`/notifications/${id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` } })
      .then(load);
  };
  React.useEffect(load, [auth.token]);
  if (!auth.token) return <div className="p-4">Please sign in.</div>;
  return (
    <div className="p-4 space-y-2">
      {items.length === 0 && <div>No notifications.</div>}
      {items.map(n => (
        <div key={n.id} className="border p-2 bg-white flex justify-between">
          <span>{n.message}</span>
          {!n.is_read && (
            <button className="text-blue-600" onClick={() => mark(n.id)}>Mark read</button>
          )}
        </div>
      ))}
    </div>
  );
}

function Media({ auth }) {
  const [files, setFiles] = React.useState([]);
  const [file, setFile] = React.useState(null);
  const [error, setError] = React.useState('');

  const loadMedia = () => {
    if (!auth.token) {
      setFiles([]);
      setError('Please sign in.');
      return;
    }
    fetch('/media/feed', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => {
        if (r.status === 401) {
          setError('Please sign in.');
          return [];
        }
        setError('');
        return r.json();
      })
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

  React.useEffect(loadMedia, [auth.token]);

  if (error && !files.length) return <div className="p-4">{error}</div>;
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

function MediaGallery({ userId, auth }) {
  const [files, setFiles] = React.useState([]);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setFiles([]);
    setError('');
    if (!auth || !auth.token) {
      setError('Please sign in to view media.');
      return;
    }
    if (String(auth.userId) === String(userId)) {
      fetch('/media')
        .then(r => r.json())
        .then(data => setFiles(data.filter(f => f.user_id == userId)));
      return;
    }
    fetch(`/follow/${userId}`, { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => {
        if (r.status === 401) {
          setError('Please sign in to view media.');
          return null;
        }
        return r.json();
      })
      .then(d => {
        if (d && d.following) {
          fetch('/media')
            .then(r => r.json())
            .then(data => setFiles(data.filter(f => f.user_id == userId)));
        } else if (d) {
          setError('Follow this user to view their media.');
        }
      });
  }, [userId, auth && auth.token, auth && auth.userId]);

  if (error) return <div>{error}</div>;
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


  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
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


  const [shows, setShows] = React.useState([]);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
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
  const [headline, setHeadline] = React.useState('');
  const [expanded, setExpanded] = React.useState(null);
  const [comments, setComments] = React.useState({});
  const [editing, setEditing] = React.useState(null);
  const [editText, setEditText] = React.useState('');
  const [postEditing, setPostEditing] = React.useState(null);
  const [postEditText, setPostEditText] = React.useState('');
  const [postEditHeadline, setPostEditHeadline] = React.useState('');
  const [needAuth, setNeedAuth] = React.useState(false);

  const load = () => {
    if (!auth.token) {
      setNeedAuth(true);
      setPosts([]);
      return;
    }
    fetch('/board/feed', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
      .then(r => {
        if (r.status === 401) {
          setNeedAuth(true);
          return [];
        }
        setNeedAuth(false);
        return r.json();
      })
      .then(setPosts);
  };

  React.useEffect(load, [auth.token]);

  const loadComments = id => {
    fetch(`/board/${id}/comments`)
      .then(r => r.json())
      .then(c => setComments(prev => ({ ...prev, [id]: c })));
  };

  const submit = () => {
    if (!headline || !content || !auth.token) return alert('Sign in and enter content');
    fetch('/board', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`
      },
      body: JSON.stringify({ headline, content })
    })
      .then(r => r.json())
      .then(() => {
        setContent('');
        setHeadline('');
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

  const updateComment = (cid, pid, text) => {
    fetch(`/board/comments/${cid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`
      },
      body: JSON.stringify({ content: text })
    }).then(() => {
      setEditing(null);
      setEditText('');
      loadComments(pid);
    });
  };

  const updatePost = (id, head, text) => {
    fetch(`/board/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`
      },
      body: JSON.stringify({ headline: head, content: text })
    }).then(() => {
      setPostEditing(null);
      setPostEditText('');
      setPostEditHeadline('');
      load();
    });
  };

  const removeComment = (cid, pid) => {
    fetch(`/board/comments/${cid}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` }
    }).then(() => loadComments(pid));
  };

  const removePost = id => {
    fetch(`/board/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` }
    }).then(load);
  };

  return (
    <div className="p-4 space-y-2">
      {needAuth ? (
        <div>Please sign in to view the board.</div>
      ) : (
        <React.Fragment>
          {auth.token && (
            <div>
              <input
                className="border p-1 mr-2"
                placeholder="Headline"
                value={headline}
                onChange={e => setHeadline(e.target.value)}
              />
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
                  className="font-semibold text-lg cursor-pointer"
                  onClick={() => {
                    setExpanded(expanded === p.id ? null : p.id);
                    if (expanded !== p.id) loadComments(p.id);
                  }}
                >
                  {p.headline}
                </div>
                <div className="text-sm text-gray-600">
                  {p.username} - {new Date(p.created_at).toLocaleString()} {p.updated_at ? '(edited)' : ''}
                </div>
                {postEditing === p.id ? (
                  <div className="space-x-1 mt-1">
                    <input
                      className="border p-0.5 mr-1"
                      placeholder="Headline"
                      value={postEditHeadline}
                      onChange={e => setPostEditHeadline(e.target.value)}
                    />
                    <input
                      className="border p-0.5"
                      value={postEditText}
                      onChange={e => setPostEditText(e.target.value)}
                    />
                    <button className="text-green-600" onClick={() => updatePost(p.id, postEditHeadline, postEditText)}>
                      Save
                    </button>
                    <button className="text-gray-600" onClick={() => setPostEditing(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>{p.content}</div>
                )}
                <div className="space-x-2 text-sm mt-1">
                  <button className="text-blue-600" onClick={() => react(p.id, 'like')}>
                    Like ({p.likes})
                  </button>
                  <button className="text-red-600" onClick={() => react(p.id, 'dislike')}>
                    Dislike ({p.dislikes})
                  </button>
                  <span>Comments: {p.comments}</span>
                  {auth.userId == p.user_id && (
                    <span className="space-x-1">
                      <button
                        className="text-sm text-blue-700"
                        onClick={() => {
                          setPostEditing(p.id);
                          setPostEditText(p.content);
                          setPostEditHeadline(p.headline);
                        }}
                      >
                        Edit
                      </button>
                      <button className="text-sm text-red-700" onClick={() => removePost(p.id)}>
                        Delete
                      </button>
                    </span>
                  )}
                </div>
                {expanded === p.id && (
                  <div className="mt-2 space-y-1">
                    {(comments[p.id] || []).map(c => (
                      <div key={c.id} className="border-t pt-1 text-sm">
                        <span className="font-bold mr-1">{c.username}:</span>
                        {editing === c.id ? (
                          <React.Fragment>
                            <input
                              className="border p-0.5 mr-1"
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                            />
                            <button
                              className="text-green-600 mr-1"
                              onClick={() => updateComment(c.id, p.id, editText)}
                            >
                              Save
                            </button>
                            <button className="text-gray-600" onClick={() => setEditing(null)}>
                              Cancel
                            </button>
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            {c.content}
                            {auth.userId == c.user_id && (
                              <span className="ml-2 space-x-1">
                                <button className="text-blue-600" onClick={() => { setEditing(c.id); setEditText(c.content); }}>
                                  Edit
                                </button>
                                <button className="text-red-600" onClick={() => removeComment(c.id, p.id)}>
                                  Delete
                                </button>
                              </span>
                            )}
                          </React.Fragment>
                        )}
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
        </React.Fragment>
      )}
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
  const auth = useAuth();
  const [unread, setUnread] = React.useState(0);

  const loadUnread = () => {
    if (!auth.token) {
      setUnread(0);
      return;
    }
    fetch('/notifications/unread_count', {
      headers: { Authorization: `Bearer ${auth.token}` }
    })
      .then(r => r.json())
      .then(d => setUnread(d.count));
  };

  React.useEffect(loadUnread, [auth.token]);
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-retro">
        <Nav auth={auth} unread={unread} />
        <Routes>
          <Route path="/" element={<Home auth={auth} />} />
          <Route path="/signin" element={<SignIn auth={auth} />} />
          <Route path="/profile" element={<Profile auth={auth} />} />
          <Route path="/profile/edit" element={<EditProfile auth={auth} />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artists/:id" element={<ArtistDetail />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/messages" element={<Messages auth={auth} />} />
          <Route path="/notifications" element={<Notifications auth={auth} refreshUnread={loadUnread} />} />
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
