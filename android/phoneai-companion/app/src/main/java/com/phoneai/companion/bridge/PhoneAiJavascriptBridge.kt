package com.phoneai.companion.bridge

import android.webkit.JavascriptInterface

class PhoneAiJavascriptBridge(
    private val viewModel: PhoneAiActionViewModel,
) {
    @JavascriptInterface
    fun requestAction(requestId: String, actionJson: String) {
        viewModel.requestAction(requestId, actionJson)
    }
}