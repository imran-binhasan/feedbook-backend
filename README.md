A social media backend to be built using NestJS + Postgres, Drizzle ORM, Redis & Cloudflare R2 for storage

Current progress:
- DB schema designed
- Project folder structure defined
- Boilerplate cleanup done
- Docker compose for local Postgres & Drizzle ORM setup done
- Database schema/table writing & initial migration done
- Common module : response interface, interceptor & response interceptor added
- Added session, user & auth service, user creation & login dto, also added auth controller for interceptor & exception testing
- Complete auth module, added access module for better architecure & communication with auth & user module, review whole codebase & fixed few issues, like we forgot to enforce env validation,was using raw drizzle import everywhere which was bad practice also few minor issues were overloooked, wrapped that & also added swagger documentation & reviewed all code quality,
-Completed storage module & service for s3
-Completed post module
-Completed comment module
-Added db-level check constraints for schema safety,index migrations, apply helmet & cors hardening for security
-Added likes module, wired session & post caching, updated response & types
-Added replies module with nested crud under comments, added reply repository with cursor pagination
