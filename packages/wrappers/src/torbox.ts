import { BaseWrapper } from './base';
import {
  Config,
  ParsedNameData,
  ParsedStream,
  ParseResult,
  Stream,
  StreamRequest,
} from '@aiostreams/types';
import { parseFilename } from '@aiostreams/parser';
import { Settings } from '@aiostreams/utils';

interface TorboxStream extends Stream {
  name: string;
  url: string;
  hash: string;
  is_cached: boolean;
  size: number;
  description: string;
  magnet?: string;
  nzb?: string;
  seeders?: number;
  peers?: number;
  quality?: string;
  resolution?: string;
  language?: string;
  type?: string;
  adult?: boolean;
}

export class Torbox extends BaseWrapper {
  constructor(
    apiKey: string,
    addonName: string = 'Torbox',
    addonId: string,
    userConfig: Config,
    indexerTimeout?: number
  ) {
    super(
      addonName,
      Settings.TORBOX_STREMIO_URL + apiKey + '/',
      addonId,
      userConfig,
      indexerTimeout || Settings.DEFAULT_TORBOX_TIMEOUT
    );
  }

  protected parseStream(stream: TorboxStream): ParseResult {
    let type = stream.type;
    let personal = false;
    if (stream.name.includes('Your Media')) {
      console.log(
        `|INF| wrappers > torbox > detected personal stream in ${stream.name}`
      );
      personal = true;
    }
    const [dQuality, dFilename, dSize, dLanguage, dAgeOrSeeders] =
      stream.description.split('\n').map((field: string) => {
        if (field.startsWith('Type')) {
          // the last line can either contain only the type or the type and the seeders/age
          // we will always return the age or seeders and assign the type to the variable declared outside the map
          const parts = field.split('|');
          type = ['torrent', 'usenet', 'web'].includes(type || '')
            ? type
            : parts[0].split(':')[1].trim().toLowerCase();
          if (parts.length > 1) {
            return parts[1].split(':')[1].trim();
          }
          // since the last line only contains the type, we will return undefined
          return undefined;
        }
        const [_, value] = field.split(':');
        return value.trim();
      });
    const filename = stream.behaviorHints?.filename || dFilename;
    const parsedFilename: ParsedNameData = parseFilename(
      filename || stream.description
    );

    /* If the quality from Torbox is not one of the qualities in the Config, they get filtered out
    So, for now, we will not update the quality from Torbox
    We can revisit this later and match the quality from Torbox to one of the qualities in the Config
    if (parsedFilename.quality === 'Unknown' && quality !== 'Unknown') {
      parsedFilename.quality = quality;
    }
    */

    const language = stream.language || dLanguage;
    const normaliseLanguage = (lang: string) => {
      if (lang.toLowerCase() === 'multi audio') {
        return 'Multi';
      }
      return lang
        .split(' ')
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(' ');
    };
    if (language) {
      const normalisedLanguage = normaliseLanguage(language);
      if (
        normalisedLanguage !== 'Unknown' &&
        !parsedFilename.languages.includes(normalisedLanguage)
      ) {
        parsedFilename.languages.push(normalisedLanguage);
      }
    }

    // usenet results provide size as a string, we need to convert it to a number
    const validateBehaviorHintSize = (size: string | number | undefined) =>
      typeof size === 'string' ? parseInt(size) : size;
    const sizeInBytes =
      stream.size ||
      validateBehaviorHintSize(stream.behaviorHints?.videoSize) ||
      (dSize ? this.extractSizeInBytes(dSize, 1000) : undefined);

    const provider = {
      id: 'torbox',
      cached: stream.is_cached,
    };

    const seeders =
      type === 'torrent'
        ? stream.seeders ||
          (dAgeOrSeeders ? parseInt(dAgeOrSeeders) : undefined)
        : undefined;
    const age = type === 'usenet' ? dAgeOrSeeders || undefined : undefined;
    let infoHash = stream.hash || this.extractInfoHash(stream.url);
    if (age && infoHash) {
      // we only need the infoHash for torrents
      infoHash = undefined;
    }

    const parsedStream: ParseResult = this.createParsedResult(
      parsedFilename,
      stream,
      filename,
      sizeInBytes,
      provider,
      seeders,
      age,
      undefined,
      undefined,
      personal,
      infoHash
    );

    return parsedStream;
  }
}

export async function getTorboxStreams(
  config: Config,
  torboxOptions: {
    indexerTimeout?: string;
    overrideName?: string;
  },
  streamRequest: StreamRequest,
  addonId: string
): Promise<{ addonStreams: ParsedStream[]; addonErrors: string[] }> {
  const torboxService = config.services.find(
    (service) => service.id === 'torbox'
  );
  if (!torboxService) {
    throw new Error('Torbox service not found');
  }

  const torboxApiKey = torboxService.credentials.apiKey;
  if (!torboxApiKey) {
    throw new Error('Torbox API key not found');
  }

  const torbox = new Torbox(
    torboxApiKey,
    torboxOptions.overrideName,
    addonId,
    config,
    torboxOptions.indexerTimeout
      ? parseInt(torboxOptions.indexerTimeout)
      : undefined
  );
  return await torbox.getParsedStreams(streamRequest);
}
