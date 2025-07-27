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
        <div key={u.id} className="border p-2 bg-white">
          <div className="font-bold">{u.name}</div>
          <div className="text-sm">@{u.username}</div>
        </div>
      ))}
    </div>
  );
}
