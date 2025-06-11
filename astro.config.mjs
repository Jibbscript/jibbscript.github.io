// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';
import starlightThemeFlexoki from 'starlight-theme-flexoki';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Yarp.Cloud',
			plugins: [
				starlightThemeFlexoki(),
				starlightBlog(),
			],
			// Logo now handled by custom SiteTitle component
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://www.github.com/jibbscript' },
				{ icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/gibran-iqbal/' },
				{ icon: 'email', label: 'Email', href: 'mailto:giqbal@gibraniq.com' },
			],
			sidebar: [
				{
					label: 'Posts',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Rangency', slug: 'reflections/rangency' },
						{ label: 'FedRAMP Data Mesh Reference Architecture', slug: 'fedramp/fedramp-datamesh' },
						{ label: 'Security Infrastructure MVP Collection', slug: 'security/security-infrastructure-mvp-collection/infra-security-projects' },
					],
				},
			],
				
			components: {
				SiteTitle: './src/components/SiteTitle.astro',
			},
		}),
	],
	site: 'https://www.yarp.cloud',
});
