# Repository Guidelines

This project is a Node.js Express server using CommonJS modules and SQLite for persistence.

## Coding style
- Use 2-space indentation in JavaScript files.
- Stick to CommonJS `require`/`module.exports` syntax.
- Keep dependencies minimal.
- Foreign key constraints are enabled via `PRAGMA foreign_keys = ON`.

## Database
- New tables: `shows`, `merch` and `board_posts`.

## Media uploads
- Files are stored in the `uploads/` directory.
- Only JPEG, PNG, MP3 and MP4 files up to 10 MB are accepted.
- Uploaded files should be scanned with `clamscan` when available.

## Contributions
- Document any new endpoints or significant features in `README.md`.
- Update this `AGENTS.md` with any new development guidelines.

## Testing
- Run `npm start` to verify that the server starts without errors.
