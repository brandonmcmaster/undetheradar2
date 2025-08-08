# Repository Guidelines

This project is a Node.js Express server using CommonJS modules and SQLite for persistence. The guidelines below exist to help future contributors extend the application safely and consistently.

## Project Structure
- **app.js** is the server entry point.
- **routes/** holds feature specific Express routers.
- **middleware/** contains request logging, auth, validation and error handlers.
- **utils/** provides shared helpers such as `gamify.js` and `notify.js`.
- **public/** serves the small React frontend and other static assets.
- **tests/** contains Playwright unit and integration tests. Always add tests alongside new features.

## Coding Style & Practices
- Use 2-space indentation in both backend and frontend JavaScript.
- Stick to CommonJS `require`/`module.exports` syntax.
- Prefer `const`/`let` over `var` and keep files focused on a single responsibility.
- Keep dependencies minimal and security focused (helmet, cors, rate limiting).
- Use **Pino** for structured logging and ensure every request is logged with a request ID (see `middleware/logger.js`).
- Propagate errors with `next(err)` so that `middleware/error.js` can handle logging and metrics.
- Sanitize and validate all input using `express-validator` and the `middleware/validate.js` helper.
- Configuration values like `PORT`, `DB_FILE` and `JWT_SECRET` come from a `.env` file via `dotenv` – never commit secrets.

## Database
- SQLite is used for persistence; tables are created in `db.js` during initialization.
- Foreign key constraints are enabled via `PRAGMA foreign_keys = ON`.
- When adding columns, follow the `safeAddColumn` pattern in `db.js` so migrations remain idempotent.
- Gamification helpers in `utils/gamify.js` should be used when awarding points, levels or badges.
- Write database code with parameterized queries to avoid SQL injection and to aid future migration to another DB.

## Routing & Middleware
- Place new endpoints in a dedicated file under `routes/` and export an Express `Router`.
- Use the `authenticate` middleware for protected routes and the `validate` middleware after `express-validator` rules.
- Keep route files concise; extract business logic into helpers when it grows.
- Record metrics and log important actions. `middleware/logger.js` already tracks requests and response times.
- For operations that create notifications, use `utils/notify.js`.

## Media Uploads
- Files are stored in the `uploads/` directory (which should be gitignored).
- Only JPEG, PNG, MP3 and MP4 files up to 10 MB are accepted.
- Uploaded files must be scanned with `clamscan` when available and removed if infected.

## Frontend
- The `public` folder contains a small React app served via CDN with Tailwind CSS styling.
- Keep frontend JavaScript indented with 2 spaces and avoid build steps; assets are served as static files.

## Documentation
- Document all new endpoints or significant features in `README.md` and update `openapi.json` so Swagger docs at `/docs` stay accurate.
- Update this `AGENTS.md` with any new development guidelines.

## Testing & Continuous Integration
- Run `npm start` locally to ensure the server boots without errors.
- Run `npm test` to execute Playwright unit and integration tests.
- All commits must pass the test suite. Do **not** modify tests just to make failing code pass. Only change or add tests when implementing or updating features that warrant it.
- If tests or the server fail locally, refactor the code until they pass. Never submit code that is known to break the CI pipeline.

## Contribution Workflow
1. Create or update code following the style and structure above.
2. Run `npm start` and `npm test`; ensure both succeed before committing.
3. Update documentation (`README.md`, `openapi.json`, `AGENTS.md`) when introducing new features or guidelines.
4. Keep pull requests focused and include a clear description of the change.

Adhering to these practices will keep the project maintainable and ready for future expansion.
