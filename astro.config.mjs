// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'YarpDotCloud',
			plugins: [
				starlightBlog(),
			],
			site: 'https://www.yarp.cloud',
			// Add logo
			logo: {
				src: './src/assets/yarpdotcloudpokemonlogo.svg',
			  },
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/jibbscript' },
				{ icon: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/in/gibran.iqbal' },
				{ icon: 'email', label: 'Email', href: 'mailto:giqbal@gibraniq.com' },
			],
			sidebar: [
				{
					label: 'Posts',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Rangency', slug: 'posts/rangency' },
						{ label: 'FedRAMP Data Mesh Reference Architecture', slug: 'posts/fedramp-datamesh' },
						{ label: 'YarpDotCloud', slug: 'posts/yarpdotcloud' },
					],
				},
			],
				,
		}),
	],
});
