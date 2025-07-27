function HomePage() {
  return (
    <div className="p-4 space-y-4 text-center">
      <h1 className="text-3xl font-bold">Under the Radar</h1>
      <p>A meeting place for underground artists.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link className="underline text-blue-700" to="/artists">Artists</Link>
        <Link className="underline text-blue-700" to="/shows">Shows</Link>
        <Link className="underline text-blue-700" to="/media">Media</Link>
        <Link className="underline text-blue-700" to="/merch">Merch</Link>
      </div>
    </div>
  );
}
