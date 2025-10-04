# AI BTS — Beauty Tour Solution

AI BTS-Beauty Tour Solution is a smart beauty concierge trip platform built on AWS. It helps users design personalized beauty and wellness trips by providing a few simple inputs (region, dates, theme such as skin clinic / hair salon / plastic surgery, and budget). Optional add-ons like flights and hotels can be included to create a full travel package.

This repository contains the application code and infrastructure for running the solution locally (development) and deploying to AWS. The project uses mise (mise-en-place) to manage developer tooling and task commands defined in `mise.toml`.

## Quick start

Prerequisites:
- Git
- A working AWS account and credentials configured locally (see "Environment variables" below)
- Internet access to install tools

Follow these steps to get started:

1. Install the developer tools declared in `mise.toml`:

```bash
mise install
```

2. Create your environment file from the example and fill required variables:

```bash
cp .env.example .env
# then open .env and fill in values (AWS credentials, secrets, API keys, etc.)
```

3. Start the development environment (this runs the SST development task defined in the repo):

```bash
mise run dev
```

4. When you want to tear down the development infrastructure (remove local dev stack):

```bash
mise run dev-remove
```

5. To deploy the production infrastructure and app to AWS:

```bash
mise run deploy
```

Note: `mise` reads the `mise.toml` file in the repository. This project already defines tasks such as `dev`, `dev-remove`, and `deploy` inside that file.

For more information about mise (mise-en-place), see: https://github.com/jdx/mise

## Environment variables

Copy `.env.example` to `.env` and populate the variables required by the project. Typical required values include AWS credentials and region (for example `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`) and any third-party API keys used by the application.

Ensure your AWS credentials have sufficient permissions to create and manage the resources required by SST/CloudFormation.

## Project layout (high level)

- `packages/web` — SvelteKit frontend and serverless routes. This is the primary web application. The `routes/api/generate-journey` endpoint contains server logic to generate travel plans.
- `mise.toml` — mise configuration (tool versions and tasks used to run/install/dev/deploy)

Explore `packages/web/src` for the frontend, components, and backend route handlers.

## Development notes

- This repo uses pnpm (version pinned in `mise.toml`) and SST for local development and deployment.
- If you need to run package manager commands directly from the `web` package:

```zsh
cd packages/web
pnpm install
pnpm run dev # if you prefer running local dev directly, but using `mise run dev` is recommended
```

## Troubleshooting

- If `mise` is not installed or the `mise` command is not found, follow the installer instructions on the mise repo: https://github.com/jdx/mise
- If SST or AWS deployment fails, confirm the AWS credentials and region in your `.env` and that your IAM user/role has permissions to manage CloudFormation and the required services.
- If package install fails, ensure `pnpm` is available (mise will install the pinned version if you run `mise install`).
