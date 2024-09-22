# Installation

### via npm
``npm install @holykuche/db-migrations-executor``

### via yarn
``yarn add @holykuche/db-migrations-executor``

# Usage
```
import { DatabaseClient, MigrationsExecutorImpl } from '@holykuche/db-migrations-executor';

// Implement DatabaseClient. You can use any database management system in theory.
// But the API imply relational databases usage.
const dbClient: DatabaseClient = {
  // your implementation
};

// Copy your migration scripts in a distributive directory
// each time while building process.
// Set this constant to relative path to migrations.
const MIGRATION_SCRIPTS_DIR = 'migration-scripts';

new MigrationsExecutorImpl(dbClient)
    .execute('migrations', resolve(__dirname, MIGRATION_SCRIPTS_DIR))
    .then(() => console.log('Migration completed successfully'))
    .catch(error => console.error(error));
```