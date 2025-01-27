import { parseFilename } from '@aiostreams/parser';
import {
  ParsedStream,
  Stream,
  Config,
  AddonDetail,
  ParsedNameData,
  StreamRequest,
} from '@aiostreams/types';
import { BaseWrapper } from './base';
import { addonDetails, Settings } from '@aiostreams/utils';
import { emojiToLanguage } from '@aiostreams/formatters';

export class DMMCast extends BaseWrapper {
  constructor(
    installationUrl: string,
    addonId: string,
    userConfig: Config,
    addonName: string = 'DMM Cast',
    indexerTimeout?: number
  ) {
    super(
      addonName,
      installationUrl,
      addonId,
      userConfig,
      indexerTimeout || Settings.DEFAULT_DMM_CAST_TIMEOUT
    );
  }

  protected parseStream(stream: Stream): ParsedStream {
    // the streams for DMM cast can be one of the following
    // 1:Cast - Cast a file inside a torrent
    // 2:Stream - Stream the latest link you casted
    // DMM Other - Filename can be split across multiple lines with 📦 {size} at last line
    // DMM Yours - Filename can be split across multiple lines with 📦 {size} at last line

    const filename = stream.title
      ? stream.title
          .split('\n')
          .filter((line) => !line.includes('📦'))
          .join('')
      : stream.behaviorHints?.filename?.trim();

    const parsedFilename: ParsedNameData = parseFilename(filename || '');
    const sizeInBytes = stream.title?.split('\n').pop()?.includes('📦')
      ? this.extractSizeInBytes(stream.title.split('\n').pop()!, 1024)
      : 0;

    const parsedStream: ParsedStream = this.createParsedResult(
      parsedFilename,
      stream,
      filename,
      sizeInBytes
    );
    return parsedStream;
  }
}

export async function getDMMCastStreams(
  config: Config,
  dmmCastOptions: {
    installationUrl?: string;
    indexerTimeout?: string;
    overrideName?: string;
  },
  streamRequest: StreamRequest,
  addonId: string
): Promise<ParsedStream[]> {
  if (!dmmCastOptions.installationUrl) {
    throw new Error('DMM Cast installation URL is missing');
  } else if (
    dmmCastOptions.installationUrl.match(
      /\/api\/stremio\/.*\/manifest\.json$/
    ) === null
  ) {
    throw new Error('Invalid DMM Cast installation URL');
  }
  const dmmCast = new DMMCast(
    dmmCastOptions.installationUrl,
    addonId,
    config,
    dmmCastOptions.overrideName,
    dmmCastOptions.indexerTimeout
      ? parseInt(dmmCastOptions.indexerTimeout)
      : undefined
  );
  return dmmCast.getParsedStreams(streamRequest);
}
