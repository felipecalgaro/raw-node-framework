# ⚙️ Raw Node Framework

## What I Learned

- How Node frameworks work under the hood
- How to implement middleware functionality from scratch using recursion
- How to implement the logic behind selecting an endpoint given its route, params, method or all together
  - E.g., the endpoint _GET /$userId/example/$postId_ should serve the request _GET /1/example/2_

## Overview

This is a project developed for studying purposes. Curious about how node frameworks such as _Express_ work, I tried to create my own from scratch. After all, just as Feynman once said, _"What I cannot create, I do not understand"_.

## Tests

In order to test purely the business logic of the framework during its development (such as the middlewares functionality or the routing system), a class _RawTest_, that simulates the behavior of the actual framework - except that it does not depend on any http feature - was implemented.

## Architecture

Two classes are implemented: Raw and Router. The first one deals with all the http and middlewares functionality, while the other, more as an attachment to the first one, helps with all the business logic of the routing system.

<img width="2960" alt="raw-framework" src="https://github.com/user-attachments/assets/64a5b1bb-b40f-4435-ae7c-03b1f9b75dd4" />

## Example

- Code:

```js
import Raw from "./raw";

const raw = new Raw();

raw.applyMiddleware(
  (req, res, next) => {
    console.log("hello");
    next();
  },
  {
    endpoint: "/users/$id",
  }
);

raw.set("POST", "/users", (req, res) => {
  const { body } = req;
  return res.end(JSON.stringify({ body }));
});

raw.set("GET", "/users/$id", (req, res) => {
  const { params } = req;
  return res.end(JSON.stringify({ params }));
});

raw.listen(3333, () => {
  console.log("Server running 🎉");
});
```

- HTTP Requests:

```http
POST http://localhost:3333/users
{
  "id": 123,
  "name": "John",
  "age": 20
}

GET http://localhost:3333/users/123
```

- Result:

```json
{
  "body": {
    "id": 123,
    "name": "John",
    "age": 20
  }
}

{
  "params": {
    "id": 123
  }
}
```
