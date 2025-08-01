# Repository Guidelines

This project is a Node.js Express server using CommonJS modules and SQLite for persistence.

## Coding style
- Use 2-space indentation in JavaScript files.
- Stick to CommonJS `require`/`module.exports` syntax.
- Keep dependencies minimal.
- Use **Pino** for structured logging; all requests should include a request ID.
- Foreign key constraints are enabled via `PRAGMA foreign_keys = ON`.
- Configuration values like `PORT`, `DB_FILE` and `JWT_SECRET` are loaded from a `.env` file using `dotenv`.

## Database
- New tables: `shows`, `merch`, `board_posts`, `board_reactions`, `board_comments`, `profile_media`, `follows` and `notifications`.
- Gamification tables: `fan_levels`, `artist_levels`, `fan_badges`, `artist_badges`, `user_fan_badges`, `user_artist_badges`.
- The `board_posts` table includes an optional `updated_at` column set when a post is edited.
- The `users` table now includes `is_artist`, `fan_points`, `artist_points`, `fan_level_id`, `artist_level_id` and `profile_theme` columns.
- Use `utils/gamify.js` helpers to award points or badges.

## Media uploads
- Files are stored in the `uploads/` directory.
- Only JPEG, PNG, MP3 and MP4 files up to 10 MB are accepted.
- Uploaded files should be scanned with `clamscan` when available.

## Contributions
- Document any new endpoints or significant features in `README.md`.
- Update this `AGENTS.md` with any new development guidelines.
- Expose API documentation via Swagger at `/docs` when adding new endpoints.

## Frontend
- The `public` folder now contains a small React app served via CDN.
- Tailwind CSS provides styling with a retro aesthetic.
- Keep frontend JavaScript indented with 2 spaces like the backend.

## Testing
- Run `npm start` to verify that the server starts without errors.
- Write tests for any new features and confirm they pass with `npm test`.
