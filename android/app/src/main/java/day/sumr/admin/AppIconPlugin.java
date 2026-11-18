package day.sumr.admin;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.LinkedHashMap;
import java.util.Map;

@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {

    private static final String NAMESPACE = "day.sumr.admin";
    private static final Map<String, String> ALIASES = new LinkedHashMap<>();

    static {
        ALIASES.put("default", NAMESPACE + ".MainActivity");
        ALIASES.put("dark", NAMESPACE + ".IconDarkAlias");
        ALIASES.put("sunset", NAMESPACE + ".IconSunsetAlias");
        ALIASES.put("light", NAMESPACE + ".IconLightAlias");
    }

    @PluginMethod
    public void getIcon(PluginCall call) {
        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        String pkg = ctx.getPackageName();
        String active = "default";

        for (Map.Entry<String, String> entry : ALIASES.entrySet()) {
            int state = pm.getComponentEnabledSetting(new ComponentName(pkg, entry.getValue()));
            if (state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                active = entry.getKey();
                break;
            }
        }

        JSObject ret = new JSObject();
        ret.put("alias", active);
        call.resolve(ret);
    }

    @PluginMethod
    public void setIcon(PluginCall call) {
        String alias = call.getString("alias", "default");
        if (!ALIASES.containsKey(alias)) {
            call.reject("Icon alias tidak dikenal: " + alias);
            return;
        }

        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        String pkg = ctx.getPackageName();

        for (Map.Entry<String, String> entry : ALIASES.entrySet()) {
            ComponentName cn = new ComponentName(pkg, entry.getValue());
            int newState = entry.getKey().equals(alias)
                ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;

            pm.setComponentEnabledSetting(cn, newState, PackageManager.DONT_KILL_APP);
        }

        JSObject ret = new JSObject();
        ret.put("alias", alias);
        call.resolve(ret);
    }
}
