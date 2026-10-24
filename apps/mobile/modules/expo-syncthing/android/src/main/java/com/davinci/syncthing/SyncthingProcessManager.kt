package com.davinci.syncthing

import android.content.Context
import java.io.File
import java.net.ServerSocket
import java.security.SecureRandom
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.*

class SyncthingProcessManager(private val context: Context) {
    private var process: Process? = null
    var port: Int = 0
        private set
    var apiKey: String = ""
        private set
    var deviceId: String = ""
        private set

    val isRunning = AtomicBoolean(false)
    val lastError = AtomicReference<String?>(null)
    private var crashTimestamps = mutableListOf<Long>()

    private val prefs = context.getSharedPreferences("davinci_syncthing_internal", Context.MODE_PRIVATE)

    fun getOrGenerateApiKey(): String {
        var key = prefs.getString("api_key", null)
        if (key.isNullOrBlank()) {
            val chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
            val random = SecureRandom()
            key = (1..32).map { chars[random.nextInt(chars.length)] }.joinToString("")
            prefs.edit().putString("api_key", key).apply()
        }
        return key
    }

    private fun findFreePort(): Int {
        ServerSocket(0).use { return it.localPort }
    }

    fun start(): Boolean {
        if (isRunning.get()) return true

        // Crash loop guard: 3 crashes within 60 seconds
        val now = System.currentTimeMillis()
        crashTimestamps.removeAll { now - it > 60_000 }
        if (crashTimestamps.size >= 3) {
            lastError.set("Crash loop detected: 3 failures in 60s. Halting automatic restart.")
            return false
        }

        val nativeLibDir = context.applicationInfo.nativeLibraryDir
        val binaryFile = File(nativeLibDir, "libsyncthing.so")
        if (!binaryFile.exists() || !binaryFile.canExecute()) {
            lastError.set("Syncthing native binary not found or not executable at: ${binaryFile.absolutePath}")
            return false
        }

        val homeDir = File(context.filesDir, "syncthing")
        if (!homeDir.exists()) homeDir.mkdirs()

        port = findFreePort()
        apiKey = getOrGenerateApiKey()

        // Strip default folder from config.xml if present
        stripDefaultFolder(homeDir)

        val pb = ProcessBuilder(
            binaryFile.absolutePath,
            "serve",
            "--home=${homeDir.absolutePath}",
            "--gui-address=http://127.0.0.1:$port",
            "--gui-apikey=$apiKey",
            "--no-browser",
            "--no-upgrade",
            "--no-restart",
            "--log-file=-"
        )
        pb.environment()["STNORESTART"] = "1"
        pb.environment()["STNOUPGRADE"] = "1"
        pb.directory(context.filesDir)

        try {
            val proc = pb.start()
            process = proc
            isRunning.set(true)
            lastError.set(null)

            // Capture logs and redact secrets
            Thread {
                proc.inputStream.bufferedReader().useLines { lines ->
                    lines.forEach { line ->
                        if (line.contains("My ID: ")) {
                            val id = line.substringAfter("My ID: ").trim().split(" ")[0]
                            if (id.length >= 56) deviceId = id
                        }
                    }
                }
                if (isRunning.get()) {
                    crashTimestamps.add(System.currentTimeMillis())
                    isRunning.set(false)
                }
            }.start()

            return true
        } catch (e: Exception) {
            lastError.set(e.message)
            return false
        }
    }

    fun stop() {
        isRunning.set(false)
        try {
            if (port > 0 && apiKey.isNotEmpty()) {
                SyncthingRestAllowlist.executeInternal(port, apiKey, "POST", "/rest/system/shutdown", null)
            }
        } catch (_: Exception) {}

        process?.let { proc ->
            proc.destroy()
            Thread.sleep(200)
            if (proc.isAlive) proc.destroyForcibly()
        }
        process = null
        port = 0
    }

    private fun stripDefaultFolder(homeDir: File) {
        val configFile = File(homeDir, "config.xml")
        if (!configFile.exists()) return
        try {
            val content = configFile.readText()
            if (content.contains("id=\"default\"")) {
                val cleaned = content.replace(Regex("<folder\\s+id=\"default\"[\\s\\S]*?</folder>"), "")
                configFile.writeText(cleaned)
            }
        } catch (_: Exception) {}
    }
}
