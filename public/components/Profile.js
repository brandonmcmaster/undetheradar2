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
    <div className="p-4 space-y-2">
      <div>Name: {profile.name}</div>
      <div>Username: {profile.username}</div>
      <div>Email: {profile.email || 'N/A'}</div>
      <div>Bio: {profile.bio || 'N/A'}</div>
    </div>
  );
}
