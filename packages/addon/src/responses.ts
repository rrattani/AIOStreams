import { Settings } from '@aiostreams/utils';

export const errorResponse = (
  errorMessage: string,
  origin?: string,
  path?: string,
  externalUrl?: string
) => {
  return {
    streams: [errorStream(errorMessage, 'Error', origin, path, externalUrl)],
  };
};

export const errorStream = (
  errorMessage: string,
  errorTitle?: string,
  origin?: string,
  path?: string,
  externalUrl?: string
) => {
  return {
    externalUrl:
      (origin && path ? origin + path : undefined) ||
      externalUrl ||
      'https://github.com/Viren070/AIOStreams',
    name: `[❌] ${Settings.ADDON_NAME}\n${errorTitle || 'Error'}`,
    description: errorMessage,
  };
};
