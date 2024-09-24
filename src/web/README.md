# Curio web
Web application, API endpoints, and database utilities for the Curio app.

## Requirements
Node 18+ for the application.

## Development
### Getting started
Start Curio's development server using the instructions in the project README.

Navigate to the application in your browser at (https://localhost:3000).

### Database migrations
#### Creating a migration
1. Edit the schema definition at `db/schema.ts`.
2. Exec into the app container using `docker exec -it curio bash`.
3. Run `npm run db:generate <MIGRATION_NAME>`.
4. Check in the generated files.

#### Running migrations
1. Exec into the app container using `docker exec -it curio bash`.
2. Run `npm run db:migrate`.