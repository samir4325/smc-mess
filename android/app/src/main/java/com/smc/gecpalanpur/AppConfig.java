package com.smc.gecpalanpur;

public class AppConfig {
    /**
     * The primary production Vercel URL for the SMC Management Portal.
     * Connected to the same Firebase Realtime Database and live data.
     */
    public static final String PRODUCTION_URL = "https://smc-mess.vercel.app";

    /**
     * Fallback URL in case custom domain or alternate host is configured.
     */
    public static final String FALLBACK_URL = "https://smc-mess.vercel.app";

    /**
     * Whitelisted hosts that should always be loaded inside the internal WebView.
     * Prevents external browser from popping up unexpectedly.
     */
    public static final String[] WHITELISTED_HOSTS = new String[] {
        "vercel.app",
        "firebaseio.com",
        "googleapis.com",
        "google.com",
        "script.google.com",
        "script.googleusercontent.com"
    };

    /**
     * Checks if a given URL should be handled internally inside the app's WebView.
     */
    public static boolean isInternalUrl(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        
        // Handle data, blob, and file URLs internally
        if (lower.startsWith("data:") || lower.startsWith("blob:") || lower.startsWith("file:")) {
            return true;
        }

        // Check whitelist
        for (String host : WHITELISTED_HOSTS) {
            if (lower.contains(host)) {
                return true;
            }
        }
        return false;
    }
}
