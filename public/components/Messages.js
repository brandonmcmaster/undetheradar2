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
