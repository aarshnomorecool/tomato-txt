# Tomato Chat - Real-Time Supabase Chat App

Production-ready full-stack chat web app built with React, Vite, Tailwind CSS, and Supabase.

## Features

- Email + password authentication
- Username-based login (username resolves to email in profiles)
- Real-time direct messaging
- Image sharing with Supabase Storage
- Typing indicators via broadcast (no DB writes)
- Presence-based online/offline status
- Floating mini chat window (draggable)
- Dark and light themes with localStorage persistence
- Seen status and message timestamps
- Responsive desktop/mobile UI

## Tech Stack

- Frontend: React + Vite
- Styling: Tailwind CSS
- Backend/Auth/DB/Realtime/Storage: Supabase
- Deployment: Vercel compatible

## Folder Structure

src/

- components/
- pages/
- hooks/
- lib/
- services/
- context/
- utils/

## Setup

1. Install dependencies:

   npm install

2. Create environment file from example:

   copy .env.example .env

3. Fill .env values:

   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

4. In Supabase SQL Editor, run supabase/schema.sql.

5. Ensure Realtime includes public.messages.

6. Run app:

   npm run dev

## Scripts

- npm run dev
- npm run lint
- npm run build
- npm run preview

## Deploy to Vercel

1. Push repository to GitHub.
2. Import repository in Vercel.
3. Add environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Deploy.

## Notes

- profiles are created from auth.users by a DB trigger in schema.sql.
- username login uses profiles table to map username to email before auth.
- chat images are uploaded to chat-images bucket and rendered in message bubbles.
- typing and presence are realtime channel based.
