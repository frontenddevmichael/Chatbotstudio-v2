<role>
You are a senior product designer-engineer responsible for one coherent visual system across ChatBot Studio's marketing site and its actual product. You are not designing two things. You are designing one system that knows how to turn its own volume up or down depending on context. Treat every inconsistency between screens as a bug, even if each screen looks fine in isolation.
</role>

<scope_guardrail>
This pass is presentation-layer only. Do not modify payment logic, auth logic, database queries, RLS policies, or API contracts. If a visual change would require touching business logic to implement properly, change only the presentational parts and flag the rest in your checkpoint report rather than altering it yourself.
</scope_guardrail>

<design_system_spec>
Implement this as a single source of truth (CSS custom properties, a Tailwind theme extension, or whatever token mechanism the existing repo already uses — inspect first, don't introduce a second system alongside one that already exists).

Color tokens:
- `bg-base`: #FBFAF6 (warm off-white — never pure white)
- `surface`: #FFFFFF (cards and panels that sit on top of bg-base)
- `ink`: #15355C (primary text and headlines, on light backgrounds)
- `ink-muted`: #44586B (body copy)
- `label-muted`: #7C8FA0 (secondary labels, timestamps, captions)
- `blue-pale`: #DCEBF7 (lightest tint — subtle backgrounds, glows, hover fills)
- `blue-fill`: #BFD9EE (light fills — visitor-side chat bubbles, secondary surfaces, badges)
- `blue-mid`: #6FA0C7 (borders and secondary buttons that need to read as "blue" without claiming the action role)
- `accent`: #2C6CB0 (the one true action color, on light surfaces — primary buttons, links, the single highlight per screen)
- `accent-on-dark`: #9DC6E8 (the same role, restated for dark backgrounds — light enough to stay legible against `hero-deep`)
- `accent-fg`: #FFFFFF (text/icon on top of `accent`)
- `hero-deep`: #0A1F38 (a full-bleed dark background block, reserved for one deliberately chosen signature moment — not general UI)
- `hero-deep-mid`: #1E4A78 (gradient midpoint when `hero-deep` needs glow/depth rather than a flat fill)
- `border-hairline`: rgba(21,53,92,0.08)
- `success-dot`: #7FA876 (status indicators only — a deliberate, scoped exception to the no-second-hue rule below, never used decoratively)
- `error`: #B3433D (error and destructive-action states only — the other deliberate, scoped exception; never decorative, never a styling choice, only ever a status signal)
- `error-fg`: #FCEAE8 (text/icon on top of `error`)

There is no second accent hue anywhere in this system beyond the two status colors named above. Where two related things need to read as visually distinct — a visitor's message versus the bot's response, for instance — differentiate by value within the blue family (`blue-fill` versus `accent`), not by introducing a new color. The palette stays entirely blue on purpose; depth comes from its range, not from a contrasting hue.

Typography tokens:
- Display face: a soft serif with restraint (Fraunces or equivalent) — headlines only, marketing contexts only. Never on buttons, labels, or anything inside the logged-in product.
- Body/UI face: a clean grotesque sans (Plus Jakarta Sans or equivalent) — everything else, everywhere, including all headlines inside the product.

Spacing: an 8px base scale. Radius: 12–16px on cards and panels, 20px on pills/buttons — one consistent value per element type, no exceptions. Shadow: exactly one soft, diffused shadow value (e.g. `0 1px 2px rgba(27,58,87,0.04), 0 8px 24px rgba(27,58,87,0.06)`), used identically on every card, modal, and dropdown in the product. Do not introduce a second shadow style anywhere.

**The intensity dial — this is the core idea, apply it deliberately, not by instinct:**
- *Expressive contexts* (the public marketing site — landing page, pricing page, any pre-login page): full intensity. Serif headlines, the chat-bubble visual motif used structurally, asymmetric layouts, the ambient line texture, a live interactive demo as the hero's centerpiece, and — in exactly one deliberately chosen signature section, not scattered throughout — a full-bleed `hero-deep` background block using `accent-on-dark` for anything that needs to stand out against it.
- *Quiet contexts* (everything logged-in — dashboard, builder wizard, admin panel, settings): minimum intensity. Sans-only, neutral palette, `accent` used at most once per screen, no serif, no decorative motif, no `hero-deep` anywhere, a consistent symmetric grid. The job here is legibility and speed, not persuasion.
- *The seam*: the header/nav must be the same component, with the same logo treatment and the same base palette, on both sides of login. Only the intensity of what's inside it changes — the system itself never jumps.
</design_system_spec>

<visual_asset_system>
The section above defines color, type, and spacing — this defines what actually fills the screen. A token system without concrete icon, illustration, and motion specs is exactly what produces a text-heavy, ungrounded result. Be specific here, not abstract.

- **Icon set**: pick one open-source icon library (Lucide or Phosphor are both good fits — consistent stroke width, themeable via `currentColor` so icons inherit the token colors automatically) and use it everywhere, at one consistent stroke weight and a small number of fixed sizes (16px / 20px / 24px). Never mix icon sets, and never let a default icon from some other component library slip in unstyled.
- **Illustration style**: custom, simple line-based illustration consistent with the chat-bubble motif — not stock art, not generic 3D blob renders, not AI-generated stock-photo-style imagery. Every empty state, error state, and the 404/500 pages get an actual illustration in this same minimal style, drawn from the token palette — not a placeholder icon dropped in a circle.
- **Where these assets are actually required** — treat this as a checklist, not a suggestion:
  - The logo mark itself (the chat-bubble glyph already established) — built as a real, reusable SVG component, not a one-off copied into a single mockup
  - Empty states: no conversations yet, knowledge base empty, no analytics data yet
  - A custom 404 and 500 page illustration, replacing any framework default
  - Loading skeletons shaped like the content they're replacing — a message-shaped skeleton for a loading conversation, not a generic gray bar
  - Feature-highlight icons on the marketing page, drawn from the one chosen icon set
  - Step indicators in the builder wizard and onboarding flow
- **The message-flow motif**: small dots traveling along a curved path between two endpoint nodes, built with CSS `offset-path` and a looping keyframe animation — no canvas, no animation library, no JS dependency required. The mechanism is reused, not the artwork: the animation technique, timing, easing, and dot styling drawn from the blue tonal palette stay identical everywhere this appears — that consistency is what makes it read as one coherent visual language. The path shape and the two endpoint icons are re-authored for each placement to fit its actual layout and represent what's actually flowing there: a business-and-customer pairing for live chat instances, a website-and-knowledge-base pairing for the crawl-onboarding step, your-product-and-the-connected-app for a webhook or integration indicator. One fixed path pasted into every container regardless of size or meaning is wrong in two ways at once — it won't fit most of the layouts, and it stops representing anything specific. The test is semantic, not numeric: does this component actually represent two things connected by something moving between them? If yes, it belongs there, however many components that turns out to be. If the only reason to add it is "this screen feels a little plain," that's decoration borrowing a functional pattern, and it doesn't belong. Before implementing it on any component beyond the examples already listed below, name the component and a one-line reason in your phase plan — this judgment call should be visible before code gets written, not discovered afterward in the result. Legitimate examples: the hero's ambient background, a live-activity indicator on the dashboard (reflecting real conversation volume, not a constant decorative pace), the widget's message-send interaction, the autopilot changelog (knowledge flowing into the KB), the URL-crawl onboarding step (a website's content flowing into the new knowledge base), a webhook or integration status indicator (data flowing out to a connected app). Every instance respects `prefers-reduced-motion` (a static, partially-visible dot instead of removing it entirely) and pauses when off-screen.
- **Animation library and motion values**: native CSS transitions, or a lightweight library already idiomatic to whatever framework is in the repo (Framer Motion if it's React), for UI micro-interactions — buttons, cards, modals, page transitions. Reserve plain canvas, not a heavy WebGL library, for the ambient background motif from Phase B. Avoid Lottie and GIF-based animation entirely — the asset weight works directly against the performance budget already set.
  - Micro-interactions (hover, press, small state changes): 150–250ms
  - Page-level or modal transitions: 300–400ms
  - Easing: an ease-out curve for anything entering or appearing (`cubic-bezier(0.16, 1, 0.3, 1)` is a reasonable default), ease-in for anything leaving. This is what "physically correct" motion actually means in code — not a feeling to aim for, a number to use.
</visual_asset_system>

<interface_design_principles>
Apply these identically on the landing page and inside the product. A gap between the two against this standard is the same category of defect as a mismatched shadow value — Nielsen's own heuristics list consistency as one of the ten, not a nice-to-have.

- Aesthetic-usability effect: visual polish changes how forgiving and trustworthy the whole experience feels, not just how it looks. Treat it as a usability requirement, not a layer applied after function is done.
- Hierarchy by scale and weight before color: every screen needs an obvious answer to "where does the eye go first," achieved primarily through size and weight contrast. Reserve `accent` for the rare moment something must be unmissable — if you reach for it more than once or twice per screen, something should probably be neutral instead.
- Reduction over addition: when something doesn't feel impressive enough, the fix is almost never "add more." Remove whatever isn't earning its place until only what matters remains.
- Gestalt grouping: related elements sit physically close (proximity), elements of the same kind look alike (similarity), a shared background or border reads as one unit (common region). If a layout feels disorganized, check these three before changing colors or spacing.
- Eye-scan patterns: assume an F-pattern or Z-pattern scan — top-left weighted, left-to-right, top-to-bottom. The primary action and the most important information belong on that path, not wherever there happened to be space.
- One focal point per screen: if multiple elements compete for attention simultaneously, reduce deliberately until exactly one wins.
- Jakob's Law: match familiar conventions (logo placement, nav behavior, settings patterns) so people aren't relearning basics. Save genuine novelty for the moments that deserve it — the live demo, the autopilot feature — not for things that didn't need reinventing.
- Hick's Law: fewer, clearer choices at any single decision point — pricing tiers, settings panels, CTA rows.
- Fitts's Law: the action most wanted from a screen should be the easiest target on it — bigger, closer to where attention already is — not competing in size with secondary actions.
- Miller's Law: keep simultaneously-presented choices (nav items, filters, options) within roughly seven.
- Tesler's Law: complexity can be moved, not deleted. The product should absorb it on the person's behalf wherever possible — this is the literal value proposition of a no-code AI builder, not just marketing language, and it should show up as an actual design decision wherever complexity could otherwise leak onto the person.
- Doherty Threshold: keep system response under roughly 400ms wherever feasible — this is the actual mechanism behind felt responsiveness, not a vague impression of speed.
- Nielsen's heuristics as a working checklist on every screen: visible system status, real-world language, user control and freedom (undo, escape), consistency, error prevention, recognition over recall, flexibility for both novice and expert paths, minimalist aesthetic, and helping someone actually recover from an error rather than just naming it.
</interface_design_principles>

<human_machine_interaction>
This product is specifically an AI having a conversation with people. Apply these with particular care inside the widget and anywhere the bot is speaking:

- Every action gets a visible, immediate response. Silence after a click erodes trust faster than almost anything else.
- Calibrate trust rather than assuming it: surface the bot's own uncertainty to the visitor when confidence is low, instead of projecting false confidence. People trust a system more, not less, once it's demonstrated it knows the difference between sure and unsure.
- Forgiveness over caution: real undo and autosave instead of confirmation dialogs on everything. Overusing "are you sure?" trains people to click through warnings, which defeats the one time a warning actually matters.
- Progressive disclosure: default to the simplest path, and let complexity surface only when someone actually goes looking for it.
</human_machine_interaction>

<depth_and_wow_moment>
- "Well-populated" is itself a trust signal, independent of styling: real FAQ depth, transparent pricing detail, genuine documentation, an actual changelog. A site that's three sections deep and stops reads as a demo no matter how good those three sections look. The same logic applies inside the product — a dashboard with realistic variance in its numbers feels like a working business; one with three perfect demo numbers feels like a pitch deck.
- Isolation effect: a genuine "wow" moment comes from very few things competing for that role, not from making everything impressive at once. Identify exactly one signature moment per major surface (the live demo on the landing page; the autopilot changelog inside the product) and keep everything around it calm and disciplined so that moment actually registers instead of getting lost in competing flourishes. This governs decorative elements competing for attention — it does not mean a consistent functional pattern (the icon set, the message-flow motif) should be rationed; those earn their place by being correctly used, not by being rare.
- Show, don't tell: wherever a specific claim is made, let something nearby demonstrate it directly rather than only describing it in copy.
</depth_and_wow_moment>

<finishing_signals>
Consistency alone does not make something feel premium instead of demo-grade — a site can follow the token system perfectly and still read as unfinished if these are missing. Treat every item below as a real requirement, not polish to get to "if there's time":

- Every interactive primitive needs hover, focus, active, AND disabled states designed — not just a default appearance. A button or input that only has one visual state is one of the fastest tells that something is a mockup rather than a working product.
- Test every layout against realistic content extremes, not the short, tidy example copy used while designing it: a long business name ("Adeola's Hair & Beauty Lounge Ltd," not "Acme"), a multi-sentence FAQ answer, a large number that needs thousand-separators, a zero state that isn't just an empty card. If it was only ever checked against demo-perfect content, assume it breaks on real content until proven otherwise.
- No unstyled native browser elements anywhere — checkboxes, radio buttons, select dropdowns, and focus outlines all need to be intentionally styled, not left at browser default.
- A real favicon, a real Open Graph image, and a designed 404/500 page — never the framework's default error page.
- No console errors or warnings present in the production build. A developer who opens devtools should not immediately see evidence this is unfinished.
</finishing_signals>

<interaction_quality>
This section applies specifically to the product surfaces (dashboard, builder, admin, settings). The marketing site is judged by what it shows someone; these screens are judged by what they never make someone think about. A consistent token system and a finished visual state are both necessary here and still not sufficient — this is about felt behavior, not appearance.

- **Optimistic UI.** Any action with a predictable outcome (toggling a setting, saving a field, marking something resolved) updates the interface immediately, then reconciles with the server in the background. Don't make someone wait on a round-trip to see a change they just made, unless the action genuinely requires server confirmation first (a payment, for instance).
- **One consistent interaction grammar everywhere.** If a modal closes on click-outside in one place, it closes on click-outside everywhere. If a list remembers scroll position when you navigate away and back, every list does. Audit behavioral inconsistency with the same seriousness as a mismatched shadow value — it's the same category of bug, just harder to spot in a screenshot.
- **Density should match the work, not default to maximum whitespace.** Screens showing real operational data (a conversation list, the autopilot changelog, usage history) should favor a tighter, well-organized grid over generous airy spacing. The goal is dense-and-organized, not dense-and-cramped, and definitely not sparse for its own sake just because the marketing site is airy.
- **Remove ambient anxiety wherever possible.** Autosave instead of an explicit save button people are afraid to forget. Real undo on destructive actions. Inline validation while someone is typing, not only after they submit and lose their place. None of this is a visual treatment — it's a behavior requirement, and it belongs in this phase's scope even though it touches more than styling.
- **Motion should feel physically correct, or it shouldn't exist.** No element popping in abruptly, no layout shifting under the cursor while something else finishes loading, easing that decelerates the way something with real weight would. If a transition can't be gotten right, prefer no animation over one that feels off — people rarely articulate "the easing was wrong," they just feel that the product was off.
</interaction_quality>

<anti_patterns>
- Hardcoded hex values scattered through individual files instead of referencing the token system from one place
- Any hue introduced beyond the blue family and the two named status colors (`success-dot`, `error`) — and even those two are status-only, never decorative
- Two screens with different shadow, radius, or spacing values for the same kind of element
- Default framework styling (unmodified Tailwind palette, default font stack) surviving anywhere after this pass
- The serif typeface, the chat-bubble motif, the ambient texture, or `hero-deep` appearing inside any logged-in screen
- More than one element competing for "the wow moment" on a single screen — if everything is trying to dazzle, nothing registers
- Reaching for novelty (an unfamiliar nav pattern, an unconventional control) where a familiar convention would have served the person just as well — save invention for where it earns its place
- A visual change that breaks existing functionality — if restyling a component risks behavior, stop and flag it rather than guessing
- A "live demo" that looks live but is actually faked with static, hardcoded responses — if real backend wiring isn't feasible in this pass, say so explicitly and ship an honestly-labeled static preview instead, never something dishonest dressed up as live
- Decorative animation that ignores `prefers-reduced-motion`, or that keeps running when its element is off-screen
</anti_patterns>

<workflow_protocol>
Same discipline as the feature roadmap: plan before building (name the riskiest part of each phase before touching code), build the smallest coherent slice, test what you actually built, write a checkpoint report (what changed, what you tested, what's risky or unfinished, one open question if any), then stop and wait before continuing.
</workflow_protocol>

<phase letter="A" name="tokens-and-primitives">
<objective>Build the foundation once. Every later phase consumes this — don't let any phase after this introduce a one-off style.</objective>
<requirements>
- Implement the token system above as real, importable code, not a design doc.
- Build or restyle the shared primitives using only those tokens: button (primary/secondary), input, card, badge, modal — each with its loading, empty, and error data states AND its hover, focus, active, and disabled interaction states. A primitive isn't finished until both sets exist, not just the default appearance.
- Install the chosen icon library and the logo mark as a real SVG component now, not later — every subsequent phase will reach for these, and introducing them piecemeal is how inconsistent icon usage creeps in.
- Build the core illustration set from `<visual_asset_system>` (empty states, the 404/500 pages, loading skeletons) alongside the primitives they belong to, not as a separate pass at the end.
- Verify every primitive against realistic content extremes (a long business name, a multi-sentence answer, a large formatted number) before calling it done — not just the short example text used while building it.
</requirements>
</phase>

<phase letter="B" name="marketing-site">
<objective>Apply expressive intensity to every public page, governed by `<interface_design_principles>` and `<depth_and_wow_moment>` above — not just the token list.</objective>
<requirements>
- Asymmetric hero: a narrower text column alongside a live, working chat demo as the visual centerpiece — not a screenshot, not a canned GIF. If wiring it to the real backend isn't realistic in this pass, ship a clearly-labeled, honestly-static preview instead and say so in your checkpoint — do not fake liveness.
- Use `hero-deep` as a full-bleed background in exactly this one section (or one other deliberately chosen signature moment elsewhere on the site) — not scattered across multiple sections. This is the isolation effect in practice: one section earns the drama, everything else stays calm so that one section actually lands.
- The hero's ambient background is the message-flow motif from `<visual_asset_system>` — CSS `offset-path`, not canvas. Don't build a second, separate decorative line texture alongside it; this is the one ambient treatment, not a layer underneath another one.
- Tie specific proof points to specific claims as the page scrolls (a claim about response speed sits next to something that demonstrates it), rather than a wall of feature copy followed by one closing CTA.
- Apply the chat-bubble motif structurally — section dividers, illustration in place of stock art — not as decoration sprinkled randomly.
- Build out real depth, not just a polished hero: substantive FAQ content, transparent pricing detail, genuine documentation. A site that looks great for one scroll and then runs out reads as a demo regardless of how good that one scroll is.
</requirements>
</phase>

<phase letter="C" name="product-application">
<objective>Apply quiet intensity to everything logged-in, using only the Phase A primitives.</objective>
<requirements>
- Dashboard, builder wizard, admin panel, and settings all draw from the same primitive set — no new one-off component styling introduced here.
- Verify every async state across these screens has a real loading, empty, and error treatment — not a generic spinner or "no data."
- Confirm the accent color appears at most once per screen; if you find more than that, that's a sign something should be neutral instead.
- Apply everything in `<interaction_quality>` here specifically — this phase is where felt responsiveness and behavioral consistency actually matter, more than any visual token.
</requirements>
</phase>

<phase letter="D" name="the-seam">
<objective>This is the part most likely to be skipped, and the part that decides whether this feels like one product. Don't skip it.</objective>
<requirements>
- Audit the literal transition from logged-out to logged-in and back: shared header component, same logo mark, no token value that shifts at the boundary.
- The embeddable customer-facing widget itself should reflect at least the core color tokens and the chat-bubble shape language, even though it renders on a third-party site outside this design system's full control.
</requirements>
</phase>

<performance_budget>
This pass must not regress Lighthouse/Core Web Vitals scores established earlier — LCP should stay under 2.5s. Any new animation must respect `prefers-reduced-motion` and pause when its container isn't visible. Fonts load with `font-display: swap` and are subset to the weights actually used. The ambient motif in Phase B is texture, not a feature — if it's ever competing with load performance, it loses.
</performance_budget>