package com.phoneai.companion

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.phoneai.companion.bridge.AndroidIntentBridge
import com.phoneai.companion.bridge.PhoneAiActionViewModel
import com.phoneai.companion.bridge.PhoneAiJavascriptBridge
import kotlinx.coroutines.launch
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var viewModel: PhoneAiActionViewModel

    private val galleryLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) {
        // The current action contract only requests the picker. A future contract
        // can add a validated result payload without exposing filesystem access.
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val bridge = AndroidIntentBridge(this) { intent ->
            galleryLauncher.launch(intent)
        }
        viewModel = ViewModelProvider(
            this,
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : androidx.lifecycle.ViewModel> create(
                    modelClass: Class<T>,
                ): T = PhoneAiActionViewModel(bridge) as T
            },
        )[PhoneAiActionViewModel::class.java]

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest,
                ): Boolean {
                    if (isTrustedPhoneAiUrl(request.url)) return false

                    startActivity(
                        Intent(Intent.ACTION_VIEW, request.url),
                    )
                    return true
                }
            }
            addJavascriptInterface(
                PhoneAiJavascriptBridge(viewModel),
                "PhoneAIBridge",
            )
        }
        setContentView(webView)

        lifecycleScope.launch {
            repeatOnLifecycle(androidx.lifecycle.Lifecycle.State.STARTED) {
                viewModel.results.collect { result ->
                    val payload = JSONObject()
                        .put("requestId", result.requestId)
                        .put("actionType", result.actionType?.name)
                        .put("ok", result.result is com.phoneai.companion.bridge.BridgeResult.Accepted)
                        .put("message", result.result.message)
                        .toString()
                    webView.evaluateJavascript(
                        "window.PhoneAI?.onNativeActionResult?.($payload);",
                        null,
                    )
                }
            }
        }

        if (BuildConfig.PHONEAI_WEB_URL.isBlank()) {
            webView.loadData(
                "<html><body><p>Configure PHONEAI_WEB_URL to load PhoneAI.</p></body></html>",
                "text/html",
                "UTF-8",
            )
        } else {
            webView.loadUrl(BuildConfig.PHONEAI_WEB_URL)
        }
    }

    private fun isTrustedPhoneAiUrl(url: Uri): Boolean {
        val configuredHost = Uri.parse(BuildConfig.PHONEAI_WEB_URL).host
            ?: return false
        return url.scheme.equals("https", ignoreCase = true) &&
            url.host.equals(configuredHost, ignoreCase = true)
    }
}