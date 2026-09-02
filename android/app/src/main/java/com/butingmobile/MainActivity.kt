package com.butingmobile

import android.os.Bundle
import android.view.View
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "BUTingMobile"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    // react-native-screens: ScreenStackFragment는 saved state 복원 시 크래시
    // https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
    super.onCreate(null)
    applyImePaddingToRoot()
  }

  /** Android 15+ edge-to-edge 환경에서 IME(키보드) inset을 루트에 반영 */
  private fun applyImePaddingToRoot() {
    val content = findViewById<View>(android.R.id.content) ?: return
    ViewCompat.setOnApplyWindowInsetsListener(content) { view, windowInsets ->
      val imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime())
      view.setPadding(
        view.paddingLeft,
        view.paddingTop,
        view.paddingRight,
        imeInsets.bottom,
      )
      windowInsets
    }
    ViewCompat.requestApplyInsets(content)
  }
}
