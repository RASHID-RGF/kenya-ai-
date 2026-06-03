# Vercel deployment checklist (Jarvis OS)

- [ ] Confirm `npm run build` produces `/dist/index.html`
- [ ] Verify the app is deployable as static on Vercel (no Cloudflare runtime needed)
- [ ] Add required VITE_ env vars in Vercel project settings:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_PUBLISHABLE_KEY
- [ ] Ensure frontend calls the Supabase Edge Function correctly in production
  - [ ] Set the Edge Function base URL / route as needed (if code requires it)
- [ ] Deploy to Vercel and test:
  - [ ] App loads
  - [ ] Voice UI works
  - [ ] Streaming chat works
