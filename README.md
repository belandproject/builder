
# Beland Builder

You can create beautiful scenes for [Beland](https://beland.io) even if you don't own a parcel.

# How to run

The builder is a SPA or single page application built with [create-react-app](https://github.com/facebook/create-react-app). It uses an [`.env`](#environment) file as configuration for a few things, you'll need to create that first.

After that, to run this app you have two options:

- **Development Server**: run `npm start` from the [`root`](https://github.com/belandproject/builder/tree/master) path
- **Production**: run `npm run build` and host the resulting index.html file with your server of choice, for example `python -m SimpleHTTPServer 5000`

For more information, check the [create-react-app](https://github.com/facebook/create-react-app) repo.

## Environment

This project depends on a few environment variables to work, as well as external services for some features.
The front-end connects to these services via URLs set via environment variables.

**Creating an environment file**

You'll need Create an `.env` file on the [`root`](https://github.com/belandproject/builder/tree/master) folder and fill it following the `.env.example` file found there.

Here are the basic requirements to run the project:

```
# .env

NODE_PATH=src

REACT_APP_BUILDER_SERVER_URL=https://builder-api.beland.io/v1
REACT_APP_MARKETPLACE_URL=https://nft-api-test.beland.io/v1

```
