package com.davinci.syncthing

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class SyncthingForegroundService : Service() {
    companion object {
        const val CHANNEL_ID = "davinci_syncthing_sync_channel"
        const val NOTIFICATION_ID = 4040
        const val ACTION_START = "com.davinci.syncthing.START"
        const val ACTION_STOP = "com.davinci.syncthing.STOP"
        const val ACTION_RESTART = "com.davinci.syncthing.RESTART"

        var instance: SyncthingForegroundService? = null
            private set
    }

    lateinit var processManager: SyncthingProcessManager
        private set
    lateinit var runConditions: SyncthingRunConditions
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        processManager = SyncthingProcessManager(this)
        runConditions = SyncthingRunConditions(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START
        when (action) {
            ACTION_STOP -> {
                stopSyncthing()
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_RESTART -> {
                stopSyncthing()
                startSyncthing()
            }
            else -> {
                startSyncthing()
            }
        }
        return START_STICKY
    }

    private fun startSyncthing() {
        val (canRun, reason) = runConditions.canRun()
        val notification = buildNotification(if (canRun) "Syncing notes in background" else "Sync paused: $reason")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        if (canRun) {
            processManager.start()
        }
    }

    private fun stopSyncthing() {
        processManager.stop()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        if (!runConditions.syncInBackground) {
            stopSyncthing()
            stopSelf()
        }
    }

    override fun onDestroy() {
        instance = null
        stopSyncthing()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "DaVinci Notes Peer Sync",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps peer-to-peer sync active with desktop"
                setShowBadge(false)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(statusText: String): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("DaVinci Notes Sync Active")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
