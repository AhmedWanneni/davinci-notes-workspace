package com.davinci.syncthing

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class SyncthingBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val conditions = SyncthingRunConditions(context)
            if (conditions.syncEnabled && conditions.syncInBackground) {
                val serviceIntent = Intent(context, SyncthingForegroundService::class.java).apply {
                    action = SyncthingForegroundService.ACTION_START
                }
                ContextCompat.startForegroundService(context, serviceIntent)
            }
        }
    }
}
