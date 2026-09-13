# Deployment Guide - AI Roadmap Generator

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
