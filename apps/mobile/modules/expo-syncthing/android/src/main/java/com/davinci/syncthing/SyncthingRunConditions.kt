package com.davinci.syncthing

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager

class SyncthingRunConditions(private val context: Context) {
    private val prefs = context.getSharedPreferences("davinci_syncthing_conditions", Context.MODE_PRIVATE)

    var wifiOnly: Boolean
        get() = prefs.getBoolean("wifi_only", false)
        set(value) = prefs.edit().putBoolean("wifi_only", value).apply()

    var chargingOnly: Boolean
        get() = prefs.getBoolean("charging_only", false)
        set(value) = prefs.edit().putBoolean("charging_only", value).apply()

    var syncInBackground: Boolean
        get() = prefs.getBoolean("sync_in_background", true)
        set(value) = prefs.edit().putBoolean("sync_in_background", value).apply()

    var syncEnabled: Boolean
        get() = prefs.getBoolean("sync_enabled", false)
        set(value) = prefs.edit().putBoolean("sync_enabled", value).apply()

    fun isWifiConnected(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val activeNetwork = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(activeNetwork) ?: return false
        return caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) || caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
    }

    fun isDeviceCharging(): Boolean {
        val ifilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        val batteryStatus = context.registerReceiver(null, ifilter) ?: return false
        val status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
        return status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
    }

    fun isIgnoringBatteryOptimizations(): Boolean {
        val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return false
        return pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    fun canRun(): Pair<Boolean, String?> {
        if (!syncEnabled) {
            return Pair(false, "Sync is disabled")
        }
        if (wifiOnly && !isWifiConnected()) {
            return Pair(false, "Waiting for Wi-Fi network connection")
        }
        if (chargingOnly && !isDeviceCharging()) {
            return Pair(false, "Waiting for device to connect to charger")
        }
        return Pair(true, null)
    }
}
