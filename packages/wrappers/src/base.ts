import {
  Stream,
  ParsedStream,
  StreamRequest,
  ParsedNameData,
  Config,
} from '@aiostreams/types';
import { parseFilename } from '@aiostreams/parser';
import {
  getMediaFlowConfig,
  getMediaFlowPublicIp,
  getTextHash,
  serviceDetails,
  Settings,
} from '@aiostreams/utils';
// import { fetch as uFetch, ProxyAgent } from 'undici';
import { emojiToLanguage, codeToLanguage } from '@aiostreams/formatters';

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
      const mediaFlowIp = await getMediaFlowPublicIp(
        mediaFlowConfig,
        this.userConfig.instanceCache
      );
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
    const cache = this.userConfig.instanceCache;
    const requestCacheKey = getTextHash(url);
    const cachedStreams = cache.get(requestCacheKey);
    const sanitisedUrl =
      new URL(url).hostname + '/****/' + new URL(url).pathname.split('/').pop();
    if (cachedStreams) {
      console.debug(
        `|DBG| wrappers > base > ${this.addonName}: Returning cached streams for ${sanitisedUrl}`
      );
      return cachedStreams;
    }
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
      cache.set(requestCacheKey, results.streams, 600); // cache for 10 minutes
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
  protected parseStream(stream: { [key: string]: any }): ParsedStream {
    // attempt to look for filename in behaviorHints.filename
    let filename =
      stream?.behaviorHints?.filename || stream.torrentTitle || stream.filename;

    // if filename behaviorHint is not present, attempt to look for a filename in the stream description or title
    let description = stream.description || stream.title;

    if (!filename && description) {
      const lines = description.split('\n');
      filename =
        lines.find(
          (line: string) =>
            line.match(
              /(?<![^ [_(\-.]])(?:s(?:eason)?[ .\-_]?(\d+)[ .\-_]?(?:e(?:pisode)?[ .\-_]?(\d+))?|(\d+)[xX](\d+))(?![^ \])_.-])/
            ) || line.match(/(?<![^ [_(\-.])(\d{4})(?=[ \])_.-]|$)/i)
        ) || lines[0];
    }

    let stringToParse: string = filename || description || '';
    if (
      !(
        filename.match(
          /(?<![^ [_(\-.]])(?:s(?:eason)?[ .\-_]?(\d+)[ .\-_]?(?:e(?:pisode)?[ .\-_]?(\d+))?|(\d+)[xX](\d+))(?![^ \])_.-])/
        ) || filename.match(/(?<![^ [_(\-.])(\d{4})(?=[ \])_.-]|$)/i)
      )
    ) {
      stringToParse = description.replace(/\n/g, ' ').trim();
    }
    let parsedInfo: ParsedNameData = parseFilename(stringToParse);

    // look for size in one of the many random places it could be
    let size: number | undefined;
    size =
      stream.behaviorHints?.videoSize ||
      stream.size ||
      stream.sizebytes ||
      stream.sizeBytes ||
      stream.torrentSize ||
      (description && this.extractSizeInBytes(description, 1024)) ||
      (stream.name && this.extractSizeInBytes(stream.name, 1024)) ||
      undefined;

    if (typeof size === 'string') {
      size = parseInt(size);
    }
    // look for seeders
    let seeders: string | undefined;
    if (description) {
      seeders = this.extractStringBetweenEmojis(['👥', '👤'], description);
    }

    // look for indexer
    let indexer: string | undefined;
    if (description) {
      indexer = this.extractStringBetweenEmojis(
        ['🌐', '⚙️', '🔗', '🔎', '☁️'],
        description
      );
    }

    [
      ...this.extractCountryFlags(description),
      ...this.extractCountryCodes(description),
    ]
      .map(
        (codeOrFlag) =>
          emojiToLanguage(codeOrFlag) || codeToLanguage(codeOrFlag)
      )
      .filter((lang) => lang !== undefined)
      .map((lang) =>
        lang
          .trim()
          .split(' ')
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(' ')
      )
      .forEach((lang) => {
        if (lang && !parsedInfo.languages.includes(lang)) {
          parsedInfo.languages.push(lang);
        }
      });

    const duration = stream.duration || this.extractDurationInMs(description);
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
      duration,
      stream.personal,
      stream.infoHash || this.extractInfoHash(stream.url || '')
    );
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
    return provider;
  }
  protected extractSizeInBytes(string: string, k: number): number {
    const sizePattern = /(\d+(\.\d+)?)\s?(KB|MB|GB)/i;
    const match = string.match(sizePattern);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[3];

    switch (unit.toUpperCase()) {
      case 'TB':
        return value * k * k * k * k;
      case 'GB':
        return value * k * k * k;
      case 'MB':
        return value * k * k;
      case 'KB':
        return value * k;
      default:
        return 0;
    }
  }

  protected extractDurationInMs(input: string): number {
    // Regular expression to match different formats of time durations
    const regex =
      /(\d+)h[:\s]?(\d+)m[:\s]?(\d+)s|(\d+)h[:\s]?(\d+)m|(\d+)h|(\d+)m|(\d+)s/gi;
    const match = regex.exec(input);
    if (!match) {
      return 0;
    }

    const hours = parseInt(match[1] || match[4] || match[5] || '0', 10);
    const minutes = parseInt(match[2] || match[5] || match[6] || '0', 10);
    const seconds = parseInt(match[3] || match[6] || match[7] || '0', 10);

    // Convert to milliseconds
    const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;

    return totalMilliseconds;
  }

  protected extractStringBetweenEmojis(
    startingEmojis: string[],
    string: string,
    endingEmojis?: string[]
  ): string | undefined {
    const emojiPattern = /[\p{Emoji_Presentation}]/u;
    const startPattern = new RegExp(`(${startingEmojis.join('|')})`, 'u');
    const endPattern = endingEmojis
      ? new RegExp(`(${endingEmojis.join('|')}|$|\n)`, 'u')
      : new RegExp(`(${emojiPattern.source}|$|\n)`, 'u');

    const startMatch = string.match(startPattern);
    if (!startMatch) return undefined;

    const startIndex = startMatch.index! + startMatch[0].length;
    const remainingString = string.slice(startIndex);

    const endMatch = remainingString.match(endPattern);
    const endIndex = endMatch ? endMatch.index! : remainingString.length;

    return remainingString.slice(0, endIndex).trim();
  }

  protected extractStringAfter(
    startingPattern: string,
    string: string,
    endingPattern?: string
  ) {
    const startPattern = new RegExp(startingPattern, 'u');
    const endPattern = endingPattern
      ? new RegExp(endingPattern, 'u')
      : new RegExp(/$/u);

    const startMatch = string.match(startPattern);
    if (!startMatch) return undefined;

    const startIndex = startMatch.index! + startMatch[0].length;
    const remainingString = string.slice(startIndex);

    const endMatch = remainingString.match(endPattern);
    const endIndex = endMatch ? endMatch.index! : remainingString.length;

    return remainingString.slice(0, endIndex).trim();
  }

  protected extractCountryFlags(string: string): string[] {
    const countryFlagPattern = /[\p{Regional_Indicator}]/u;
    const matches = string.match(countryFlagPattern);
    return matches ? [...new Set(matches)] : [];
  }

  protected extractCountryCodes(string: string): string[] {
    const countryCodePattern = /\b(?!AC|DV)[A-Z]{2}\b/g;
    const matches = string.match(countryCodePattern);
    return matches ? [...new Set(matches)] : [];
  }

  protected extractInfoHash(url: string): string | undefined {
    return url.match(/(?<=[-/[(;:&])[a-fA-F0-9]{40}(?=[-\]\)/:;&])/)?.[0];
  }
}
