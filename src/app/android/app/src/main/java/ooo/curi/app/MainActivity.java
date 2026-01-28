package ooo.curi.app;

import android.view.ActionMode;
import android.view.Menu;
import android.view.MenuItem;
import android.content.SharedPreferences;
import android.app.Activity;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onActionModeStarted(ActionMode mode) {
        super.onActionModeStarted(mode);

        Menu menu = mode.getMenu();

        // Remove "Read aloud" to see if we can modify the menu and make room
        for (int i = 0; i < menu.size(); i++) {
            MenuItem item = menu.getItem(i);
            if (item.getTitle() != null && item.getTitle().toString().toLowerCase().contains("read aloud")) {
                menu.removeItem(item.getItemId());
                break;
            }
        }

        menu.add(0, 101, 0, "Explain")
                .setShowAsActionFlags(MenuItem.SHOW_AS_ACTION_ALWAYS)
                .setOnMenuItemClickListener(item -> {
                    this.getBridge()
                            .eval(
                                    "window.dispatchEvent(new CustomEvent('native-action-explain'))",
                                    null);
                    mode.finish();
                    return true;
                });

        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Activity.MODE_PRIVATE);
        String canHighlight = prefs.getString("canHighlight", "false");

        if ("true".equals(canHighlight)) {
            menu.add(0, 102, 0, "Highlight")
                    .setShowAsActionFlags(MenuItem.SHOW_AS_ACTION_ALWAYS)
                    .setOnMenuItemClickListener(item -> {
                        this.getBridge()
                                .eval(
                                        "window.dispatchEvent(new CustomEvent('native-action-highlight'))",
                                        null);
                        mode.finish();
                        return true;
                    });
        }

        // Force refresh of the floating menu
        mode.invalidate();
    }
}
