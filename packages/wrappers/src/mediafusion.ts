import { AddonDetail, StreamRequest } from '@aiostreams/types';
import { ParsedStream, Stream, Config } from '@aiostreams/types';
import { BaseWrapper } from './base';
import { addonDetails, Settings } from '@aiostreams/utils';

export class MediaFusion extends BaseWrapper {
  constructor(
    configString: string | null,
    overrideUrl: string | null,
    addonName: string = 'MediaFusion',
    addonId: string,
    userConfig: Config,
    indexerTimeout?: number
  ) {
    let url = overrideUrl
      ? overrideUrl
      : Settings.MEDIAFUSION_URL + (configString ? configString + '/' : '');

    super(
      addonName,
      url,
      addonId,
      userConfig,
      indexerTimeout || Settings.DEFAULT_MEDIAFUSION_TIMEOUT
    );
  }

  protected parseStream(stream: Stream): ParsedStream {
    const parsedStream: ParsedStream = super.parseStream(stream);
    // handle content warning streams and join all lines into a single string
    if (
      parsedStream.filename &&
      stream.description &&
      parsedStream.filename.includes('Content Warning')
    ) {
      parsedStream.filename = stream.description.split('\n').join(' ');
    }
    return parsedStream;
  }
}

export async function getMediafusionStreams(
  config: Config,
  mediafusionOptions: {
    prioritiseDebrid?: string;
    overrideUrl?: string;
    indexerTimeout?: string;
    overrideName?: string;
    filterCertificationLevels?: string;
    filterNudity?: string;
  },
  streamRequest: StreamRequest,
  addonId: string
): Promise<{
  addonStreams: ParsedStream[];
  addonErrors: string[];
}> {
  const supportedServices: string[] =
    addonDetails.find((addon: AddonDetail) => addon.id === 'mediafusion')
      ?.supportedServices || [];
  const addonStreams: ParsedStream[] = [];
  const indexerTimeout = mediafusionOptions.indexerTimeout
    ? parseInt(mediafusionOptions.indexerTimeout)
    : undefined;

  // If overrideUrl is provided, use it to get streams and skip all other steps
  if (mediafusionOptions.overrideUrl) {
    const mediafusion = new MediaFusion(
      null,
      mediafusionOptions.overrideUrl as string,
      mediafusionOptions.overrideName,
      addonId,
      config,
      indexerTimeout
    );
    return {
      addonStreams: await mediafusion.getParsedStreams(streamRequest),
      addonErrors: [],
    };
  }

  // find all usable and enabled services
  const usableServices = config.services.filter(
    (service) => supportedServices.includes(service.id) && service.enabled
  );

  // if no usable services found, use mediafusion without debrid
  if (usableServices.length < 1) {
    const configString = await getConfigString(
      getMediaFusionConfig(
        mediafusionOptions.filterCertificationLevels,
        mediafusionOptions.filterNudity
      )
    );
    const mediafusion = new MediaFusion(
      configString,
      null,
      mediafusionOptions.overrideName,
      addonId,
      config,
      indexerTimeout
    );
    return {
      addonStreams: await mediafusion.getParsedStreams(streamRequest),
      addonErrors: [],
    };
  }

  // otherwise, depending on the configuration, create multiple instances of mediafusion or use a single instance with the prioritised service

  if (
    mediafusionOptions.prioritiseDebrid &&
    !supportedServices.includes(mediafusionOptions.prioritiseDebrid)
  ) {
    throw new Error(
      `The service ${mediafusionOptions.prioritiseDebrid} is invalid for MediaFusion`
    );
  }

  if (mediafusionOptions.prioritiseDebrid) {
    const debridService = usableServices.find(
      (service) => service.id === mediafusionOptions.prioritiseDebrid
    );
    if (!debridService) {
      throw new Error(
        `${mediafusionOptions.prioritiseDebrid} could not be found in your services`
      );
    }
    if (!debridService.credentials.apiKey) {
      throw new Error(
        `Missing API key for ${mediafusionOptions.prioritiseDebrid}`
      );
    }

    // get the encrypted mediafusion string
    const mediafusionConfig = getMediaFusionConfig(
      mediafusionOptions.filterCertificationLevels,
      mediafusionOptions.filterNudity,
      debridService.id,
      debridService.credentials
    );
    const encryptedStr = await getConfigString(mediafusionConfig);
    const mediafusion = new MediaFusion(
      encryptedStr,
      null,
      mediafusionOptions.overrideName,
      addonId,
      config,
      indexerTimeout
    );

    return {
      addonStreams: await mediafusion.getParsedStreams(streamRequest),
      addonErrors: [],
    };
  }

  // if no prioritised service is provided, create a mediafusion instance for each service
  const addonErrors: string[] = [];
  const servicesToUse = usableServices.filter((service) => service.enabled);
  if (servicesToUse.length < 1) {
    throw new Error(`No enabled services found for MediaFusion`);
  }
  const promises = servicesToUse.map(async (service) => {
    const mediafusionConfig = getMediaFusionConfig(
      mediafusionOptions.filterCertificationLevels,
      mediafusionOptions.filterNudity,
      service.id,
      service.credentials
    );
    const encryptedStr = await getConfigString(mediafusionConfig);
    const mediafusion = new MediaFusion(
      encryptedStr,
      null,
      mediafusionOptions.overrideName,
      addonId,
      config,
      indexerTimeout
    );
    return mediafusion.getParsedStreams(streamRequest);
  });

  const results = await Promise.allSettled(promises);
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      addonStreams.push(...result.value);
    } else {
      addonErrors.push(result.reason.message);
    }
  });

  return {
    addonStreams,
    addonErrors,
  };
}

const getMediaFusionConfig = (
  filterCertificationLevels?: string,
  filterNudity?: string,
  service?: string,
  credentials: { [key: string]: string } = {}
): any => {
  let nudityFilter = ['Disable'];
  let certificationFilter = ['Disable'];
  if (filterCertificationLevels) {
    const levels = filterCertificationLevels.split(',');
    certificationFilter = levels.map((level) => level.trim());
  }
  if (filterNudity) {
    const levels = filterNudity.split(',');
    nudityFilter = levels.map((level) => level.trim());
  }
  console.debug(
    `|DBG| wrappers > mediafusion: Determined nudity filter: ${nudityFilter} and certification filter: ${certificationFilter}`
  );
  return {
    streaming_provider: service
      ? {
          token: !['pikpak'].includes(service) ? credentials.apiKey : undefined,
          email: credentials.email,
          password: credentials.password,
          service: service,
          enable_watchlists_catalogs: false,
          download_via_browser: false,
          only_show_cached_streams: false,
        }
      : null,
    selected_catalogs: [],
    selected_resolutions: [
      '4k',
      '2160p',
      '1440p',
      '1080p',
      '720p',
      '576p',
      '480p',
      '360p',
      '240p',
      null,
    ],
    enable_catalogs: true,
    enable_imdb_metadata: false,
    max_size: 'inf',
    max_streams_per_resolution: '500',
    torrent_sorting_priority: [
      { key: 'language', direction: 'desc' },
      { key: 'cached', direction: 'desc' },
      { key: 'resolution', direction: 'desc' },
      { key: 'quality', direction: 'desc' },
      { key: 'size', direction: 'desc' },
      { key: 'seeders', direction: 'desc' },
      { key: 'created_at', direction: 'desc' },
    ],
    show_full_torrent_name: true,
    show_language_country_flag: true,
    nudity_filter: nudityFilter,
    certification_filter: certificationFilter,
    language_sorting: [
      'English',
      'Tamil',
      'Hindi',
      'Malayalam',
      'Kannada',
      'Telugu',
      'Chinese',
      'Russian',
      'Arabic',
      'Japanese',
      'Korean',
      'Taiwanese',
      'Latino',
      'French',
      'Spanish',
      'Portuguese',
      'Italian',
      'German',
      'Ukrainian',
      'Polish',
      'Czech',
      'Thai',
      'Indonesian',
      'Vietnamese',
      'Dutch',
      'Bengali',
      'Turkish',
      'Greek',
      'Swedish',
      null,
    ],
    quality_filter: [
      'BluRay/UHD',
      'WEB/HD',
      'DVD/TV/SAT',
      'CAM/Screener',
      'Unknown',
    ],
    api_password: Settings.MEDIAFUSION_API_PASSWORD || null,
    mediaflow_config: null,
    rpdb_config: null,
    live_search_streams: false,
    contribution_streams: false,
    mdblist_config: null,
  };
};

async function getConfigString(data: any): Promise<string> {
  const encryptUrl = `${Settings.MEDIAFUSION_URL}encrypt-user-data`;
  const response = await fetch(encryptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const encryptedData = await response.json();
  if (encryptedData.status !== 'success') {
    throw new Error(
      `Config encryption failed: ${encryptedData.message || 'Unknown error'}`
    );
  }
  return encryptedData.encrypted_str;
}
