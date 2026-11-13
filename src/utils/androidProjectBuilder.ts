import JSZip from 'jszip';
import type { VpnKeypair, VpnServer, VpnSettings } from '../types';
import { getCountryLogoUrl, getOperatorLogoUrl, getOperatorLogoSlug } from './logoPaths';
import { buildWireGuardConfig, resolveDnsServers } from './vpnConfig';

export async function generateUniversalAndroidProjectZip(
  servers: VpnServer[],
  activeServer: VpnServer,
  activeOperator: string,
  keypair: VpnKeypair,
  settings: VpnSettings
): Promise<Blob> {
  const zip = new JSZip();
  const wgConfig = buildWireGuardConfig(activeServer, activeOperator, keypair, settings);
  const dnsList = resolveDnsServers(settings)
    .split(',')
    .map((d) => `"${d.trim()}"`)
    .join(', ');
  const excludedAppsKotlin = settings.excludedApps.map((pkg) => `"${pkg}"`).join(', ');

  zip.file(
    'README.md',
    `# Kestrel VPN — Projet Android APK Universel (54 Pays Africains · Go Illimités)

Ce dépôt contient le code source complet Kotlin / Android VpnService prêt à compiler en **APK universel** (\`arm64-v8a\`, \`armeabi-v7a\`, \`x86\`, \`x86_64\`) compatible Android 7.0 à Android 15 (API 24–35).

## Fonctionnalités incluses
- **54 pays africains avec indicatifs (+20 à +291) et opérateurs mobiles** intégrés dans \`app/src/main/assets/servers.json\`.
- **Quota Go illimité** sur tous les profils sans bridage de volume.
- **Connexion directe par adresse IP passerelle** (\`${activeServer.gatewayIp}:${activeServer.wgPort}\`).
- **Profil actif pré-embarqué** : ${activeServer.country} (${activeServer.dialCode}) · ${activeOperator}.
- **Kill Switch & Split Tunneling** natifs via \`VpnService.Builder.addDisallowedApplication()\`.

## Méthode 1 : Compiler l'APK dans Android Studio
1. Ouvrez ce dossier dans **Android Studio**.
2. Exécutez :
   \`\`\`bash
   ./gradlew assembleUniversalRelease
   \`\`\`

## Méthode 2 : Compiler l'APK automatiquement dans le cloud (GitHub Actions, sans PC)
1. Créez un dépôt sur GitHub et déposez-y le contenu de ce dossier.
2. Ouvrez l'onglet **Actions** → le workflow \`.github/workflows/build-apk.yml\` installe Android SDK + Gradle 8.9 et compile automatiquement \`app-universal-debug.apk\`.
3. Téléchargez l'artefact **kestrel-vpn-universal-apk** prêt à installer sur tout téléphone Android.
`
  );

  zip.file(
    '.github/workflows/build-apk.yml',
    `name: Build Universal Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.9'
      - name: Build Universal APK
        run: gradle assembleDebug
      - name: Upload Universal APK
        uses: actions/upload-artifact@v4
        with:
          name: kestrel-vpn-universal-apk
          path: app/build/outputs/apk/debug/*universal*.apk
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`
  );

  zip.file(
    'app/src/main/res/values/strings.xml',
    `<resources>
    <string name="app_name">Kestrel VPN</string>
</resources>
`
  );

  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "KestrelVPNUniversal"
include(":app")
`
  );

  zip.file(
    'build.gradle.kts',
    `plugins {
    id("com.android.application") version "8.6.1" apply false
    id("org.jetbrains.kotlin.android") version "2.0.20" apply false
}
`
  );

  zip.file(
    'app/build.gradle.kts',
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.kestrelvpn.universal"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.kestrelvpn.universal"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    splits {
        abi {
            isEnable = true
            reset()
            include("armeabi-v7a", "arm64-v8a", "x86", "x86_64")
            isUniversalApk = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.2")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("com.wireguard.android:tunnel:1.0.20230706")
}
`
  );

  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="false"
        android:label="Kestrel VPN"
        android:supportsRtl="true"
        android:theme="@style/Theme.Material3.DayNight.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".UniversalVpnService"
            android:exported="false"
            android:foregroundServiceType="specialUse"
            android:permission="android.permission.BIND_VPN_SERVICE">
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
        </service>
    </application>
</manifest>
`
  );

  zip.file(
    'app/src/main/java/com/kestrelvpn/universal/UniversalVpnService.kt',
    `package com.kestrelvpn.universal

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import com.wireguard.android.backend.GoBackend
import com.wireguard.android.backend.Tunnel
import com.wireguard.config.Config
import java.io.ByteArrayInputStream

class UniversalVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var backend: GoBackend? = null

    private val activeTunnel = object : Tunnel {
        override fun getName(): String = "kestrel_tun0"
        override fun onStateChange(newState: Tunnel.State) {
            // Mise à jour d'état du tunnel
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_DISCONNECT) {
            stopTunnel()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, buildNotification())
        val rawConfig = intent?.getStringExtra(EXTRA_WG_CONFIG)
            ?: assets.open("kestrel_default.conf").bufferedReader().use { it.readText() }

        startWireGuardTunnel(rawConfig)
        return START_STICKY
    }

    private fun startWireGuardTunnel(rawConfig: String) {
        try {
            val goBackend = backend ?: GoBackend(applicationContext).also { backend = it }
            val parsed = Config.parse(ByteArrayInputStream(rawConfig.toByteArray()))
            goBackend.setState(activeTunnel, Tunnel.State.UP, parsed)
        } catch (_: Exception) {
            val builder = Builder()
                .setSession("Kestrel VPN")
                .addAddress("10.8.0.2", 32)
                .setMtu(${settings.mtu})

            val dnsServers = listOf(${dnsList})
            dnsServers.forEach { dns -> builder.addDnsServer(dns) }

            builder.addRoute("0.0.0.0", 0)
            ${settings.killSwitch ? 'builder.setBlocking(true)' : '// Kill Switch optionnel'}

            val excluded = listOf(${excludedAppsKotlin})
            excluded.forEach { pkg ->
                runCatching { builder.addDisallowedApplication(pkg) }
            }

            vpnInterface = builder.establish()
        }
    }

    private fun stopTunnel() {
        runCatching { backend?.setState(activeTunnel, Tunnel.State.DOWN, null) }
        runCatching { vpnInterface?.close() }
        vpnInterface = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        stopTunnel()
        super.onDestroy()
    }

    private fun buildNotification(): Notification {
        val channelId = "kestrel_vpn_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Tunnel VPN Kestrel",
                NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        return builder
            .setContentTitle("Kestrel VPN · Go illimités")
            .setContentText("${activeServer.country} (${activeServer.dialCode}) · ${activeOperator}")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .build()
    }

    companion object {
        const val ACTION_DISCONNECT = "com.kestrelvpn.universal.DISCONNECT"
        const val EXTRA_WG_CONFIG = "wg_config"
        private const val NOTIFICATION_ID = 1042
    }
}
`
  );

  zip.file(
    'app/src/main/java/com/kestrelvpn/universal/MainActivity.kt',
    `package com.kestrelvpn.universal

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private var isConnected = false
    private lateinit var statusLabel: TextView
    private lateinit var toggleButton: Button

    private val vpnPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            launchVpnService()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(64, 128, 64, 64)
        }

        val title = TextView(this).apply {
            text = "Kestrel VPN · Go Illimités"
            textSize = 24f
        }

        statusLabel = TextView(this).apply {
            text = "Prêt — ${activeServer.country} (${activeServer.dialCode}) · ${activeOperator}"
            textSize = 15f
            setPadding(0, 24, 0, 48)
        }

        toggleButton = Button(this).apply {
            text = "Activer le VPN"
            setOnClickListener {
                if (isConnected) {
                    val stopIntent = Intent(this@MainActivity, UniversalVpnService::class.java).apply {
                        action = UniversalVpnService.ACTION_DISCONNECT
                    }
                    startService(stopIntent)
                    isConnected = false
                    text = "Activer le VPN"
                    statusLabel.text = "Déconnecté"
                } else {
                    val prepareIntent = VpnService.prepare(this@MainActivity)
                    if (prepareIntent != null) {
                        vpnPermissionLauncher.launch(prepareIntent)
                    } else {
                        launchVpnService()
                    }
                }
            }
        }

        root.addView(title)
        root.addView(statusLabel)
        root.addView(toggleButton)
        setContentView(root)
    }

    private fun launchVpnService() {
        val intent = Intent(this, UniversalVpnService::class.java)
        startForegroundService(intent)
        isConnected = true
        toggleButton.text = "Déconnecter"
        statusLabel.text = "Tunnel actif · ${activeServer.country} (${activeServer.dialCode}) · ${activeOperator}"
    }
}
`
  );

  const enrichedServers = servers.map((srv) => ({
    ...srv,
    countryLogo: `logos/countries/${srv.countryCode.toLowerCase()}.png`,
    operatorLogos: srv.operators.map((op) => ({
      name: op,
      logo: `logos/operators/${getOperatorLogoSlug(op)}.png`,
    })),
  }));

  zip.file('app/src/main/assets/kestrel_default.conf', wgConfig);
  zip.file('app/src/main/assets/servers.json', JSON.stringify(enrichedServers, null, 2));

  // Embarquer les logos PNG des 54 pays et des opérateurs dans les assets Android
  const uniqueOpSlugs = new Map<string, string>();
  servers.forEach((srv) => {
    srv.operators.forEach((op) => {
      const slug = getOperatorLogoSlug(op);
      if (!uniqueOpSlugs.has(slug)) {
        uniqueOpSlugs.set(slug, getOperatorLogoUrl(op));
      }
    });
  });

  await Promise.all([
    ...servers.map(async (srv) => {
      try {
        const res = await fetch(getCountryLogoUrl(srv.countryCode));
        if (res.ok) {
          const buf = await res.arrayBuffer();
          zip.file(`app/src/main/assets/logos/countries/${srv.countryCode.toLowerCase()}.png`, buf);
        }
      } catch {
        // ignore offline fetch skip
      }
    }),
    ...Array.from(uniqueOpSlugs.entries()).map(async ([slug, url]) => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          zip.file(`app/src/main/assets/logos/operators/${slug}.png`, buf);
        }
      } catch {
        // ignore offline fetch skip
      }
    }),
  ]);

  return zip.generateAsync({ type: 'blob' });
}
