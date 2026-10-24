package com.davinci.syncthing

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.PowerManager
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ExpoSyncthingModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("React context not available")

    private val runConditions by lazy { SyncthingRunConditions(context) }

    override fun definition() = ModuleDefinition {
        Name("ExpoSyncthing")

        Events("onStatusChange")

        AsyncFunction("start") {
            runConditions.syncEnabled = true
            val serviceIntent = Intent(context, SyncthingForegroundService::class.java).apply {
                action = SyncthingForegroundService.ACTION_START
            }
            ContextCompat.startForegroundService(context, serviceIntent)

            // Wait briefly for process to initialize
            var attempts = 0
            while (attempts < 20) {
                val svc = SyncthingForegroundService.instance
                if (svc != null && svc.processManager.isRunning.get() && svc.processManager.port > 0) {
                    val port = svc.processManager.port
                    val devId = svc.processManager.deviceId
                    return@AsyncFunction mapOf(
                        "status" to "running",
                        "port" to port,
                        "deviceId" to devId
                    )
                }
                Thread.sleep(150)
                attempts++
            }

            val svc = SyncthingForegroundService.instance
            val err = svc?.processManager?.lastError?.get() ?: "Starting Syncthing..."
            mapOf(
                "status" to if (svc?.processManager?.isRunning?.get() == true) "running" else "starting",
                "port" to (svc?.processManager?.port ?: 0),
                "deviceId" to (svc?.processManager?.deviceId ?: ""),
                "reason" to err
            )
        }

        AsyncFunction("stop") {
            runConditions.syncEnabled = false
            val serviceIntent = Intent(context, SyncthingForegroundService::class.java).apply {
                action = SyncthingForegroundService.ACTION_STOP
            }
            context.startService(serviceIntent)
        }

        AsyncFunction("status") {
            val svc = SyncthingForegroundService.instance
            if (svc != null && svc.processManager.isRunning.get()) {
                mapOf(
                    "status" to "running",
                    "port" to svc.processManager.port,
                    "deviceId" to svc.processManager.deviceId
                )
            } else {
                val err = svc?.processManager?.lastError?.get()
                mapOf(
                    "status" to if (err != null) "crashed" else "stopped",
                    "port" to 0,
                    "deviceId" to (svc?.processManager?.deviceId ?: ""),
                    "reason" to err
                )
            }
        }

        AsyncFunction("getDeviceId") {
            val svc = SyncthingForegroundService.instance
            svc?.processManager?.deviceId ?: ""
        }

        AsyncFunction("getQrDataUri") { text: String ->
            withContext(Dispatchers.IO) {
                val svc = SyncthingForegroundService.instance
                val port = svc?.processManager?.port ?: 0
                if (port <= 0) return@withContext ""
                try {
                    val encoded = java.net.URLEncoder.encode(text, "UTF-8")
                    val url = java.net.URL("http://127.0.0.1:$port/qr/?text=$encoded")
                    val conn = url.openConnection() as java.net.HttpURLConnection
                    conn.connectTimeout = 3000
                    conn.readTimeout = 5000
                    val bytes = conn.inputStream.use { it.readBytes() }
                    val b64 = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP)
                    "data:image/png;base64,$b64"
                } catch (_: Exception) {
                    ""
                }
            }
        }

        AsyncFunction("request") { method: String, path: String, body: String? ->
            withContext(Dispatchers.IO) {
                val svc = SyncthingForegroundService.instance
                    ?: throw IllegalStateException("Syncthing service is not running")
                val port = svc.processManager.port
                val key = svc.processManager.apiKey
                if (port <= 0 || key.isEmpty()) {
                    throw IllegalStateException("Syncthing is not ready yet")
                }
                SyncthingRestAllowlist.executeRequest(port, key, method, path, body)
            }
        }

        AsyncFunction("setRunConditions") { wifiOnly: Boolean, chargingOnly: Boolean, background: Boolean ->
            runConditions.wifiOnly = wifiOnly
            runConditions.chargingOnly = chargingOnly
            runConditions.syncInBackground = background
        }

        AsyncFunction("isBatteryOptimizationIgnored") {
            runConditions.isIgnoringBatteryOptimizations()
        }

        AsyncFunction("requestBatteryOptimization") {
            if (!runConditions.isIgnoringBatteryOptimizations()) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
                true
            } else {
                false
            }
        }
    }
}
