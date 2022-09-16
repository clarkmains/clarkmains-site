---
layout: "@layouts/BlogPostLayout.astro"
title: Creating a one-pager with Astro
author: Clark
tags:
  - Astro
  - Fullstack
image: /images/tinkering-with-astro/cover.jpg
date: "2022-05-19T00:00:00Z"
draft: false
github: "https://github.com/clarkmains/astro-slinky-starter"
description: Exploring the web framework with all the hype
---

Earlier this month I did some tinkering with [Astro](https://astro.build/).

If you spend any time on tech Twitter it's likely you have seen some of the hype around Astro. Given that the Astro 1.0 Beta has recently [dropped](https://astro.build/blog/astro-1-beta-release/) - what better time to finally check it out and see what all the fuss is about 🚀

## Why am I interested in Astro?

This site is currently running on [Gatsby](https://www.gatsbyjs.com/). One motivation for migrating to Gatsby from [Hugo](https://gohugo.io/) was the opportunity to teach myself a bit more about React and GraphQL.

On reflection, while I love the component-driven development that Gatsby/React offers, I prefer Hugo in some respects - the simplicity, sheer performance and SEO, for example.

Astro offers me the best of both worlds!

- Generate 100% static HTML by default
- Simple, file based routing
- UI framework-agnostic. Use pure Astro components or mix and match with React etc.
- Native Markdown and MDX integration for blog posts

## Building a one-pager in Astro

To learn the basics I built a CV/Resume one-pager in pure Astro i.e. no additional UI frameworks, plus the Tailwind CSS integration for styling.

Code for this example is available on my [GitHub](https://github.com/clarkmains/astro-slinky-starter).

![Page screenshot](/images/tinkering-with-astro/screenshot.jpg)

The content of this page is driven entirely by a single Markdown file:

    /src/pages/index.md

Astro uses file-based routing to generate URLs based on the structure of `src/pages/` which in this case means the `index.md` file automatically becomes the index page of the website, with no configuration required.

The Astro docs explain in detail [how Frontmatter and Markdown work](https://docs.astro.build/en/guides/markdown-content/) within Astro.

In my example, Frontmatter defines the majority of content on the page. The exception is the "About" section - the content of this section is populated by the Markdown slot, which means this section can contain rich content such as images. The Tailwind [Typography](https://tailwindcss.com/docs/typography-plugin) plugin is implemented to take care of any formatting in the "About" section.

#### index.md

```yaml
---
layout: "~/layouts/Default.astro"
image: "/headshot.jpeg"
name: Daphne Blake
description: Hey! I'm Daphne, a Web Developer & UX Designer based
in Glasgow, Scotland.

experience:
  - period: Jun 2019 - Now
    place: Tyrell Corporation
    description: User Experience Designer
  - period: Mar 2016 - May 2019
    place: Omni Consumer Products
    description: Front End Developer
  - period: Aug 2015 - Feb 2016
    place: Weyland Yutani
    description: Web Developer

education:
  - period: 2014 - 2015
    place: Strathclyde University
    description: MSc Mobile Web Development
  - period: 2010 - 2014
    place: Glasgow University
    description: BSc (Hons) Computer Science

contacts:
  - name: GitHub
    icon: fa:github
    link: https://www.github.com
  - name: Behance
    icon: fa:behance
    link: https://www.behance.net
  - name: Twitter
    icon: fa:twitter
    link: https://twitter.com
  - name: Linkedin
    icon: fa:linkedin
    link: https://www.linkedin.com
---
I love using human-centred design to create digital experiences that solve
real-world problems in an intuitive and accessible way.
```

An Astro [Layout](https://docs.astro.build/en/core-concepts/layouts/) component parses the content of the file and the end result is rendered as the page shown in the screenshot.

Specific details on the frontmatter structure used in this example and how it is translated to the page content are documented in the [README](https://github.com/clarkmains/astro-slinky-starter/blob/main/README.md) of the example's GitHub repository.

## Final thoughts

The UI-framework-agnostic aspect of Astro, or Bring Your Own UI Framework, as Astro call it - is a really cool and unique proposition. The ability to easily extend my blog platform by adding a component from a new framework as and when I want to learn something about said framework, is super-compelling.

I really enjoyed building this example project and I have decided that I am going to rebuild the blog using Astro 🚀

Thanks for reading and watch this space for more Astro!

**Update 27-09-2022**: since publishing this blog, the example page has now been version bumped - post beta - to use Astro 1.3.0 and include the new native Image integration.
