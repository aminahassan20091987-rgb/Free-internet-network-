export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type VpnTab = 'connect' | 'servers' | 'tools' | 'apk';

export type VpnProtocol = 'wireguard' | 'openvpn-udp' | 'openvpn-tcp' | 'ikev2';

export type DnsProvider = 'cloudflare' | 'quad9' | 'adguard' | 'mullvad' | 'custom';

export type AfricanRegion =
  | 'Afrique du Nord'
  | 'Afrique de l\'Ouest'
  | 'Afrique Centrale'
  | 'Afrique de l\'Est'
  | 'Afrique Australe';

export interface VpnServer {
  id: string;
  country: string;
  dialCode: string;
  countryCode: string;
  region: AfricanRegion;
  operators: string[];
  gatewayIp: string;
  wgPort: number;
  ovpnPort: number;
  publicKey: string;
  baseLatencyMs: number;
  measuredLatencyMs: number | null;
  loadPct: number;
  unlimitedData: boolean;
  ipv6: boolean;
}

export interface VpnKeypair {
  privateKey: string;
  publicKey: string;
  presharedKey: string;
  createdAt: string;
}

export interface VpnSettings {
  selectedServerId: string;
  selectedOperator: string;
  protocol: VpnProtocol;
  dnsProvider: DnsProvider;
  customDns: string;
  killSwitch: boolean;
  splitTunnelingEnabled: boolean;
  bypassLan: boolean;
  excludedApps: string[];
  mtu: number;
  autoConnectUntrustedWifi: boolean;
}

export interface TunnelSession {
  connected: boolean;
  serverId: string;
  operator: string;
  gatewayIp: string;
  connectedAt: string | null;
  virtualIp: string;
  virtualIpv6: string;
  protocol: VpnProtocol;
  unlimitedData: boolean;
  bytesRx: number;
  bytesTx: number;
  currentDownMbps: number;
  currentUpMbps: number;
}

export interface TelemetryPoint {
  ts: string;
  downMbps: number;
  upMbps: number;
  latencyMs: number;
}

export interface NetworkInspection {
  clientIp: string;
  publicIp: string | null;
  userAgent: string;
  acceptLanguage: string;
  protocol: string;
  serverTimestamp: string;
}

export interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export interface DohResponse {
  domain: string;
  recordType: string;
  resolver: string;
  status: number;
  elapsedMs: number;
  answers: DohAnswer[];
}
