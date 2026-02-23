# Mini CRM Tutorial

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). It serves as a tutorial application for a Mini CRM system.

## Features

- **Authentication**: Secure user authentication powered by [Clerk](https://clerk.com/).
- **Database**: Flexible database support using **SQLite** (local development) and **Turso** (production), managed via [Drizzle ORM](https://orm.drizzle.team/).
- **UI Components**: Built with Tailwind CSS and Radix UI.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/andrealencar/mini-crm-tutorial.git
cd mini-crm-tutorial
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Environment Configuration

The application requires specific environment variables to function correctly. A generic example is provided in `.env.example`.

**Create your local environment file:**

```bash
cp .env.example .env.local
```

**Populate the `.env.local` file with your credentials:**

- **Clerk Authentication**:
  - Sign up at [Clerk](https://clerk.com/).
  - Create a new application.
  - Copy the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` and `CLERK_WEBHOOK_SECRET` from your Clerk dashboard to your `.env.local`.

- **Database**:
  - **Local Development**: The default configuration uses a local SQLite file (`sqlite.db`).
  - **Production (Turso)**: To use Turso, uncomment the Turso configuration lines in `.env.local` and add your database URL and Auth Token.

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Management

This project uses **Drizzle ORM**.

- **Schema Changes**: If you modify the database schema, you can push changes using:
  ```bash
  npx drizzle-kit push
  ```
- **Studio**: To visualize your database:
  ```bash
  npx drizzle-kit studio
  ```

### Alternative: Using Supabase (Optional)

This project defaults to **SQLite/Turso**. If you prefer to use **Supabase (PostgreSQL)**, you must refactor the database layer:

1.  **Environment Variables**:
    - Add your Supabase `DATABASE_URL` (connection string) to `.env.local`.
2.  **Code Changes Required**:
    - **Install Driver**: `npm install postgres` (or `pg`) and uninstall `@libsql/client`.
    - **Schema**: Rewrite `lib/db/schema.ts` to use `pg-core` (e.g., `pgTable`) instead of `sqlite-core`.
    - **Connection**: Update `lib/db/index.ts` to use the postgres driver.
    - **Config**: Update `drizzle.config.ts` to set `dialect: 'postgresql'`.


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1.  **Push to GitHub**: Ensure your project is pushed to a GitHub repository.
2.  **Import in Vercel**: Create a new project in Vercel and import your repository.
3.  **Environment Variables**:
    - Add all keys from your `.env.local` to the **Environment Variables** section in Vercel project settings.
    - **Important**: For production, ensure you are using the **Turso** connection string (libsql) instead of the local file path.
4.  **Deploy**: Click "Deploy" and your Mini CRM will be live!

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
