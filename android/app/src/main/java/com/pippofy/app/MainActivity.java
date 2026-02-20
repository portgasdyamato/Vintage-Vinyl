package com.pippofy.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.media.AudioManager;
import android.content.Context;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Request Audio Focus natively to trick Android into seeing us as a Music App
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
            audioManager.requestAudioFocus(focusRequest -> {}, 
                AudioManager.STREAM_MUSIC, 
                AudioManager.AUDIOFOCUS_GAIN);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        // Force the WebView to allow background media
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
        }
    }
}
