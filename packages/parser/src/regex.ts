const createRegex = (pattern: string): RegExp =>
  new RegExp(`(?<![^\\s\\[(_\\-.,])(${pattern})(?=[\\s\\)\\]_.\\-,]|$)`, 'i');

export const PARSE_REGEX = {
  resolutions: {
    '2160p': createRegex('4k|2160p|u(ltra)?hd'),
    '1080p': createRegex('1080p|f(ull)?hd'),
    '720p': createRegex('720p|hd'),
    '480p': createRegex('480p|sd'),
  },
  qualities: {
    'BluRay REMUX': createRegex('(blu[ .\\-_]?ray|bd|br|b|uhd)[ .\\-_]?remux'),
    BluRay: createRegex(
      'blu[ .\\-_]?ray|((bd|br|b)[ .\\-_]?(rip|r)?)(?![ .\\-_]?remux)'
    ),
    'WEB-DL': createRegex('web[ .\\-_]?(dl)?(?![ .\\-_]?(DLRip|cam))'),
    WEBRip: createRegex('web[ .\\-_]?rip'),
    HDRip: createRegex('hd[ .\\-_]?rip|web[ .\\-_]?dl[ .\\-_]?rip'),
    'HC HD-Rip': createRegex('hc|hd[ .\\-_]?rip'),
    DVDRip: createRegex('dvd[ .\\-_]?(rip|mux|r|full|5|9)'),
    HDTV: createRegex(
      '(hd|pd)tv|tv[ .\\-_]?rip|hdtv[ .\\-_]?rip|dsr(ip)?|sat[ .\\-_]?rip'
    ),
    CAM: createRegex('cam|hdcam|cam[ .\\-_]?rip'),
    TS: createRegex('telesync|ts|hd[ .\\-_]?ts|pdvd|predvd(rip)?'),
    TC: createRegex('telecine|tc|hd[ .\\-_]?tc'),
    SCR: createRegex('((dvd|bd|web)?[ .\\-_]?)?(scr(eener)?)'),
  },
  visualTags: {
    '10bit': createRegex('10[ .\\-_]?bit'),
    'HDR10+': createRegex('hdr[ .\\-_]?10[ .\\-_]?(plus|[+])'),
    HDR10: createRegex('hdr[ .\\-_]?10(?![ .\\-_]?(?:\\+|plus))'),
    HDR: createRegex('hdr(?![ .\\-_]?10)(?![ .\\-_]?(?:\\+|plus))'),
    DV: createRegex('dolby[ .\\-_]?vision(?:[ .\\-_]?atmos)?|dv'),
    '3D': createRegex('(bd)?(3|three)[ .\\-_]?(d(imension)?(al)?)'),
    IMAX: createRegex('imax'),
    AI: createRegex('ai[ .\\-_]?(upscale|enhanced|remaster)?'),
  },
  audioTags: {
    Atmos: createRegex('atmos'),
    'DD+': createRegex(
      '(d(olby)?[ .\\-_]?d(igital)?[ .\\-_]?(p(lus)?|\\+)(?:[ .\\-_]?(5[ .\\-_]?1|7[ .\\-_]?1))?)|e[ .\\-_]?ac[ .\\-_]?3'
    ),
    DD: createRegex(
      '(d(olby)?[ .\\-_]?d(igital)?(?:[ .\\-_]?(5[ .\\-_]?1|7[ .\\-_]?1))?)|(?<!e[ .\\-_]?)ac[ .\\-_]?3'
    ),
    'DTS-HD MA': createRegex('dts[ .\\-_]?hd[ .\\-_]?ma'),
    'DTS-HD': createRegex('dts[ .\\-_]?hd(?![ .\\-_]?ma)'),
    DTS: createRegex('dts(?![ .\\-_]?hd[ .\\-_]?ma|[ .\\-_]?hd)'),
    TrueHD: createRegex('true[ .\\-_]?hd'),
    5.1: createRegex(
      'd(olby)?[ .\\-_]?d(igital)?[ .\\-_]?(p(lus)?|\\+)?[ .\\-_]?5[ .\\-_]?1(ch)?'
    ),
    7.1: createRegex(
      'd(olby)?[ .\\-_]?d(igital)?[ .\\-_]?(p(lus)?|\\+)?[ .\\-_]?7[ .\\-_]?1'
    ),
    AAC: createRegex('q?aac(?:[ .\\-_]?2)?'),
    FLAC: createRegex('flac(?:[ .\\-_]?(lossless|2\\.0|x[2-4]))?'),
  },
  encodes: {
    HEVC: createRegex('hevc[ .\\-_]?(10)?|[xh][ .\\-_]?265'),
    AVC: createRegex('avc|[xh][ .\\-_]?264'),
    AV1: createRegex('av1'),
    Xvid: createRegex('xvid'),
    DivX: createRegex('divx|dvix'),
    'H-OU': createRegex('h?(alf)?[ .\\-_]?(ou|over[ .\\-_]?under)'),
    'H-SBS': createRegex('h?(alf)?[ .\\-_]?(sbs|side[ .\\-_]?by[ .\\-_]?side)'),
  },
  languages: {
    Multi: createRegex('multi|multi[ .\\-_]?audio'),
    'Dual Audio': createRegex(
      'dual[ .\\-_]?(audio|lang(uage)?|flac|ac3|aac2?)'
    ),
    Dubbed: createRegex('dub(bed)?'),
    English: createRegex('english|eng'),
    Japanese: createRegex('japanese|jap'),
    Chinese: createRegex('chinese|chi'),
    Russian: createRegex('russian|rus'),
    Arabic: createRegex('arabic|ara'),
    Portuguese: createRegex('portuguese|por'),
    Spanish: createRegex('spanish|spa|esp'),
    French: createRegex('french|fra'),
    German: createRegex('german|ger'),
    Italian: createRegex('italian|ita'),
    Korean: createRegex('korean|kor'),
    Hindi: createRegex('hindi|hin'),
    Bengali: createRegex('bengali|ben'),
    Punjabi: createRegex('punjabi|pan'),
    Marathi: createRegex('marathi|mar'),
    Gujarati: createRegex('gujarati|guj'),
    Tamil: createRegex('tamil|tam'),
    Telugu: createRegex('telugu|tel'),
    Kannada: createRegex('kannada|kan'),
    Malayalam: createRegex('malayalam|mal'),
    Thai: createRegex('thai|tha'),
    Vietnamese: createRegex('vietnamese|vie'),
    Indonesian: createRegex('indonesian|ind'),
    Turkish: createRegex('turkish|tur'),
    Hebrew: createRegex('hebrew|heb'),
    Persian: createRegex('persian|per'),
    Ukrainian: createRegex('ukrainian|ukr'),
    Greek: createRegex('greek|ell'),
    Lithuanian: createRegex('lithuanian|lit'),
    Latvian: createRegex('latvian|lav'),
    Estonian: createRegex('estonian|est'),
    Polish: createRegex('polish|pol'),
    Czech: createRegex('czech|cze'),
    Slovak: createRegex('slovak|slo'),
    Hungarian: createRegex('hungarian|hun'),
    Romanian: createRegex('romanian|rum'),
    Bulgarian: createRegex('bulgarian|bul'),
    Serbian: createRegex('serbian|srp'),
    Croatian: createRegex('croatian|hrv'),
    Slovenian: createRegex('slovenian|slv'),
    Dutch: createRegex('dutch|dut'),
    Danish: createRegex('danish|dan'),
    Finnish: createRegex('finnish|fin'),
    Swedish: createRegex('swedish|swe'),
    Norwegian: createRegex('norwegian|nor'),
    Malay: createRegex('malay'),
    Latino: createRegex('latino|lat'),
  },
};
