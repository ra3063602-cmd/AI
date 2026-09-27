package com.phoneai.companion.bridge

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.phoneai.companion.actions.PhoneActionJsonCodec
import com.phoneai.companion.actions.PhoneActionType
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch

data class NativeActionResult(
    val requestId: String,
    val actionType: PhoneActionType?,
    val result: BridgeResult,
)

class PhoneAiActionViewModel(
    private val bridge: AndroidBridge,
) : ViewModel() {
    private val _results = MutableSharedFlow<NativeActionResult>(extraBufferCapacity = 16)
    val results: SharedFlow<NativeActionResult> = _results.asSharedFlow()

    fun requestAction(requestId: String, rawAction: String) {
        viewModelScope.launch {
            val result = PhoneActionJsonCodec.decode(rawAction)
                .fold(
                    onSuccess = { action -> bridge.request(action) },
                    onFailure = {
                        BridgeResult.Rejected(
                            actionType = null,
                            message = "The action JSON was rejected.",
                        )
                    },
                )

            _results.emit(
                NativeActionResult(
                    requestId = requestId.take(100),
                    actionType = result.actionType,
                    result = result,
                ),
            )
        }
    }
}