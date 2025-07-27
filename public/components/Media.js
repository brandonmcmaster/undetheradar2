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
