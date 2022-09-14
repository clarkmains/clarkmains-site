import { defineConfig } from 'astro/config';

import image from "@astrojs/image";
import mdx from "@astrojs/mdx";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [image(), mdx(), tailwind()],
  site: 'https://clarkmains.com'
});