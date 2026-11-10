// Generates the scene files for the film from one shared stylesheet. Run: node gen.mjs
import fs from 'node:fs';
const css = (id) => `
    @font-face { font-family: 'Just Another Hand'; src: url('assets/fonts/jah.woff2') format('woff2'); }
    #root { position: absolute; inset: 0; overflow: hidden; color: #fff6ea; font-family: 'Outfit', sans-serif; }
    #${id}-w { position: absolute; inset: 0; background: #000; }
    .${id}-img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: cover; }
    .${id}-shade { position: absolute; inset: 0; }
    .${id}-eyebrow { font-size: 30px; letter-spacing: 0.26em; text-transform: uppercase; font-weight: 400; color: #fff6ea; display: flex; align-items: center; gap: 22px; }
    .${id}-eyebrow i { width: 64px; height: 2px; background: #ff6d25; display: block; }
    .${id}-h { font-weight: 300; font-size: 150px; line-height: 0.95; letter-spacing: -0.035em; }
    .${id}-s { font-family: 'Just Another Hand', cursive; color: #ff6d25; font-weight: 400; letter-spacing: 0; }
    .${id}-mask { overflow: hidden; padding: 0.1em 0.08em 0.04em 0; }
    .${id}-mask > span { display: inline-block; }`;
const scene = (id, style, body, script) => `<template>
  <style>${css(id)}
${style}
  </style>
  <div id="root" data-composition-id="${id}" data-width="1920" data-height="1080">
    <div id="${id}-w" data-layout-allow-overflow>
${body}
    </div>
  </div>
  <script>
    (() => {
      const tl = gsap.timeline({ paused: true });
${script}
      window.__timelines["${id}"] = tl;
    })();
  </script>
</template>
`;
const S = {};

S.open = scene('open', `
    #open-c { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 26px; }
    #open-mark { font-family: 'Just Another Hand', cursive; color: #ff6d25; font-size: 300px; line-height: 1; padding: 0 0.1em; }
    #open-rule { width: 420px; height: 2px; background: rgba(255,246,234,0.4); }
    #open-tag { font-size: 32px; letter-spacing: 0.34em; text-transform: uppercase; color: rgba(255,246,234,0.8); }`,
`      <div id="open-c">
        <div class="open-mask"><span id="open-mark">avocado&amp;brownies</span></div>
        <div id="open-rule"></div>
        <div id="open-tag">Bakehouse &amp; café</div>
      </div>`,
`      tl.fromTo("#open-mark", { scale: 0.86, opacity: 0.55 }, { scale: 1, opacity: 1, duration: 1.6, ease: "expo.out" }, 0);
      tl.fromTo("#open-rule", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "expo.out" }, 0.8);
      tl.fromTo("#open-tag", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 1.1);
      tl.fromTo("#open-c", { scale: 1 }, { scale: 1.06, duration: 3.4, ease: "none" }, 0);`);

S.maga = scene('maga', `
    #maga-bg { position: absolute; inset: -40px; width: calc(100% + 80px); height: calc(100% + 80px); object-fit: cover; opacity: 0.32; }
    #maga-shade { background: linear-gradient(90deg, #000 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.55) 100%); }
    #maga-card { position: absolute; right: 200px; top: 90px; width: 506px; height: 900px; border-radius: 30px; overflow: hidden; box-shadow: 0 40px 90px rgba(0,0,0,0.7); }
    #maga-card img { width: 100%; height: 100%; object-fit: cover; }
    #maga-t { position: absolute; left: 192px; top: 330px; display: grid; gap: 30px; }`,
`      <img id="maga-bg" src="assets/mag-final.jpg" alt="">
      <div id="maga-shade" class="maga-shade"></div>
      <div id="maga-card"><img id="maga-img" src="assets/mag-final.jpg" alt=""></div>
      <div id="maga-t">
        <div id="maga-e" class="maga-eyebrow"><i></i>Our most sought-after</div>
        <div class="maga-h">
          <div class="maga-mask"><span id="maga-l1">The <span class="maga-s" style="font-size:1.25em">Magnum</span></span></div>
          <div class="maga-mask"><span id="maga-l2">Cake</span></div>
        </div>
      </div>`,
`      tl.fromTo("#maga-w", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
      tl.fromTo("#maga-card", { yPercent: 18, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.3, ease: "expo.out" }, 0.1);
      tl.fromTo("#maga-img", { scale: 1.22 }, { scale: 1.04, duration: 4.6, ease: "power1.out" }, 0);
      tl.fromTo("#maga-bg", { scale: 1.1 }, { scale: 1, duration: 4.6, ease: "none" }, 0);
      tl.fromTo("#maga-e", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }, 0.5);
      tl.fromTo(["#maga-l1", "#maga-l2"], { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.12, ease: "expo.out" }, 0.6);`);

S.magb = scene('magb', `
    .magb-col { position: absolute; top: 80px; height: 800px; width: 450px; overflow: hidden; border-radius: 28px; }
    #magb-c1 { left: 165px; } #magb-c2 { left: 735px; } #magb-c3 { left: 1305px; }
    .magb-col img { width: 100%; height: 100%; object-fit: cover; }
    #magb-cap { position: absolute; left: 165px; width: 1590px; bottom: 90px; display: flex; justify-content: space-between; }
    #magb-cap span { width: 450px; font-size: 40px; font-weight: 300; }
    #magb-cap b { color: #ff6d25; font-weight: 400; font-size: 28px; letter-spacing: 0.14em; margin-right: 16px; }`,
`      <div id="magb-c1" class="magb-col"><img class="magb-im" src="assets/mag-pour1.jpg" alt=""></div>
      <div id="magb-c2" class="magb-col"><img class="magb-im" src="assets/mag-pour2.jpg" alt=""></div>
      <div id="magb-c3" class="magb-col"><img class="magb-im" src="assets/mag-final.jpg" alt=""></div>
      <div id="magb-cap">
        <span class="magb-k"><b>01</b>Milk chocolate</span>
        <span class="magb-k"><b>02</b>White chocolate</span>
        <span class="magb-k"><b>03</b>Roasted nuts</span>
      </div>`,
`      tl.fromTo("#magb-w", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0);
      tl.fromTo(".magb-col", { yPercent: 118 }, { yPercent: 0, duration: 1.3, stagger: 0.18, ease: "expo.out" }, 0.05);
      tl.fromTo(".magb-im", { scale: 1.3 }, { scale: 1.05, duration: 4, ease: "power1.out" }, 0);
      tl.fromTo(".magb-k", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.18, ease: "power3.out" }, 0.9);`);

S.bra = scene('bra', `
    #bra-shade { background: linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 42%, rgba(0,0,0,0.05) 74%); }
    #bra-t { position: absolute; left: 192px; bottom: 124px; display: grid; gap: 30px; }
    #bra-t .bra-h { font-size: 176px; }`,
`      <img id="bra-img" class="bra-img" src="assets/brownie-macro.jpg" alt="">
      <div id="bra-shade" class="bra-shade"></div>
      <div id="bra-t">
        <div id="bra-e" class="bra-eyebrow"><i></i>Signature Nº 02</div>
        <div class="bra-h">
          <div class="bra-mask"><span id="bra-l1">Fudge, all</span></div>
          <div class="bra-mask"><span id="bra-l2">the way <span class="bra-s" style="font-size:1.25em">through.</span></span></div>
        </div>
      </div>`,
`      tl.fromTo("#bra-w", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
      tl.fromTo("#bra-img", { scale: 1.42, yPercent: -4 }, { scale: 1.05, yPercent: 0, duration: 4.6, ease: "power2.out" }, 0);
      tl.fromTo("#bra-e", { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }, 0.5);
      tl.fromTo(["#bra-l1", "#bra-l2"], { yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.12, ease: "expo.out" }, 0.6);`);

S.brb = scene('brb', `
    .brb-col { position: absolute; top: 96px; height: 760px; width: 548px; overflow: hidden; border-radius: 28px; }
    #brb-c1 { left: 96px; } #brb-c2 { left: 686px; } #brb-c3 { left: 1276px; }
    #brb-cap { position: absolute; left: 96px; right: 96px; bottom: 84px; display: flex; justify-content: space-between; align-items: baseline; }
    #brb-cap .brb-n { font-size: 46px; font-weight: 300; letter-spacing: -0.02em; }
    #brb-cap .brb-s { font-size: 84px; line-height: 0.8; }`,
`      <div id="brb-c1" class="brb-col"><img id="brb-i1" class="brb-img" src="assets/brownie-side.jpg" alt=""></div>
      <div id="brb-c2" class="brb-col"><img id="brb-i2" class="brb-img" src="assets/stack.jpg" alt=""></div>
      <div id="brb-c3" class="brb-col"><img id="brb-i3" class="brb-img" src="assets/brownie-top.jpg" alt=""></div>
      <div id="brb-cap">
        <span class="brb-n brb-k">Hazelnut Fudge Brownie</span>
        <span class="brb-s brb-k">the brownies</span>
        <span class="brb-n brb-k">Marble Brownie Stack</span>
      </div>`,
`      tl.fromTo("#brb-w", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0);
      tl.fromTo(".brb-col", { yPercent: 118 }, { yPercent: 0, duration: 1.3, stagger: 0.14, ease: "expo.out" }, 0.05);
      tl.fromTo(["#brb-i1", "#brb-i2", "#brb-i3"], { scale: 1.4 }, { scale: 1.08, duration: 4.4, ease: "power1.out" }, 0);
      tl.fromTo(".brb-k", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.14, ease: "power3.out" }, 0.9);`);

S.close = scene('close', `
    #close-glow { position: absolute; left: 310px; top: -110px; width: 1300px; height: 1300px; background: radial-gradient(closest-side, rgba(255,109,37,0.22), rgba(255,109,37,0) 70%); }
    #close-p1 { position: absolute; left: -150px; top: 250px; width: 580px; height: 580px; }
    #close-p2 { position: absolute; left: 1490px; top: 250px; width: 580px; height: 580px; }
    #close-c { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    #close-c .close-h { font-size: 132px; }
    #close-c .close-s { font-size: 236px; line-height: 0.8; }
    #close-mark { margin-top: 64px; font-size: 30px; letter-spacing: 0.34em; text-transform: uppercase; color: rgba(255,246,234,0.8); }`,
`      <div id="close-glow"></div>
      <img id="close-p1" src="assets/plate-milkcake.png" alt="">
      <img id="close-p2" src="assets/plate-brownie.png" alt="">
      <div id="close-c">
        <div class="close-h"><div class="close-mask"><span id="close-l1">Baked with love,</span></div></div>
        <div class="close-mask"><span id="close-l2" class="close-s">craved forever!</span></div>
        <div id="close-mark">avocado&amp;brownies</div>
      </div>`,
`      tl.fromTo("#close-w", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
      tl.fromTo("#close-p1", { x: -520, rotation: -200 }, { x: 0, rotation: -30, duration: 1.8, ease: "expo.out" }, 0.1);
      tl.fromTo("#close-p2", { x: 520, rotation: 200 }, { x: 0, rotation: 30, duration: 1.8, ease: "expo.out" }, 0.2);
      tl.fromTo("#close-p1", { rotation: -30 }, { rotation: 6, duration: 3.1, ease: "none", immediateRender: false }, 1.9);
      tl.fromTo("#close-p2", { rotation: 30 }, { rotation: -6, duration: 3.0, ease: "none", immediateRender: false }, 2.0);
      tl.fromTo("#close-l1", { yPercent: 115 }, { yPercent: 0, duration: 1.2, ease: "expo.out" }, 0.5);
      tl.fromTo("#close-l2", { yPercent: 115 }, { yPercent: 0, duration: 1.3, ease: "expo.out" }, 0.7);
      tl.fromTo("#close-mark", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 1.5);
      tl.fromTo("#close-glow", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1.1, duration: 4.5, ease: "power1.out" }, 0.2);`);

for (const [k, v] of Object.entries(S)) fs.writeFileSync(`compositions/${k}.html`, v);

const slots = [['open', 0, 3.4], ['maga', 3.1, 4.6], ['magb', 7.4, 4.0], ['bra', 11.1, 4.6], ['brb', 15.4, 4.4], ['close', 19.5, 5.0]];
fs.writeFileSync('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #000; }
      #root { position: relative; width: 1920px; height: 1080px; background: #000; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="24.5" data-width="1920" data-height="1080">
${slots.map(([id, s, d], i) => `      <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${s}" data-duration="${d}" data-track-index="${i + 1}" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index:${i + 1}"></div>`).join('\n')}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`);
console.log('ok');
