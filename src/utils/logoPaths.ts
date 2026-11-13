export function getCountryLogoUrl(countryCode: string): string {
  return `/logos/countries/${countryCode.toLowerCase()}.png`;
}

export function getOperatorLogoSlug(operatorName: string): string {
  const lower = operatorName.toLowerCase().trim();

  if (lower.includes('mtn')) return 'mtn';
  if (lower.includes('orange')) return 'orange';
  if (lower.includes('moov')) return 'moov-africa';
  if (lower.includes('vodacom')) return 'vodacom';
  if (lower.includes('vodafone')) return 'vodafone';
  if (lower.includes('airteltigo')) return 'airteltigo';
  if (lower.includes('airtel')) return 'airtel';
  if (lower.includes('africell')) return 'africell';
  if (lower.includes('ooredoo')) return 'ooredoo';
  if (lower.includes('djezzy')) return 'djezzy';
  if (lower.includes('mobilis')) return 'mobilis';
  if (lower.includes('unitel t+')) return 'unitel';
  if (lower.includes('unitel')) return 'unitel';
  if (lower.includes('movicel')) return 'movicel';
  if (lower.includes('celtiis')) return 'celtiis';
  if (lower.includes('mascom')) return 'mascom';
  if (lower === 'btc') return 'btc';
  if (lower.includes('telecel')) return 'telecel';
  if (lower.includes('lumitel')) return 'lumitel';
  if (lower.includes('econet')) return 'econet';
  if (lower.includes('onatel')) return 'onatel';
  if (lower.includes('camtel')) return 'camtel';
  if (lower.includes('cvmóvel') || lower.includes('cvmovel')) return 'cvmovel';
  if (lower.includes('t+ telecom')) return 'tplus';
  if (lower.includes('comores telecom')) return 'comores-telecom';
  if (lower.includes('telma')) return 'telma';
  if (lower.includes('djibouti')) return 'djibouti-telecom';
  if (lower.includes('etisalat')) return 'etisalat';
  if (lower === 'we') return 'we';
  if (lower.includes('eritel')) return 'eritel';
  if (lower.includes('eswatini mobile')) return 'eswatini-mobile';
  if (lower.includes('ethio telecom')) return 'ethio-telecom';
  if (lower.includes('safaricom')) return 'safaricom';
  if (lower === 'gva') return 'gva';
  if (lower.includes('gamcel')) return 'gamcel';
  if (lower.includes('comium')) return 'comium';
  if (lower === 'glo') return 'glo';
  if (lower.includes('cellcom')) return 'cellcom';
  if (lower.includes('guinetel')) return 'guinetel';
  if (lower === 'muni') return 'muni';
  if (lower.includes('green com')) return 'green-com';
  if (lower.includes('telkom')) return 'telkom';
  if (lower.includes('cell c')) return 'cell-c';
  if (lower === 'rain') return 'rain';
  if (lower.includes('libyana')) return 'libyana';
  if (lower.includes('al madar')) return 'al-madar';
  if (lower === 'tnm') return 'tnm';
  if (lower.includes('sotelma')) return 'sotelma';
  if (lower.includes('maroc telecom')) return 'maroc-telecom';
  if (lower === 'inwi') return 'inwi';
  if (lower.includes('mauritius telecom')) return 'mauritius-telecom';
  if (lower.includes('emtel')) return 'emtel';
  if (lower === 'chili') return 'chili';
  if (lower.includes('mauritel')) return 'mauritel';
  if (lower.includes('mattel')) return 'mattel';
  if (lower.includes('chinguitel')) return 'chinguitel';
  if (lower.includes('movitel')) return 'movitel';
  if (lower.includes('tmcel')) return 'tmcel';
  if (lower === 'mtc') return 'mtc';
  if (lower.includes('telecom namibia')) return 'telecom-namibia';
  if (lower.includes('niger telecom')) return 'niger-telecom';
  if (lower.includes('9mobile')) return '9mobile';
  if (lower === 'cst') return 'cst';
  if (lower === 'free') return 'free';
  if (lower.includes('expresso')) return 'expresso';
  if (lower.includes('cable & wireless')) return 'cable-wireless';
  if (lower.includes('intelvision')) return 'intelvision';
  if (lower.includes('qcell')) return 'qcell';
  if (lower.includes('hormuud')) return 'hormuud';
  if (lower.includes('somtel')) return 'somtel';
  if (lower.includes('telesom')) return 'telesom';
  if (lower.includes('golis')) return 'golis';
  if (lower.includes('zain')) return 'zain';
  if (lower.includes('sudani')) return 'sudani';
  if (lower.includes('digitel')) return 'digitel';
  if (lower === 'tigo') return 'tigo';
  if (lower.includes('halotel')) return 'halotel';
  if (lower.includes('togocom')) return 'togocom';
  if (lower.includes('tunisie telecom')) return 'tunisie-telecom';
  if (lower.includes('zamtel')) return 'zamtel';
  if (lower.includes('netone')) return 'netone';

  return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getOperatorLogoUrl(operatorName: string): string {
  return `/logos/operators/${getOperatorLogoSlug(operatorName)}.png`;
}
