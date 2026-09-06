package com.smc.gecpalanpur;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;

    private WebView webView;
    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private View layoutNoInternet;
    private Button btnRetry;
    private FloatingActionButton fabScrollTop;

    private ValueCallback<Uri[]> filePathCallback;
    private Uri cameraPhotoUri;

    private boolean doubleBackToExitPressedOnce = false;
    private final Handler backPressHandler = new Handler(Looper.getMainLooper());

    private final ActivityResultLauncher<String> requestPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                // Permission callback handled
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Switch from Splash theme to main App theme
        setTheme(R.style.Theme_SMC);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initViews();
        setupWebView();
        setupListeners();
        setupBackNavigation();

        // Check network and load website
        loadWebsite();
    }

    private void initViews() {
        webView = findViewById(R.id.webView);
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        progressBar = findViewById(R.id.progressBar);
        layoutNoInternet = findViewById(R.id.layoutNoInternet);
        btnRetry = findViewById(R.id.btnRetry);
        fabScrollTop = findViewById(R.id.fabScrollTop);

        swipeRefreshLayout.setColorSchemeResources(
                R.color.primary,
                R.color.accent,
                R.color.primary_light
        );
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Security: Disallow mixed content over HTTPS
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
        }

        // Enable responsive hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Add JavaScript Interface for Excel/PDF Base64 File Downloads
        webView.addJavascriptInterface(new SMCAndroidBridge(), "AndroidBridge");

        // WebChromeClient for File Uploads, Camera, and Progress
        webView.setWebChromeClient(new SMCWebChromeClient());

        // WebViewClient for navigation and error handling
        webView.setWebViewClient(new SMCWebViewClient());

        // DownloadListener for standard URLs and data URIs
        webView.setDownloadListener(new SMCDownloadListener());

        // Scroll listener to disable pull-to-refresh while scrolled down & toggle Scroll-To-Top FAB
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            webView.setOnScrollChangeListener((v, scrollX, scrollY, oldScrollX, oldScrollY) -> {
                swipeRefreshLayout.setEnabled(scrollY == 0);
                if (scrollY > 300) {
                    if (fabScrollTop != null && fabScrollTop.getVisibility() != View.VISIBLE) {
                        fabScrollTop.show();
                    }
                } else {
                    if (fabScrollTop != null && fabScrollTop.getVisibility() == View.VISIBLE) {
                        fabScrollTop.hide();
                    }
                }
            });
        }
    }

    private void setupListeners() {
        swipeRefreshLayout.setOnRefreshListener(() -> {
            if (NetworkUtils.isNetworkAvailable(this)) {
                hideOfflineView();
                webView.reload();
            } else {
                swipeRefreshLayout.setRefreshing(false);
                showOfflineView();
            }
        });

        btnRetry.setOnClickListener(v -> {
            if (NetworkUtils.isNetworkAvailable(this)) {
                hideOfflineView();
                webView.reload();
            } else {
                Toast.makeText(this, R.string.no_internet_msg, Toast.LENGTH_SHORT).show();
            }
        });

        if (fabScrollTop != null) {
            fabScrollTop.setOnClickListener(v -> {
                webView.scrollTo(0, 0);
                webView.evaluateJavascript("window.scrollTo({ top: 0, behavior: 'smooth' });", null);
            });
        }
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    if (doubleBackToExitPressedOnce) {
                        setEnabled(false);
                        getOnBackPressedDispatcher().onBackPressed();
                        return;
                    }

                    doubleBackToExitPressedOnce = true;
                    Toast.makeText(MainActivity.this, R.string.press_back_again, Toast.LENGTH_SHORT).show();

                    backPressHandler.postDelayed(() -> doubleBackToExitPressedOnce = false, 2000);
                }
            }
        });
    }

    private void loadWebsite() {
        if (NetworkUtils.isNetworkAvailable(this)) {
            hideOfflineView();
            webView.loadUrl(AppConfig.PRODUCTION_URL);
        } else {
            showOfflineView();
        }
    }

    private void showOfflineView() {
        layoutNoInternet.setVisibility(View.VISIBLE);
        swipeRefreshLayout.setVisibility(View.GONE);
    }

    private void hideOfflineView() {
        layoutNoInternet.setVisibility(View.GONE);
        swipeRefreshLayout.setVisibility(View.VISIBLE);
    }

    // =========================================================================
    // JavaScript Interface for Native File Saving (Excel / Reports)
    // =========================================================================
    private class SMCAndroidBridge {
        @JavascriptInterface
        public void saveBase64File(String base64Data, String filename, String mimeType) {
            runOnUiThread(() -> {
                try {
                    byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
                    File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (!downloadsDir.exists()) {
                        downloadsDir.mkdirs();
                    }

                    String actualName = (filename != null && !filename.trim().isEmpty()) ? filename.trim() : ("SMC_Report_" + System.currentTimeMillis() + ".xlsx");
                    File file = new File(downloadsDir, actualName);

                    FileOutputStream fos = new FileOutputStream(file);
                    fos.write(decodedBytes);
                    fos.flush();
                    fos.close();

                    String typeLabel = (mimeType != null && mimeType.contains("pdf")) ? "PDF" : "File";
                    Toast.makeText(MainActivity.this, typeLabel + " downloaded: " + file.getName(), Toast.LENGTH_LONG).show();

                    // Open file chooser or viewer app
                    try {
                        Uri fileUri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", file);
                        Intent openIntent = new Intent(Intent.ACTION_VIEW);
                        openIntent.setDataAndType(fileUri, mimeType != null ? mimeType : "*/*");
                        openIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        startActivity(Intent.createChooser(openIntent, "Open " + typeLabel + " with..."));
                    } catch (Exception ignored) {}

                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Save error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    // =========================================================================
    // WebChromeClient: Progress & File Chooser (Camera + Gallery + Documents)
    // =========================================================================
    private class SMCWebChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            if (newProgress < 100) {
                progressBar.setVisibility(View.VISIBLE);
                progressBar.setProgress(newProgress);
            } else {
                progressBar.setVisibility(View.GONE);
                swipeRefreshLayout.setRefreshing(false);
            }
        }

        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                         FileChooserParams fileChooserParams) {
            if (MainActivity.this.filePathCallback != null) {
                MainActivity.this.filePathCallback.onReceiveValue(null);
            }
            MainActivity.this.filePathCallback = filePathCallback;

            // Camera capture intent
            Intent takePictureIntent = null;
            if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                    == PackageManager.PERMISSION_GRANTED) {
                takePictureIntent = createCameraIntent();
            } else {
                requestPermissionLauncher.launch(Manifest.permission.CAMERA);
            }

            // File selection intent (Images, PDFs, Documents)
            Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
            contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
            contentSelectionIntent.setType("*/*");
            String[] mimetypes = {"image/*", "application/pdf"};
            contentSelectionIntent.putExtra(Intent.EXTRA_MIME_TYPES, mimetypes);

            Intent[] intentArray;
            if (takePictureIntent != null) {
                intentArray = new Intent[]{takePictureIntent};
            } else {
                intentArray = new Intent[0];
            }

            Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
            chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
            chooserIntent.putExtra(Intent.EXTRA_TITLE, "Select Bill / Document");
            chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

            startActivityForResult(chooserIntent, FILE_CHOOSER_REQUEST_CODE);
            return true;
        }
    }

    private Intent createCameraIntent() {
        Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        File photoFile = null;
        try {
            photoFile = createImageFile();
        } catch (IOException ex) {
            // Error creating file
        }

        if (photoFile != null) {
            cameraPhotoUri = FileProvider.getUriForFile(
                    this,
                    getPackageName() + ".fileprovider",
                    photoFile
            );
            takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri);
            return takePictureIntent;
        }
        return null;
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "SMC_BILL_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        return File.createTempFile(imageFileName, ".jpg", storageDir);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (filePathCallback == null) {
                super.onActivityResult(requestCode, resultCode, data);
                return;
            }

            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK) {
                if (data == null || data.getData() == null) {
                    // Photo captured via camera
                    if (cameraPhotoUri != null) {
                        results = new Uri[]{cameraPhotoUri};
                    }
                } else {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
            }

            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    // =========================================================================
    // WebViewClient: In-App Navigation & Error Handling
    // =========================================================================
    private class SMCWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            return handleUrl(view, url);
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleUrl(view, url);
        }

        private boolean handleUrl(WebView view, String url) {
            if (url == null) return false;

            // Internal SMC app navigation
            if (AppConfig.isInternalUrl(url)) {
                return false; // Let WebView handle it internally
            }

            // Standard intent schemas (tel:, mailto:, whatsapp:, etc.)
            if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:") || url.startsWith("sms:")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return true;
                }
            }

            // Genuine external links open in system browser
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(browserIntent);
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            hideOfflineView();
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            swipeRefreshLayout.setRefreshing(false);
            progressBar.setVisibility(View.GONE);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request.isForMainFrame()) {
                showOfflineView();
            }
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            super.onReceivedError(view, errorCode, description, failingUrl);
            showOfflineView();
        }
    }

    // =========================================================================
    // DownloadListener: Handles File & PDF Downloads from the Portal
    // =========================================================================
    private class SMCDownloadListener implements DownloadListener {
        @Override
        public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                     String mimeType, long contentLength) {
            // Handle base64 Data URLs (PDF receipts, reports generated client-side)
            if (url.startsWith("data:")) {
                handleDataUrlDownload(url, mimeType);
                return;
            }

            if (url.startsWith("blob:")) {
                Toast.makeText(MainActivity.this, "Processing download...", Toast.LENGTH_SHORT).show();
                return;
            }

            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType(mimeType);
                String cookies = CookieManager.getInstance().getCookie(url);
                request.addRequestHeader("cookie", cookies);
                request.addRequestHeader("User-Agent", userAgent);
                request.setDescription("Downloading file from SMC Portal...");
                request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType));
                request.allowScanningByMediaScanner();
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(
                        Environment.DIRECTORY_DOWNLOADS,
                        URLUtil.guessFileName(url, contentDisposition, mimeType)
                );

                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                if (dm != null) {
                    dm.enqueue(request);
                    Toast.makeText(MainActivity.this, "Downloading file...", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(MainActivity.this, "Download failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void handleDataUrlDownload(String dataUrl, String mimeType) {
        try {
            String[] parts = dataUrl.split(",");
            if (parts.length < 2) return;

            byte[] decodedBytes = Base64.decode(parts[1], Base64.DEFAULT);
            String extension = mimeType != null && mimeType.contains("pdf") ? ".pdf" : mimeType != null && (mimeType.contains("sheet") || mimeType.contains("excel")) ? ".xlsx" : ".png";
            String filename = "SMC_Export_" + System.currentTimeMillis() + extension;

            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File file = new File(downloadsDir, filename);

            FileOutputStream fos = new FileOutputStream(file);
            fos.write(decodedBytes);
            fos.close();

            Toast.makeText(this, "Saved to Downloads: " + filename, Toast.LENGTH_LONG).show();
        } catch (Exception e) {
            Toast.makeText(this, "Save error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onRestoreInstanceState(@NonNull Bundle savedInstanceState) {
        super.onRestoreInstanceState(savedInstanceState);
        webView.restoreState(savedInstanceState);
    }
}