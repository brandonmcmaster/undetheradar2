
# Under the Radar

A social platform for underground musicians to connect, share their music, and promote events without the noise of mainstream networks.

## Vision

Under the Radar is designed to foster an inclusive space where independent artists can build community. Musicians will be able to collaborate, showcase their work, and engage with fans directly. The project focuses on simplicity and giving creators ownership over their content.

## Planned Tech Stack

- **Frontend:** React with Vite for fast development and routing via React Router.
- **Backend:** Node.js and Express to provide a REST API.
- **Database:** MongoDB for storing user profiles, messages, music metadata, events, and merchandise listings.
- **Authentication:** JSON Web Tokens (JWT) with Passport.js for secure login and session management.
- **File Storage:** Local storage during development with a plan to integrate S3-compatible storage for production music uploads.

## Setup Instructions

1. Clone this repository.
2. Install dependencies for both the client and server:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
3. Start MongoDB locally or provide a connection string in `server/.env`.
4. From the `server` directory run `npm start` to launch the API.
5. In another terminal, start the React development server:
   ```bash
   cd client && npm run dev
   ```
6. Visit `http://localhost:5173` to open the app in your browser.

## Core Features

- **Artist Profiles** – Create personal pages with bios, photos, and streaming links.
- **Messaging** – Direct message other users for collaboration and networking.
- **Music Uploads** – Share tracks or albums with built‑in streaming from uploaded files.
- **Show Dates** – Post upcoming gigs with maps, dates, and ticket links.
- **Merch** – List and sell merchandise such as shirts, vinyl, or digital downloads.

Development is in the planning stage. Contributions and ideas are welcome!
=======
# Unde the Radar API

This project provides a basic Express server with modules for user profiles, messaging, and media uploads.

## Setup

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

The server listens on port `3000` by default.

## Database

The API uses **SQLite** for data storage. When you start the server for the
first time it will automatically create a file named `app.db` in the project
root containing the required tables.

## API Endpoints

### `/users`

- `GET /users` – list all users
- `POST /users` – create a new user
- `GET /users/:id` – fetch a user by id

Example request to create a user:

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'
```

### `/messages`

- `GET /messages` – list all messages
- `POST /messages` – send a new message

Example request to send a message:

```bash
curl -X POST http://localhost:3000/messages \
  -H "Content-Type: application/json" \
  -d '{"sender_id":1,"receiver_id":2,"content":"Hello"}'
```

### `/media`

- `GET /media` – list uploaded files
- `POST /media` – upload a file using `multipart/form-data`

Example request to upload a file:

```bash
curl -X POST http://localhost:3000/media \
  -F file=@path/to/image.png
```

