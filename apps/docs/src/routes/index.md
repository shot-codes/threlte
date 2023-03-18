---
title: Introduction
---

<script lang="ts">
import Example from '$examples/introduction/App.svelte'

type Testimonial = {
  image: string; // Author image
  name: string; // Author name
  title: string; // Author title
  link: string; // Source URL
  contents: string; // The testimonial itself
}
const testimonials: Testimonial[] = [
  {
    image: 'https://avatars.githubusercontent.com/u/1162160?v=4',
    name: 'Rich Harris',
    title: "Creator of Svelte.",
    link: 'https://twitter.com/Rich_Harris/status/1599090054382596097',
    contents: "indeed — threlte is where it's at. i should get round to updating the svelte cubed repo/site to make that clearer",
  },
  {
    image: 'https://www.shiyunlu.com/assets/head-shot-2020.8496dae1_iHYyX.png',
    name: 'Shiyun 诗韵',
    title: "Globalist, learner, software engineer",
    link: 'https://twitter.com/lu_shiyun/status/1598002293114540032',
    contents: `My first try at writing shaders in #threejs .. used the FBO particles technique to explore Chinese characters that have "女" (woman) as a component in them.. OMG it's so challenging! The new @threlte, made it easier though 🤓`,
  },
  {
    image: 'https://www.higsch.com/img/me_coding.jpg',
    name: 'Matthias Stahl 🇪🇺',
    title: "I am a designer creating knowledge through data visualization.",
    link: 'https://twitter.com/h_i_g_s_c_h',
    contents: "🧑‍💻 First experiments using threlte for Svelte. After I didn't succeed using svelte-cubed, threlte seems to be a rather well-documented and good working declarative THREE library for Svelte. Many thanks to @a_warnes and @Reyfenberg!",
  },
  {
    image: 'https://avatars.githubusercontent.com/u/1162160?v=4',
    name: 'Rich Harris',
    title: "Creator of Svelte.",
    link: 'https://twitter.com/Rich_Harris/status/1580663361993248769',
    contents: "give threlte.xyz a whirl. not as mature as the r3f ecosystem, but already pretty capable",
  },
  {
    image: 'https://avatars.githubusercontent.com/u/57304890?v=4',
    name: 'shiva',
    title: "Computer Science + Art student @Carnegie Mellon",
    link: 'https://twitter.com/shiva_peri/status/1541627317147009025',
    contents: "threlte, which combines threejs and svelte, is easily one of my new favorite libraries",
  },
  {
    image: 'https://www.a3k.me/favicon/apple-touch-icon.png?v=2.2.0',
    name: 'Amr',
    title: "Freelancer web developer",
    link: 'https://twitter.com/amr3k_/status/1580799004694089728',
    contents: "I built 3 webGL apps using threlte and it's amazing <3",
  },
  {
    image: 'https://avatars.githubusercontent.com/u/3778969?v=4',
    name: 'Vatroslav Vrbanić',
    title: "Creator of svelthree and svelte-accmod",
    link: 'https://twitter.com/vatro_vrbanic/status/1556947920171286528',
    contents: "I'm impressed by all the features of threlte.xyz, it's well polished / feels complete. Still, svelthree is different in many ways, and I think it's good to have alternatives. After 1.0.0-next.1, I'll have to dive deeper into threlte and compare/test it extensively.",
  }
];
</script>

# Introduction

Threlte is a renderer and component library for Svelte to build and render three.js scenes **declaratively** and **state-driven** in Svelte apps.

<ExampleWrapper playgroundHref="/introduction">
<Example />

<div slot="code">

@[code svelte|title=App.svelte](../examples/introduction/App.svelte)
@[code svelte|title=Scene.svelte](../examples/introduction/Scene.svelte)

</div>
</ExampleWrapper>

It's inspired by the sensible defaults of [react-three-fiber](https://github.com/pmndrs/react-three-fiber), the simplicity and effectiveness of Sveltes reactivity model and [Svelte Cubed](https://github.com/Rich-Harris/svelte-cubed).

It provides strictly typed components to quickly and easily build three.js scenes with deep reactivity and interactivity out-of-the-box.

It also aims to provide the building blocks to quickly extend Threlte when it's needed.

:::admonition type="note"
Threlte is still in active development and you should expect breaking changes. Check the release notes before updating. If you want to be on the safe side, install Threlte with `npm i @threlte/core --save-exact` to lock the versions, same goes for `@threlte/extras` and `@threlte/rapier`
:::

## Don't take our word for it!

<!-- <div class="flex justify-center p-4">
  <video preload="auto" autoplay="autoplay" class="w-full" controls>
    <source src="https://i.imgur.com/1Kea5Wk.mp4" type="video/mp4" />
  </video>
</div> -->

<div class="grid place-items-center grid-cols-1 992:grid-cols-2 gap-3">
  {#each testimonials as _t}
    <a href={_t.link} rel="external" class="w-full h-full rounded-md px-4 border-none bg-gray-50 duration-200 shadow-xl hover:shadow-2xl">
      <div class="flex gap-6">
        <img src={_t.image} alt="{_t.name} profile photo" class="rounded-full w-12 h-12 object-cover" />
        <div class="grow">
          <h4 class="mb-0">{_t.name}</h4>
          <p class="text-sm font-normal text-gray-400">{_t.title}</p>
        </div>
      </div>
      <p class="mt-0 font-normal text-base text-gray-600">{_t.contents}</p>
    </a>
  {/each}
</div>
