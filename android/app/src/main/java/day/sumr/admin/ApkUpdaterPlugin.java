package day.sumr.admin;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
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
        String urlStr = call.getString("url");
        if (urlStr == null || urlStr.isEmpty()) {
            call.reject("URL APK tidak valid.");
            return;
        }

        Context ctx = getContext();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !ctx.getPackageManager().canRequestPackageInstalls()) {
            Intent permIntent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + ctx.getPackageName())
            );
            permIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(permIntent);

            JSObject ret = new JSObject();
            ret.put("status", "permission_required");
            call.resolve(ret);
            return;
        }

        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                String currentUrl = urlStr;
                for (int i = 0; i < 6; i++) {
                    URL url = new URL(currentUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setInstanceFollowRedirects(false);
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(30000);
                    conn.connect();

                    int code = conn.getResponseCode();
                    if (code == HttpURLConnection.HTTP_MOVED_TEMP || code == HttpURLConnection.HTTP_MOVED_PERM || code == 307 || code == 308) {
                        String next = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (next == null) break;
                        currentUrl = next;
                    } else {
                        break;
                    }
                }

                if (conn == null || conn.getResponseCode() < 200 || conn.getResponseCode() >= 300) {
                    call.reject("Gagal mengunduh APK (HTTP " + (conn != null ? conn.getResponseCode() : 0) + ")");
                    return;
                }

                int totalBytes = conn.getContentLength();
                File outFile = new File(ctx.getCacheDir(), "update.apk");
                if (outFile.exists()) outFile.delete();

                try (InputStream in = conn.getInputStream(); FileOutputStream out = new FileOutputStream(outFile)) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    long downloaded = 0;
                    int lastPct = -1;

                    while ((bytesRead = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                        downloaded += bytesRead;
                        if (totalBytes > 0) {
                            int pct = (int) ((downloaded * 100L) / totalBytes);
                            if (pct != lastPct && (pct % 5 == 0 || pct == 100)) {
                                lastPct = pct;
                                JSObject prog = new JSObject();
                                prog.put("progress", pct);
                                notifyListeners("downloadProgress", prog);
                            }
                        }
                    }
                }

                Uri apkUri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", outFile);
                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(installIntent);

                JSObject ret = new JSObject();
                ret.put("status", "installing");
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("Gagal mengunduh/install APK: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        }).start();
    }
}
