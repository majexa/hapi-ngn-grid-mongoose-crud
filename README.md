# hapi-ngn-grid-mongoose-crud

## Usage

Mongoose init example:
https://github.com/majexa/skills-server/blob/master/src/lib/db/index.js

```php
const crud = require('hapi-ngn-grid-mongoose-crud');
const dbConnect = require('./lib/db');
dbConnect().then((models) => {
  const server = new Hapi.Server();
  server.decorate('request', 'db', models);
  server.route(debugRoutes(crud('modelName', models.ModelName, {
    filter: {
      $ne: {
        someKey: null
      }
    }
  })));
```
