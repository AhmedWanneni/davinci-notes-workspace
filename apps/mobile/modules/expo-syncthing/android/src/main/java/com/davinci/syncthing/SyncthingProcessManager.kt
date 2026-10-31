package com.davinci.syncthing

import android.content.Context
import android.util.Log
import java.io.File
import java.net.ServerSocket
import java.security.SecureRandom
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

class SyncthingProcessManager(private val context: Context) {
    private var process: Process? = null
    var port: Int = 0
        private set
    var apiKey: String = ""
        private set
    var deviceId: String = ""
        private set
    var binaryPath: String = ""
        private set
    var binaryExists: Boolean = false
        private set
    var binaryExecutable: Boolean = false
        private set
    var lastExitCode: Int? = null
        private set

    val isRunning = AtomicBoolean(false)
    val lastError = AtomicReference<String?>(null)
    val recentLogs = ConcurrentLinkedQueue<String>()
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

        val now = System.currentTimeMillis()
        crashTimestamps.removeAll { now - it > 60_000 }
        if (crashTimestamps.size >= 3) {
            val err = "Crash loop detected: 3 failures in 60s. Halting automatic restart."
            lastError.set(err)
            Log.e("SyncthingProcess", err)
            return false
        }

        val nativeLibDir = context.applicationInfo.nativeLibraryDir
        val binaryFile = File(nativeLibDir, "libsyncthing.so")
        binaryPath = binaryFile.absolutePath
        binaryExists = binaryFile.exists()
        binaryExecutable = binaryFile.canExecute()

        Log.i("SyncthingProcess", "Locating binary: path=$binaryPath, exists=$binaryExists, canExecute=$binaryExecutable")

        if (!binaryExists) {
            val err = "Syncthing native binary not found in native library directory: $binaryPath"
            lastError.set(err)
            Log.e("SyncthingProcess", err)
            return false
        }

        if (!binaryExecutable) {
            binaryFile.setExecutable(true, false)
            binaryExecutable = binaryFile.canExecute()
            if (!binaryExecutable) {
                val err = "Syncthing native binary exists but is not executable at: $binaryPath"
                lastError.set(err)
                Log.e("SyncthingProcess", err)
                return false
            }
        }

        val homeDir = File(context.filesDir, "syncthing")
        if (!homeDir.exists()) homeDir.mkdirs()

        port = findFreePort()
        apiKey = getOrGenerateApiKey()
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
        pb.redirectErrorStream(true)
        pb.environment()["HOME"] = homeDir.absolutePath
        pb.environment()["STNORESTART"] = "1"
        pb.environment()["STNOUPGRADE"] = "1"
        pb.directory(context.filesDir)

        try {
            Log.i("SyncthingProcess", "Spawning Syncthing process on port $port...")
            val proc = pb.start()
            process = proc
            isRunning.set(true)
            lastError.set(null)
            lastExitCode = null

            Thread {
                try {
                    proc.inputStream.bufferedReader().useLines { lines ->
                        lines.forEach { line ->
                            val sanitized = if (apiKey.isNotEmpty()) line.replace(apiKey, "[REDACTED]") else line
                            appendLog(sanitized)
                            if (line.contains("My ID: ")) {
                                val id = line.substringAfter("My ID: ").trim().split(" ")[0]
                                if (id.length >= 56) {
                                    deviceId = id
                                    Log.i("SyncthingProcess", "Syncthing ready, deviceId=$id")
                                }
                            }
                        }
                    }
                } catch (_: Exception) {}

                val exit = proc.waitFor()
                lastExitCode = exit
                isRunning.set(false)
                Log.w("SyncthingProcess", "Syncthing process terminated with exit code $exit")

                if (exit != 0) {
                    crashTimestamps.add(System.currentTimeMillis())
                    val recent = recentLogs.toList().takeLast(5).joinToString("\n")
                    lastError.set("Syncthing exited unexpectedly (code $exit). Last logs:\n$recent")
                }
            }.start()

            return true
        } catch (e: Exception) {
            val err = "Failed to spawn Syncthing process: ${e.message}"
            lastError.set(err)
            Log.e("SyncthingProcess", err, e)
            return false
        }
    }

    private fun appendLog(line: String) {
        recentLogs.add(line)
        while (recentLogs.size > 50) {
            recentLogs.poll()
        }
    }

    fun getRecentLogsList(): List<String> = recentLogs.toList()

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
