import type { DnsProvider, VpnKeypair, VpnProtocol, VpnServer, VpnSettings } from '../types';

export interface DnsMeta {
  id: DnsProvider;
  label: string;
  servers: string;
  dohUrl: string;
  note: string;
}

export const DNS_PROVIDERS: DnsMeta[] = [
  {
    id: 'cloudflare',
    label: 'Cloudflare',
    servers: '1.1.1.1, 1.0.0.1',
    dohUrl: 'https://cloudflare-dns.com/dns-query',
    note: 'Résolution ultra-rapide sans journalisation',
  },
  {
    id: 'quad9',
    label: 'Quad9 Sécurisé',
    servers: '9.9.9.9, 149.112.112.112',
    dohUrl: 'https://dns.quad9.net:5053/dns-query',
    note: 'Blocage des domaines malveillants et phishing',
  },
  {
    id: 'adguard',
    label: 'AdGuard DNS',
    servers: '94.140.14.14, 94.140.15.15',
    dohUrl: 'https://dns.adguard-dns.com/dns-query',
    note: 'Filtrage des traqueurs et publicités mobiles',
  },
  {
    id: 'mullvad',
    label: 'Mullvad DNS',
    servers: '194.242.2.2',
    dohUrl: 'https://dns.mullvad.net/dns-query',
    note: 'Confidentialité stricte et blocage des télémétries',
  },
  {
    id: 'custom',
    label: 'DNS Personnalisé',
    servers: '1.1.1.1',
    dohUrl: 'https://cloudflare-dns.com/dns-query',
    note: 'Adresse IPv4/IPv6 définie manuellement',
  },
];

export const PROTOCOL_INFO: Record<
  VpnProtocol,
  { label: string; cipher: string; summary: string; portLabel: string }
> = {
  wireguard: {
    label: 'WireGuard',
    cipher: 'ChaCha20-Poly1305',
    summary: 'Noyau léger, reconnexion instantanée 3G/4G/5G/Wi-Fi et consommation batterie réduite.',
    portLabel: 'UDP 51820',
  },
  'openvpn-udp': {
    label: 'OpenVPN UDP',
    cipher: 'AES-256-GCM',
    summary: 'Débit élevé et compatibilité étendue avec les mobiles Android et routeurs.',
    portLabel: 'UDP 1194',
  },
  'openvpn-tcp': {
    label: 'OpenVPN TCP',
    cipher: 'AES-256-GCM',
    summary: 'Traverse les pare-feu mobiles restrictifs des opérateurs via port TCP 443.',
    portLabel: 'TCP 443',
  },
  ikev2: {
    label: 'IKEv2 / IPsec',
    cipher: 'AES-256-GCM',
    summary: 'Protocole mobile MOBIKE résistant aux changements d’antenne cellulaire.',
    portLabel: 'UDP 500 / 4500',
  },
};

export interface AndroidAppOption {
  packageName: string;
  label: string;
  category: string;
}

export const ANDROID_APPS_CATALOG: AndroidAppOption[] = [
  { packageName: 'com.whatsapp', label: 'WhatsApp', category: 'Messagerie' },
  { packageName: 'com.android.chrome', label: 'Google Chrome', category: 'Navigateur' },
  { packageName: 'com.google.android.youtube', label: 'YouTube', category: 'Vidéo' },
  { packageName: 'com.spotify.music', label: 'Spotify', category: 'Audio' },
  { packageName: 'com.netflix.mediaclient', label: 'Netflix', category: 'Streaming' },
  { packageName: 'com.orange.orangemoney', label: 'Orange Money', category: 'Mobile Money' },
  { packageName: 'com.mtn.momo', label: 'MTN MoMo', category: 'Mobile Money' },
  { packageName: 'com.wave.personal', label: 'Wave Mobile', category: 'Paiement' },
];

export function resolveDnsServers(settings: VpnSettings): string {
  if (settings.dnsProvider === 'custom') {
    const cleaned = settings.customDns.trim();
    return cleaned || '1.1.1.1';
  }
  const found = DNS_PROVIDERS.find((d) => d.id === settings.dnsProvider);
  return found ? found.servers : '1.1.1.1, 1.0.0.1';
}

export function buildWireGuardConfig(
  server: VpnServer,
  operator: string,
  keypair: VpnKeypair,
  settings: VpnSettings,
  virtualIp = '10.8.0.2/32',
  virtualIpv6 = 'fd00:8::2/128'
): string {
  const dns = resolveDnsServers(settings);
  const allowedIps =
    settings.bypassLan && !settings.killSwitch
      ? '0.0.0.0/1, 128.0.0.0/1, ::/1, 8000::/1'
      : server.ipv6
        ? '0.0.0.0/0, ::/0'
        : '0.0.0.0/0';

  const lines = [
    `# Profil Kestrel VPN — ${server.country} (${server.dialCode})`,
    `# Opérateur : ${operator} · Quota : Go illimité`,
    `[Interface]`,
    `PrivateKey = ${keypair.privateKey}`,
    `Address = ${virtualIp}${server.ipv6 ? `, ${virtualIpv6}` : ''}`,
    `DNS = ${dns}`,
    `MTU = ${settings.mtu}`,
  ];

  if (settings.splitTunnelingEnabled && settings.excludedApps.length > 0) {
    lines.push(`# Applications Android exclues du tunnel`);
    lines.push(`# ExcludedApplications = ${settings.excludedApps.join(', ')}`);
  }

  lines.push(
    ``,
    `[Peer]`,
    `PublicKey = ${server.publicKey}`,
    `PresharedKey = ${keypair.presharedKey}`,
    `AllowedIPs = ${allowedIps}`,
    `Endpoint = ${server.gatewayIp}:${server.wgPort}`,
    `PersistentKeepalive = 25`,
    ``
  );

  return lines.join('\n');
}

export function buildOpenVpnConfig(
  server: VpnServer,
  operator: string,
  settings: VpnSettings
): string {
  const isTcp = settings.protocol === 'openvpn-tcp';
  const proto = isTcp ? 'tcp-client' : 'udp';
  const port = isTcp ? 443 : server.ovpnPort;
  const primaryDns = resolveDnsServers(settings).split(',')[0].trim();

  return [
    `# Profil OpenVPN Kestrel VPN — ${server.country} (${server.dialCode})`,
    `# Opérateur : ${operator} · Quota : Go illimité`,
    `client`,
    `dev tun`,
    `proto ${proto}`,
    `remote ${server.gatewayIp} ${port}`,
    `resolv-retry infinite`,
    `nobind`,
    `persist-key`,
    `persist-tun`,
    `remote-cert-tls server`,
    `cipher AES-256-GCM`,
    `data-ciphers AES-256-GCM:CHACHA20-POLY1305`,
    `auth SHA256`,
    `verb 3`,
    `tun-mtu ${settings.mtu}`,
    `dhcp-option DNS ${primaryDns}`,
    settings.killSwitch ? `block-outside-dns` : `# block-outside-dns`,
    `redirect-gateway def1 bypass-dhcp`,
    ``,
    `<ca>`,
    `# Insérez le certificat racine CA de votre passerelle si auto-hébergée`,
    `</ca>`,
    ``,
  ].join('\n');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} Ko`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} Mo`;
  return `${(mb / 1024).toFixed(2)} Go`;
}

export function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}
