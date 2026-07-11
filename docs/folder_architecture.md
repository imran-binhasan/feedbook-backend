Note: this is not ai generated. i used tree command & copied the folder structure below

├── docs
│   ├── db_diagram.png
│   └── folder_architecture.md
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── README.md
├── src
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── common
│   │   ├── filter
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptor
│   │   │   └── response.interceptor.ts
│   │   └── interface
│   │       └── api-response.interface.ts
│   ├── infrastructure
│   │   ├── database
│   │   │   ├── database.module.ts
│   │   │   └── schema
│   │   │       ├── comments.schema.ts
│   │   │       ├── likes.schema.ts
│   │   │       ├── posts.schema.ts
│   │   │       ├── replies.schema.ts
│   │   │       └── users.schema.ts
│   │   ├── redis
│   │   └── storage
│   ├── main.ts
│   └── modules
│       ├── auth
│       │   ├── auth.module.ts
│       │   ├── controller
│       │   ├── dto
│       │   └── service
│       ├── comments
│       │   ├── comments.module.ts
│       │   ├── controller
│       │   ├── dto
│       │   └── service
│       ├── likes
│       │   ├── controller
│       │   ├── dto
│       │   ├── likes.module.ts
│       │   └── service
│       ├── posts
│       │   ├── controller
│       │   ├── dto
│       │   ├── posts.module.ts
│       │   └── service
│       ├── replies
│       │   ├── controller
│       │   ├── dto
│       │   ├── replies.module.ts
│       │   └── service
│       └── users
│           ├── controller
│           ├── dto
│           ├── service
│           └── users.module.ts
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── tsconfig.build.json
├── tsconfig.json
└── yarn.lock