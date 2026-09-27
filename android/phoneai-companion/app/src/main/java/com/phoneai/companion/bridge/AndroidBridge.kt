package com.phoneai.companion.bridge

import com.phoneai.companion.actions.PhoneAction
import com.phoneai.companion.actions.PhoneActionType

interface AndroidBridge {
    suspend fun request(action: PhoneAction): BridgeResult
}

sealed interface BridgeResult {
    val actionType: PhoneActionType?
    val message: String

    data class Accepted(
        override val actionType: PhoneActionType,
        override val message: String,
    ) : BridgeResult

    data class Rejected(
        override val actionType: PhoneActionType?,
        override val message: String,
    ) : BridgeResult
}