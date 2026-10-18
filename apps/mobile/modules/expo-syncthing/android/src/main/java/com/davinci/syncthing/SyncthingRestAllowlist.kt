package com.davinci.syncthing

import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

object SyncthingRestAllowlist {
    private val ALLOWED_PREFIXES = listOf(
        "/rest/system/status",
        "/rest/system/version",
        "/rest/system/connections",
        "/rest/config/devices",
        "/rest/config/folders",
        "/rest/config/options",
        "/rest/cluster/pending/",
        "/rest/db/completion",
        "/rest/db/scan",
        "/rest/events"
    )

    private val DISALLOWED_PATHS = listOf(
        "/rest/system/shutdown",
        "/rest/system/restart",
        "/rest/system/reset"
    )

    fun isAllowed(path: String): Boolean {
        val clean = path.trim()
        if (DISALLOWED_PATHS.any { clean.startsWith(it) }) return false
        return ALLOWED_PREFIXES.any { clean.startsWith(it) }
    }

    fun executeInternal(
        port: Int,
        apiKey: String,
        method: String,
        path: String,
        body: String?
    ): String {
        val url = URL("http://127.0.0.1:$port$path")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = method.uppercase()
        conn.connectTimeout = 4000
        conn.readTimeout = 8000
        conn.setRequestProperty("X-API-Key", apiKey.trim())
        conn.setRequestProperty("Content-Type", "application/json")
        conn.setRequestProperty("Accept", "application/json")

        if (!body.isNullOrBlank() && (method.equals("POST", true) || method.equals("PUT", true) || method.equals("PATCH", true))) {
            conn.doOutput = true
            conn.outputStream.use { os ->
                os.write(body.toByteArray(Charsets.UTF_8))
            }
        }

        val responseCode = conn.responseCode
        val stream = if (responseCode in 200..299) conn.inputStream else conn.errorStream
        val response = stream?.bufferedReader()?.use(BufferedReader::readText) ?: ""

        if (responseCode !in 200..299) {
            val safeMsg = response.replace(apiKey, "[REDACTED]")
            throw RuntimeException("Syncthing returned HTTP $responseCode: $safeMsg")
        }

        return response
    }

    fun executeRequest(
        port: Int,
        apiKey: String,
        method: String,
        path: String,
        body: String?
    ): String {
        if (!isAllowed(path)) {
            throw SecurityException("Syncthing API path is not in allowlist: $path")
        }
        return executeInternal(port, apiKey, method, path, body)
    }
}
