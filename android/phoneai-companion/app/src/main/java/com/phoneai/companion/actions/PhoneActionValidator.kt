package com.phoneai.companion.actions

import android.net.Uri

object PhoneActionValidator {
    private val allowedHosts = setOf(
        "google.com",
        "www.google.com",
        "youtube.com",
        "www.youtube.com",
    )

    fun requireValid(action: PhoneAction) {
        val valid = when (action) {
            is PhoneAction.OpenUrl -> isSafeUrl(action.parameters.url)
            is PhoneAction.SearchWeb -> action.parameters.query.length <= 500
            is PhoneAction.OpenGallery ->
                action.parameters.source == "device_gallery"
            is PhoneAction.ShowDate -> action.parameters.locale == "default"
            is PhoneAction.ShowTime -> action.parameters.locale == "default"
        }

        require(valid) { "The PhoneAI action or its parameters are not allowed." }
    }

    private fun isSafeUrl(value: String): Boolean {
        if (value.length > 2_000) return false

        val uri = Uri.parse(value)
        return uri.scheme.equals("https", ignoreCase = true) &&
            uri.host?.lowercase() in allowedHosts
    }
}