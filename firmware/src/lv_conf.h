#ifndef LV_CONF_H
#define LV_CONF_H

#include <stdint.h>

/* Profundidade de cores (16 bits para RGB565 do CYD) */
#define LV_COLOR_DEPTH 16

/* Gerenciamento de memória (usar o do stdlib/Arduino) */
#define LV_USE_STDLIB_MALLOC LV_STDLIB_BUILTIN

/* Fontes nativas habilitadas */
#define LV_FONT_MONTSERRAT_14 1
#define LV_FONT_MONTSERRAT_16 1
#define LV_FONT_MONTSERRAT_20 1

/* Monitor de Performance no canto da tela (útil no desenvolvimento) */
#define LV_USE_SYSMON   1
#define LV_USE_PERF_MONITOR 1
#define LV_USE_MEM_MONITOR  1

/* SDL (Para o Emulador PC) */
#define LV_USE_SDL 1

#endif /*LV_CONF_H*/
