# Deployment Guide

# Table of Contents

1. [Before Setup Instructions](#before-setup)
2. [Run Locally](#run-locally)
3. [Run via Docker](#run-via-docker-)
4. [Cloud Deployment](#cloud-deployment-vercel-render-and-neon-postgresql-free-tier)


# Before Setup

## Set Up Gemini API key

- Go to [Google AI studio](https://aistudio.google.com)
- Login using your google account
- Expand sidebar and go to ```api keys -> create api key```
- Copy the api key and paste to the server environment

## Get JWT secret key

For creating jwt secret key run this using node js and paste it's output to the variable

```javascript
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

# Run Locally

Follow these instructions to run the file locally on your PC.

## Basic Requirements
- Node.js installed
- Google gemini api from google ai studio
- PostgreSQL installed locally or mounted via Docker

## 1. Setup PostgreSQL
Create a new database in your postgresql server.

```sql
CREATE DATABASE ai_roadmap;
```

## 2. Install Dependencies

After cloning the repository, go to the repository folder and install dependencies.

```bash
cd client
npm install

cd ..

cd server
npm install

```

## 3. Setup Environment

Go to client and create a .env file and paste this. you can also copy the env.example file and save as .env on same directory.

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

If your backend port or link is different change the url accordingly

Client Environment setup done.

Now go to server folder and create an .env file with the following details.

```env
PORT=5000
DATABASE_URL=postgresql://postgres_username:postgres_password@localhost:portno/ai_roadmap
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```
Give the postgresql username password hostname and port correctly

Also provide the Google Gemini API key and jwt secret key generated.

## 4. Run Migrations

Go to server directory and open a terminal run 

```bash
npm run db:init
```

## 5. Run the application

Create a new terminal and go to repository directory.

Go to server directory and run the server
```bash
cd server
```

```bash
npm start
```

Or to run on dev mode

```bash
npm run dev
```

Do the same for client with the same commands after changing to client directory
```bash
cd client
```

# Run via Docker 🐳

## Basic Requirements
- Docker & Docker Compose installed

## 1. Set Up Environment

In this setup just copy the .env.example file for both server and client and save as .env .

Add the jwt secret and your gemini api key to the new .env file

## 2. Run the Application

Run the application using docker compose

```bash
docker compose up -d --build
```

Check if all the components of the application such as the client, server and database are running

```bash
docker ps
```

And the output should look something like below
```
CONTAINER ID   IMAGE                     COMMAND                  CREATED         STATUS                   PORTS                                         NAMES
d175f1b69cd3   ai-roadmap-arena-client   "/docker-entrypoint.…"   2 minutes ago   Up 2 minutes             0.0.0.0:80->80/tcp, [::]:80->80/tcp           client
0e4e8a04e86b   ai-roadmap-arena-server   "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes             0.0.0.0:5000->5000/tcp, [::]:5000->5000/tcp   server
714dde5e5b47   postgres:17-alpine        "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp   database
```

If all three services are running open ```http://localhost:80``` in your favoruite web browser.

# Cloud Deployment (Vercel, Render and Neon PostgreSQL Free Tier)

Follow these instructions to deploy your database to Neon, backend to Render, and frontend to Vercel.

---

## 1. Database Setup: Neon PostgreSQL

Neon provides a fully-managed serverless PostgreSQL database.

1.  **Create an Account:**
    *   Sign up at [neon.tech](https://neon.tech/).
2.  **Create a New Project:**
    *   Set the database name (e.g. `ai_roadmap`).
    *   Select your preferred cloud region (e.g. US East or Europe).
3.  **Get Connection String:**
    *   From the Neon Console dashboard, copy the connection string under the **Connection details** block.
    *   It will look like: `postgresql://[user]:[password]@[hostname]/ai_roadmap?sslmode=require`
4.  **Create Tables via SQL Editor:**
    *   Navigate to the **SQL Editor** tab in your Neon Console.
    *   Paste the following SQL schema commands and click **Run**:
    ```sql
    CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE roadmaps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(100) NOT NULL,
        experience_level VARCHAR(50) NOT NULL,
        user_context TEXT,
        specializations TEXT[],
        checkpoints JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE roadmap_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
        checkpoint_id VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'locked',
        best_score INT DEFAULT 0,
        attempts_count INT DEFAULT 0,
        completed_at TIMESTAMP WITH TIME ZONE,
        UNIQUE (roadmap_id, checkpoint_id)
    );

    CREATE TABLE quiz_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
        checkpoint_id VARCHAR(100) NOT NULL,
        questions JSONB NOT NULL,
        user_answers JSONB NOT NULL,
        score INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

---

## 2. Backend Deployment: Render

Render is a cloud hosting platform for running backend servers.

1.  **Prepare Git Repository:**
    *   Make sure your project codebase is pushed to a GitHub repository.
2.  **Create a Web Service on Render:**
    *   Sign in at [dashboard.render.com](https://dashboard.render.com/).
    *   Click **New +** and select **Web Service**.
    *   Connect your GitHub repository.
3.  **Configure Web Service Settings:**
    *   **Name:** `ai-roadmap-backend` (or similar)
    *   **Region:** Select the region closest to your Neon database server.
    *   **Root Directory:** `server` (Important: points Render directly to your backend directory)
    *   **Runtime:** `Node`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
4.  **Add Environment Variables:**
    *   Navigate to the **Environment** tab on Render and add the following keys:
        *   `DATABASE_URL` = (Your Neon connection string)
        *   `JWT_SECRET` = (A long, random secret key for security)
        *   `GEMINI_API_KEY` = (Your Google Gemini API Key)
        *   `GEMINI_MODEL` = `gemini-1.5-flash`
        *   `PORT` = `10000` (Render binds automatically, but setting it ensures standard routing)
5.  **Deploy:**
    *   Click **Create Web Service**. Wait for the build logs to compile and show `Server running on http://localhost:10000`.
    *   Copy the generated Render URL (e.g. `https://ai-roadmap-backend.onrender.com`).

---

## 3. Frontend Deployment: Vercel

Vercel is optimized for building and deploying single-page frontend apps.

1.  **Create Project on Vercel:**
    *   Sign in at [vercel.com](https://vercel.com).
    *   Click **Add New...** and select **Project**.
    *   Import your GitHub repository.
2.  **Configure Framework & Root Settings:**
    *   **Framework Preset:** `Vite` (Vercel detects this automatically)
    *   **Root Directory:** `client` (Click edit and choose the `client` folder)
3.  **Configure Build & Development Settings:**
    *   Keep defaults:
        *   **Build Command:** `npm run build`
        *   **Output Directory:** `dist`
        *   **Install Command:** `npm install`
4.  **Add Environment Variables:**
    *   Add the following environment variable key:
        *   `VITE_API_BASE_URL` = `https://YOUR-RENDER-BACKEND-URL/api` (Remember to append `/api` to the Render URL copied in step 2).
5.  **Deploy:**
    *   Click **Deploy**.
    *   Once complete, Vercel will provide a staging/production domain link (e.g., `https://ai-roadmap-generator.vercel.app`).
