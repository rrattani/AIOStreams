import { AddonDetail, ErrorStream, StreamRequest } from '@aiostreams/types';
import { ParsedStream, Stream, Config } from '@aiostreams/types';
import { BaseWrapper } from './base';
import { addonDetails } from '@aiostreams/utils';
import { Settings } from '@aiostreams/utils';

// name, title, url
export class OrionStremioAddon extends BaseWrapper {
  constructor(
    configString: string | null,
    overrideUrl: string | null,
    addonName: string = 'Orion',
    addonId: string,
    userConfig: Config,
    indexerTimeout?: number
  ) {
    let url = overrideUrl
      ? overrideUrl
      : Settings.ORION_STREMIO_ADDON_URL +
        (configString ? configString + '/' : '');

    super(
      addonName,
      url,
      addonId,
      userConfig,
      indexerTimeout || Settings.DEFAULT_ORION_TIMEOUT
    );
  }

  protected parseStream(stream: Stream): ParsedStream {
    const parsedStream: ParsedStream = super.parseStream(stream);
    // handle error streams and join all lines into a single string
    const filename = stream.title
      ? stream.title.includes('ERROR')
        ? `Error: ${stream.title.split('\n')[1]} - ${stream.title.split('\n')[2]}`
        : stream.title.split('\n')[0]
      : stream.behaviorHints?.filename?.trim();
    parsedStream.filename = filename;
    return parsedStream;
  }
}

function getOrionConfigString(
  orionApiKey: string,
  linkLimit: string = '10',
  showTorrents: string = 'false',
  debridServices: string[]
) {
  return Buffer.from(
    JSON.stringify({
      api: orionApiKey,
      linkLimit: linkLimit,
      sortValue: 'best',
      audiochannels: '1,2,6,8',
      videoquality:
        'hd8k,hd6k,hd4k,hd2k,hd1080,hd720,sd,scr1080,scr720,scr,cam1080,cam720,cam',
      listOpt:
        debridServices.length > 0
          ? showTorrents === 'true'
            ? 'both'
            : 'debrid'
          : 'torrent',
      debridservices: debridServices,
      audiolanguages: [],
      additionalParameters: '',
    })
  ).toString('base64');
}

export async function getOrionStreams(
  config: Config,
  orionOptions: {
    orionApiKey?: string;
    showTorrents?: string;
    linkLimit?: string;
    overrideUrl?: string;
    indexerTimeout?: string;
    overrideName?: string;
  },
  streamRequest: StreamRequest,
  addonId: string
): Promise<{ addonStreams: ParsedStream[]; addonErrors: string[] }> {
  const orionServiceConfig = config.services.find(
    (service) => service.id === 'orion'
  );

  // orion api key can either be in deprecated orionApiKey or in the new orionServiceConfig
  let orionApiKey =
    orionOptions.orionApiKey || orionServiceConfig?.credentials.apiKey || '';
  if (!orionApiKey && !orionOptions.overrideUrl) {
    throw new Error('Missing Orion API key or override URL');
  }

  const supportedServices: string[] =
    addonDetails.find(
      (addon: AddonDetail) => addon.id === 'orion-stremio-addon'
    )?.supportedServices || [];
  const indexerTimeout = orionOptions.indexerTimeout
    ? parseInt(orionOptions.indexerTimeout)
    : undefined;

  // If overrideUrl is provided, use it to get streams and skip all other steps
  if (orionOptions.overrideUrl) {
    const orion = new OrionStremioAddon(
      null,
      orionOptions.overrideUrl,
      orionOptions.overrideName,
      addonId,
      config,
      indexerTimeout
    );
    const streams = await orion.getParsedStreams(streamRequest);
    return { addonStreams: streams, addonErrors: [] };
  }

  // find all usable services
  const usableServices = config.services.filter(
    (service) => supportedServices.includes(service.id) && service.enabled
  );

  // if no usable services found, use orion without any configuration
  if (usableServices.length < 1) {
    const configString = getOrionConfigString(
      orionApiKey,
      orionOptions.linkLimit,
      'true',
      []
    );
    const orion = new OrionStremioAddon(
      configString,
      null,
      orionOptions.overrideName,
      addonId,
      config,
      indexerTimeout
    );
    return {
      addonStreams: await orion.getParsedStreams(streamRequest),
      addonErrors: [],
    };
  }

  // otherwise, pass all the services to orion
  const debridServices = usableServices.map((service) => service.id);
  console.log(
    `|DBG| wrappers > orion > using debrid services: ${debridServices}`
  );
  const configString = getOrionConfigString(
    orionApiKey,
    orionOptions.linkLimit,
    orionOptions.showTorrents,
    debridServices
  );
  const orion = new OrionStremioAddon(
    configString,
    null,
    orionOptions.overrideName,
    addonId,
    config,
    indexerTimeout
  );
  return {
    addonStreams: await orion.getParsedStreams(streamRequest),
    addonErrors: [],
  };
}
