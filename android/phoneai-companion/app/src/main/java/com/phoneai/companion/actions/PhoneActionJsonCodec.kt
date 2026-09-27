package com.phoneai.companion.actions

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject

object PhoneActionJsonCodec {
    private val json = Json {
        ignoreUnknownKeys = false
    }

    fun decode(raw: String): Result<PhoneAction> = runCatching {
        val root = json.parseToJsonElement(raw).jsonObject
        require(root.keys == setOf("type", "parameters")) {
            "An action must contain only type and parameters."
        }

        val type = root.requireString("type")
        val parameters = root["parameters"]?.jsonObject
            ?: error("Action parameters are required.")

        val action = when (type) {
            "OPEN_URL" -> PhoneAction.OpenUrl(
                parameters = OpenUrlParameters(
                    url = parameters.requireOnlyString("url"),
                ),
            )
            "SEARCH_WEB" -> PhoneAction.SearchWeb(
                parameters = SearchWebParameters(
                    query = parameters.requireOnlyString("query"),
                ),
            )
            "OPEN_GALLERY" -> PhoneAction.OpenGallery(
                parameters = OpenGalleryParameters(
                    source = parameters.requireOnlyString("source"),
                ),
            )
            "SHOW_DATE" -> PhoneAction.ShowDate(
                parameters = LocaleParameters(
                    locale = parameters.requireOnlyString("locale"),
                ),
            )
            "SHOW_TIME" -> PhoneAction.ShowTime(
                parameters = LocaleParameters(
                    locale = parameters.requireOnlyString("locale"),
                ),
            )
            else -> error("Unsupported PhoneAI action type.")
        }

        PhoneActionValidator.requireValid(action)
        action
    }

    private fun JsonObject.requireString(key: String): String =
        (this[key] as? JsonPrimitive)?.content
            ?: error("Parameter $key must be a string.")

    private fun JsonObject.requireOnlyString(key: String): String {
        require(keys == setOf(key)) {
            "Action parameters contain unsupported fields."
        }
        return requireString(key)
    }
}