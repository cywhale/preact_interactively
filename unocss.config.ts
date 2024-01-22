import {
  defineConfig,
  presetAttributify,
  presetUno,
  presetWebFonts,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    /*presetIcons({
      cdn: 'https://esm.sh/',
      scale: 1.5,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),*/
    presetWebFonts(),
    presetAttributify(),
  ],
})
