# Capacitor / Cordova
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }
-dontwarn com.getcapacitor.**
-dontwarn org.apache.cordova.**

-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin *;
}

# Capgo Native Purchases
-keep class ee.forgr.nativepurchases.** { *; }
-dontwarn ee.forgr.nativepurchases.**

# WebView JS bridges
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
