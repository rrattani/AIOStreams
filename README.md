<p align="center"><img src="https://raw.githubusercontent.com/Viren070/AIOStreams/refs/heads/main/packages/frontend/public/assets/logo.png" /></p>
<h1 align="center" id="title">AIOStreams</h1>

## Table of Contents

- [Description](#description)
- [FAQ](#faq)
  - [How does it work?](#how-does-it-work)
- [Usage](#usage)
  - [Public Instance](#public-instance)
  - [Personal Instance](#deploying-your-own-instance)
    - [Hugging Face](#hugging-face)
    - [Cloudflare Workers](#cloudflare-workers)
    - [Render](#render)
    - [ElfHosted](#elfhosted-paid)
    - [Heroku](#heroku-paid)
  - [Self Hosting](#self-hosting)
    - [Docker](#docker)
    - [From Source](#from-source)
- [Configuring](#configuring)
  - [Environment Variables](#environment-variables)
  - [Cloudflare Workers](#cloudflare-workers-1)
  - [Render](#render-1)
  - [Hugging Face](#hugging-face-1)
  - [Local](#local)
- [Development](#development)
- [Credits](#credits)

## Description

Combines streams from other addons into one and provides much greater customisation:

- Change the format of the resutls
- Filter all results by resolution, quality, visual tags, audio tags, encodes.
- Remove duplicate results, and prioritise specific services for a given file.
- Sort all results by quality, resolution, size, cached, visual tags, audio tags, encodes, seeders, service, language
- Prioritise or exclude specific languages
- Specify a minimum and/or maximum size
- Limiting to a specific number of results per resolution
- Proxy your streams with MediaFlow

You simply configure your options, add any API keys for any services you use, then enable whichever addons you want, and install.

The addon will scrape all results from all addons, apply your configuration, and give the results back to you in one go.

> [!NOTE]
> Do not install other addons that you have enabled through this addon. You will only cause unnecessary requests to the addon.
> I also do not recommend installing/enabling too many addons as they all scrape mostly the same sources.

## FAQ

### How does it work?

The addon has parsers for specific addons and can extract the relevant information.
It goes through each addon you selected and obtains the results with all the parsed information.

Once it has all the parsed information for each result, it can apply your configured sorting and filtering options.

### Why was this addon created?

I wanted to have a single addon that could scrape all the sources I wanted and apply my own custom filters and sorting options.
Many addons lack the ability to finely tune how you want your results to be sorted and filtered.

Being able to change the format of every result was also a big factor in creating this addon.
I preferred the format of my GDrive addon and wanted to use that format for all my results.
This makes it easier to parse the results and explain to less tech-savvy people how to pick the best result.

It also means you only have to install one addon instead of configuring multiple addons.

Furthermore, being able to apply a global filter and sort to all results means that you can get the best results from all sources displayed first,
rather than having to check each addon individually.

### What are the currently supported addons?

It currently supports:

- Torrentio
- MediaFusion
- Comet
- Torbox Addon
- Debridio
- Jackettio
- Peerflix
- DMM Cast
- Orion Stremio Addon
- Easynews
- Easynews+
- [Stremio GDrive](https://github.com/Viren070/stremio-gdrive-addon)
- Custom: You can input an addon URL and name and it will parse as much information as it can.

> [!NOTE]
> The URL can either be a URL to the manifest.json or the url without the manifest.json
> e.g. `https://torrentio.strem.fun/` or `https://torrentio.strem.fun/manifest.json`

### What are the supported formatters?

The addon can display your results in different formats. The formats available are:

- gdrive:
  Uses the format from this [Stremio GDrive](https://github.com/Viren070/stremio-gdrive-addon) addon

  ![image](https://github.com/user-attachments/assets/9d9c74ab-afde-41f9-ba94-eaf8904b580b)

- minimalistic-gdrive
  A modified version of the `gdrive` format where the filename is not shown. Emojis are used for languages, and seeders are not shown for cached results.

- torrentio:
  Uses the format from the Torrentio addon.

  ![image](https://github.com/user-attachments/assets/343dccb4-13c5-4b57-998a-82b763e9ebf9)

- torbox:
  Uses the format from the Torbox stremio addon.

  ![image](https://github.com/user-attachments/assets/21f90ee2-e81d-4a56-9e64-8937fb7ab2bc)

### What is Stremio or How do I use this addon?

Read my [Stremio guide](https://guides.viren070.me/stremio).

## Usage

### Public Instance

> [!IMPORTANT]
> Torrentio is disabled on the public instance!

[ElfHosted](https://elfhosted.com/) have been kind enough to host a [community instance of AIOStreams](https://aiostreams.elfhosted.com/configure).

This community instance does have a ratelimit in place, but it is unlikely you will reach it. It also avoids the ratelimits of ElfHosted addons like Comet and MediaFusion as AIOStreams' requests to these addons are routed internally.
However, other non-ElfHosted addons may rate limit the community instance.

### Deploying your own instance

Rather than hosting the addon locally, you can make use of some services to deploy the addon for you. This would be your own instance. However, if anyone has the URL to it, they can also use it.

I would recommend using Hugging Face over the other options, it is fast and is still easy to set up.

#### Hugging Face

This addon can be deployed as a [Hugging Face](https://huggingface.co/) space.

> [!IMPORTANT]
> Hugging Face is centered around AI and as this addon is not related to AI, they may have begun blocking deployments of this addon which cause it to get stuck on building.
>
> To workaround this, you can create a fork of this repository with a random name (not AIOStreams), and after step 4, before clicking `Commit to main`, simply edit the file where it says Viren070/AIOStreams to use your forked repository instead.
> Note: To update your instance with this workaround, you need to sync your fork on GitHub, and **then** do a `Factory Rebuild`



1. Create a Hugging Face account and on the [home page](https://huggingface.co) create a new space.

![Screenshot 2024-12-29 133648](https://github.com/user-attachments/assets/9d20a1ac-8eff-4748-8ed7-29da174bd438)

2. In the 'Create a space' menu, choose 'Docker' as the `Space SDK` and 'Blank' for the docker template.

![image](https://github.com/user-attachments/assets/99dc4aed-9331-4bde-a500-2fa1b9dac572)

- Ensure the space is set to `Public`
- The `Space name` can be anything.

3. After clicking 'Create Space', you should be taken to your space. Scroll down to 'Create your dockerfile', and click the link contained in the hint.

![image](https://github.com/user-attachments/assets/8020ca91-abbf-4077-9379-1e0b693444a0)

4. Copy and paste the following Dockerfile into the text box. Do not use the Dockerfile in this repository. Make sure to use the one below
<details>
<summary>Dockerfile - Click to expand</summary>
<pre><code>
FROM node:22-alpine AS builder
WORKDIR /build
RUN apk add --no-cache git && \
git clone https://github.com/Viren070/AIOStreams.git . && \
apk del git

RUN npm install

RUN npm run build

RUN npm --workspaces prune --omit=dev

FROM node:22-alpine AS final

WORKDIR /app

COPY --from=builder /build/package\*.json /build/LICENSE ./

COPY --from=builder /build/packages/addon/package.*json ./packages/addon/
COPY --from=builder /build/packages/frontend/package.*json ./packages/frontend/
COPY --from=builder /build/packages/formatters/package.*json ./packages/formatters/
COPY --from=builder /build/packages/parser/package.*json ./packages/parser/
COPY --from=builder /build/packages/types/package.*json ./packages/types/
COPY --from=builder /build/packages/wrappers/package.*json ./packages/wrappers/
COPY --from=builder /build/packages/utils/package.\*json ./packages/utils/

COPY --from=builder /build/packages/addon/dist ./packages/addon/dist
COPY --from=builder /build/packages/frontend/out ./packages/frontend/out
COPY --from=builder /build/packages/formatters/dist ./packages/formatters/dist
COPY --from=builder /build/packages/parser/dist ./packages/parser/dist
COPY --from=builder /build/packages/types/dist ./packages/types/dist
COPY --from=builder /build/packages/wrappers/dist ./packages/wrappers/dist
COPY --from=builder /build/packages/utils/dist ./packages/utils/dist

COPY --from=builder /build/node_modules ./node_modules

EXPOSE 7860

ENV PORT=7860

ENTRYPOINT ["npm", "run", "start:addon"]
</code></pre>

</details>

5. Click `Commit new file to main`

6. Your addon will be hosted at {username}-{space-name}.hf.space. You can also find a direct URL to it by clicking the 3 dots > Embed this space > Direct URL > Copy

>[!WARNING]
> The build process generally takes around 5 minutes. However, it can sometimes get stuck sometimes or fail. In this case, go to `Settings`, and click `Factory Rebuild`. If it fails after factory rebuilding more than 3 times, you can create an issue.

##### Updating

To update the addon, you can simply go to the `Settings` tab and click `Factory rebuild`. This will rebuild the addon with the latest changes.

#### Cloudflare Workers

This addon can be deployed as a [Cloudflare Worker](https://workers.cloudflare.com/).

> [!NOTE]
> Cloudflare Workers cannot make requests to other Cloudflare Workers from the same account. If you have deployed the Stremio GDrive addon already on a Cloudflare account, the AIOStreams worker on the same account will not be able to fetch streams from your Stremio GDrive worker.

> [!WARNING]
> A Cloudflare Worker may get blocked by Torrentio. You may also encounter a build error, in which case you will have to edit the code slightly and lose the functionality of the `ADDON_PROXY` environment variable

There are 2 methods to do this. Method 2 requires you to have Git and Node.js installed, method 1 does not, and only requires a web browser and a Cloudflare account.

**Method 1**

1. Fork my GitHub repository.
2. Head to the [Cloudflare Dashboard](https://dash.cloudflare.com/sign-up/workers-and-pages), signing up for an account if needed.
3. Click the `Create` button and call your worker `aiostreams`
4. Click `Continue to project` after it's done creating
5. Go to the `Settings` tab.
6. Scroll down to the `Build` section, and click `Connect` on the Git repository option.
   - Choose your GitHub account, and the repository you created earlier when forking my repository
   - Leave the branch as main
   - Build command:
        ```bash
        npm install | npm run build
        ```
   - Deploy command:
       ```bash
       npm run deploy:cloudflare-worker
       ```
7. Click `Connect`
8. Trigger a redeployment by going to the `Deployments` tab, clicking `Deploy version`, and `Deploy`
9. You can find the URL for your cloudflare worker by clicking `View version` at the `Deployments` tab under the `Active deployments` section

If you get an error about the `node:sqlite` module, follow [these instructions](https://github.com/Viren070/AIOStreams/issues/32#issuecomment-2602643959), editing the code at your forked GitHub repository. 

**Method 2**

1. Sign up for a [Cloudflare Account](https://dash.cloudflare.com/sign-up/workers-and-pages)
2. Install Node.js (I would recommend using package managers e.g. fnm on Windows)
3. Install Git
5. Run the following commands:



```bash
git clone https://github.com/Viren070/AIOStreams.git
cd AIOStreams
npm i
npm run build
npm run deploy:cloudflare-worker
```

If you get an error about the `node:sqlite` module, follow [these instructions](https://github.com/Viren070/AIOStreams/issues/32#issuecomment-2602643959)

##### Updating

**Method 1**

Go to your forked GitHub repository and click sync fork. This should trigger a deployment, if not follow the same steps above to redeploy.

**Method 2**

To update the addon, you can simply run the following commands to pull the latest changes, build the project, and deploy the worker.
This will update the worker with the latest changes, which may not be stable. In case, you get the build error about `node:sqlite` again, follow the instructions linked above again. 

```
git pull --rebase
npm run build
npm run deploy:cloudflare-worker
```

#### Render

https://render.com/

> [!WARNING]
> Free instances 'spin down' after 15 minutes of inactivity. In this suspended state, it can take around a minute to start back up again when you make a request to it.

> [!TIP]
> Use a service (like [cron-job.org](https://cron-job.org/en/) or [UptimeRobot](https://uptimerobot.com/)) to automatically ping the URL of your instance + /health to keep it alive (e.g. if your instance was at `https://aiostreams.onrender.com`, create a job to ping `https://aiostreams.onrender.com/health` every 10 minutes) 

1. Deploy a new web service
2. Select `Public Git Repository` as the source
3. Enter `https://github.com/Viren070/AIOStreams`
4. Deploy


##### Updating

When you deploy with Render, it automatically builds the addon every time a commit is pushed to this repository. You can also manually trigger a build by clicking the `Deploy` button.

It is recommend to disable the `Auto Deploy` feature as the latest changes may not be stable. You can do this by going to the `Settings` tab and scrolling down to the `Auto Deploy` setting near the bottom of the `Build & Deploy` section.

#### ElfHosted (paid)

> [!NOTE] 
> Use the link below to support me, 33% of your AIOStreams subscription will go to me ❤️ 

AIOStreams is available as a [paid product on ElfHosted](https://store.elfhosted.com/product/aiostreams/elf/viren070/). This offers you a no-hassle experience where you can expect things to "just work". 

#### Heroku (paid) 

> [!TIP]
> Heroku have a [student offer](https://www.heroku.com/github-students/) which gives you $13 worth of credit each month to spend for 24 months. 

To deploy AIOStreams on [Heroku](https://heroku.com/), you can fork this repository, and create a new app on the [Heroku Dashboard](https://dashboard.heroku.com/), using `GitHub` as the deployment method in the `Deploy` tab, and choosing the `Node.js` buildpack in the `Settings` tab. 

### Self-Hosting

#### Docker

[Docker](https://docs.docker.com/get-docker/) is a quick and convenient way to run this. Official images are available at the [ghcr.io](https://github.com/Viren070/AIOStreams/pkgs/container/aiostreams) and [docker.io](https://hub.docker.com/r/viren070/aiostreams) registries

You can use the prebuilt images using one of the following commands:

**GitHub Container Registry**:
```
docker run -p 8080:3000 ghcr.io/viren070/aiostreams:latest
```
**Docker Hub**:
```
docker run -p 8080:3000 viren070/aiostreams:latest
```

If you would like to pass one of the [environment variables](CONFIGURING.md), you can provide the -e flag, e.g. to provide a SECRET_KEY (recommended, see [CONFIGURING.md](CONFIGURING.md) for how to generate a secret key.): 

```
docker run -p 8080:3000 -e SECRET_KEY=... viren070/aiostreams:latest
```


If you don't want to use a prebuilt image, or want to build from a commit that isn't tagged with a version yet, you can build the image yourself using the following commands: 

```
git clone https://github.com/Viren070/aiostreams.git
cd aiostreams
docker build -t aiostreams .
docker run -p 8080:3000 aiostreams
```

#### From source

You need Node.js and git installed. Node v22 and npm v10.9 were used in the development of this project. I can not guarantee earlier versions will work.

1. Clone the project and set it as the current directory
   ```
   git clone https://github.com/Viren070/AIOStreams.git
   ```
   ```
   cd aiostreams
   ```
2. Install project dependencies
   ```
   npm i
   ```
3. Build project
   ```
   npm run build
   ```
4. Run project
   ```
   npm run start:addon
   ```
5. Go to `http://localhost:3000/configure`

You can change the PORT environment variable to change the port that the addon will listen on.

## Configuring

If you would like an explanation on the configuration options at the /configure page, have a look at this [guide for aiostreams](https://guides.viren070.me/stremio/addons/aiostreams) that I made. 

Outside of the configuration page, the behaviour of this addon can also be changed with environment variables.  
Most users don't need to set any environment variables. However, if you do, the SECRET_KEY is the one you might want to configure. This key enables encrypted manifest URLs, which help protect your API keys.

With encryption, someone who has your manifest URL can't directly see your API keys. However, they can still install the addon using the encrypted URL. Once installed, they can view API keys within other addons' URLs that are contained within AIOStreams' responses, as most addons don’t encrypt their manifest URLs.

### Environment Variables

Please see [CONFIGURING](CONFIGURING.md) for all the environment variables you can set. 

Below, you can find how to set environment variables for the different methods of deployment.

### Cloudflare Workers

Unfortunately, it is not currently possible to set environment variables for this addon on a Cloudflare Worker. You will have to modify the code directly. You can look in `packages/utils/src/settings.ts` to change the default values.

### Render

You can set environment variables in the Render dashboard.

1. Go to the [Render dashboard](https://dashboard.render.com/) and select the `AIOStreams` service.
2. Click on the `Environment` tab under the `Manage` section.
3. Click on the `Edit` button.
4. Click `Add Environment Variable` and enter the name and value of the environment variable you want to set.
5. Once you have added all the environment variables you want to set, click `Save, build, and deploy`.

### Hugging Face

1. Go to your Hugging Face space and click on the `Settings` tab.
2. Scroll down to `Variables and Secrets` and click on `New secret`.
   > [!WARNING]
   > Ensure you are using `Secrets`, especially for `SECRET_KEY`. Variables are public and can be seen by anyone.
3. Enter the name and value of the environment variable you want to set. The description is optional and can be left empty.

### Local

You can set environment variables using a .env file in the root of the project.

```
ADDON_NAME=AIOStreams
ADDON_ID=aiostreams.viren070.com
PORT=3000
SECRET_KEY=your_secret_key
COMET_URL=https://comet.elfhosted.com/
...
```

## Development

1. Clone the project and set it as the current directory
   ```
   git clone https://github.com/Viren070/AIOStreams.git
   ```
   ```
   cd aiostreams
   ```
2. Install project dependencies
   ```
   npm i
   ```

Now, you can run various aspects of the project in development.

> [!NOTE]
> Most of these commands require that you build the project beforehand. Changes in other packages do not reflect immediately as it needs to be compiled into JavaScript first.
> Run `npm run build` to build the project.

To start the addon in development mode, run the following command:

```
npm run start:addon:dev
```

To run the cloudflare worker in development mode, run the following command

```
npm run start:cloudflare-worker:dev
```

To run the frontend of the project, run the following command

```
npm run start:frontend:dev
```

### Deploying

To deploy your cloudflare worker, run the following command:

```
npm run deploy:cloudflare-worker
```

## Disclaimer 

AIOStreams and its developer do not host, store, or distribute any content that is found using this addon. All content is sourced from publicly available addons. AIOStreams does not endorse or promote piracy in any form. It is the user's responsibility to ensure that their use of this addon is in compliance with their local laws and regulations.

## Credits

- Thanks to [sleeyax/stremio-easynews-addon](https://github.com/Sleeyax/stremio-easynews-addon) for the repository structure and dockerfile.
- Thanks to all addon devs for creating the upstream addons that AIOStreams scrapes. 
- [MediaFlow](https://github.com/Mhdzumair/mediaflow-proxy) for MediaFlow Proxy which is used in this addon to proxy your streams
- Issue templates were stolen from [5rahim/seanime](https://github.com/5rahim/seanime) (You should really try out this app)
