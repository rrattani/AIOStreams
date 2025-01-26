import {
  Stream,
  ParsedStream,
  StreamRequest,
  ParsedNameData,
  Config,
} from '@aiostreams/types';
import { extractSizeInBytes, parseFilename } from '@aiostreams/parser';
import {
  getMediaFlowConfig,
  getMediaFlowPublicIp,
  serviceDetails,
  Settings,
} from '@aiostreams/utils';
// import { fetch as uFetch, ProxyAgent } from 'undici';

export class BaseWrapper {
  private readonly streamPath: string = 'stream/{type}/{id}.json';
  private indexerTimeout: number;
  protected addonName: string;
  private addonUrl: string;
  private addonId: string;
  private userConfig: Config;
  constructor(
    addonName: string,
    addonUrl: string,
    addonId: string,
    userConfig: Config,
    indexerTimeout?: number
  ) {
    this.addonName = addonName;
    this.addonUrl = this.standardizeManifestUrl(addonUrl);
    this.addonId = addonId;
    (this.indexerTimeout = indexerTimeout || Settings.DEFAULT_TIMEOUT),
      (this.userConfig = userConfig);
  }

  protected standardizeManifestUrl(url: string): string {
    // remove trailing slash and replace stremio:// with https://
    let manifestUrl = url.replace('stremio://', 'https://').replace(/\/$/, '');
    return manifestUrl.endsWith('/manifest.json')
      ? manifestUrl
      : `${manifestUrl}/manifest.json`;
  }

  public async getParsedStreams(
    streamRequest: StreamRequest
  ): Promise<ParsedStream[]> {
    const streams: Stream[] = await this.getStreams(streamRequest);
    const parsedStreams: ParsedStream[] = streams
      .map((stream) => this.parseStream(stream))
      .filter((parsedStream) => parsedStream !== undefined);
    return parsedStreams;
  }

  private getStreamUrl(streamRequest: StreamRequest) {
    return (
      this.addonUrl.replace('manifest.json', '') +
      this.streamPath
        .replace('{type}', streamRequest.type)
        .replace('{id}', encodeURIComponent(streamRequest.id))
    );
  }

  private async getRequestingIp() {
    let userIp = this.userConfig.requestingIp;
    const mediaFlowConfig = getMediaFlowConfig(this.userConfig);
    if (mediaFlowConfig.mediaFlowEnabled) {
      const mediaFlowIp = await getMediaFlowPublicIp(mediaFlowConfig);
      if (!mediaFlowIp) {
        throw new Error('Failed to get public IP from MediaFlow');
      }
      userIp = mediaFlowIp;
    }
    return userIp;
  }

  protected async getStreams(streamRequest: StreamRequest): Promise<Stream[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, this.indexerTimeout);

    const url = this.getStreamUrl(streamRequest);
    try {
      // Add requesting IP to headers
      const headers = new Headers();
      const userIp = await this.getRequestingIp();
      if (userIp) {
        if (Settings.LOG_SENSITIVE_INFO) {
          console.debug(
            `|DBG| wrappers > base > ${this.addonName}: Using IP: ${userIp}`
          );
        }
        headers.set('X-Forwarded-For', userIp);
        headers.set('X-Real-IP', userIp);
      }
      const urlParts = url.split('/');
      const sanitisedUrl = `${urlParts[0]}//${urlParts[2]}/*************/${urlParts.slice(-3).join('/')}`;
      console.log(
        `|INF| wrappers > base > ${this.addonName}: Fetching with timeout ${this.indexerTimeout}ms from ${sanitisedUrl}`
      );
      let response;
      try {
        response = await fetch(url, {
          method: 'GET',
          headers: headers,
          signal: controller.signal,
        });
        if (!response.ok) {
          let message = await response.text();
          throw new Error(
            `${response.status} - ${response.statusText}: ${message}`
          );
        }
      } catch (error: any) {
        /*
        if (!Settings.ADDON_PROXY) {
          throw error;
        }
        const dispatcher = new ProxyAgent(Settings.ADDON_PROXY);
        console.error(
          `|ERR| wrappers > base > ${this.addonName}: Got error: ${error.message} when fetching from ${sanitisedUrl}, trying with proxy instead`
        );
        response = await uFetch(url, {
          dispatcher,
          method: 'GET',
          headers: headers,
          signal: controller.signal,
        });
        */
        throw error;
      }

      clearTimeout(timeout);

      if (!response.ok) {
        let message = await response.text();
        throw new Error(
          `${response.status} - ${response.statusText}: ${message}`
        );
      }

      const results = (await response.json()) as { streams: Stream[] };
      if (!results.streams) {
        throw new Error('Failed to respond with streams');
      }
      return results.streams;
    } catch (error: any) {
      clearTimeout(timeout);
      let message = error.message;
      if (error.name === 'AbortError') {
        message = `${this.addonName} failed to respond within ${this.indexerTimeout}ms`;
      }
      return Promise.reject(new Error(message));
    }
  }

  protected extractInfoHash(url: string): string | undefined {
    return url.match(/(?<=[-/[(;&])[a-fA-F0-9]{40}(?=[-\]\)/;&])/)?.[0];
  }

  protected createParsedResult(
    parsedInfo: ParsedNameData,
    stream: Stream,
    filename?: string,
    size?: number,
    provider?: ParsedStream['provider'],
    seeders?: number,
    usenetAge?: string,
    indexer?: string,
    duration?: number,
    personal?: boolean,
    infoHash?: string
  ): ParsedStream {
    return {
      ...parsedInfo,
      addon: { name: this.addonName, id: this.addonId },
      filename: filename,
      size: size,
      url: stream.url,
      externalUrl: stream.externalUrl,
      _infoHash: infoHash,
      torrent: {
        infoHash: stream.infoHash,
        fileIdx: stream.fileIdx,
        sources: stream.sources,
        seeders: seeders,
      },
      provider: provider,
      usenet: {
        age: usenetAge,
      },
      indexers: indexer,
      duration: duration,
      personal: personal,
      stream: {
        subtitles: stream.subtitles,
        behaviorHints: {
          countryWhitelist: stream.behaviorHints?.countryWhitelist,
          notWebReady: stream.behaviorHints?.notWebReady,
          proxyHeaders:
            stream.behaviorHints?.proxyHeaders?.request ||
            stream.behaviorHints?.proxyHeaders?.response
              ? {
                  request: stream.behaviorHints?.proxyHeaders?.request,
                  response: stream.behaviorHints?.proxyHeaders?.response,
                }
              : undefined,
          videoHash: stream.behaviorHints?.videoHash,
        },
      },
    };
  }

  protected parseServiceData(
    string: string
  ): ParsedStream['provider'] | undefined {
    const cleanString = string.replace(/web-?dl/i, '');
    const services = serviceDetails;
    const cachedSymbols = ['+', '⚡', '🚀', 'cached'];
    const uncachedSymbols = ['⏳', 'download', 'UNCACHED'];
    let provider: ParsedStream['provider'] | undefined;
    services.forEach((service) => {
      // for each service, generate a regexp which creates a regex with all known names separated by |
      const regex = new RegExp(
        `(^|(?<![^ |[(_\\/\\-.]))(${service.knownNames.join('|')})(?=[ ⏳⚡+/|\\)\\]_.-]|$)`,
        'i'
      );
      // check if the string contains the regex
      if (regex.test(cleanString)) {
        let cached: boolean | undefined = undefined;
        // check if any of the uncachedSymbols are in the string
        if (uncachedSymbols.some((symbol) => string.includes(symbol))) {
          cached = false;
        }
        // check if any of the cachedSymbols are in the string
        else if (cachedSymbols.some((symbol) => string.includes(symbol))) {
          cached = true;
        }

        provider = {
          id: service.id,
          cached: cached,
        };
      }
    });
    if (!provider) {
      console.log(
        `|WRN| wrappers > base > parseServiceData: No provider found for ${string}`
      );
    }
    return provider;
  }
  protected parseStream(stream: {
    [key: string]: any;
  }): ParsedStream | undefined {
    // attempt to look for filename in behaviorHints.filename, return undefined if not found
    let filename = stream?.behaviorHints?.filename;

    // if filename behaviorHint is not present, attempt to look for a filename in the stream description or title
    let description = stream.description || stream.title;

    if (!filename && description) {
      console.log(
        `|DBG| wrappers > base > parseStream: No filename found in behaviorHints, attempting to parse from description`
      );
      const lines = description.split('\n');
      filename =
        lines.find(
          (line: string) =>
            line.match(
              /(?<![^ [_(\-.]])(?:s(?:eason)?[ .\-_]?(\d+)[ .\-_]?(?:e(?:pisode)?[ .\-_]?(\d+))?|(\d+)[xX](\d+))(?![^ \])_.-])/
            ) || line.match(/(?<![^ [_(\-.])(\d{4})(?=[ \])_.-]|$)/i)
        ) || lines[0];
      console.log(
        `|DBG| wrappers > base > parseStream: With description: ${description}, found filename: ${filename}`
      );
    } else if (!description) {
      console.log(
        `|WRN| wrappers > base > parseStream: No description found, filename could not be determined`
      );
    }

    let parsedInfo: ParsedNameData = parseFilename(filename || '');

    // look for size in one of the many random places it could be
    let size: number | undefined;
    size =
      stream.behaviorHints?.videoSize ||
      stream.size ||
      stream.sizebytes ||
      (description && extractSizeInBytes(description, 1024)) ||
      (stream.name && extractSizeInBytes(stream.name, 1024)) ||
      undefined;

    // look for seeders
    let seeders: string | undefined;
    if (description) {
      seeders = description.match(/(👥|👤) (\d+)/)?.[2];
    }

    // look for indexer
    let indexer: string | undefined;
    if (description) {
      const indexerMatch = RegExp(
        /[🌐⚙️🔗] ([^\s\p{Emoji_Presentation}]+(?:\s[^\s\p{Emoji_Presentation}]+)*)/u
      ).exec(description || '');
      indexer = indexerMatch ? indexerMatch[1] : undefined;
    }

    // look for providers
    let provider: ParsedStream['provider'] = this.parseServiceData(
      stream.name || ''
    );

    if (stream.infoHash && provider) {
      // if its a p2p result, it is not from a debrid service
      provider = undefined;
    }
    return this.createParsedResult(
      parsedInfo,
      stream,
      filename,
      size,
      provider,
      seeders ? parseInt(seeders) : undefined,
      undefined,
      indexer,
      stream.duration,
      stream.personal,
      stream.infoHash || this.extractInfoHash(stream.url || '')
    );
  }
}
