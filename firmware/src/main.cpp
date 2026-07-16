#include <lvgl.h>

#if defined(ARDUINO)
/* =========================================================================
 *  CÓDIGO DA PLACA FÍSICA (ESP32-S3)
 * ========================================================================= */
#include <Arduino.h>
#include <Arduino_GFX_Library.h>
#include <TAMC_GT911.h>

// Pinos do Display RGB Paralelo do ESP32-8048S070C (7 polegadas)
#define GFX_BL 2
Arduino_ESP32RGBPanel *bus = new Arduino_ESP32RGBPanel(
    41 /* DE */, 40 /* VSYNC */, 39 /* HSYNC */, 42 /* PCLK */,
    14 /* R0 */, 21 /* R1 */, 47 /* R2 */, 48 /* R3 */, 45 /* R4 */,
    9 /* G0 */, 46 /* G1 */, 3 /* G2 */, 8 /* G3 */, 16 /* G4 */, 1 /* G5 */,
    15 /* B0 */, 7 /* B1 */, 6 /* B2 */, 5 /* B3 */, 4 /* B4 */,
    0 /* hsync_polarity */, 10 /* hsync_front_porch */, 8 /* hsync_pulse_width */, 50 /* hsync_back_porch */,
    0 /* vsync_polarity */, 10 /* vsync_front_porch */, 8 /* vsync_pulse_width */, 20 /* vsync_back_porch */,
    1 /* pclk_active_neg */, 16000000 /* prefer_speed */);

Arduino_RGB_Display *gfx = new Arduino_RGB_Display(800 /* width */, 480 /* height */, bus);

// Pinos do Touch GT911
#define TOUCH_SDA 19
#define TOUCH_SCL 20
#define TOUCH_INT -1
#define TOUCH_RST 38
#define TOUCH_WIDTH 800
#define TOUCH_HEIGHT 480
TAMC_GT911 ts = TAMC_GT911(TOUCH_SDA, TOUCH_SCL, TOUCH_INT, TOUCH_RST, TOUCH_WIDTH, TOUCH_HEIGHT);

static const uint32_t screenWidth = 480;
static const uint32_t screenHeight = 800;
static uint8_t draw_buf[screenWidth * screenHeight / 10 * 2];

void my_disp_flush(lv_display_t *disp, const lv_area_t *area, uint8_t *px_map) {
  uint32_t w = (area->x2 - area->x1 + 1);
  uint32_t h = (area->y2 - area->y1 + 1);
  gfx->draw16bitRGBBitmap(area->x1, area->y1, (uint16_t *)px_map, w, h);
  lv_display_flush_ready(disp);
}

void my_touchpad_read(lv_indev_t * indev, lv_indev_data_t * data) {
  ts.read();
  if (ts.isTouched) {
    data->state = LV_INDEV_STATE_PRESSED;
    data->point.x = ts.points[0].x;
    data->point.y = ts.points[0].y;
  } else {
    data->state = LV_INDEV_STATE_RELEASED;
  }
}

uint32_t my_tick_get_cb(void) {
  return millis();
}

void setup() {
  Serial.begin(115200);
  Serial.println("Iniciando CYD Notebook...");

  gfx->begin();
  gfx->fillScreen(BLACK);
  pinMode(GFX_BL, OUTPUT);
  digitalWrite(GFX_BL, HIGH);

  ts.begin();
  ts.setRotation(ROTATION_NORMAL);

  lv_init();
  lv_tick_set_cb(my_tick_get_cb);

  lv_display_t * disp = lv_display_create(screenWidth, screenHeight);
  lv_display_set_flush_cb(disp, my_disp_flush);
  lv_display_set_buffers(disp, draw_buf, NULL, sizeof(draw_buf), LV_DISPLAY_RENDER_MODE_PARTIAL);

  lv_indev_t * indev = lv_indev_create();
  lv_indev_set_type(indev, LV_INDEV_TYPE_POINTER);
  lv_indev_set_read_cb(indev, my_touchpad_read);

  lv_obj_t * label = lv_label_create(lv_screen_active());
  lv_label_set_text(label, "Notebook V1 - ESP32");
  lv_obj_center(label);
}

void loop() {
  lv_timer_handler();
  delay(5);
}

#else
/* =========================================================================
 *  CÓDIGO DO SIMULADOR (PC / LINUX)
 * ========================================================================= */
#include <unistd.h>
#include <pthread.h>
#include <stdio.h>
#include <string>
#include <ArduinoJson.h>

// Função rápida para remover acentos (Latin-1) do UTF-8
std::string removeAccents(const std::string& input) {
    std::string output;
    for (size_t i = 0; i < input.length(); i++) {
        if ((unsigned char)input[i] == 0xC3) {
            i++;
            if (i < input.length()) {
                unsigned char c = input[i];
                if (c == 0xA1 || c == 0xA0 || c == 0xA2 || c == 0xA3 || c == 0xA4) output += 'a';
                else if (c == 0x81 || c == 0x80 || c == 0x82 || c == 0x83 || c == 0x84) output += 'A';
                else if (c == 0xA9 || c == 0xA8 || c == 0xAA || c == 0xAB) output += 'e';
                else if (c == 0x89 || c == 0x88 || c == 0x8A || c == 0x8B) output += 'E';
                else if (c == 0xAD || c == 0xAC || c == 0xAE || c == 0xAF) output += 'i';
                else if (c == 0x8D || c == 0x8C || c == 0x8E || c == 0x8F) output += 'I';
                else if (c == 0xB3 || c == 0xB2 || c == 0xB4 || c == 0xB5 || c == 0xB6) output += 'o';
                else if (c == 0x93 || c == 0x92 || c == 0x94 || c == 0x95 || c == 0x96) output += 'O';
                else if (c == 0xBA || c == 0xB9 || c == 0xBB || c == 0xBC) output += 'u';
                else if (c == 0x9A || c == 0x99 || c == 0x9B || c == 0x9C) output += 'U';
                else if (c == 0xA7) output += 'c';
                else if (c == 0x87) output += 'C';
                else output += '?';
            }
        } else {
            output += input[i];
        }
    }
    return output;
}

lv_obj_t * ui_title;
lv_obj_t * ui_content;
lv_obj_t * ui_sidebar;
int current_page_index = 0;
int total_pages = 0;
std::string last_json_data = "";

void fetch_api_data(lv_timer_t * timer) {
  std::string json_data = "";
  FILE* pipe = popen("curl -s http://localhost:3001/api/notebooks", "r");
  if (pipe) {
    char buffer[128];
    while (!feof(pipe)) {
      if (fgets(buffer, 128, pipe) != NULL)
        json_data += buffer;
    }
    pclose(pipe);
  }

  if (json_data.empty()) return;
  last_json_data = json_data;

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, json_data);

  if (!error && doc.is<JsonArray>() && doc.size() > 0) {
    total_pages = doc.size();
    if(current_page_index >= total_pages) current_page_index = total_pages - 1;

    JsonObject notebook = doc[current_page_index];
    const char* title_raw = notebook["name"] | "Pagina 1";
    std::string title_text = removeAccents(title_raw);
    lv_label_set_text(ui_title, title_text.c_str());

    // Limpa a lista atual para desenhar os novos itens
    lv_obj_clean(ui_content);

    JsonArray items = notebook["items"];
    for (JsonObject item : items) {
      bool isTask = item["isTask"] | false;
      bool done = item["done"] | false;
      const char* raw_text = item["text"] | "";
      
      std::string text_str = removeAccents(raw_text);
      const char* text = text_str.c_str();
      
      if (strlen(text) == 0 && !isTask) continue;

      if (isTask) {
        lv_obj_t * cb = lv_checkbox_create(ui_content);
        lv_checkbox_set_text(cb, text);
        lv_obj_set_style_text_font(cb, &lv_font_montserrat_16, 0);
        lv_obj_set_style_bg_opa(cb, 0, LV_PART_MAIN);
        lv_obj_set_style_border_width(cb, 0, LV_PART_MAIN);
        // Estilo do indicador (borda cinza por padrão)
        lv_obj_set_style_border_color(cb, lv_color_hex(0x6b7280), LV_PART_INDICATOR);
        lv_obj_set_style_border_width(cb, 1, LV_PART_INDICATOR);
        lv_obj_set_style_radius(cb, 3, LV_PART_INDICATOR);
        if (done) {
          lv_obj_add_state(cb, LV_STATE_CHECKED);
          lv_obj_set_style_text_color(cb, lv_color_hex(0x9ca3af), 0);
          // Indicator azul quando marcado (accent-blue-500)
          lv_obj_set_style_bg_color(cb, lv_color_hex(0x3b82f6), LV_PART_INDICATOR | LV_STATE_CHECKED);
          lv_obj_set_style_border_color(cb, lv_color_hex(0x3b82f6), LV_PART_INDICATOR | LV_STATE_CHECKED);
        } else {
          lv_obj_set_style_text_color(cb, lv_color_hex(0x1f2937), 0);
        }
      } else {
        lv_obj_t * lbl = lv_label_create(ui_content);
        lv_label_set_text(lbl, text);
        lv_obj_set_style_text_font(lbl, &lv_font_montserrat_16, 0);
        lv_obj_set_style_text_color(lbl, lv_color_hex(0x1f2937), 0);
      }
    }
  }
}

static void notebook_btn_cb(lv_event_t * e) {
    int new_index = (int)(intptr_t)lv_event_get_user_data(e);
    current_page_index = new_index;
    lv_obj_add_flag(ui_sidebar, LV_OBJ_FLAG_HIDDEN);
    fetch_api_data(NULL);
}

static void hamburger_btn_cb(lv_event_t * e) {
    if(lv_obj_has_flag(ui_sidebar, LV_OBJ_FLAG_HIDDEN)) {
        lv_obj_clear_flag(ui_sidebar, LV_OBJ_FLAG_HIDDEN);
        lv_obj_clean(ui_sidebar);

        // 1. Linhas Pautadas do Sidebar (Ignore layout para ficar no fundo)
        lv_obj_t * lines_bg = lv_obj_create(ui_sidebar);
        lv_obj_set_size(lines_bg, lv_pct(100), lv_pct(100));
        lv_obj_add_flag(lines_bg, LV_OBJ_FLAG_IGNORE_LAYOUT);
        lv_obj_set_style_bg_opa(lines_bg, 0, 0);
        lv_obj_set_style_border_width(lines_bg, 0, 0);
        lv_obj_set_style_pad_all(lines_bg, 0, 0);
        
        for(int y = 50; y < 800; y += 32) { // 50 é a altura do header
            lv_obj_t * line = lv_obj_create(lines_bg);
            lv_obj_set_size(line, 260, 1);
            lv_obj_set_pos(line, 0, y);
            lv_obj_set_style_bg_color(line, lv_color_hex(0xe5e7eb), 0);
            lv_obj_set_style_border_width(line, 0, 0);
        }

        // 2. Linha Vermelha do Sidebar
        lv_obj_t * red_line = lv_obj_create(ui_sidebar);
        lv_obj_set_size(red_line, 1, 800);
        lv_obj_set_pos(red_line, 40, 0); // Margem como na web
        lv_obj_add_flag(red_line, LV_OBJ_FLAG_IGNORE_LAYOUT);
        lv_obj_set_style_bg_color(red_line, lv_color_hex(0xfca5a5), 0);
        lv_obj_set_style_border_width(red_line, 0, 0);

        // Header do menu "Índice"
        lv_obj_t * header_row = lv_obj_create(ui_sidebar);
        lv_obj_set_width(header_row, lv_pct(100));
        lv_obj_set_height(header_row, 50);
        lv_obj_set_style_pad_all(header_row, 0, 0);
        lv_obj_set_style_bg_color(header_row, lv_color_hex(0xf0ebda), 0);
        lv_obj_set_style_bg_opa(header_row, 255, 0);
        lv_obj_set_style_border_width(header_row, 0, 0);
        lv_obj_set_style_border_width(header_row, 1, LV_PART_MAIN);
        lv_obj_set_style_border_side(header_row, LV_BORDER_SIDE_BOTTOM, LV_PART_MAIN);
        lv_obj_set_style_border_color(header_row, lv_color_hex(0xd8d4c0), 0);
        lv_obj_set_style_radius(header_row, 0, 0);
        
        lv_obj_t * lbl = lv_label_create(header_row);
        lv_label_set_text(lbl, "Indice"); // Sem acento, ou tratamos.
        lv_obj_set_style_text_font(lbl, &lv_font_montserrat_20, 0);
        lv_obj_set_style_text_color(lbl, lv_color_hex(0x1f2937), 0);
        lv_obj_align(lbl, LV_ALIGN_LEFT_MID, 50, 0); // Depois da linha vermelha

        lv_obj_t * close_btn = lv_button_create(header_row);
        lv_obj_set_size(close_btn, 40, 40);
        lv_obj_align(close_btn, LV_ALIGN_RIGHT_MID, 0, 0);
        lv_obj_set_style_bg_opa(close_btn, 0, 0);
        lv_obj_set_style_text_color(close_btn, lv_color_hex(0x1f2937), 0);
        lv_obj_set_style_shadow_width(close_btn, 0, 0);
        lv_obj_add_event_cb(close_btn, [](lv_event_t *e){ lv_obj_add_flag(ui_sidebar, LV_OBJ_FLAG_HIDDEN); }, LV_EVENT_CLICKED, NULL);
        lv_obj_t * close_lbl = lv_label_create(close_btn);
        lv_label_set_text(close_lbl, LV_SYMBOL_CLOSE);
        lv_obj_center(close_lbl);

        // Lista de cadernos (iteração reversa para paridade com o web: mais antigo no topo)
        if(last_json_data.empty()) return;

        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, last_json_data);
        if (!error && doc.is<JsonArray>()) {
            JsonArray arr = doc.as<JsonArray>();
            int total = (int)arr.size();
            for(int i = total - 1; i >= 0; i--) {
                JsonObject notebook = arr[i];
                const char* name_raw = notebook["name"] | "Sem nome";
                std::string name_text = removeAccents(name_raw);
                
                lv_obj_t * btn = lv_button_create(ui_sidebar);
                lv_obj_set_width(btn, lv_pct(100));
                lv_obj_set_height(btn, 32); // Altura exata da pauta do caderno (32px)
                lv_obj_set_style_radius(btn, 0, 0);
                lv_obj_set_style_shadow_width(btn, 0, 0);
                lv_obj_set_style_pad_all(btn, 0, 0);
                lv_obj_set_style_border_width(btn, 0, 0);
                
                // Estilo ativo vs inativo (fiel ao web: bg-blue-600/10 = blue-100)
                if (i == current_page_index) {
                    lv_obj_set_style_bg_color(btn, lv_color_hex(0xdbeafe), 0); // blue-100
                    lv_obj_set_style_bg_opa(btn, 255, 0);
                    lv_obj_set_style_text_color(btn, lv_color_hex(0x1e40af), 0); // Texto azul escuro
                } else {
                    lv_obj_set_style_bg_opa(btn, 0, 0);
                    lv_obj_set_style_text_color(btn, lv_color_hex(0x374151), 0); // Texto cinza
                }
                
                lv_obj_t * btn_lbl = lv_label_create(btn);
                lv_label_set_text(btn_lbl, name_text.c_str());
                lv_obj_set_style_text_font(btn_lbl, &lv_font_montserrat_16, 0);
                lv_obj_align(btn_lbl, LV_ALIGN_LEFT_MID, 50, 0); // Depois da linha vermelha

                lv_obj_add_event_cb(btn, notebook_btn_cb, LV_EVENT_CLICKED, (void*)(intptr_t)i);
            }
        }
    } else {
        lv_obj_add_flag(ui_sidebar, LV_OBJ_FLAG_HIDDEN);
    }
}

int main(void) {
  // Inicializa a engine principal do LVGL
  lv_init();
  
  lv_display_t * disp = lv_sdl_window_create(480, 800);
  lv_indev_t * mouse = lv_sdl_mouse_create();
  lv_indev_t * keyboard = lv_sdl_keyboard_create();
  
  // 1. Fundo do Papel (Creme)
  lv_obj_t * bg = lv_obj_create(lv_screen_active());
  lv_obj_set_size(bg, 480, 800);
  lv_obj_set_style_bg_color(bg, lv_color_hex(0xfdfaf1), 0);
  lv_obj_set_style_border_width(bg, 0, 0);
  lv_obj_set_style_radius(bg, 0, 0);
  lv_obj_set_style_pad_all(bg, 0, 0);
  lv_obj_clear_flag(bg, LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_center(bg);

  // 2. Linhas Horizontais (Pauta do Caderno)
  lv_obj_t * lines_bg = lv_obj_create(bg);
  lv_obj_set_size(lines_bg, 480, 800);
  lv_obj_set_style_bg_opa(lines_bg, 0, 0); 
  lv_obj_set_style_border_width(lines_bg, 0, 0);
  lv_obj_set_style_pad_all(lines_bg, 0, 0);
  lv_obj_center(lines_bg);
  
  for(int y = 16; y < 800; y += 32) { // Alinhado com backgroundPosition web: '0 16px'
      lv_obj_t * line = lv_obj_create(lines_bg);
      lv_obj_set_size(line, 480, 1);
      lv_obj_set_pos(line, 0, y);
      lv_obj_set_style_bg_color(line, lv_color_hex(0xe5e7eb), 0);
      lv_obj_set_style_border_width(line, 0, 0);
  }

  // 3. Linha Vermelha de Margem
  lv_obj_t * red_line = lv_obj_create(bg);
  lv_obj_set_size(red_line, 1, 800); // 1px como no web (left-6/left-8)
  lv_obj_set_pos(red_line, 48, 0);  // x=48: recuado o suficiente para ficar visível
  lv_obj_set_style_bg_color(red_line, lv_color_hex(0xfca5a5), 0);
  lv_obj_set_style_border_width(red_line, 0, 0);
  lv_obj_set_style_radius(red_line, 0, 0);

  // 4. Header Superior
  lv_obj_t * header = lv_obj_create(bg);
  lv_obj_set_size(header, 480, 60);
  lv_obj_set_pos(header, 0, 0);
  lv_obj_set_style_bg_color(header, lv_color_hex(0xf0ebda), 0);
  lv_obj_set_style_border_width(header, 0, LV_PART_MAIN);
  lv_obj_set_style_border_width(header, 1, LV_PART_MAIN);
  lv_obj_set_style_border_side(header, LV_BORDER_SIDE_BOTTOM, LV_PART_MAIN);
  lv_obj_set_style_border_color(header, lv_color_hex(0xe2dfd5), 0); // Cor correta da borda do web (#e2dfd5)
  lv_obj_set_style_radius(header, 0, 0);
  lv_obj_clear_flag(header, LV_OBJ_FLAG_SCROLLABLE);

  // Botão Menu Hamburger (Esquerda)
  lv_obj_t * btn_menu = lv_button_create(header);
  lv_obj_set_size(btn_menu, 40, 40);
  lv_obj_align(btn_menu, LV_ALIGN_LEFT_MID, 5, 0); // Movido para a esquerda
  lv_obj_set_style_bg_opa(btn_menu, 0, 0); // Totalmente transparente (flat)
  lv_obj_set_style_border_width(btn_menu, 0, 0); // Sem borda
  lv_obj_set_style_text_color(btn_menu, lv_color_hex(0x4b5563), 0); // Cor grafite elegante
  lv_obj_set_style_shadow_width(btn_menu, 0, 0);
  lv_obj_add_event_cb(btn_menu, hamburger_btn_cb, LV_EVENT_CLICKED, NULL);
  lv_obj_t * lbl_menu = lv_label_create(btn_menu);
  lv_label_set_text(lbl_menu, LV_SYMBOL_LIST); // Ícone de 3 traços
  lv_obj_set_style_text_font(lbl_menu, &lv_font_montserrat_20, 0); // Ícone maior
  lv_obj_center(lbl_menu);

  // Título no Header (fica à direita do botão hamburguer de 40px + 5px offset + folga)
  ui_title = lv_label_create(header);
  lv_label_set_text(ui_title, "Carregando...");
  lv_obj_set_style_text_font(ui_title, &lv_font_montserrat_20, 0);
  lv_obj_set_style_text_color(ui_title, lv_color_hex(0x1f2937), 0);
  lv_obj_align(ui_title, LV_ALIGN_LEFT_MID, 62, 0); // x=62: depois do botão (5+40+17)

  // 5. Área de Conteúdo (Tarefas e Textos)
  ui_content = lv_obj_create(bg);
  lv_obj_set_size(ui_content, 480 - 64, 800 - 60); // Começa após a margem vermelha (x=48+16=64)
  lv_obj_set_pos(ui_content, 64, 60);              // pl-16 equivale a 64px, alinhado após margem em x=48
  lv_obj_set_style_bg_opa(ui_content, 0, 0); 
  lv_obj_set_style_border_width(ui_content, 0, 0);
  lv_obj_set_style_pad_all(ui_content, 0, 0);      // Remove padding extra
  lv_obj_set_style_pad_top(ui_content, 8, 0);      // py-2 equivalente (~8px top)
  lv_obj_set_layout(ui_content, LV_LAYOUT_FLEX);
  lv_obj_set_flex_flow(ui_content, LV_FLEX_FLOW_COLUMN);
  lv_obj_set_flex_align(ui_content, LV_FLEX_ALIGN_START, LV_FLEX_ALIGN_START, LV_FLEX_ALIGN_START);
  lv_obj_set_style_pad_row(ui_content, 0, 0);      // Itens alinhados às linhas de pauta (leading-[2rem])

  // 6. Sidebar (Menu Lateral)
  ui_sidebar = lv_obj_create(lv_screen_active());
  lv_obj_set_size(ui_sidebar, 260, 800);
  lv_obj_set_pos(ui_sidebar, 0, 0); // Movido para a esquerda (x = 0)
  lv_obj_set_style_bg_color(ui_sidebar, lv_color_hex(0xfdfaf1), 0); // Fundo papel creme!
  lv_obj_set_style_border_color(ui_sidebar, lv_color_hex(0xd8d4c0), 0); // Borda como no web
  lv_obj_set_style_border_width(ui_sidebar, 1, 0);
  lv_obj_set_style_radius(ui_sidebar, 12, 0);                            // rounded-xl = 12px
  lv_obj_set_style_shadow_width(ui_sidebar, 20, 0);
  lv_obj_set_style_shadow_ofs_x(ui_sidebar, 6, 0);                      // shadow decorativa deslocada
  lv_obj_set_style_shadow_ofs_y(ui_sidebar, 6, 0);
  lv_obj_set_style_shadow_color(ui_sidebar, lv_color_hex(0xd8d4c0), 0); // Sombra bege como no web
  lv_obj_set_style_shadow_opa(ui_sidebar, 200, 0);
  lv_obj_set_style_pad_all(ui_sidebar, 0, 0); // Remove padding para preencher tudo
  lv_obj_set_layout(ui_sidebar, LV_LAYOUT_FLEX);
  lv_obj_set_flex_flow(ui_sidebar, LV_FLEX_FLOW_COLUMN);
  lv_obj_set_flex_align(ui_sidebar, LV_FLEX_ALIGN_START, LV_FLEX_ALIGN_START, LV_FLEX_ALIGN_START);
  lv_obj_add_flag(ui_sidebar, LV_OBJ_FLAG_HIDDEN); // Escondido por padrão

  // Executa a busca inicial e cria um timer para rodar a cada 2000ms
  fetch_api_data(NULL);
  lv_timer_create(fetch_api_data, 2000, NULL);

  // Loop principal do simulador
  while(1) {
    lv_timer_handler(); 
    usleep(5000);       
    lv_tick_inc(5);     // <-- Informa ao LVGL que 5ms se passaram
  }
  
  return 0;
}
#endif
