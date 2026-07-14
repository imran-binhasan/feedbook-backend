Note: this is not ai generated. i used tree command & copied the folder structure below

├── docker-compose.yml
├── docs
│   ├── db_diagram.png
│   └── folder_architecture.md
├── drizzle.config.ts
├── env.validation.ts
├── eslint.config.mjs
├── nest-cli.json
├── package.json
├── package-lock.json
├── README.md
├── src
│   ├── app.module.ts
│   ├── common
│   │   ├── common.module.ts
│   │   ├── decorator
│   │   │   └── current-user.decorator.ts
│   │   ├── filter
│   │   │   └── all-exception.filter.ts
│   │   ├── interceptor
│   │   │   └── response.interceptor.ts
│   │   ├── interface
│   │   │   └── api-response.interface.ts
│   │   ├── middleware
│   │   │   └── request-id.middleware.ts
│   │   ├── services
│   │   │   └── password-hasher.service.ts
│   │   ├── types
│   │   │   └── request.type.ts
│   │   └── utils
│   │       └── crypto.util.ts
│   ├── infrastructure
│   │   ├── cache
│   │   │   ├── cache.constants.ts
│   │   │   ├── cache.module.ts
│   │   │   ├── cache.service.ts
│   │   │   └── redis-throttler.storage.ts
│   │   ├── database
│   │   │   ├── database-connection.ts
│   │   │   ├── database.module.ts
│   │   │   ├── migrations
│   │   │   │   ├── 0000_broad_mikhail_rasputin.sql
│   │   │   │   ├── 0001_blushing_multiple_man.sql
│   │   │   │   ├── 0002_open_morph.sql
│   │   │   │   ├── 0003_public_betty_ross.sql
│   │   │   │   └── meta
│   │   │   │       ├── 0000_snapshot.json
│   │   │   │       ├── 0001_snapshot.json
│   │   │   │       ├── 0002_snapshot.json
│   │   │   │       ├── 0003_snapshot.json
│   │   │   │       └── _journal.json
│   │   │   ├── repositories
│   │   │   │   ├── comment.repository.ts
│   │   │   │   ├── like.repository.ts
│   │   │   │   ├── post.repository.ts
│   │   │   │   ├── reply.repository.ts
│   │   │   │   ├── repositories.module.ts
│   │   │   │   ├── session.repository.ts
│   │   │   │   └── user.repository.ts
│   │   │   └── schema
│   │   │       ├── comment-likes.schema.ts
│   │   │       ├── comments.schema.ts
│   │   │       ├── index.ts
│   │   │       ├── post-likes.schema.ts
│   │   │       ├── posts.schema.ts
│   │   │       ├── replies.schema.ts
│   │   │       ├── reply-likes.schema.ts
│   │   │       ├── sessions.schema.ts
│   │   │       └── users.schema.ts
│   │   └── storage
│   │       ├── storage.module.ts
│   │       └── storage.service.ts
│   ├── main.ts
│   └── modules
│       ├── auth
│       │   ├── auth.module.ts
│       │   ├── controller
│       │   │   └── auth.controller.ts
│       │   ├── dto
│       │   │   ├── login.dto.ts
│       │   │   ├── register.dto.ts
│       │   │   └── update-user.dto.ts
│       │   ├── guard
│       │   │   └── auth.guard.ts
│       │   └── service
│       │       ├── auth.service.ts
│       │       ├── session.service.ts
│       │       └── users.service.ts
│       ├── comments
│       │   ├── comments.module.ts
│       │   ├── controller
│       │   │   ├── comments.controller.ts
│       │   │   └── post-comments.controller.ts
│       │   ├── dto
│       │   │   ├── create-comment.dto.ts
│       │   │   └── update-comment.dto.ts
│       │   └── service
│       │       └── comments.service.ts
│       ├── likes
│       │   ├── controller
│       │   │   └── likes.controller.ts
│       │   ├── dto
│       │   ├── likes.module.ts
│       │   └── service
│       │       └── likes.service.ts
│       ├── posts
│       │   ├── controller
│       │   │   ├── posts.controller.ts
│       │   │   └── user-posts.controller.ts
│       │   ├── dto
│       │   │   ├── create-post.dto.ts
│       │   │   └── update-post.dto.ts
│       │   ├── posts.module.ts
│       │   └── service
│       │       └── posts.service.ts
│       ├── replies
│       │   ├── controller
│       │   │   ├── post-comment-replies.controller.ts
│       │   │   └── replies.controller.ts
│       │   ├── dto
│       │   │   ├── create-reply.dto.ts
│       │   │   └── update-reply.dto.ts
│       │   ├── replies.module.ts
│       │   └── service
│       │       └── replies.service.ts
│       └── uploads
│           ├── controller
│           │   └── uploads.controller.ts
│           ├── service
│           │   └── uploads.service.ts
│           └── uploads.module.ts
├── test
│   ├── auth.service.spec.ts
│   ├── password-hasher.service.spec.ts
│   ├── posts.service.spec.ts
│   └── security.spec.ts
├── tsconfig.build.json
├── tsconfig.json
└── yarn.lock