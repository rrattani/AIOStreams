import { ParsedStream } from '@aiostreams/types';
import { formatDuration, formatSize } from './utils';

const imposters = [
  'Disney+',
  'Netflix',
  'HBO',
  'Amazon Prime Video',
  'Hulu',
  'Apple TV+',
  'Peacock',
  'Paramount+',
];

export function imposterFormat(stream: ParsedStream): {
  name: string;
  description: string;
} {
  let name: string = '';

  if (stream.torrent?.infoHash) {
    name += `[P2P] `;
  }
  const chosenImposter =
    imposters[Math.floor(Math.random() * imposters.length)];
  name += `${chosenImposter} ${stream.personal ? '(Your Media) ' : ''}`;

  name += stream.resolution !== 'Unknown' ? stream.resolution + '' : '';

  let description: string = `${stream.quality !== 'Unknown' ? '🎥 ' + stream.quality + ' ' : ''}${stream.encode !== 'Unknown' ? '🎞️ ' + stream.encode : ''}`;

  if (stream.visualTags.length > 0 || stream.audioTags.length > 0) {
    description += '\n';

    description +=
      stream.visualTags.length > 0
        ? `📺 ${stream.visualTags.join(' | ')}   `
        : '';
    description +=
      stream.audioTags.length > 0 ? `🎧 ${stream.audioTags.join(' | ')}` : '';
  }
  if (
    stream.size ||
    stream.torrent?.seeders ||
    stream.usenet?.age ||
    stream.duration
  ) {
    description += '\n';

    description += `📦 ${formatSize(stream.size || 0)} `;
    description += stream.duration
      ? `⏱️ ${formatDuration(stream.duration)} `
      : '';
    description += stream.torrent?.seeders
      ? `👥 ${stream.torrent.seeders}`
      : '';

    description += stream.usenet?.age ? `📅 ${stream.usenet.age}` : '';
  }

  if (stream.languages.length !== 0) {
    let languages = stream.languages;
    description += `\n🔊 ${languages.join(' | ')}`;
  }

  description += `\n📄 ${stream.filename ? stream.filename : 'Unknown'}`;
  if (stream.message) {
    description += `\n📢${stream.message}`;
  }
  return { name, description };
}
