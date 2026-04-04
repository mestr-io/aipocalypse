.PHONY: dev test migrate install clean seed image-build image-tag image-push image-release

REGISTRY ?= ghcr.io
IMAGE ?= $(REGISTRY)/senyorjou/aipocalypse
LOCAL_IMAGE ?= localhost/aipocalypse
MANIFEST ?= localhost/aipocalypse-multi
TAG ?= latest
PLATFORMS ?= linux/amd64,linux/arm64

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

image-build:
	podman build -t $(LOCAL_IMAGE):$(TAG) .

image-tag:
	podman tag $(LOCAL_IMAGE):$(TAG) $(IMAGE):$(TAG)

image-push: image-tag
	podman push $(IMAGE):$(TAG)

image-release:
	podman manifest rm $(MANIFEST):$(TAG) >/dev/null 2>&1 || true
	podman manifest create $(MANIFEST):$(TAG)
	podman build --platform $(PLATFORMS) --manifest $(MANIFEST):$(TAG) .
	podman manifest push --all $(MANIFEST):$(TAG) docker://$(IMAGE):$(TAG)
