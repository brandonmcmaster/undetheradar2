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
