#include "ui.h"
#include "lvgl.h"
#include <string.h>

static lv_obj_t* s_label_state;
static lv_obj_t* s_label_batt;
static lv_obj_t* s_arc;
static lv_obj_t* s_arc_acc;
static lv_obj_t* s_chart;
static lv_chart_series_t* s_ser;
static lv_obj_t* s_heat;
static lv_obj_t* s_heat_cells[32];
static lv_obj_t* s_label_temp;
static lv_obj_t* s_label_stab;
static lv_obj_t* s_label_inten;
static lv_obj_t* s_home;
static lv_obj_t* s_settings;
static lv_obj_t* s_about;
static lv_obj_t* s_boot;
static lv_obj_t* s_shutdown;
static lv_obj_t* s_topbar;
static void (*on_scan_start)(void);
static void (*on_back)(void);
static void (*on_shutdown_cb)(void);
static void (*on_toggle_silent_cb)(bool v);
static void (*on_select_mode_cb)(int m);
static bool s_silent;

static void cb_scan(lv_event_t* e) { if (on_scan_start) on_scan_start(); }
static void cb_back(lv_event_t* e) { if (on_back) on_back(); }
static void cb_shutdown(lv_event_t* e) { if (on_shutdown_cb) on_shutdown_cb(); }
static void cb_silent(lv_event_t* e) { bool st = lv_obj_has_state(lv_event_get_target(e), LV_STATE_CHECKED); s_silent = st; if (on_toggle_silent_cb) on_toggle_silent_cb(st); }
static void cb_mode(lv_event_t* e) { int id = lv_dropdown_get_selected(lv_event_get_target(e)); if (on_select_mode_cb) on_select_mode_cb(id); }

static lv_obj_t* make_icon_btn(lv_obj_t* parent, const char* txt) {
    lv_obj_t* b = lv_btn_create(parent);
    lv_obj_set_size(b, 64, 64);
    lv_obj_set_style_radius(b, 32, 0);
    lv_obj_set_style_bg_color(b, lv_color_hex(0x0B1A14), 0);
    lv_obj_set_style_border_color(b, lv_color_hex(0x00FF8C), 0);
    lv_obj_set_style_border_opa(b, LV_OPA_30, 0);
    lv_obj_t* l = lv_label_create(b);
    lv_label_set_text(l, txt);
    lv_obj_center(l);
    return b;
}

static void nav_settings(lv_event_t* e) {
    (void)e;
    lv_obj_add_flag(s_home, LV_OBJ_FLAG_HIDDEN);
    lv_obj_clear_flag(s_settings, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_about, LV_OBJ_FLAG_HIDDEN);
}

static void nav_about(lv_event_t* e) {
    (void)e;
    lv_obj_add_flag(s_home, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_settings, LV_OBJ_FLAG_HIDDEN);
    lv_obj_clear_flag(s_about, LV_OBJ_FLAG_HIDDEN);
}

void ui_create(void) {
    lv_obj_t* scr = lv_scr_act();
    lv_obj_set_style_bg_color(scr, lv_color_hex(0x0A0F12), 0);
    lv_obj_set_style_bg_grad_color(scr, lv_color_hex(0x09131A), 0);
    lv_obj_set_style_bg_grad_dir(scr, LV_GRAD_DIR_VER, 0);
    s_topbar = lv_obj_create(scr);
    lv_obj_remove_style_all(s_topbar);
    lv_obj_set_size(s_topbar, lv_pct(100), 48);
    lv_obj_align(s_topbar, LV_ALIGN_TOP_MID, 0, 0);
    s_label_state = lv_label_create(s_topbar);
    lv_obj_align(s_label_state, LV_ALIGN_LEFT_MID, 12, 0);
    s_label_batt = lv_label_create(s_topbar);
    lv_obj_align(s_label_batt, LV_ALIGN_RIGHT_MID, -12, 0);
    s_arc = lv_arc_create(scr);
    lv_obj_set_size(s_arc, 180, 180);
    lv_arc_set_bg_angles(s_arc, 0, 360);
    lv_arc_set_rotation(s_arc, 270);
    lv_obj_align(s_arc, LV_ALIGN_LEFT_MID, 40, -20);
    lv_obj_set_style_arc_width(s_arc, 18, LV_PART_MAIN);
    lv_obj_set_style_arc_color(s_arc, lv_color_hex(0x223344), LV_PART_MAIN);
    lv_obj_set_style_arc_width(s_arc, 18, LV_PART_INDICATOR);
    lv_obj_set_style_arc_color(s_arc, lv_color_hex(0x00FF88), LV_PART_INDICATOR);
    s_arc_acc = lv_arc_create(scr);
    lv_obj_set_size(s_arc_acc, 180, 180);
    lv_arc_set_bg_angles(s_arc_acc, 0, 360);
    lv_arc_set_rotation(s_arc_acc, 270);
    lv_obj_align_to(s_arc_acc, s_arc, LV_ALIGN_OUT_RIGHT_MID, 0, 0);
    lv_obj_add_flag(s_arc_acc, LV_OBJ_FLAG_OVERFLOW_VISIBLE);
    lv_obj_set_style_arc_width(s_arc_acc, 18, LV_PART_INDICATOR);
    lv_obj_set_style_arc_color(s_arc_acc, lv_color_hex(0x335577), LV_PART_INDICATOR);
    lv_obj_add_flag(s_arc_acc, LV_OBJ_FLAG_HIDDEN);
    lv_obj_t* label = lv_label_create(scr);
    lv_label_set_text(label, "0%");
    lv_obj_align_to(label, s_arc, LV_ALIGN_CENTER, 0, 0);
    s_chart = lv_chart_create(scr);
    lv_obj_set_size(s_chart, 300, 120);
    lv_obj_align(s_chart, LV_ALIGN_TOP_RIGHT, -20, 56);
    lv_chart_set_type(s_chart, LV_CHART_TYPE_LINE);
    lv_chart_set_range(s_chart, LV_CHART_AXIS_PRIMARY_Y, -100, 100);
    lv_chart_set_point_count(s_chart, 120);
    s_ser = lv_chart_add_series(s_chart, lv_color_hex(0x00FF88), LV_CHART_AXIS_PRIMARY_Y);
    s_heat = lv_obj_create(scr);
    lv_obj_set_size(s_heat, 420, 90);
    lv_obj_align(s_heat, LV_ALIGN_BOTTOM_LEFT, 20, -20);
    lv_obj_set_style_radius(s_heat, 12, 0);
    lv_obj_set_style_bg_color(s_heat, lv_color_hex(0x0A0F12), 0);
    lv_obj_set_style_bg_grad_color(s_heat, lv_color_hex(0x09131A), 0);
    lv_obj_set_style_bg_grad_dir(s_heat, LV_GRAD_DIR_VER, 0);
    lv_obj_set_style_border_color(s_heat, lv_color_hex(0x00FF8C), 0);
    lv_obj_set_style_border_opa(s_heat, LV_OPA_20, 0);
    int w = 12;
    for (int i = 0; i < 32; i++) {
        lv_obj_t* cell = lv_obj_create(s_heat);
        s_heat_cells[i] = cell;
        lv_obj_set_size(cell, w, 70);
        lv_obj_align(cell, LV_ALIGN_LEFT_MID, 8 + i * (w + 2), 0);
        lv_obj_set_style_radius(cell, 6, 0);
        lv_obj_set_style_bg_color(cell, lv_color_hex(0x00331C), 0);
        lv_obj_set_style_border_opa(cell, LV_OPA_0, 0);
    }
    lv_label_set_text_fmt(label, "%d%%", 0);
    s_label_temp = lv_label_create(scr);
    lv_obj_align(s_label_temp, LV_ALIGN_BOTTOM_RIGHT, -20, -16);
    s_label_stab = lv_label_create(scr);
    lv_obj_align_to(s_label_stab, s_label_temp, LV_ALIGN_OUT_TOP_RIGHT, 0, -8);
    s_label_inten = lv_label_create(scr);
    lv_obj_align_to(s_label_inten, s_label_stab, LV_ALIGN_OUT_TOP_RIGHT, 0, -8);
    s_home = lv_obj_create(scr);
    lv_obj_center(s_home);
    lv_obj_set_size(s_home, 280, 360);
    lv_obj_set_style_radius(s_home, 14, 0);
    lv_obj_set_style_bg_color(s_home, lv_color_hex(0x0A0F12), 0);
    lv_obj_set_style_bg_grad_color(s_home, lv_color_hex(0x09131A), 0);
    lv_obj_set_style_bg_grad_dir(s_home, LV_GRAD_DIR_VER, 0);
    lv_obj_set_style_border_color(s_home, lv_color_hex(0x00FF8C), 0);
    lv_obj_set_style_border_opa(s_home, LV_OPA_20, 0);
    lv_obj_add_flag(s_home, LV_OBJ_FLAG_HIDDEN);
    lv_obj_t* logo = lv_label_create(s_home);
    lv_label_set_text(logo, "RescueLiveAI");
    lv_obj_align(logo, LV_ALIGN_TOP_MID, 0, 20);
    lv_obj_t* btn_scan = lv_btn_create(s_home);
    lv_obj_align(btn_scan, LV_ALIGN_CENTER, 0, -20);
    lv_obj_t* l1 = lv_label_create(btn_scan);
    lv_label_set_text(l1, "Scan");
    lv_obj_center(l1);
    lv_obj_t* btn_settings = lv_btn_create(s_home);
    lv_obj_align(btn_settings, LV_ALIGN_CENTER, 0, 40);
    lv_obj_t* l2 = lv_label_create(btn_settings);
    lv_label_set_text(l2, "Settings");
    lv_obj_center(l2);
    lv_obj_t* btn_about = lv_btn_create(s_home);
    lv_obj_align(btn_about, LV_ALIGN_CENTER, 0, 100);
    lv_obj_t* l3 = lv_label_create(btn_about);
    lv_label_set_text(l3, "About");
    lv_obj_center(l3);
    s_settings = lv_obj_create(scr);
    lv_obj_set_size(s_settings, 280, 360);
    lv_obj_center(s_settings);
    lv_obj_set_style_radius(s_settings, 14, 0);
    lv_obj_set_style_bg_color(s_settings, lv_color_hex(0x0A0F12), 0);
    lv_obj_set_style_bg_grad_color(s_settings, lv_color_hex(0x09131A), 0);
    lv_obj_set_style_bg_grad_dir(s_settings, LV_GRAD_DIR_VER, 0);
    lv_obj_set_style_border_color(s_settings, lv_color_hex(0x00FF8C), 0);
    lv_obj_set_style_border_opa(s_settings, LV_OPA_20, 0);
    lv_obj_add_flag(s_settings, LV_OBJ_FLAG_HIDDEN);
    lv_obj_t* sw_silent = lv_switch_create(s_settings);
    lv_obj_align(sw_silent, LV_ALIGN_TOP_MID, 0, 40);
    lv_obj_t* lbl_silent = lv_label_create(s_settings);
    lv_label_set_text(lbl_silent, "Silent");
    lv_obj_align_to(lbl_silent, sw_silent, LV_ALIGN_OUT_BOTTOM_MID, 0, 8);
    lv_obj_t* dd = lv_dropdown_create(s_settings);
    lv_dropdown_set_options(dd, "Rapid\nDeep");
    lv_obj_align(dd, LV_ALIGN_CENTER, 0, 0);
    lv_obj_t* btn_back1 = make_icon_btn(s_settings, LV_SYMBOL_LEFT);
    lv_obj_align(btn_back1, LV_ALIGN_BOTTOM_MID, 0, -20);
    lv_obj_add_event_cb(btn_scan, cb_scan, LV_EVENT_CLICKED, NULL);
    lv_obj_add_event_cb(btn_settings, nav_settings, LV_EVENT_CLICKED, NULL);
    lv_obj_add_event_cb(btn_about, nav_about, LV_EVENT_CLICKED, NULL);
    lv_obj_add_event_cb(btn_back1, cb_back, LV_EVENT_CLICKED, NULL);
    lv_obj_add_event_cb(sw_silent, cb_silent, LV_EVENT_VALUE_CHANGED, NULL);
    lv_obj_add_event_cb(dd, cb_mode, LV_EVENT_VALUE_CHANGED, NULL);
    s_about = lv_obj_create(scr);
    lv_obj_set_size(s_about, 280, 360);
    lv_obj_center(s_about);
    lv_obj_set_style_radius(s_about, 14, 0);
    lv_obj_set_style_bg_color(s_about, lv_color_hex(0x0A0F12), 0);
    lv_obj_set_style_bg_grad_color(s_about, lv_color_hex(0x09131A), 0);
    lv_obj_set_style_bg_grad_dir(s_about, LV_GRAD_DIR_VER, 0);
    lv_obj_set_style_border_color(s_about, lv_color_hex(0x00FF8C), 0);
    lv_obj_set_style_border_opa(s_about, LV_OPA_20, 0);
    lv_obj_add_flag(s_about, LV_OBJ_FLAG_HIDDEN);
    lv_obj_t* t = lv_label_create(s_about);
    lv_label_set_text(t, "RescueLiveAI\nUART Compatible\nESP32 Ready\nHLK-LD2410S Compatible\nPowered by Pathway");
    lv_obj_align(t, LV_ALIGN_TOP_MID, 0, 20);
    lv_obj_t* btn_back2 = make_icon_btn(s_about, LV_SYMBOL_LEFT);
    lv_obj_align(btn_back2, LV_ALIGN_BOTTOM_MID, 0, -20);
    lv_obj_add_event_cb(btn_back2, cb_back, LV_EVENT_CLICKED, NULL);
    s_boot = lv_obj_create(scr);
    lv_obj_remove_style_all(s_boot);
    lv_obj_set_size(s_boot, lv_pct(100), lv_pct(100));
    lv_obj_t* spin = lv_spinner_create(s_boot, 1000, 60);
    lv_obj_set_size(spin, 80, 80);
    lv_obj_center(spin);
    s_shutdown = lv_obj_create(scr);
    lv_obj_remove_style_all(s_shutdown);
    lv_obj_set_size(s_shutdown, lv_pct(100), lv_pct(100));
    lv_obj_add_flag(s_shutdown, LV_OBJ_FLAG_HIDDEN);
    lv_obj_t* shut = lv_spinner_create(s_shutdown, 800, 40);
    lv_obj_set_size(shut, 60, 60);
    lv_obj_center(shut);
}

void ui_update_conf(int conf, int acc) {
    lv_arc_set_value(s_arc, conf);
    if (acc >= 0) {
        lv_obj_clear_flag(s_arc_acc, LV_OBJ_FLAG_HIDDEN);
        lv_arc_set_value(s_arc_acc, acc);
    }
}

void ui_push_wave(float v) {
    int iv = (int)(v * 100);
    lv_chart_set_next_value(s_chart, s_ser, iv);
}

void ui_update_heat(int idx, int intensity) {
    if (idx < 0 || idx >= 32) return;
    int alpha = intensity;
    if (alpha < 20) alpha = 20;
    if (alpha > 100) alpha = 100;
    lv_color_t c = lv_color_make(0, 255, 140);
    lv_obj_set_style_bg_color(s_heat_cells[idx], c, 0);
    lv_obj_set_style_bg_opa(s_heat_cells[idx], alpha * 2, 0);
}

void ui_set_state_label(const char* s) {
    lv_label_set_text(s_label_state, s);
}

void ui_set_battery(int pct) {
    lv_label_set_text_fmt(s_label_batt, "BAT %d%%", pct);
}

void ui_update_env(float temp_c, float stability, float intensity) {
    lv_label_set_text_fmt(s_label_temp, "%.1f°C", temp_c);
    lv_label_set_text_fmt(s_label_stab, "%.2f", stability);
    lv_label_set_text_fmt(s_label_inten, "%.2f", intensity);
}

void ui_show_boot(void) {
    lv_obj_clear_flag(s_boot, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_home, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_settings, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_about, LV_OBJ_FLAG_HIDDEN);
}

void ui_show_home(void) {
    lv_obj_add_flag(s_boot, LV_OBJ_FLAG_HIDDEN);
    lv_obj_clear_flag(s_home, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_settings, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_about, LV_OBJ_FLAG_HIDDEN);
}

void ui_show_scan(void) {
    lv_obj_add_flag(s_boot, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_home, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_settings, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_about, LV_OBJ_FLAG_HIDDEN);
    lv_obj_clear_flag(s_topbar, LV_OBJ_FLAG_HIDDEN);
}

void ui_show_settings(void) {
    lv_obj_add_flag(s_boot, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_home, LV_OBJ_FLAG_HIDDEN);
    lv_obj_clear_flag(s_settings, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_about, LV_OBJ_FLAG_HIDDEN);
}

void ui_show_about(void) {
    lv_obj_add_flag(s_boot, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_home, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_settings, LV_OBJ_FLAG_HIDDEN);
    lv_obj_clear_flag(s_about, LV_OBJ_FLAG_HIDDEN);
}

void ui_show_shutdown(void) {
    lv_obj_add_flag(s_boot, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_home, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_settings, LV_OBJ_FLAG_HIDDEN);
    lv_obj_add_flag(s_about, LV_OBJ_FLAG_HIDDEN);
    lv_obj_clear_flag(s_shutdown, LV_OBJ_FLAG_HIDDEN);
}

void ui_bind_on_scan_start(void (*cb)(void)) { on_scan_start = cb; }
void ui_bind_on_back(void (*cb)(void)) { on_back = cb; }
void ui_bind_on_shutdown(void (*cb)(void)) { on_shutdown_cb = cb; }
void ui_bind_on_toggle_silent(void (*cb)(bool v)) { on_toggle_silent_cb = cb; }
void ui_bind_on_select_mode(void (*cb)(int)) { on_select_mode_cb = cb; }
