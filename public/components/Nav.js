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
        <>
          <Link className="hover:underline" to="/profile">Profile</Link>
          <button className="ml-auto" onClick={auth.clear}>Logout</button>
        </>
      ) : (
        <Link className="ml-auto hover:underline" to="/signin">Sign In</Link>
      )}
    </nav>
  );
}
