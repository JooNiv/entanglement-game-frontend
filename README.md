# CSC ACF Quantum Demo Frontend

Frontend for Quantum entanglement demo game for CSC ACF conference 2025

# Running locally

## Set environment variables

Create a `.env` file in `/frontend` and add your variables according to `frontend/.example-env`. In the frontend one can sign up as admin (only gives rights to toggle one leaderboard column on/off) by appending `/?admin=password` to the url or by manually setting a token `admin=true`. NOTE: admin and password fetched from the .env file.

## Docker

```bash
docker compose up --build
```

## NPM

### Install frontend dependencies

```bash
npm install
```

### Running manually

#### Via provided bash script

```bash
npm run dev
```