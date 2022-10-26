---
layout: "@layouts/BlogPostLayout.astro"
title: Rebuilding my blog with Astro
author: Clark
tags:
  - Astro
  - Creators
  - Fullstack
image: /images/blog-replatform-astro/cover.png
date: "2022-10-04T00:00:00Z"
draft: false
github: "https://github.com/clarkmains/clarkmains-site"
description: How I rebuilt my personal site and blog using Astro, Tailwind CSS and Netlify
---

Back in May [I wrote about](/blog/tinkering-with-astro) my first experience trying the [Astro](https://astro.build/) web framework. I was so impressed with Astro, I subsequently rebuilt this site and this is how it went down..

## Why the rebuild?

Primarily - **learning**.

I find blogging to be a great tool for continuous improvement. On several levels.

I post about what I have learned and through the process of posting I hopefully learn how to make the following post better. If I get feedback on a post, I learn from that too.

Furthermore, I improve my technical skills by developing the blog platform. In this regard, Astro offers me unrivalled flexibility and opportunity to learn new things - want to create a post containing React, Svelte and Vue components? No problem, Astro, with its [bring-your-own-framework](https://docs.astro.build/en/core-concepts/framework-components/) philosophy, can do it!

Secondly - performance and accessibility. Using Astro's native Image integration and Tailwind CSS it was relatively painless to build a responsive site that achieves some great Lighthouse scores!

![Home page Lighthouse scores](/images/blog-replatform-astro/lighthouse-home.png)

## The Stack

This is the stack I settled on.

- Astro and official Image, MDX integrations
- Astro-icon package for easy access to a huge library of SVG Icons
- Tailwind CSS and the Typography plugin

At launch, this site is written using only pure Astro components.

In terms of hosting.. well as an AWS enthusiast, my default for static site hosting is, as you would expect, S3 + CloudFront. For this site though, I chose [Netlify](https://www.netlify.com/). Why?

- Built-in form handling
- Super fast cache invalidation (vs CloudFront anyway)
- GitHub Pull Request integrated preview environments
- Easy to add native non-Google analytics
- Serverless functions

The Netlify cache invalidation is satisfyingly fast, I have to say!

It was a pleasure to rebuild the site with this stack and if you wish, you can check out the source code on [GitHub](https://github.com/clarkmains/clarkmains-site).

## Core Functionality

### Authoring Posts

My blog posts are written in plain Markdown, which Astro [supports natively](https://docs.astro.build/en/guides/markdown-content/). I plan on writing a post in MDX soon and there is an official integration for MDX so happy days all round on the authoring front!

### Serving Posts

Astro uses file-based routing to generate URLs at build time based on the layout under `src/pages/`. This means any Markdown file inside `/src/pages/` will be treated as a page and Astro will automatically build a page route using the pathname of the file.

Take the following Markdown file as an example:

    /src/pages/blog/tinkering-with-astro.md

Astro will generate a corresponding blog post accessible from this url:

    <site-url>/blog/tinkering-with-astro

The final HTML output of the page is determined by a [Markdown Layout](https://docs.astro.build/en/core-concepts/layouts/#markdown-layouts) file specified in the frontmatter of the Markdown file. The Astro docs explain [Markdown and frontmatter support](https://docs.astro.build/en/guides/markdown-content/) in greater detail.

To list all posts on the blog page we use [`Astro.glob()`](https://docs.astro.build/en/guides/markdown-content/#importing-markdown) to first return an array of posts:

```javascript
const posts = (await Astro.glob("./blog/*.{md,mdx}")).sort(
  (a, b) =>
    new Date(b.frontmatter.date).valueOf() -
    new Date(a.frontmatter.date).valueOf()
);
```

Next, we iterate through the array and display links to each post in whatever style your prefer. I use an Astro component to display a preview of each post on a grid:

```javascript
<div class="grid gap-x-10 gap-y-12 md:grid-cols-2">
  {posts.map((post) => (
    <BlogPostCard post={post} />
  ))}
</div>
```

There is not much more you have to do to get the core functionality of a blog up and running. Super simple, fast and elegant!

## Engagement Features

One of the great things about static sites is they usually need very little infrastructure.

The downside of this simplicity is that implementing standard engagement features, such as comments, can be challenging given that there is likely no persistent data store in the stack. So how do we add such features?

### Comments

I implemented comments using [Giscus](https://giscus.app/) which is powered by GitHub Discussions.

Giscus embeds a comments section in your page where visitors (that have a GitHub account) can submit feedback, questions and such. These interactions are stored in a GitHub Discussion in a public GitHub repository of your choice.

I was initially hesitant to use Giscus due to the requirement for a GitHub Account..

After mulling it over though my conclusion was - in this community, who _doesn't_ have a GitHub account? Also, I am already directing people to GitHub for my example code, so.. may as well go all in!

If you want to see how it looks, well - scroll down to the comments section 😄

Adding Giscus to your site involves 3 steps:

1. Decide which of your (public) GitHub repositories will host your Discussions
2. Create a Giscus script tag with your desired configuration
3. Add the Giscus script tag to your site

Helpfully, the configuration section of the [Giscus Site](https://giscus.app/) has a config generator/wizard that will do the majority of step 2 for you and also walk you through the process of setting up a repository to host comments via GitHub Discussions.

Finally - the Giscus app will verify your configuration and a script tag will be generated.

The code will look something like this:

```javascript
<script
  src="https://giscus.app/client.js"
  data-repo="[ENTER REPO HERE]"
  data-repo-id="[ENTER REPO ID HERE]"
  data-category="[ENTER CATEGORY NAME HERE]"
  data-category-id="[ENTER CATEGORY ID HERE]"
  data-mapping="pathname"
  data-strict="0"
  data-reactions-enabled="1"
  data-emit-metadata="0"
  data-input-position="bottom"
  data-theme="preferred_color_scheme"
  data-lang="en"
  crossorigin="anonymous"
  async
></script>
```

You should be able to just take the generated code, paste it into a new native Astro component or your blog post layout, and be good to go.

_Alternatively_ - if you have integrated React, Vue, or Svelte in your Astro site, Giscus already has a [component library](https://github.com/giscus/giscus-component) that you can use.

### Contact Form

There is an About page on the site and it is nice to offer an easy way for people to get in touch via a contact form, rather than just having an email link on the page.

One nice thing about hosting a static site on Netlify - there is built-in [form handling](https://docs.netlify.com/forms/setup/) that will take care of the request-response wiring and spam prevention for you, with no fuss.

It is as straightforward as adding `data-netlify="true"` to your `<form>` tag, and you can start receiving form submissions in your Netlify site admin panel. Great stuff!

## Final Thoughts

I have some things in mind for this site already:

- Experiment with MDX when authoring my next blog post
- Add a Projects page to showcase my side projects
- Write E2E tests in Cypress (or Playwright)

I really enjoyed using Astro for this project. It is super easy to get something up and running quickly while offering a deep feature set through native integrations and third-party framework add ons.

I was a big fan of [Hugo](https://gohugo.io/) and Astro reminds me of Hugo but with all the modern bells & whistles. Thanks for reading, I hope you give Astro a try!
