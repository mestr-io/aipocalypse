.PHONY: dev test migrate install clean seed

dev:
	bun --hot run src/index.ts

test:
	bun test

migrate:
	bun run src/db/migrate.ts

install:
	bun install

clean:
	rm -rf data/ node_modules/ .test-tmp/

seed:
	bun run scripts/seed.ts
