# Database Migrations

This directory contains SQL migration scripts for the application database schema.

## Running Migrations

To apply migrations to your database, run:

```bash
psql $DATABASE_URL -f migrations/001_create_app_schema.sql
```

Or if using a migration tool:

```bash
# Example with dbmate
dbmate up

# Example with migrate
migrate -path migrations -database $DATABASE_URL up
```

## Migration Files

- `001_create_app_schema.sql` - Creates all application tables (conversations, messages, user profiles, etc.)

## Important Notes

- Supabase Auth manages its own tables (users, sessions, auth schema) automatically
- These migrations only handle application-specific tables
- All tables use `IF NOT EXISTS` to be idempotent
- Foreign keys reference Supabase's auth.users table via `user_id` uuid field