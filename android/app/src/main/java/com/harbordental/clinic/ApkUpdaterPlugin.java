package com.harbordental.clinic;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {
    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !isAllowed(url)) {
            call.reject("Update link was not recognized.");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent settingsIntent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName())
            );
            settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(settingsIntent);
            call.reject("INSTALL_PERMISSION");
            return;
        }

        HttpURLConnection connection = null;
        try {
            connection = open(url);
            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) {
                call.reject("Download failed (" + status + ").");
                return;
            }
            File apk = new File(getContext().getCacheDir(), "harbor-dental-update.apk");
            if (apk.exists() && !apk.delete()) {
                call.reject("Could not replace the previous download.");
                return;
            }
            try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(apk)) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    output.write(buffer, 0, read);
                }
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
            Intent install = new Intent(Intent.ACTION_VIEW);
            install.setDataAndType(uri, "application/vnd.android.package-archive");
            install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            if (getActivity() == null) {
                call.reject("The app is not in the foreground.");
                return;
            }
            getActivity().runOnUiThread(() -> getContext().startActivity(install));
            call.resolve();
        } catch (Exception error) {
            call.reject(error.getMessage() != null ? error.getMessage() : "Could not install the update.");
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private HttpURLConnection open(String startUrl) throws Exception {
        String current = startUrl;
        for (int hop = 0; hop < 5; hop++) {
            if (!isAllowed(current)) {
                throw new IllegalArgumentException("Update link was not recognized.");
            }
            HttpURLConnection connection = (HttpURLConnection) new URL(current).openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(20000);
            connection.setReadTimeout(120000);
            connection.setRequestProperty("Accept", "application/octet-stream");
            connection.setRequestProperty("User-Agent", "HarborDental");
            connection.connect();
            int status = connection.getResponseCode();
            if (status >= 300 && status < 400) {
                String location = connection.getHeaderField("Location");
                connection.disconnect();
                if (location == null || location.isEmpty()) {
                    throw new IllegalStateException("Download redirect was empty.");
                }
                current = new URL(new URL(current), location).toString();
                continue;
            }
            return connection;
        }
        throw new IllegalStateException("Too many download redirects.");
    }

    private boolean isAllowed(String url) {
        return url.startsWith("https://github.com/")
            || url.startsWith("https://release-assets.githubusercontent.com/")
            || url.startsWith("https://objects.githubusercontent.com/");
    }
}
