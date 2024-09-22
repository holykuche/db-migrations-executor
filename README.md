# Installation

### via npm
```shell
npm install @holykuche/db-migrations-executor
```

### via yarn
```shell
yarn add @holykuche/db-migrations-executor
```

# Usage
```js
import { DatabaseClient, MigrationsExecutorImpl } from '@holykuche/db-migrations-executor';

// Implement DatabaseClient. You can use any database management system in theory.
// But the API implies relational databases usage.
const dbClient: DatabaseClient = {
  // your implementation
};

// Keep your migration scripts in a distributive directory fresh.
// For example, you might copy migration scripts into a distributive
// directory each time while building process.
// Set this constant to relative path to migrations.
const MIGRATION_SCRIPTS_DIR = 'migration-scripts';

new MigrationsExecutorImpl(dbClient)
    .execute('migrations', resolve(__dirname, MIGRATION_SCRIPTS_DIR))
    .then(() => console.log('Migration completed successfully'))
    .catch(error => console.error(error));
```

Also, you can find a usage example [here](https://github.com/holykuche/planning-poker/tree/microservice) (see ``poker`` and ``telegram`` modules).