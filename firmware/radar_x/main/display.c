#include "display.h"
#include "lvgl.h"
#include "driver/spi_master.h"
#include "driver/gpio.h"
#include "esp_lcd_panel_io.h"
#include "esp_lcd_panel_vendor.h"
#include "esp_lcd_panel_ops.h"
#include "esp_timer.h"

#define LCD_HRES 320
#define LCD_VRES 480
#define PIN_NUM_MOSI 23
#define PIN_NUM_MISO 19
#define PIN_NUM_CLK 18
#define PIN_NUM_CS 5
#define PIN_NUM_DC 2
#define PIN_NUM_RST 4
#define PIN_NUM_BL 27

static esp_lcd_panel_handle_t s_panel;
static lv_disp_draw_buf_t s_draw_buf;
static lv_color_t* s_buf1;
static lv_color_t* s_buf2;
static lv_disp_drv_t s_disp_drv;
static esp_timer_handle_t s_tick_timer;

static void tick_cb(void* arg) { lv_tick_inc(2); }

static void flush_cb(lv_disp_drv_t* drv, const lv_area_t* area, lv_color_t* color_p) {
    int x1 = area->x1;
    int y1 = area->y1;
    int x2 = area->x2 + 1;
    int y2 = area->y2 + 1;
    esp_lcd_panel_draw_bitmap(s_panel, x1, y1, x2, y2, color_p);
    lv_disp_flush_ready(drv);
}

void display_init(void) {
    lv_init();
    spi_bus_config_t buscfg = {
        .mosi_io_num = PIN_NUM_MOSI,
        .miso_io_num = PIN_NUM_MISO,
        .sclk_io_num = PIN_NUM_CLK,
        .quadwp_io_num = -1,
        .quadhd_io_num = -1,
        .max_transfer_sz = LCD_HRES * 40 * sizeof(uint16_t),
    };
    spi_bus_initialize(SPI2_HOST, &buscfg, SPI_DMA_CH_AUTO);
    esp_lcd_panel_io_handle_t io_handle = NULL;
    esp_lcd_panel_io_spi_config_t io_config = {
        .cs_gpio_num = PIN_NUM_CS,
        .dc_gpio_num = PIN_NUM_DC,
        .spi_mode = 0,
        .pclk_hz = 40 * 1000 * 1000,
        .trans_queue_depth = 10,
        .on_color_trans_done = NULL,
        .user_ctx = NULL,
    };
    esp_lcd_new_panel_io_spi((esp_lcd_spi_bus_handle_t)SPI2_HOST, &io_config, &io_handle);
    esp_lcd_panel_dev_config_t panel_config = {
        .reset_gpio_num = PIN_NUM_RST,
        .rgb_endian = LCD_RGB_ENDIAN_RGB,
        .bits_per_pixel = 16,
    };
    esp_lcd_new_panel_ili9488(io_handle, &panel_config, &s_panel);
    esp_lcd_panel_reset(s_panel);
    esp_lcd_panel_init(s_panel);
    esp_lcd_panel_mirror(s_panel, true, false);
    gpio_config_t io_conf = { .mode = GPIO_MODE_OUTPUT, .pin_bit_mask = 1ULL << PIN_NUM_BL };
    gpio_config(&io_conf);
    gpio_set_level(PIN_NUM_BL, 1);
    s_buf1 = heap_caps_malloc(LCD_HRES * 40 * sizeof(lv_color_t), MALLOC_CAP_DMA);
    s_buf2 = heap_caps_malloc(LCD_HRES * 40 * sizeof(lv_color_t), MALLOC_CAP_DMA);
    lv_disp_draw_buf_init(&s_draw_buf, s_buf1, s_buf2, LCD_HRES * 40);
    lv_disp_drv_init(&s_disp_drv);
    s_disp_drv.hor_res = LCD_HRES;
    s_disp_drv.ver_res = LCD_VRES;
    s_disp_drv.flush_cb = flush_cb;
    s_disp_drv.draw_buf = &s_draw_buf;
    lv_disp_drv_register(&s_disp_drv);
    const esp_timer_create_args_t targs = { .callback = &tick_cb, .arg = NULL, .dispatch_method = ESP_TIMER_TASK, .name = "lvgl" };
    esp_timer_create(&targs, &s_tick_timer);
    esp_timer_start_periodic(s_tick_timer, 2000);
}

void display_tick(void) {
    lv_timer_handler();
}

