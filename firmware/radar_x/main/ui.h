#ifndef UI_H
#define UI_H
#include <stdbool.h>
typedef enum { UI_BOOT, UI_HOME, UI_SCAN, UI_SETTINGS, UI_ABOUT, UI_SHUTDOWN } ui_screen_t;
void ui_create(void);
void ui_show_boot(void);
void ui_show_home(void);
void ui_show_scan(void);
void ui_show_settings(void);
void ui_show_about(void);
void ui_show_shutdown(void);
void ui_update_conf(int conf, int acc);
void ui_push_wave(float v);
void ui_update_heat(int idx, int intensity);
void ui_set_state_label(const char* s);
void ui_set_battery(int pct);
void ui_update_env(float temp_c, float stability, float intensity);
void ui_bind_on_scan_start(void (*cb)(void));
void ui_bind_on_back(void (*cb)(void));
void ui_bind_on_shutdown(void (*cb)(void));
void ui_bind_on_toggle_silent(void (*cb)(bool));
void ui_bind_on_select_mode(void (*cb)(int));
#endif
