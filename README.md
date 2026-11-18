# Kenya Vehicles — Kenya's largest car marketplace

Kenya Vehicles is Kenya's largest car marketplace — buy, hire & finance with confidence. Shop verified dealers nationwide and compare car loan options from banks, saccos, microfinance, and fintechs in one place.

## Features

- Browse and filter cars by county, body type, price, and keyword
- Dealer directory with verified badges and per-dealer inventory
- Car detail pages with enquiry forms and finance estimates
- Loan partner comparison with monthly payment calculator
- Join flows for dealers and lenders

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Deploy on Render

One-click deploy (uses `render.yaml`):

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/charlesnduya-png/kenya-vehicles)

Repo: https://github.com/charlesnduya-png/kenya-vehicles

After deploy, the live site is typically:

`https://kenya-vehicles.onrender.com`

## Platform layers (target production)

3. **API layer** — Connects frontend to backend  
4. **Backend** — Processes requests and business logic  
5. **Authentication** — Manages users, roles and permissions  
6. **Database** — Stores users, listings and transactions (PostgreSQL / Neon)  
7. **File storage** — Stores images, documents and videos (e.g. Vercel Blob)  
8. **Infrastructure** — Hosting, networking and deployment  
9. **Security** — Protects the entire platform  
10. **Monitoring** — Tracks performance, errors and uptime  

### How they communicate (listing a car)

1. **Frontend** — A dealer fills in the car listing form.  
2. **API** — Sends the vehicle information to the server.  
3. **Backend** — Validates the information and checks the dealer’s permissions.  
4. **Database** — Saves the vehicle details in PostgreSQL (Neon).  
5. **File storage** — Saves listing photos in Vercel Blob.  
6. **Frontend** — Displays the newly published car to visitors.  

On localhost, open `/architecture` for the same overview in the app.

## Stack (current demo)

- React + TypeScript
- Vite
- React Router
- Local storage for demo data
