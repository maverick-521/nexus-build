/*!
 * Nexus Studio site assistant — demo (personal project)
 * Answers only from the Nexus Studio site's own content (bundled below by build/make_widget.py).
 * No API key, no backend, no tracking, no storage: everything runs in the visitor's browser.
 *
 * Drop-in usage (floating launcher, bottom right):
 *   <script src="nexus-chat.js" defer></script>
 * Options (data-* attributes on the script tag):
 *   data-mode="inline" data-target="#el"  mount inside an element instead of floating
 *   data-open="true"                      start with the panel open
 *   data-source-base="https://…/"         prefix for "From the site" links (default: same page, e.g. #faq)
 *   data-contact="#contact"               where "Get in touch" goes (default: #contact on the same page)
 */
(function () {
  'use strict';
  var KB = {"source":"Nexus Studio site (index.html), extracted by build_kb.py","siteUrl":"https://maverick-521.github.io/nexus-build/","contactUrl":"https://x.com/nexusstudiohq","chunks":[{"id":"svc-ai","type":"service","section":"build","title":"AI assistants & LLM integrations","outcome":"An assistant that answers from your own docs, data and tools.","includes":["Custom GPT-style assistant or chat widget","Answers grounded in your documents (RAG), with sources","Connected to your site, app, Slack or Telegram","Usage limits, logging and a handover guide"],"turnaround":"1–2 weeks","price":"$450","kw":"ai chatbot chat bot assistant gpt llm rag widget openai support bot customer service faq bot"},{"id":"svc-video","type":"service","section":"build","title":"Short-form video editing","outcome":"Reels, TikToks and Shorts cut to hold attention past the first second.","includes":["Hook-first edits from your raw footage","Captions, music, b-roll and brand styling","Vertical, square and widescreen exports","Pack of 3 edits, with one revision round each"],"turnaround":"2–4 days","price":"$90","kw":"video edit editing reels tiktok shorts youtube clips footage captions ugc"},{"id":"svc-social","type":"service","section":"build","title":"Social media content & management","outcome":"A steady, on-brand feed without you writing every post.","includes":["Monthly content plan for two platforms","12 designed posts with captions and hashtags","Scheduling and profile clean-up","Monthly report on reach and engagement"],"turnaround":"Monthly, starts in 5–7 days","price":"$250 per month","kw":"social media instagram posts content management feed monthly manage accounts"},{"id":"svc-web","type":"service","section":"build","title":"Websites, landing pages & web apps","outcome":"A fast site or tool that explains what you do and turns visitors into enquiries.","includes":["Custom design and responsive build","Landing pages, dashboards and internal tools","Analytics, forms and a clean admin where needed","Hosting, domain, HTTPS and deployment handled"],"turnaround":"1–4 weeks","price":"$350","kw":"website site web landing page web app dashboard internal tool homepage portfolio build"},{"id":"svc-seo","type":"service","section":"build","title":"SEO audit & content","outcome":"More of the right people finding you on Google and in AI search.","includes":["Technical and on-page SEO audit","Fixes to titles, speed, schema and structure","Keyword plan for your services or products","Two search-ready blog articles to start"],"turnaround":"5–7 days","price":"$150","kw":"seo google search ranking rank audit keywords blog articles traffic"},{"id":"svc-shop","type":"service","section":"build","title":"Shopify store setup","outcome":"A clean store that is ready to take orders, not just a theme install.","includes":["Theme setup and brand styling","Up to 20 products, collections and navigation","Payments, shipping, taxes and policies","Apps for reviews, email capture and upsells"],"turnaround":"5–10 days","price":"$300","kw":"shopify store shop ecommerce e-commerce online store products sell selling dropshipping"},{"id":"svc-brand","type":"service","section":"build","title":"Logo & brand kit","outcome":"A simple, confident identity you can use everywhere.","includes":["Three logo concepts, refined into one","Colour palette and type pairing","Social profile and favicon set","One-page brand guide with all source files"],"turnaround":"3–5 days","price":"$150","kw":"logo brand branding identity brand kit design colours colors fonts guide"},{"id":"svc-email","type":"service","section":"build","title":"Email marketing setup","outcome":"Automated emails that welcome, follow up and win back customers.","includes":["Klaviyo or Mailchimp account setup","Welcome, abandoned-cart and win-back flows","Branded templates that work on mobile","Sign-up form, list clean-up and tracking"],"turnaround":"3–5 days","price":"$180","kw":"email marketing newsletter klaviyo mailchimp flows abandoned cart"},{"id":"svc-auto","type":"service","section":"build","title":"Automation, bots & data","outcome":"Hours of copy-paste replaced by workflows, bots and data that run themselves.","includes":["Zapier, Make or n8n workflows and API integrations","Telegram or Discord bots with admin controls","Scrapers and data pipelines to Sheets or a database","Error alerts, logs and a one-page runbook"],"turnaround":"3–10 days","price":"$150","kw":"automation automate zapier make n8n workflow bots telegram discord scraper scraping data pipeline api integration"},{"id":"other","type":"text","section":"build","title":"Something else?","text":"Ads setup, blog content, browser extensions, API work. Get in touch and we will say honestly if it is a fit.","kw":"other something else ads blog extension extensions api custom"},{"id":"pricenote","type":"pricelist","section":"pricing","title":"Starting prices","text":"Prices are starting points in USD. Final quote after a short scope chat.","kw":"price prices pricing cost costs how much rates rate charge fee fees budget cheap expensive quote list all services"},{"id":"pricing","type":"text","section":"pricing","title":"Pricing","text":"Every “from” price is for a small, well-defined version of that service. The final quote comes after a short scope chat, in writing, before any work starts.","points":["Quote first: Scope, price and timeline agreed before we begin.","No silent extras: If the scope changes, we quote the change first.","Yours at handover: Source files and code, setup notes and a walkthrough.","Set in USD: GBP and EUR figures on this page are approximate conversions."],"kw":"price quote quotes pricing extras hidden fees scope change currency usd gbp eur pounds euros dollars"},{"id":"samples","type":"samples","section":"samples","title":"Samples","points":["Self-initiated concept edits, not client work. Footage, music and sound effects from Mixkit, used under its free licence.","Small working concepts we built for this page to show how we think about interfaces. Sample data only. These are not client projects."],"kw":"portfolio examples example samples sample work reviews review testimonials testimonial clients client past previous case studies showreel reel results proof"},{"id":"process","type":"text","section":"process","title":"Process","text":"Four steps. No surprises.","points":["Scope chat: A short call or message thread. You tell us the outcome you want; we ask the questions that matter.","Written quote: Scope, price and a realistic timeline in writing, before any work starts.","Build in the open: Small, working pieces and regular updates, so you see it running early.","Hand over: Source files, code, setup notes and a walkthrough, so it keeps running without us."],"kw":"process steps how does it work how do you work workflow start begin procedure"},{"id":"why","type":"text","section":"why","title":"Why Nexus Studio","text":"No borrowed logos, no invented numbers. Just the way we work, written down so you can hold us to it.","points":["A quote before any work: Scope, price and date in writing. You decide with everything on the table.","You talk to the people building it: No hand-offs to someone you have never met. Questions reach the person doing the work.","Made for you, not a template: Every piece is designed around your brand, your audience and the outcome you want.","You see it early: Small working pieces and regular updates, so nothing arrives as a surprise at the end.","Yours, fully: Files, code, accounts and notes are handed over. Nothing stays locked to us.","Honest about fit: If something is not right for us, or not worth your money, we say so before you pay."],"kw":"why choose you different trust who are you team studio people talk to builder"},{"id":"faq-1","type":"faq","section":"faq","title":"How long does a project take?","text":"Each service above shows a typical turnaround. Small, well-defined jobs usually take days; larger builds take a few weeks. Your written quote includes a delivery date before anything starts.","kw":"how long time timeline turnaround deadline fast quick days weeks deliver delivery when ready"},{"id":"faq-2","type":"faq","section":"faq","title":"How many revisions are included?","text":"The number of revision rounds is written into every quote, so you know it up front. If a change grows the scope, we quote it first. Nothing is added silently.","kw":"revisions revision changes change edits amend rounds feedback"},{"id":"faq-3","type":"faq","section":"faq","title":"How do I pay?","text":"Payment terms, including how and when you pay, are agreed in the written quote before any work starts.","kw":"pay payment paying deposit invoice upfront card paypal bank methods"},{"id":"faq-4","type":"faq","section":"faq","title":"Who owns the finished work?","text":"You do, once the project is paid. Source files, code, setup notes and any accounts we created are handed over. Nothing stays locked to us.","kw":"own ownership rights copyright files source code ip handover"},{"id":"faq-5","type":"faq","section":"faq","title":"Can you work with the tools I already use?","text":"Usually, yes. We build on what you already have where it makes sense, and tell you plainly when something else would serve you better.","kw":"tools existing platform already use integrate stack wordpress wix squarespace"},{"id":"faq-6","type":"faq","section":"faq","title":"What do you need from me to start?","text":"A few lines about the outcome you want, any examples you like, and your deadline. We take it from there with a short scope chat.","kw":"need start requirements brief information get started begin"},{"id":"contact","type":"contact","section":"contact","title":"Contact","text":"Pick what you need, message us on X with a few lines, and we will come back with questions and a quote.","kw":"contact get in touch hire message talk human person reach email call phone book enquiry enquire x twitter dm"}]};
  var MARK = "M67.50 600.00 L67.50 266.74 C68.76 268.26 70.00 269.80 71.27 271.31 C72.54 272.82 73.83 274.32 75.13 275.81 C76.43 277.30 77.74 278.78 79.06 280.25 C80.39 281.71 81.73 283.16 83.08 284.60 C84.43 286.05 85.80 287.47 87.17 288.89 C88.55 290.31 89.94 291.71 91.34 293.11 C92.74 294.50 94.16 295.88 95.58 297.25 C97.00 298.62 98.44 299.98 99.89 301.33 C101.33 302.67 102.79 304.01 104.26 305.33 C105.72 306.65 107.20 307.97 108.69 309.27 C110.18 310.57 111.68 311.86 113.18 313.13 C114.69 314.41 116.21 315.68 117.73 316.93 C119.26 318.19 120.80 319.43 122.34 320.67 C123.88 321.90 125.43 323.12 126.99 324.33 C128.56 325.55 130.12 326.75 131.70 327.94 C133.28 329.13 134.86 330.31 136.45 331.49 C138.04 332.66 139.64 333.82 141.25 334.97 C142.85 336.12 144.46 337.27 146.08 338.40 C147.70 339.53 149.33 340.66 150.96 341.77 C152.59 342.89 154.22 344.00 155.87 345.09 C157.51 346.19 159.16 347.28 160.81 348.36 C162.47 349.44 164.13 350.52 165.79 351.58 C167.45 352.65 169.12 353.71 170.79 354.76 C172.47 355.81 174.14 356.86 175.83 357.89 C177.51 358.93 179.19 359.96 180.88 360.99 C182.57 362.01 184.27 363.03 185.96 364.04 C187.66 365.06 189.36 366.06 191.06 367.07 C192.76 368.07 194.47 369.07 196.18 370.06 C197.89 371.05 199.60 372.04 201.31 373.03 C203.02 374.01 204.74 374.99 206.46 375.97 C208.17 376.95 209.89 377.92 211.61 378.90 C213.33 379.87 215.05 380.84 216.78 381.81 C218.50 382.78 220.22 383.74 221.95 384.71 C223.67 385.67 225.39 386.64 227.12 387.60 C228.84 388.57 230.57 389.53 232.29 390.50 C234.02 391.46 235.74 392.43 237.46 393.40 C239.18 394.37 240.91 395.33 242.63 396.31 C244.35 397.28 246.07 398.25 247.78 399.23 C249.50 400.21 251.21 401.20 252.92 402.18 C254.64 403.17 256.35 404.16 258.05 405.16 C259.76 406.16 261.46 407.16 263.15 408.18 C264.85 409.19 266.54 410.21 268.23 411.24 C269.92 412.26 271.60 413.30 273.28 414.35 C274.95 415.39 276.62 416.45 278.29 417.52 C279.95 418.59 281.61 419.66 283.25 420.76 C284.90 421.85 286.54 422.95 288.16 424.07 C289.79 425.19 291.41 426.33 293.02 427.48 C294.62 428.63 296.22 429.79 297.80 430.98 C299.39 432.16 300.96 433.36 302.51 434.58 C304.07 435.80 305.61 437.03 307.13 438.29 C308.66 439.55 310.17 440.82 311.66 442.12 C313.15 443.42 314.62 444.73 316.08 446.07 C317.53 447.41 318.97 448.77 320.38 450.15 C321.79 451.53 323.19 452.93 324.56 454.35 C325.93 455.78 327.28 457.22 328.60 458.69 C329.93 460.15 331.23 461.64 332.51 463.15 C333.78 464.65 335.04 466.18 336.26 467.73 C337.49 469.28 338.69 470.85 339.87 472.44 C341.05 474.02 342.20 475.63 343.32 477.25 C344.45 478.88 345.55 480.52 346.62 482.18 C347.69 483.84 348.74 485.52 349.76 487.21 C350.78 488.90 351.77 490.61 352.74 492.33 C353.71 494.06 354.65 495.79 355.56 497.55 C356.48 499.30 357.37 501.06 358.23 502.84 C359.10 504.62 359.93 506.41 360.75 508.21 C361.56 510.01 362.35 511.82 363.11 513.64 C363.88 515.46 364.61 517.30 365.33 519.14 C366.04 520.98 366.73 522.83 367.40 524.69 C368.07 526.55 368.71 528.42 369.34 530.30 C369.96 532.17 370.55 534.06 371.13 535.95 C371.71 537.84 372.26 539.73 372.79 541.64 C373.32 543.54 373.83 545.45 374.32 547.36 C374.81 549.28 375.28 551.20 375.73 553.12 C376.17 555.05 376.60 556.98 377.01 558.91 C377.41 560.84 377.80 562.78 378.16 564.72 C378.53 566.67 378.87 568.61 379.20 570.56 C379.52 572.51 379.83 574.46 380.12 576.42 C380.40 578.37 380.67 580.33 380.91 582.29 C381.16 584.25 381.39 586.22 381.59 588.18 C381.79 590.15 381.98 592.11 382.13 594.08 C382.29 596.05 382.38 598.03 382.50 600.00 L450.00 600.00 L450.00 0.00 L382.50 0.00 L382.50 333.26 C381.24 331.74 380.00 330.20 378.73 328.69 C377.46 327.18 376.17 325.68 374.87 324.19 C373.57 322.70 372.26 321.22 370.94 319.75 C369.61 318.29 368.27 316.84 366.92 315.40 C365.57 313.95 364.20 312.53 362.83 311.11 C361.45 309.69 360.06 308.29 358.66 306.89 C357.26 305.50 355.84 304.12 354.42 302.75 C353.00 301.38 351.56 300.02 350.11 298.67 C348.67 297.33 347.21 295.99 345.74 294.67 C344.28 293.35 342.80 292.03 341.31 290.73 C339.82 289.43 338.32 288.14 336.82 286.87 C335.31 285.59 333.79 284.32 332.27 283.07 C330.74 281.81 329.20 280.57 327.66 279.33 C326.12 278.10 324.57 276.88 323.01 275.67 C321.44 274.45 319.88 273.25 318.30 272.06 C316.72 270.87 315.14 269.69 313.55 268.51 C311.96 267.34 310.36 266.18 308.75 265.03 C307.15 263.88 305.54 262.73 303.92 261.60 C302.30 260.47 300.67 259.34 299.04 258.23 C297.41 257.11 295.78 256.00 294.13 254.91 C292.49 253.81 290.84 252.72 289.19 251.64 C287.53 250.56 285.87 249.48 284.21 248.42 C282.55 247.35 280.88 246.29 279.21 245.24 C277.53 244.19 275.86 243.14 274.17 242.11 C272.49 241.07 270.81 240.04 269.12 239.01 C267.43 237.99 265.73 236.97 264.04 235.96 C262.34 234.94 260.64 233.94 258.94 232.93 C257.24 231.93 255.53 230.93 253.82 229.94 C252.11 228.95 250.40 227.96 248.69 226.97 C246.98 225.99 245.26 225.01 243.54 224.03 C241.83 223.05 240.11 222.08 238.39 221.10 C236.67 220.13 234.95 219.16 233.22 218.19 C231.50 217.22 229.78 216.26 228.05 215.29 C226.33 214.33 224.61 213.36 222.88 212.40 C221.16 211.43 219.43 210.47 217.71 209.50 C215.98 208.54 214.26 207.57 212.54 206.60 C210.82 205.63 209.09 204.67 207.37 203.69 C205.65 202.72 203.93 201.75 202.22 200.77 C200.50 199.79 198.79 198.80 197.08 197.82 C195.36 196.83 193.65 195.84 191.95 194.84 C190.24 193.84 188.54 192.84 186.85 191.82 C185.15 190.81 183.46 189.79 181.77 188.76 C180.08 187.74 178.40 186.70 176.72 185.65 C175.05 184.61 173.38 183.55 171.71 182.48 C170.05 181.41 168.39 180.34 166.75 179.24 C165.10 178.15 163.46 177.05 161.84 175.93 C160.21 174.81 158.59 173.67 156.98 172.52 C155.38 171.37 153.78 170.21 152.20 169.02 C150.61 167.84 149.04 166.64 147.49 165.42 C145.93 164.20 144.39 162.97 142.87 161.71 C141.34 160.45 139.83 159.18 138.34 157.88 C136.85 156.58 135.38 155.27 133.92 153.93 C132.47 152.59 131.03 151.23 129.62 149.85 C128.21 148.47 126.81 147.07 125.44 145.65 C124.07 144.22 122.72 142.78 121.40 141.31 C120.07 139.85 118.77 138.36 117.49 136.85 C116.22 135.35 114.96 133.82 113.74 132.27 C112.51 130.72 111.31 129.15 110.13 127.56 C108.95 125.98 107.80 124.37 106.68 122.75 C105.55 121.12 104.45 119.48 103.38 117.82 C102.31 116.16 101.26 114.48 100.24 112.79 C99.22 111.10 98.23 109.39 97.26 107.67 C96.29 105.94 95.35 104.21 94.44 102.45 C93.52 100.70 92.63 98.94 91.77 97.16 C90.90 95.38 90.07 93.59 89.25 91.79 C88.44 89.99 87.65 88.18 86.89 86.36 C86.12 84.54 85.39 82.70 84.67 80.86 C83.96 79.02 83.27 77.17 82.60 75.31 C81.93 73.45 81.29 71.58 80.66 69.70 C80.04 67.83 79.45 65.94 78.87 64.05 C78.29 62.16 77.74 60.27 77.21 58.36 C76.68 56.46 76.17 54.55 75.68 52.64 C75.19 50.72 74.72 48.80 74.27 46.88 C73.83 44.95 73.40 43.02 72.99 41.09 C72.59 39.16 72.20 37.22 71.84 35.28 C71.47 33.33 71.13 31.39 70.80 29.44 C70.48 27.49 70.17 25.54 69.88 23.58 C69.60 21.63 69.33 19.67 69.09 17.71 C68.84 15.75 68.61 13.78 68.41 11.82 C68.21 9.85 68.02 7.89 67.87 5.92 C67.71 3.95 67.62 1.97 67.50 0.00 L0.00 0.00 L0.00 600.00 L67.50 600.00Z";
  if (!KB || window.__nexusChat) return;
  window.__nexusChat = true;

  var me = document.currentScript || document.querySelector('script[src*="nexus-chat"]');
  var opt = function (k, d) { return (me && me.getAttribute('data-' + k)) || d; };
  var MODE = opt('mode', 'float');
  var SRC_BASE = opt('source-base', '');
  var CONTACT = opt('contact', '#contact');
  var LABEL = 'Demo — personal project. Answers only from this site\u2019s content.';
  var SECTION_NAMES = { build: 'What we build', samples: 'Samples', edits: 'Recent edits', pricing: 'Pricing', process: 'Process', why: 'Why Nexus Studio', faq: 'Questions', contact: 'Contact' };

  /* ---------- retrieval: BM25 over the site's own chunks ---------- */
  var STOP = ('a an the and or but if of to in on at for with from by as is are was were be been being do does did doing ' +
    'i me my we our you your yours it its this that these those can could would should will shall may might must ' +
    'have has had having what which who whom whose when where why how there here then than so not no yes please ' +
    'about any some all just also very really into out up down over under again more most other such only own same ' +
    'too s t don now get got want wanted need like would know tell let us them they their he she him her hi hello hey thanks thank').split(' ');
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });
  var SYN = { cost: 'price', costs: 'price', pricing: 'price', prices: 'price', priced: 'price', charge: 'price', fee: 'price', fees: 'price', rate: 'price', rates: 'price', budget: 'price', cheap: 'price', expensive: 'price',
    ecommerce: 'shopify', 'e-commerce': 'shopify', webshop: 'shopify', shop: 'shopify',
    chatbot: 'chat', chatbots: 'chat', bot: 'bot', bots: 'bot', website: 'website', websites: 'website', site: 'website', sites: 'website',
    logos: 'logo', branding: 'brand', colour: 'colour', color: 'colour', colours: 'colour', colors: 'colour',
    timeline: 'turnaround', timeframe: 'turnaround', deadline: 'turnaround', long: 'turnaround', fast: 'turnaround', quick: 'turnaround', quickly: 'turnaround',
    revision: 'revision', revisions: 'revision', amendments: 'revision', amend: 'revision', changes: 'revision',
    pay: 'payment', paying: 'payment', paid: 'payment', payments: 'payment', invoice: 'payment', deposit: 'payment' };
  function stem(w) {
    if (SYN[w]) return SYN[w];
    if (w.length > 5 && /ing$/.test(w)) w = w.slice(0, -3);
    else if (w.length > 4 && /ies$/.test(w)) w = w.slice(0, -3) + 'y';
    else if (w.length > 4 && /es$/.test(w) && !/(ss|us)es$/.test(w)) w = w.slice(0, -1);
    else if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) w = w.slice(0, -1);
    return SYN[w] || w;
  }
  function tokens(s) {
    return (s || '').toLowerCase().replace(/[\u2018\u2019']/g, '').replace(/&/g, ' and ')
      .split(/[^a-z0-9$\-]+/).filter(function (w) { return w.length > 1 && !STOPSET[w]; }).map(stem);
  }
  function docText(c) {
    return [c.title, c.title, c.title, c.kw, c.kw, c.outcome, (c.includes || []).join(' '), c.text, (c.points || []).join(' ')].join(' ');
  }
  var docs = KB.chunks.map(function (c) { var t = tokens(docText(c)); var tf = {}; t.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; }); return { c: c, tf: tf, len: t.length }; });
  var N = docs.length, avg = docs.reduce(function (a, d) { return a + d.len; }, 0) / N, df = {};
  docs.forEach(function (d) { Object.keys(d.tf).forEach(function (w) { df[w] = (df[w] || 0) + 1; }); });
  // words that actually appear in answer text (not the search-only keyword hints)
  var SITEVOCAB = {};
  KB.chunks.forEach(function (c) { tokens([c.title, c.outcome, (c.includes || []).join(' '), c.text, (c.points || []).join(' ')].join(' ')).forEach(function (w) { SITEVOCAB[w] = 1; }); });
  var GENERIC = {}; ('build make create help work job project business company small thing things something someone stuff good best new start '
    + 'done offer provide anything everything kind type sort able sure maybe also one two three day week month time').split(' ').forEach(function (w) { GENERIC[stem(w)] = 1; });
  function unknownTerms(q) {
    var seen = {}, out = [];
    (q || '').toLowerCase().replace(/[\u2018\u2019']/g, '').split(/[^a-z0-9\-]+/).forEach(function (raw) {
      if (!raw || raw.length < 4 || STOPSET[raw] || /^\d/.test(raw)) return;
      var w = stem(raw); if (SITEVOCAB[w] || GENERIC[w] || RXWORDS[w] || seen[w]) return;
      seen[w] = 1; out.push(raw);
    });
    return out;
  }
  var RXWORDS = {}; 'price turnaround payment revision does much long cost costs charge'.split(' ').forEach(function (w) { RXWORDS[stem(w)] = 1; });
  function idf(w) { return Math.log(1 + (N - (df[w] || 0) + 0.5) / ((df[w] || 0) + 0.5)); }
  function search(q) {
    var qt = tokens(q), uniq = {}; qt.forEach(function (w) { uniq[w] = 1; });
    var res = docs.map(function (d) {
      var s = 0, hits = [];
      Object.keys(uniq).forEach(function (w) {
        var f = d.tf[w]; if (!f) return;
        hits.push(w);
        s += idf(w) * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * d.len / avg));
      });
      return { c: d.c, score: s, hits: hits };
    }).sort(function (a, b) { return b.score - a.score; });
    return { q: qt, res: res };
  }

  /* ---------- answer composition (text copied from the site only) ---------- */
  var RX = {
    greet: /^\s*(hi|hello|hey|hiya|good (morning|afternoon|evening)|yo)\b[\s!.?]*$/i,
    thanks: /^\s*(thanks|thank you|cheers|ta|great|ok(ay)?|cool|perfect)\b[\s!.?]*$/i,
    human: /\b(are|r) (you|u) (a )?(human|real|person|bot|robot|ai|machine|chatgpt)\b|\bwho am i (talking|speaking|chatting) (to|with)\b|\bis this (a )?(bot|human|person|real)\b/i,
    handover: /\b(speak|talk|chat) (to|with) (a |an |someone|somebody|human|person|real|ibrahim|the team)|\b(human|real person|someone real|agent)\b.*\b(please|help)?|\bcontact (you|details|info)|\bget in touch\b|\bhire (you|someone)\b/i,
    services: /\bwhat (services|do you (do|offer|build|make)|can you (do|build|make|help))\b|\b(list|all) (of )?(your |the )?services\b|\bwhat.*\boffer\b/i,
    allPrices: /\b(price list|all (your |the )?prices|your prices|your rates|how much do you charge|what do you charge|pricing)\b/i,
    price: /\b(price|prices|cost|costs|how much|charge|fee|fees|rate|rates|budget|\$|£|€)\b/i,
    time: /\b(how long|turnaround|timeline|time frame|timeframe|deadline|how fast|how quick|how soon|days|weeks|when.*(ready|done|finished|deliver))\b/i,
    start: /\b(what do you need|need from me|how do (i|we) (start|begin|get started)|how to (start|begin|get started)|get started)\b/i,
    currency: /\b(gbp|eur|pounds?|euros?|sterling|£|€|currency|currencies)\b/i
  };
  function svcLine(c) { return c.title + ': from ' + c.price + ' (' + c.turnaround.charAt(0).toLowerCase() + c.turnaround.slice(1) + ')'; }
  function compose(q) {
    q = String(q || '').replace(/<[^>]*>/g, ' ');
    var out = { parts: [], sources: [], contact: false, chips: null };
    function src(sec) { if (out.sources.indexOf(sec) < 0) out.sources.push(sec); }
    var svcs = KB.chunks.filter(function (c) { return c.type === 'service'; });

    if (RX.greet.test(q)) {
      out.parts.push({ p: 'Hello! I\u2019m an automated assistant for Nexus Studio, not a person. Ask me about services, starting prices, turnaround, the process or the FAQs, and I\u2019ll answer from this site\u2019s content.' });
      out.chips = ['What do you build?', 'How much is a Shopify store?', 'How do I pay?'];
      return out;
    }
    if (RX.human.test(q)) {
      out.parts.push({ p: 'I\u2019m an automated assistant, not a human. I\u2019m a demo that only repeats what\u2019s written on this site. If you\u2019d like to talk to the person who does the work, use Get in touch below.' });
      out.contact = true; return out;
    }
    if (RX.thanks.test(q)) { out.parts.push({ p: 'You\u2019re welcome. Anything else about services, prices or the process?' }); return out; }

    var r = search(q), top = r.res[0];
    var svcHits = r.res.filter(function (x) { return x.c.type === 'service' && x.score > 0; });
    var priceQ = RX.price.test(q), timeQ = RX.time.test(q);
    var bestSvc = svcHits[0] && svcHits[0].score >= 1.6 ? svcHits[0] : null;
    if (RX.start.test(q) && !priceQ) { var f6 = KB.chunks.filter(function (c) { return c.id === 'faq-6'; })[0]; if (f6) top = { c: f6, score: 99 }; bestSvc = null; }
    if (RX.services.test(q)) { // "what services do you offer" should list, unless a specific service is named
      var r2 = search(q.replace(/\b(services?|offer(s|ing)?|do|build|make|help)\b/gi, ' ')).res.filter(function (x) { return x.c.type === 'service'; })[0];
      if (!r2 || r2.score < 1.6) bestSvc = null;
    }
    if (bestSvc && top && top.c.type !== 'service' && top.score > bestSvc.score * 1.3 && !priceQ) bestSvc = null;

    if (RX.handover.test(q) && !bestSvc) {
      var ct = KB.chunks.filter(function (c) { return c.id === 'contact'; })[0];
      out.parts.push({ p: 'You can reach a person directly. From the site: \u201c' + ct.text + '\u201d' });
      src('contact'); out.contact = true; return out;
    }
    if (RX.services.test(q) && !bestSvc && !(top && top.c.type === 'samples')) {
      out.parts.push({ p: 'Nexus Studio lists nine services on this site:' });
      out.parts.push({ list: svcs.map(svcLine) });
      out.parts.push({ p: KB.chunks.filter(function (c) { return c.id === 'pricenote'; })[0].text });
      src('build'); out.chips = ['Tell me about Shopify', 'How long does a project take?', 'What\u2019s the process?']; return out;
    }
    if (RX.currency.test(q) && !bestSvc) {
      out.parts.push({ p: 'Prices are set in USD. From the site: \u201cGBP and EUR figures on this page are approximate conversions.\u201d You can switch the currency in the \u201cWhat we build\u201d section. How you pay is agreed in the written quote before any work starts.' });
      src('pricing'); return out;
    }
    if ((RX.allPrices.test(q) || (priceQ && !bestSvc)) ) {
      out.parts.push({ p: 'Starting prices from the site:' });
      out.parts.push({ list: svcs.map(svcLine) });
      out.parts.push({ p: KB.chunks.filter(function (c) { return c.id === 'pricing'; })[0].text });
      src('build'); src('pricing'); out.contact = true; return out;
    }
    if (bestSvc && (!top || top.c.type === 'service' || bestSvc.score >= top.score * 0.8 || priceQ)) {
      var picks = [bestSvc];
      if (svcHits[1] && svcHits[1].score >= bestSvc.score * 0.8) picks.push(svcHits[1]);
      var unk = unknownTerms(q);
      if (unk.length) out.parts.push({ p: 'I can\u2019t find \u201c' + unk.join('\u201d or \u201c') + '\u201d on the site, so here\u2019s the closest service it lists. A person can confirm whether it fits your project.' });
      picks.forEach(function (h) {
        var c = h.c;
        if (priceQ) {
          out.parts.push({ p: c.title + ' starts from ' + c.price + '. Typical turnaround: ' + c.turnaround.charAt(0).toLowerCase() + c.turnaround.slice(1) + '.' });
          out.parts.push({ p: c.outcome + ' Included:' });
        } else if (timeQ) {
          out.parts.push({ p: c.title + ': typical turnaround ' + c.turnaround.charAt(0).toLowerCase() + c.turnaround.slice(1) + ' (from ' + c.price + ').' });
          out.parts.push({ p: c.outcome + ' Included:' });
        } else {
          out.parts.push({ h: c.title });
          out.parts.push({ p: c.outcome + ' From ' + c.price + '. Typical turnaround: ' + c.turnaround.charAt(0).toLowerCase() + c.turnaround.slice(1) + '.' });
          out.parts.push({ p: 'Included:' });
        }
        out.parts.push({ list: c.includes });
      });
      out.parts.push({ p: timeQ && !priceQ ? 'Your written quote includes a delivery date before anything starts.' : 'That\u2019s a starting price for a small, well-defined version. The final quote comes after a short scope chat, in writing, before any work starts.' });
      src('build'); out.contact = true; return out;
    }
    // generic chunks (FAQ, process, pricing, why, other)
    var THRESH = 2.2;
    if (top && top.score >= THRESH) {
      var c = top.c;
      if (c.type === 'faq') { out.parts.push({ h: c.title }); out.parts.push({ p: c.text }); out.contact = true; }
      else if (c.id === 'process') { out.parts.push({ p: 'The process on the site has four steps:' }); out.parts.push({ list: c.points, ol: true }); }
      else if (c.type === 'samples') {
        out.parts.push({ p: 'The site doesn\u2019t show client reviews, testimonials or client projects. What it does show is labelled as concept work:' });
        out.parts.push({ list: c.points }); src('edits');
      }
      else if (c.id === 'why') { out.parts.push({ p: c.text }); out.parts.push({ list: c.points }); }
      else if (c.id === 'pricing') { out.parts.push({ p: c.text }); out.parts.push({ list: c.points }); }
      else if (c.id === 'contact') { out.parts.push({ p: c.text }); out.contact = true; }
      else { out.parts.push({ p: 'That isn\u2019t one of the nine services listed, but the site says, under \u201c' + c.title + '\u201d: \u201c' + c.text + '\u201d' }); out.contact = true; }
      src(c.section);
      if (c.id === 'faq-1') out.chips = ['How long does a Shopify store take?', 'How long does a website take?'];
      return out;
    }
    out.parts.push({ p: 'Sorry, I couldn\u2019t find that on this site. I can only answer from Nexus Studio\u2019s own pages: services, starting prices, turnaround, the process and the FAQs. For anything else, a person can help you directly.' });
    out.contact = true; out.fallback = true;
    out.chips = ['What do you build?', 'Your prices', 'How do I pay?'];
    return out;
  }

  /* ---------- UI ---------- */
  var CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box;margin:0;padding:0}',
    '.nx{--bg:#030409;--bg2:#0b1325;--frost:#f2f8ff;--ice:#a9cbe8;--mist:#8592a6;--sap:#5480b2;--txt:#c3cdda;--line:rgba(190,208,230,.14);',
    ' font:400 15px/1.55 "General Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--txt);-webkit-font-smoothing:antialiased}',
    '.launch{position:fixed;right:20px;bottom:20px;z-index:2147483000;display:flex;align-items:center;gap:10px;height:52px;padding:0 20px 0 16px;border-radius:999px;border:1px solid rgba(169,203,232,.35);',
    ' background:linear-gradient(180deg,rgba(84,128,178,.28),rgba(84,128,178,.1)),#0b1325;color:var(--frost);font:600 15px/1 "General Sans",system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.45),inset 0 1px 0 rgba(242,248,255,.12)}',
    '.launch:hover{border-color:rgba(169,203,232,.6)}',
    '.launch svg{width:16px;height:21px}',
    '.launch[aria-expanded="true"]{display:none}',
    ':focus-visible{outline:2px solid var(--ice);outline-offset:2px}',
    '.panel{display:flex;flex-direction:column;background:linear-gradient(180deg,#0b1325,#030409);border:1px solid var(--line);border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.55),inset 0 1px 0 rgba(242,248,255,.06)}',
    '.float .panel{position:fixed;right:20px;bottom:20px;z-index:2147483001;width:380px;height:min(620px,calc(100vh - 40px))}',
    '.float .panel[hidden]{display:none}',
    '.nx.inline{height:100%}',
    '.inline .panel{width:100%;height:100%;min-height:480px}',
    '.hd{display:flex;align-items:center;gap:12px;padding:14px 14px 12px 16px;border-bottom:1px solid var(--line)}',
    '.av{flex:none;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:#0b1325;border:1px solid var(--line)}',
    '.av svg{width:15px;height:20px}',
    '.ttl{flex:1;min-width:0}',
    '.ttl b{display:block;font:600 16px/1.2 "Clash Display","General Sans",system-ui,sans-serif;color:var(--frost);letter-spacing:.01em}',
    '.ttl span{display:block;font-size:12.5px;color:var(--mist);margin-top:2px}',
    '.x{flex:none;width:36px;height:36px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--frost);font-size:20px;line-height:1;cursor:pointer}',
    '.inline .x{display:none}',
    '.demo{margin:0;padding:8px 16px;font-size:12.5px;line-height:1.4;color:var(--ice);background:rgba(84,128,178,.12);border-bottom:1px solid var(--line)}',
    '.log{flex:1;min-height:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#2a3a55 transparent}',
    '.m{max-width:88%;padding:10px 13px;border-radius:16px;font-size:14.5px;overflow-wrap:anywhere}',
    '.m.bot{align-self:flex-start;background:rgba(242,248,255,.05);border:1px solid var(--line);border-bottom-left-radius:6px}',
    '.m.me{align-self:flex-end;background:rgba(84,128,178,.34);border:1px solid rgba(84,128,178,.6);color:var(--frost);border-bottom-right-radius:6px}',
    '.m p+p,.m p+ul,.m ul+p,.m p+ol,.m ol+p{margin-top:7px}',
    '.m .q{font:600 14.5px/1.35 "General Sans",system-ui,sans-serif;color:var(--frost)}',
    '.m ul,.m ol{padding-left:18px}',
    '.m li+li{margin-top:3px}',
    '.src{margin-top:8px;font-size:12px;color:var(--mist)}',
    '.src a{color:var(--ice);text-decoration:underline;text-underline-offset:2px}',
    '.cta{display:inline-flex;align-items:center;gap:6px;margin-top:9px;padding:8px 14px;border-radius:999px;background:var(--frost);color:#030409;font:600 13.5px/1 "General Sans",system-ui,sans-serif;text-decoration:none}',
    '.cta:hover{background:#fff}',
    '.chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px}',
    '.chip{padding:7px 11px;border-radius:999px;border:1px solid rgba(169,203,232,.3);background:rgba(84,128,178,.1);color:var(--frost);font:500 13px/1.2 "General Sans",system-ui,sans-serif;cursor:pointer}',
    '.chip:hover{background:rgba(84,128,178,.22)}',
    '.f{display:flex;gap:8px;padding:12px;border-top:1px solid var(--line)}',
    '.f label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}',
    '.f input{flex:1;min-width:0;height:44px;padding:0 14px;border-radius:12px;border:1px solid var(--line);background:#030409;color:var(--frost);font:400 16px/1 "General Sans",system-ui,sans-serif}',
    '.f input::placeholder{color:var(--mist)}',
    '.f button{flex:none;height:44px;padding:0 16px;border-radius:12px;border:0;background:var(--frost);color:#030409;font:600 14px/1 "General Sans",system-ui,sans-serif;cursor:pointer}',
    '.typing{display:inline-flex;gap:4px}.typing i{width:6px;height:6px;border-radius:50%;background:var(--mist);animation:b 1s infinite}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}',
    '@keyframes b{0%,80%,100%{opacity:.3}40%{opacity:1}}',
    '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}',
    '@media (max-width:520px){.float .panel{right:0;bottom:0;left:0;top:0;width:auto;height:auto;border-radius:0;border:0}.launch{right:14px;bottom:14px}}',
    '@media (prefers-reduced-motion:reduce){.typing i{animation:none;opacity:.7}}'
  ].join('\n');

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function markSvg() {
    var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg'), p = document.createElementNS(ns, 'path');
    s.setAttribute('viewBox', '0 0 450 600'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    p.setAttribute('fill', '#F2F8FF'); p.setAttribute('d', MARK); s.appendChild(p); return s;
  }

  function mount() {
    var host = document.createElement('div');
    host.setAttribute('data-nexus-chat', '');
    var target = MODE === 'inline' ? document.querySelector(opt('target', '#nexus-chat')) : null;
    (target || document.body).appendChild(host);
    if (target) host.style.cssText = 'display:block;height:100%';
    var root = host.attachShadow({ mode: 'open' });
    var st = el('style'); st.textContent = CSS; root.appendChild(st);
    var wrap = el('div', 'nx ' + (target ? 'inline' : 'float')); root.appendChild(wrap);
    var uid = 'nxc' + Math.random().toString(36).slice(2, 7);

    var launch = el('button', 'launch'); launch.type = 'button';
    launch.setAttribute('aria-controls', uid); launch.setAttribute('aria-expanded', 'false');
    launch.appendChild(markSvg()); launch.appendChild(el('span', null, 'Ask about Nexus'));
    if (!target) wrap.appendChild(launch);

    var panel = el('section', 'panel'); panel.id = uid;
    panel.setAttribute('role', target ? 'region' : 'dialog');
    panel.setAttribute('aria-label', 'Nexus Studio site assistant (demo)');
    if (!target) panel.hidden = true;
    var hd = el('div', 'hd'), av = el('div', 'av'); av.appendChild(markSvg()); hd.appendChild(av);
    var ttl = el('div', 'ttl'); ttl.appendChild(el('b', null, 'Nexus site assistant')); ttl.appendChild(el('span', null, 'Automated · not a person'));
    hd.appendChild(ttl);
    var x = el('button', 'x', '\u00d7'); x.type = 'button'; x.setAttribute('aria-label', 'Close assistant'); hd.appendChild(x);
    panel.appendChild(hd);
    panel.appendChild(el('p', 'demo', LABEL));
    var log = el('div', 'log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite'); log.setAttribute('aria-label', 'Conversation'); log.tabIndex = 0;
    panel.appendChild(log);
    var chips = el('div', 'chips'); chips.setAttribute('aria-label', 'Suggested questions'); chips.setAttribute('role', 'group'); panel.appendChild(chips);
    var form = el('form', 'f'); form.setAttribute('autocomplete', 'off');
    var lab = el('label', null, 'Ask a question about Nexus Studio'); lab.htmlFor = uid + 'q';
    var inp = el('input'); inp.id = uid + 'q'; inp.type = 'text'; inp.maxLength = 300; inp.placeholder = 'Ask about services, prices, process…'; inp.setAttribute('enterkeyhint', 'send');
    var send = el('button', null, 'Send'); send.type = 'submit';
    form.appendChild(lab); form.appendChild(inp); form.appendChild(send); panel.appendChild(form);
    wrap.appendChild(panel);

    function srcHref(sec) { return SRC_BASE + '#' + sec; }
    function contactHref() { return CONTACT; }
    function scroll() { log.scrollTop = log.scrollHeight; }
    function setChips(list) {
      chips.textContent = '';
      (list || []).forEach(function (t) { var b = el('button', 'chip', t); b.type = 'button'; b.addEventListener('click', function () { ask(t); }); chips.appendChild(b); });
    }
    function bot(ans) {
      var m = el('div', 'm bot');
      m.appendChild(el('span', 'sr', 'Assistant: '));
      ans.parts.forEach(function (pt) {
        if (pt.h) m.appendChild(el('p', 'q', pt.h));
        if (pt.p) m.appendChild(el('p', null, pt.p));
        if (pt.list) { var ul = el(pt.ol ? 'ol' : 'ul'); pt.list.forEach(function (li) { ul.appendChild(el('li', null, li)); }); m.appendChild(ul); }
      });
      if (ans.sources.length) {
        var s = el('p', 'src'); s.appendChild(document.createTextNode('From the site: '));
        ans.sources.forEach(function (sec, i) {
          if (i) s.appendChild(document.createTextNode(' · '));
          var a = el('a', null, SECTION_NAMES[sec] || sec); a.href = srcHref(sec);
          if (SRC_BASE) { a.target = '_blank'; a.rel = 'noopener'; }
          s.appendChild(a);
        });
        m.appendChild(s);
      }
      if (ans.contact) {
        var c = el('a', 'cta'); c.href = contactHref(); c.appendChild(document.createTextNode('Get in touch'));
        c.appendChild(el('span', null, '\u2192')).setAttribute('aria-hidden', 'true');
        if (/^https?:/.test(c.href) && contactHref().charAt(0) !== '#') { c.target = '_blank'; c.rel = 'noopener'; }
        c.addEventListener('click', function () { if (contactHref().charAt(0) === '#' && !target) close(); });
        m.appendChild(c);
      }
      log.appendChild(m); setChips(ans.chips); scroll();
    }
    function ask(q) {
      q = (q || '').trim().slice(0, 300); if (!q) return;
      var m = el('div', 'm me'); m.appendChild(el('span', 'sr', 'You: ')); m.appendChild(document.createTextNode(q)); log.appendChild(m);
      setChips(null);
      var t = el('div', 'm bot'); t.setAttribute('aria-hidden', 'true'); var ty = el('span', 'typing'); ty.appendChild(el('i')); ty.appendChild(el('i')); ty.appendChild(el('i')); t.appendChild(ty);
      log.appendChild(t); scroll();
      var ans = compose(q);
      setTimeout(function () { t.remove(); bot(ans); }, window.__nexusChatInstant ? 0 : 350);
      return ans;
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); var q = inp.value; inp.value = ''; ask(q); });
    function open() { panel.hidden = false; launch.setAttribute('aria-expanded', 'true'); setTimeout(function () { inp.focus(); }, 30); }
    function close() { if (target) return; panel.hidden = true; launch.setAttribute('aria-expanded', 'false'); launch.focus(); }
    launch.addEventListener('click', open); x.addEventListener('click', close);
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    bot({ parts: [{ p: 'Hi, I\u2019m an automated assistant (not a person). I answer questions about Nexus Studio using only what\u2019s written on this site. What would you like to know?' }],
      sources: [], contact: false, chips: ['What do you build?', 'How much is a Shopify store?', 'How many revisions?', 'How do I pay?'] });
    if (target || opt('open', '') === 'true') { panel.hidden = false; launch.setAttribute('aria-expanded', 'true'); }

    window.NexusChat = { ask: ask, open: open, close: close, answer: compose };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
