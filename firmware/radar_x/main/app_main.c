#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"
#include "esp_system.h"

typedef struct {
    float distance;
    float motion_energy;
    float micro_signal;
    float respiration_freq;
    float heartbeat_est;
    float temperature;
    float stability_index;
    float battery_voltage;
} radar_sample_t;

static QueueHandle_t q_radar;
static QueueHandle_t q_decision;
static QueueHandle_t q_ui;
static QueueHandle_t q_audio;
static QueueHandle_t q_log;

static void radar_task(void* arg) {
    for (;;) {
        radar_sample_t s = {0};
        xQueueSend(q_radar, &s, 0);
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

static void detection_task(void* arg) {
    for (;;) {
        radar_sample_t s;
        if (xQueueReceive(q_radar, &s, portMAX_DELAY)) {
            float conf = 0.5f;
            xQueueSend(q_decision, &conf, 0);
        }
    }
}

static void fusion_task(void* arg) {
    for (;;) {
        float conf;
        if (xQueueReceive(q_decision, &conf, portMAX_DELAY)) {
            xQueueSend(q_ui, &conf, 0);
            xQueueSend(q_audio, &conf, 0);
            xQueueSend(q_log, &conf, 0);
        }
    }
}

static void ui_task(void* arg) {
    for (;;) {
        float conf;
        if (xQueueReceive(q_ui, &conf, portMAX_DELAY)) {
        }
    }
}

static void audio_task(void* arg) {
    for (;;) {
        float conf;
        if (xQueueReceive(q_audio, &conf, portMAX_DELAY)) {
        }
    }
}

static void logger_task(void* arg) {
    for (;;) {
        float conf;
        if (xQueueReceive(q_log, &conf, portMAX_DELAY)) {
        }
    }
}

static void power_task(void* arg) {
    for (;;) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

static void fault_task(void* arg) {
    for (;;) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

static void supervisor_task(void* arg) {
    for (;;) {
        vTaskDelay(pdMS_TO_TICKS(200));
    }
}

void app_main(void) {
    q_radar = xQueueCreate(8, sizeof(radar_sample_t));
    q_decision = xQueueCreate(8, sizeof(float));
    q_ui = xQueueCreate(8, sizeof(float));
    q_audio = xQueueCreate(8, sizeof(float));
    q_log = xQueueCreate(8, sizeof(float));
    xTaskCreatePinnedToCore(radar_task, "radar", 4096, NULL, 6, NULL, 0);
    xTaskCreatePinnedToCore(detection_task, "detect", 4096, NULL, 6, NULL, 1);
    xTaskCreatePinnedToCore(fusion_task, "fusion", 4096, NULL, 5, NULL, 1);
    xTaskCreatePinnedToCore(ui_task, "ui", 4096, NULL, 4, NULL, 0);
    xTaskCreatePinnedToCore(audio_task, "audio", 4096, NULL, 3, NULL, 0);
    xTaskCreatePinnedToCore(logger_task, "log", 4096, NULL, 3, NULL, 1);
    xTaskCreatePinnedToCore(power_task, "power", 4096, NULL, 4, NULL, 0);
    xTaskCreatePinnedToCore(fault_task, "fault", 4096, NULL, 4, NULL, 1);
    xTaskCreatePinnedToCore(supervisor_task, "super", 4096, NULL, 7, NULL, 0);
}
