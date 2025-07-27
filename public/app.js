// React front-end for Under the Radar
// Uses React and Tailwind from CDNs. Retro fonts via style.css.

const { BrowserRouter, Routes, Route, Link, useNavigate } = ReactRouterDOM;

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

function App() {
  const auth = useToken();
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-retro">
        <Nav auth={auth} />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignIn auth={auth} />} />
          <Route path="/profile" element={<Profile auth={auth} />} />
          <Route path="/artists" element={<Artists />} />
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
