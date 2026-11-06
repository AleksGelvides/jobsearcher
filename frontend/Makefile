.DEFAULT_GOAL := help

FRONTEND_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))

.PHONY: help install dev test typecheck lint build e2e

help:
	@printf '%s\n' 'Help hello!'

install:
	cd "$(FRONTEND_DIR)" && npm ci

dev:
	cd "$(FRONTEND_DIR)" && npm run dev

test:
	cd "$(FRONTEND_DIR)" && npm run test

typecheck:
	cd "$(FRONTEND_DIR)" && npm run typecheck

lint:
	cd "$(FRONTEND_DIR)" && npm run lint

build:
	cd "$(FRONTEND_DIR)" && npm run build

e2e:
	cd "$(FRONTEND_DIR)" && npm run test:e2e
