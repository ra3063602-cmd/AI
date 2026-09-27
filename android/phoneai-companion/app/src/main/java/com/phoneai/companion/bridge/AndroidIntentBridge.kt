package com.phoneai.companion.bridge

import android.app.SearchManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import com.phoneai.companion.actions.PhoneAction
import com.phoneai.companion.actions.PhoneActionValidator
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.text.DateFormat
import java.util.Date
import java.util.Locale

class AndroidIntentBridge(
    private val context: Context,
    private val launchGallery: (Intent) -> Unit,
) : AndroidBridge {
    override suspend fun request(action: PhoneAction): BridgeResult =
        withContext(Dispatchers.Main.immediate) {
            runCatching {
                PhoneActionValidator.requireValid(action)
                when (action) {
                    is PhoneAction.OpenUrl -> openUrl(action)
                    is PhoneAction.SearchWeb -> searchWeb(action)
                    is PhoneAction.OpenGallery -> openGallery(action)
                    is PhoneAction.ShowDate -> showDate(action)
                    is PhoneAction.ShowTime -> showTime(action)
                }
            }.getOrElse { error ->
                BridgeResult.Rejected(
                    actionType = action.type,
                    message = error.message ?: "The action was rejected.",
                )
            }
        }

    private fun openUrl(action: PhoneAction.OpenUrl): BridgeResult {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(action.parameters.url))
        return startActivity(intent, action.type, "Opening the requested website.")
    }

    private fun searchWeb(action: PhoneAction.SearchWeb): BridgeResult {
        val intent = Intent(Intent.ACTION_WEB_SEARCH).apply {
            putExtra(SearchManager.QUERY, action.parameters.query)
        }
        return startActivity(intent, action.type, "Opening web search.")
    }

    private fun openGallery(action: PhoneAction.OpenGallery): BridgeResult {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "image/*"
        }
        return try {
            launchGallery(intent)
            BridgeResult.Accepted(action.type, "Opening the Android image picker.")
        } catch (error: ActivityNotFoundException) {
            BridgeResult.Rejected(action.type, "No Android image picker is available.")
        }
    }

    private fun showDate(action: PhoneAction.ShowDate): BridgeResult {
        val date = DateFormat.getDateInstance(DateFormat.FULL, Locale.getDefault())
            .format(Date())
        Toast.makeText(context, "Today's date is $date.", Toast.LENGTH_LONG).show()
        return BridgeResult.Accepted(action.type, "Displayed today's date.")
    }

    private fun showTime(action: PhoneAction.ShowTime): BridgeResult {
        val time = DateFormat.getTimeInstance(DateFormat.SHORT, Locale.getDefault())
            .format(Date())
        Toast.makeText(context, "The current time is $time.", Toast.LENGTH_LONG).show()
        return BridgeResult.Accepted(action.type, "Displayed the current time.")
    }

    private fun startActivity(
        intent: Intent,
        actionType: com.phoneai.companion.actions.PhoneActionType,
        successMessage: String,
    ): BridgeResult {
        if (intent.resolveActivity(context.packageManager) == null) {
            return BridgeResult.Rejected(actionType, "No Android app can handle this action.")
        }

        context.startActivity(intent)
        return BridgeResult.Accepted(actionType, successMessage)
    }
}