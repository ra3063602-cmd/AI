package com.phoneai.companion.actions

enum class PhoneActionType {
    OPEN_URL,
    SEARCH_WEB,
    OPEN_GALLERY,
    SHOW_DATE,
    SHOW_TIME,
}

sealed interface PhoneAction {
    val type: PhoneActionType
    val parameters: PhoneActionParameters

    data class OpenUrl(
        override val parameters: OpenUrlParameters,
    ) : PhoneAction {
        override val type = PhoneActionType.OPEN_URL
    }

    data class SearchWeb(
        override val parameters: SearchWebParameters,
    ) : PhoneAction {
        override val type = PhoneActionType.SEARCH_WEB
    }

    data class OpenGallery(
        override val parameters: OpenGalleryParameters = OpenGalleryParameters(),
    ) : PhoneAction {
        override val type = PhoneActionType.OPEN_GALLERY
    }

    data class ShowDate(
        override val parameters: LocaleParameters = LocaleParameters(),
    ) : PhoneAction {
        override val type = PhoneActionType.SHOW_DATE
    }

    data class ShowTime(
        override val parameters: LocaleParameters = LocaleParameters(),
    ) : PhoneAction {
        override val type = PhoneActionType.SHOW_TIME
    }
}

sealed interface PhoneActionParameters

data class OpenUrlParameters(
    val url: String,
) : PhoneActionParameters

data class SearchWebParameters(
    val query: String,
) : PhoneActionParameters

data class OpenGalleryParameters(
    val source: String = "device_gallery",
) : PhoneActionParameters

data class LocaleParameters(
    val locale: String = "default",
) : PhoneActionParameters