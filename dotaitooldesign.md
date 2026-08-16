# dotai Digital Product Design System

Status: Product style guide, version 1.2, Cyan-Fuchsia Syncretic Vector Edition  
Parent system: `dotai-design.md`, version 1.1 and later  
Applies to: Design Decode, dotai Academy, Not a Guru and future dotai digital products  
Reference repositories: `xKevIsDev/GenUAI` and `magicuidesign/magicui`  

## 1. Purpose

This guide translates the dotai identity into working digital products. The website can argue, introduce and perform. A tool has to hold attention across repeated use, preserve a person's work and explain what the system is doing.

Every dotai product should feel related before its logo appears. The relation comes from:

- dotai cyan as the primary product colour, with fuchsia as the permanent accent
- Strong monochrome structure
- Monospaced operational type
- Visible sources, annotations and edits
- Hard-edged panels instead of soft SaaS cards
- Computational vectors and motion woven through the interface
- Users positioned as interpreters, not recipients

The system should feel like a research table wired into a living visual instrument: part annotated publication, part experimental animation, part precise AI workspace. It needs edge. It should be enjoyable before it becomes familiar and remain usable after the novelty leaves.

## 2. Product principles

### 2.1 Interpretation before automation

The interface should help a person see, compare, question and revise. Do not collapse interpretation into a single score or answer.

### 2.2 Show the grounds

Every consequential output should reveal its sources, model inference, uncertainty, user edits and revision history. Evidence is part of the interface, not a compliance drawer.

### 2.3 Preserve agency

Users can change the prompt, context, source set and output. They can undo, compare, export and remove their material. A generated result is always editable.

### 2.4 Productive friction

Ask for judgement where judgement matters. Confirm destructive actions. Surface contradictions. Do not remove every pause in the name of speed.

### 2.5 Structured energy

Repeated work still needs rhythm, character and surprise. Stable controls sit inside an active field of cyan vectors interrupted by fuchsia accents, changing geometries, hard-edged panels and purposeful motion. The system does not divide itself into a quiet “serious product” and an expressive “creative layer”. Expression is built into navigation, chat, progress, evidence and transition states.

### 2.6 Mobile-first, task-aware

Begin public and lightweight flows at 360-390 px. Expand deliberately for larger workspaces. Image comparison, corpus management, code inspection and dense annotation may require tablet or desktop layouts. Never hide this requirement.

### 2.7 Anti-extractive by default

Record who supplied a source, what permission covers it, how it may be used and how it can be withdrawn. Credit intellectual and cultural labour inside the product.

### 2.8 Progressive depth

Use the strongest lesson from the Smashing Magazine Gen Z reference: quick entry does not require shallow content. Every screen should offer an immediate action or reading, then deeper evidence, method and technical detail. Users may skim, explore or scrutinise without being forced into one pace.

## 3. Relationship to the dotai parent identity

`dotai-design.md` remains authoritative for the logo, editorial voice, core typography and ethical position. This tool system adds product states, interaction rules and a distinct accent hierarchy.

### 3.1 Cyan-fuchsia hierarchy

dotai cyan is the primary product colour. Fuchsia is always the accent.

- Use cyan for primary fields, structural lines, navigation states, open panels, progress tracks and the dominant body of vector forms.
- Use fuchsia for the exact point of intervention: primary action, current focus, active evidence, cursor, live annotation and the visual peak of an animation.
- Do not substitute product-specific accent colours for fuchsia.
- The official dotai logo retains its cyan contour and should feel continuous with the product field.
- Cyan and fuchsia may meet in gradients and line transitions, but they must not perform the same interface role.
- Semantic success, warning and error colours may appear only where meaning requires them.

## 4. Colour system

| Token | Value | Role |
| --- | --- | --- |
| `--dot-cyan` | `#00F1DE` | Primary product colour, fields, structural vectors |
| `--dot-cyan-dark` | `#007F76` | Accessible cyan text and rules on light fields |
| `--dot-cyan-soft` | `#C9FFF9` | Open panels, selected surfaces, quiet vector wash |
| `--dot-cyan-deep` | `#003D39` | Dark cyan field and inverse surfaces |
| `--dot-fuchsia` | `#FF00A8` | Canonical accent, decisive action, current focus, intervention |
| `--dot-fuchsia-dark` | `#A60063` | Accessible fuchsia text and rules on light fields |
| `--dot-fuchsia-soft` | `#FFD6EE` | Annotation wash and brief accent field |
| `--dot-fuchsia-deep` | `#4A002D` | Dark tinted panels |
| `--dot-ink` | `#090909` | Primary text and dark surfaces |
| `--dot-paper` | `#F7F5F0` | Warm reading surface |
| `--dot-white` | `#FFFFFF` | Canvas and inverse text |
| `--dot-grey-100` | `#EFEDE8` | Quiet surface |
| `--dot-grey-300` | `#C8C5BF` | Disabled structure and rules |
| `--dot-grey-600` | `#6B6965` | Secondary text |
| `--dot-success` | `#157A4A` | Confirmed completion |
| `--dot-warning` | `#A45A00` | Caution and unresolved state |
| `--dot-error` | `#B42318` | Failure and destructive action |

### 4.1 Accent discipline

Cyan establishes the product atmosphere and may occupy 10-30% of a normal screen through fields, rules and vectors. Fuchsia is the cut, spark or interruption and should usually occupy 2-6%. A decisive fuchsia screen or transition is allowed, but it must be brief and return to the cyan-led system.

Avoid fuchsia body copy on white. Use `--dot-fuchsia-dark` for small text. White or black text must be contrast-tested on every fuchsia surface. Colour never carries status alone.

### 4.2 Dark mode

Dark mode uses `--dot-ink` or `--dot-cyan-deep` as the field, off-white text, luminous cyan structure and fuchsia accents. It is a complete theme, not an inversion filter. Images, charts, code and annotations need dedicated dark states.

### 4.3 Spectral vector colour

The vector spectrum is anchored by cyan and punctuated by fuchsia. A form may travel from cyan through electric blue or dusty lilac, then peak in fuchsia and warm coral. Pale silver can carry receding structure. These colours belong inside the vector object. They do not become independent button, link or selection colours.

Approved supporting vector colours:

| Token | Value | Use |
| --- | --- | --- |
| `--vector-lilac` | `#9E7BFF` | Line depth and secondary trail |
| `--vector-blue` | `#3E6BFF` | Receding geometry |
| `--vector-coral` | `#FF6B61` | Warm transition inside a vector |
| `--vector-silver` | `#D9D8D2` | Wireframe structure on dark fields |

Every multicolour vector must contain a clear cyan body and a smaller fuchsia moment.

## 5. Typography

### 5.1 UI sans

Use IBM Plex Sans for controls, explanations and continuous reading.

```css
font-family: "IBM Plex Sans", Arial, sans-serif;
```

### 5.2 Operational mono

Use IBM Plex Mono for prompts, labels, metadata, source identifiers, timestamps, model states, code and compact headings.

```css
font-family: "IBM Plex Mono", "Courier New", monospace;
```

### 5.3 Editorial serif

Use Source Serif 4 for essays, reflective prompts, quotations and long Academy readings. Keep it outside dense control surfaces.

### 5.4 Product type scale

| Token | Desktop | Mobile | Use |
| --- | ---: | ---: | --- |
| `display` | 52 px | 38 px | Empty-state proposition, module opening |
| `h1` | 36 px | 30 px | Workspace title |
| `h2` | 26 px | 23 px | Major region |
| `h3` | 20 px | 19 px | Panel title |
| `body-lg` | 18 px | 18 px | Lead and generated answer |
| `body` | 16 px | 16 px | Default reading |
| `small` | 14 px | 14 px | Secondary information |
| `micro` | 12 px | 12 px | Metadata, never essential content |

Generated answers use a minimum 1.55 line height and a maximum line length of 72 characters.

## 6. Shape, rules and depth

- Panel radius: 0-4 px
- Control radius: 4 px
- Pill radius: reserved for tags, filters and status only
- Default rule: 1 px solid `--dot-grey-300`
- Active panel rule: 2 px solid `--dot-cyan`
- Annotation rule: 2 px dotted `--dot-fuchsia-dark`
- Shadow: none by default
- Elevated overlay: a short hard shadow, never a diffuse floating cloud

Hard edges keep the product connected to dotai's editorial identity. Use spacing and rules before shadows.

## 6.1 Syncretic vector language

The three supplied references establish the visual grammar.

1. Computational line forms: tunnels, wave fields, spirals, globes, toruses, parametric flowers and nested loops. These suggest thought as a changing relation, not a glowing brain.
2. Constructivist collisions: circles, wedges, spikes, starbursts, clipped gradients and abrupt overlaps. These give the tools editorial tension.
3. Modernist modular geometry: arcs, stripes, dots, semicircles and gridded assemblies. These stabilise the more fluid vectors and make them usable as layouts.

The synthesis is neither retro-futurist wallpaper nor austere Swiss modernism. Use a rational grid as the stage, then let one computational form bend, pierce or animate across it.

### 6.1.1 Core vector families

| Family | Geometry | Product meaning |
| --- | --- | --- |
| `Field` | Parallel waves, contour lines, nested arcs | Several readings held together |
| `Orbit` | Concentric loops, spirographs, toruses | Iteration, return, versioning |
| `Portal` | Perspective grids, nested arches, tunnels | Entering a source, lesson or deeper layer |
| `Pulse` | Four-point stars, asterisks, soft crosses | New insight, active tool, exact intervention |
| `Split` | Diverging curves, mirrored cones, hourglass forms | Competing positions or comparison |
| `Assembly` | Circles, wedges, dots, striped modules | A syllabus, corpus or multi-part artefact |

### 6.1.2 Construction rules

- Prefer vector line work to volumetric 3D rendering.
- Use 1-2 px lines at interface scale and 2-4 px in full-screen scenes.
- Let geometry crop against panels and viewport edges.
- Combine one fluid family with one modular family. Avoid a catalogue of shapes on one screen.
- Build with SVG, Canvas or lightweight CSS where practical.
- Keep decorative vectors outside the reading column and away from essential controls.
- Provide a static composition with the same hierarchy under reduced motion.

### 6.1.3 Product continuity

Each product receives a primary family, but all use the same construction logic:

- Design Decode: `Field` and `Orbit`
- dotai Academy: `Portal` and `Assembly`
- Not a Guru: `Split` and `Pulse`

This produces kinship without recolouring one template.

## 6.2 Vector behaviour

Vectors should react to product state.

- Idle: a slow 12-20 second drift, rotation or phase change
- Hover/focus: local line convergence within 160-240 ms
- Processing: geometry accumulates, travels or tightens around the active region
- Ready: one visible release, opening or alignment, then return to rest
- Error: motion stops or breaks its path; use semantic error text rather than recolouring the whole vector red
- User edit: the relevant strand changes course and persists in the next state

Mouse or device motion may create subtle parallax, capped at 8 px. Never require motion input to understand or use the interface.

## 7. Layout system

### 7.1 Breakpoints

| Range | Behaviour |
| --- | --- |
| 360-639 px | One primary region, drawers for secondary material |
| 640-1023 px | One main region plus optional inspector sheet |
| 1024-1439 px | Split workspace, resizable panels |
| 1440 px and above | Three-region workspace when the task requires it |

### 7.2 Workspace anatomy

Use a consistent product shell:

1. Product bar: dotai mark, product name, workspace title, save state and account
2. Context rail: sources, modules, history or projects
3. Main work surface: the current image, lesson, conversation or generated artefact
4. Inspector: evidence, properties, source detail, rubric or revision controls
5. Composer: prompt, response or action entry

On mobile, show the main surface first. Context and inspector become labelled sheets. Preserve state when panels open or close.

### 7.3 Density modes

Offer `Comfortable` and `Compact` modes for expert tools. Density changes spacing and row height, never font size below accessible minimums.

## 8. Shared navigation

- Product names remain visible. Do not reduce them to ambiguous icons.
- Use a left rail for persistent desktop navigation and a bottom bar only for three to five high-frequency mobile destinations.
- A Magic UI-style dock may be used on wide screens for optional creation tools. It must have labels, predictable order, keyboard access and no magnification when reduced motion is enabled.
- Keep global dotai navigation outside the task flow. A user should not accidentally leave a long analysis.
- Display save status using plain language: `Saving`, `Saved 14:32`, `Offline changes`, `Could not save`.

## 9. Prompt and input system

The GenUAI repository demonstrates a useful pattern: a prompt produces an editable artefact inside a live workspace. dotai should adopt that anatomy without adopting one-prompt mythology.

### 9.1 Composer

The composer may contain:

- A multiline prompt field
- Source attachment control
- Context scope selector
- Output form selector
- Optional advanced settings
- Primary action

Keep the primary field open and generous. Do not trap it in a tiny chat bar when the task requires thought.

### 9.2 Prompt assistance

Use suggestion chips as starting structures, not presumed intentions. A chip should insert editable text. Examples:

- `Compare two interpretations`
- `Show the visual evidence`
- `Question this assumption`
- `Turn this into a learning sequence`

Prompt rewriting must show the proposed revision before it is used. Provide `Use revision`, `Edit` and `Keep mine`.

### 9.3 Advanced settings

Hide model, temperature and context controls by default, but make them available to informed users. Describe their effect in ordinary language. Preserve settings with the saved run.

### 9.4 Signature chatbox

The chatbox is a central visual object across the product family. It should resemble an editorial workbench, not a messaging app.

#### Resting state

- Hard-edged or lightly clipped container with a 1 px ink rule and cyan lower edge
- One animated vector fragment entering from a corner or passing behind the composer
- Generous multiline field with a visible label
- Attach, source-scope and mode controls on a clear tool row
- Decisive send button distinguished by shape and fuchsia, rather than a generic paper-plane icon

#### Expanded state

The chatbox grows with the user's thought. On desktop it may widen into a split composer: prompt on the left, selected sources or output mode on the right. On mobile these become a stacked disclosure.

#### User turn

User prompts appear as full-width editorial strips with a cyan registration line, timestamp and edit action. The currently edited prompt receives a fuchsia cursor or corner mark. Avoid speech bubbles.

#### dotai turn

Responses sit on the paper field with a narrow animated `Field` vector in the margin. The vector resolves into evidence markers as sources arrive. Text remains still while its margin moves.

#### Tool activity

Tool calls appear as compact mono rows: `Reading source`, `Comparing image`, `Checking citation`. A cyan line travels through the active row with a fuchsia point at its leading edge. Completed activity folds into a persistent `Process` section.

#### Branching

Alternative directions emerge as offset panels joined by a `Split` vector. Users can follow, compare or fold a branch back into the main conversation.

| Product | Composer cue | Response behaviour |
| --- | --- | --- |
| Design Decode | Image thumbnail and region selector inside the composer | Evidence markers connect text to image coordinates |
| dotai Academy | Modes: `Ask`, `Try`, `Reflect`, `Critique` | Explanation alternates with small actions |
| Not a Guru | Opens with `What are you trying to understand?` | Response may split into positions rather than resolve too early |

Avoid glossy glass bubbles, floating mascot heads, anonymous typing dots, automatic scroll and fuchsia glow behind long text.

## 10. Generative workspace pattern

Adapt the strongest structural lessons from GenUAI:

- Prompt and output inhabit the same workspace.
- Generated material can be previewed and inspected.
- User edits become part of the next revision.
- Updates apply as visible differences, not unexplained replacement.
- History persists across sessions.
- Sharing creates an addressable snapshot with permission controls.
- Sandbox or processing errors appear in the workspace.

### 10.1 Run lifecycle

Every run moves through explicit states:

`Draft` → `Queued` → `Reading sources` → `Generating` → `Checking` → `Ready`

Failure states name the failed stage. Avoid a generic `Something went wrong` when the system knows more.

### 10.2 Streaming

Stream text only when partial content is useful. Keep the current paragraph visually stable. Do not scroll the user away from what they are reading. Provide `Stop` during generation and preserve the partial result.

### 10.3 Revision

- Keep the user's direct edits.
- Apply revisions as diffs where practical.
- Let users compare any two versions.
- Mark which passages were changed by the user, system or collaborator.
- Never regenerate the entire artefact when a bounded edit can be applied.

### 10.4 History

History records prompt, sources, settings, model/provider, output, edits, timestamp and cost or usage when relevant. A user can rename, duplicate, export or delete a run.

## 11. AI output anatomy

Every substantial output should support four layers.

### Layer 1: Answer

The direct response or artefact. It should be readable without opening technical detail.

### Layer 2: Evidence

Source title, author or owner, date, relevant excerpt and location. Selecting a claim highlights its supporting evidence.

### Layer 3: Interpretation

Assumptions, inference and alternative readings. Use language such as `The tool infers` rather than presenting inference as source fact.

### Layer 4: Process

Model, source scope, transformations, user edits and version history. Keep this available without making it mandatory reading.

### 11.1 Confidence

Avoid unexplained percentages. Prefer grounded labels:

- `Directly supported`
- `Supported across sources`
- `Interpretive`
- `Contested`
- `Source missing`

## 12. Source and annotation components

### Source card

Contains title, contributor, date, language, permission and last review. The card opens the original material at the cited location.

### Evidence chip

A compact numbered link between claim and source. Fuchsia indicates the currently inspected link.

### Annotation

Annotations are marginal by default on wide screens and inline on mobile. Each shows author, time and status: `Open`, `Resolved`, `Carried forward`.

### Permission label

Use explicit states: `Private`, `Team`, `Published`, `Teaching use`, `Restricted`, `Permission unknown`.

### Contradiction block

Place conflicting sources side by side. Do not force a synthetic agreement. Let users record their interpretation.

## 13. Component guidance from Magic UI

Magic UI provides open-source animated React components and effects for Next.js, Tailwind and shadcn-based interfaces. dotai may adapt selected patterns. Copying the component is the beginning of design work, not the end.

| Magic UI pattern | dotai use | Constraint |
| --- | --- | --- |
| Bento Grid | Module or project overview | Cards must represent unequal, real priorities; collapse to a linear mobile order |
| Animated Beam | Source-to-claim relation and chat activity | May cross a panel edge; endpoints must remain legible |
| Border Beam | Active processing boundary | Cyan beam with a short fuchsia head; static cyan rule under reduced motion |
| Shimmer Button | Primary generation action | Fuchsia-led sweep across a cyan/black control; becomes vector progress after activation |
| Marquee | Contributor or archive strip | Pause control required; avoid for testimonials, notices or essential content |
| Dock | Expert tool switcher | Desktop only; labels, tooltips, keyboard order and stable positions required |
| Text Reveal | Chapter, lesson and major tool-state opening | Full text remains accessible and selectable |

### 13.1 Effects as a native layer

Animated grids, orbiting lines, particles, blur transitions and number motion may enter core screens when they are translated into the dotai vector families. An orbit can hold versions. A grid can open a source. Particles can gather while a corpus is indexed. The effect must use cyan as its body, fuchsia as its active interruption, respond to state and resolve into useful structure. Generic rainbow borders, meteors and ambient techno spectacle remain outside the system.

### 13.2 Motion tokens

| Token | Duration | Use |
| --- | ---: | --- |
| `instant` | 80 ms | Press and local state |
| `fast` | 160 ms | Tooltip, hover, selection |
| `base` | 240 ms | Sheet, panel and disclosure |
| `slow` | 480 ms | Diagram relation or editorial reveal |

Use ease-out for entrances and ease-in for exits. Continuous motion must pause when off-screen, when the tab is hidden and when reduced motion is requested.

### 13.3 Choreography

Motion follows an editorial sequence rather than making everything move at once:

1. Frame: the panel or field enters
2. Vector: geometry draws, bends or converges
3. Content: type and controls appear
4. Evidence: sources, annotations or state labels lock into place

For exits, reverse the order. In chat, text begins only after the response frame is stable. In image analysis, the marked region appears before its explanatory line travels to the text.

### 13.4 Hero-to-tool continuity

A vector used in the entry screen should survive into the workspace in reduced form. The Academy portal can become the lesson-progress arc. The Design Decode orbit can become the annotation navigator. The Not a Guru split line can become the branching conversation map. This prevents the expressive opening from feeling like an unrelated splash screen.

## 14. Buttons and actions

Buttons should carry the same geometric intelligence as the vector system. They remain recognisable controls, but their edge, icon and hover state can bend the grid.

### 14.1 Primary: Vector Cut

Black field, white text, one clipped corner and a 2 px cyan lower or side rule. On hover, cyan contour lines slide through the clipped corner and one fuchsia line cuts across them. On activation, the cyan lines travel around the boundary with a fuchsia leading point.

### 14.2 Accent: Pulse

Fuchsia field, black text and a compact four-point `Pulse` mark. Use for a single decisive action such as `Begin analysis`, `Enter studio` or `Publish lesson`. The mark rotates 45 degrees on hover and contracts on press.

### 14.3 Secondary: Outline Shift

Paper field, black text and black rule. A cyan offset outline appears 3 px away on hover, echoing the dotai logo's registration logic. Keyboard focus adds the fuchsia focus ring.

### 14.4 Tertiary: Thread Link

Text link with a visible underline that extends into a short fuchsia thread or arrow. Use for `Inspect source`, `See process`, `Compare versions` and other depth actions.

### 14.5 Tool button: Shape Key

Square or circular icon control with a distinct vector glyph. Selected state fills with cyan; the currently active tool carries a small fuchsia point. Tooltips name the action and shortcut. Shape Keys may assemble into a Magic UI-style dock or compact chatbox tool row.

### 14.6 Destructive

White or dark field with error-coloured text. Fuchsia is not used for destructive meaning.

Button copy starts with a verb. Loading does not erase the label: use `Analysing…`, not a spinner alone. Only one button per region should animate continuously, and only while work is active.

## 15. Forms

- Labels remain visible above fields.
- Help text explains format before error text appears.
- Validate after a field is complete, not on every keystroke.
- Preserve entered material after failure.
- Break long forms by conceptual stage, not arbitrary page count.
- Show why sensitive information is requested.
- Avoid mandatory social login. Offer email or institution-appropriate access.
- Use a fuchsia focus ring plus shape or weight change.

## 16. Loading, empty and error states

### Loading

State the current work: `Reading 12 sources`, `Building visual comparison`, `Checking citations`. Progress must not invent precision. Skeletons should match the eventual structure.

### Empty

Explain what can be made here, show one material example and offer one clear action. Use a large live vector as the invitation: a portal waiting to open, an orbit waiting for an image or a split line waiting for a question. It should respond when a file is dragged or the composer receives focus.

### Error

Name what failed, what remains safe and what the user can do. Retain prompt, sources and edits. Give technical detail through a disclosure, and provide a copyable error reference.

### Partial result

If part of a process succeeds, show it. Mark missing regions and let the user retry only those regions.

## 17. Notifications

- Use inline feedback beside the action when possible.
- Toasts confirm minor reversible events and disappear after sufficient reading time.
- Persistent problems remain visible until resolved.
- Never place essential error information only in a toast.
- Announce asynchronous state changes to assistive technology without stealing focus.

## 18. Product family

The products share tokens and behaviour but differ in rhythm and primary object.

| Product | Primary object | Character | Vector signature | Signature interaction |
| --- | --- | --- | --- | --- |
| Design Decode | Image, artefact, visual relation | Forensic, visual, comparative | Contour fields and orbit lines | Claim linked to a marked region and source |
| dotai Academy | Learning sequence, reading, exercise | Studio-like, paced, reflective | Nested portals and modular assemblies | Learn, attempt, critique, revise |
| Not a Guru | Question, dialogue, position | Sceptical, conversational, non-authoritarian | Splitting lines and pulse marks | Several positions held open for judgement |

## 19. Design Decode

### 19.1 Workspace

- Centre: high-resolution image or comparison canvas
- Left: image set, archive and analysis history
- Right: observation, semiotics, material, context, intertext and source panels
- Bottom: question/composer and view controls

The image canvas may carry a slowly moving contour field beyond the object boundary. When a region is selected, nearby contour lines bend towards it, then connect to the relevant observation. The image itself stays unfiltered.

### 19.2 Image interaction

- Support zoom, pan, rotate, fit, full resolution and side-by-side comparison.
- Annotations retain coordinates across responsive views.
- Cyan outlines mark analysed regions; a fuchsia handle marks the region currently in focus. Inactive regions use numbered monochrome rules.
- Do not cover the object with opaque interface chrome.
- Provide keyboard alternatives to pointer drawing.

### 19.3 Analysis structure

Separate:

1. Observation: what can be seen
2. Formal relation: scale, rhythm, hierarchy, edge, colour and spatial behaviour
3. Material and production: medium, process, wear, circulation and labour
4. Interpretation: possible meanings and contradictions
5. Context: historical, institutional and political conditions
6. Intertext: related images and arguments
7. Evidence: sources and provenance

The interface must prevent interpretation from being presented as visual fact.

## 20. dotai Academy

### 20.1 Learning rhythm

Academy should feel like a studio with a patient teacher, not a course marketplace.

Use the sequence:

`Encounter` → `Notice` → `Try` → `Discuss` → `Revise` → `Carry forward`

The module opens through a nested `Portal`. Each completed stage adds a modular arc, line or dot to an `Assembly` that becomes the learner's visual record. It grows through work, not reward theatre.

### 20.2 Progress

Track completed work and revisions, not passive screen time. Avoid streaks, leaderboards, badges and confetti. A learning record may show questions attempted, feedback incorporated and ideas revisited.

### 20.3 Lesson page

- A short orientation
- Reading, image, video or demonstration
- Captions and transcript by default
- An activity with explicit material requirements
- A reflection or peer exchange
- Sources and further depth

### 20.4 Feedback

Separate descriptive feedback from evaluation. Show the rubric before submission. Let students reply, revise and retain earlier versions. Credit peer critique.

## 21. Not a Guru

### 21.1 Position

The product must refuse the visual authority of the all-knowing assistant. Do not use a guru portrait, glowing avatar, oracle animation or single “final answer” card.

### 21.2 Conversation

- The user's question stays visible.
- Responses may branch into positions rather than one linear answer.
- Sources and counter-readings sit beside each position.
- The tool can say `I do not have enough context` and ask a precise question.
- Users can mark what they accept, reject or want to hold open.

### 21.3 Voice

Direct, curious and willing to disagree. Avoid therapeutic mimicry, praise loops and false familiarity. Questions should open thought, not endlessly defer a position.

### 21.4 Signature visual

Use a cyan marginal line that splits, overlaps or reconnects as positions diverge. Fuchsia pulse marks identify a claim, doubt or intervention. The line can move behind chat panels and reappear as a branch selector, so the argument has a visible topology.

## 22. Search and retrieval

- Search across titles, full text, source owner, language, date and annotation.
- Show why a result matched.
- Preserve query and filters when opening a result.
- Support Indian scripts without transliteration being mandatory.
- Treat transliteration, translation and original text as distinct layers.
- Do not rank institutional documents above community or personal archives merely because their metadata is cleaner.

## 23. Collaboration

- Presence indicators are quiet and textual.
- Comments attach to exact passages, regions or versions.
- Roles: `Owner`, `Editor`, `Commenter`, `Viewer` and context-specific contributor roles.
- Show who changed what.
- Allow private drafting before sharing.
- Export comments and attribution with the artefact.
- Never use collaborator activity as a productivity ranking.

## 24. Sharing and publishing

Following GenUAI's addressable artefact idea, every published output may have a stable URL. The owner chooses:

- Private
- Named collaborators
- Link access
- Public and indexed

A shared view displays creator, contributors, source permissions, version and publication date. Forking creates a new lineage and retains credit to the parent artefact.

## 25. Accessibility

- Meet WCAG 2.2 AA.
- Keyboard access covers every action, annotation and panel.
- Visible focus uses fuchsia plus a high-contrast secondary outline when required.
- Motion honours `prefers-reduced-motion`.
- Captions are on by default; transcripts accompany long media.
- Charts and image annotations have textual equivalents.
- Drag-and-drop always has button and keyboard alternatives.
- Do not rely on hover.
- Test at 200% zoom and 320 CSS px width.
- Maintain logical reading order when visual panels rearrange.

## 26. Performance

- Public routes should remain useful on a mid-range Android phone and unstable mobile data.
- Load the task surface before secondary motion or illustration.
- Lazy-load deep source previews and high-resolution image tiles.
- Pause animation off-screen.
- Preserve local drafts during connectivity loss.
- Display offline, reconnecting and synchronised states.
- Use the smallest responsible model and context for the task.

## 27. Privacy and data

Before upload, state:

- Where material will be stored
- Who can access it
- Whether it may be used for model training
- How long it remains
- How it can be exported or deleted

Workspace privacy must be visible from the product bar. Changing a permission requires confirmation and produces a readable record.

## 28. Implementation foundation

Recommended foundation:

- React and Next.js App Router
- TypeScript
- Tailwind CSS with semantic tokens
- shadcn/ui primitives for accessible controls
- Selected Magic UI components copied into the codebase and adapted locally
- A sandboxed preview only where users generate executable artefacts

GenUAI uses Next.js, Tailwind, shadcn-derived libraries and Sandpack for live generated-app previews. dotai should borrow the separation of prompt, preview, source and error feedback when a product generates artefacts. It should not import GenUAI's model choices or one-prompt proposition as a product principle.

### 28.1 Component ownership

Copied components become dotai components. Remove unused variants, replace hard-coded colours with semantic tokens, add reduced-motion behaviour, test keyboard interaction and document the accepted use.

### 28.2 Naming

Use semantic names:

- `EvidenceLink`, not `PinkBadge`
- `GenerationBoundary`, not `BorderBeam`
- `SourceRelation`, not `AnimatedBeam`
- `ToolShelf`, not `Dock`
- `ModuleGrid`, not `BentoGrid`

The implementation name should describe the product meaning, not the borrowed effect.

## 29. Tokens

```css
:root {
  --dot-cyan: #00f1de;
  --dot-cyan-dark: #007f76;
  --dot-cyan-soft: #c9fff9;
  --dot-cyan-deep: #003d39;

  --dot-fuchsia: #ff00a8;
  --dot-fuchsia-dark: #a60063;
  --dot-fuchsia-soft: #ffd6ee;
  --dot-fuchsia-deep: #4a002d;

  --vector-lilac: #9e7bff;
  --vector-blue: #3e6bff;
  --vector-coral: #ff6b61;
  --vector-silver: #d9d8d2;

  --dot-ink: #090909;
  --dot-paper: #f7f5f0;
  --dot-white: #ffffff;
  --dot-grey-100: #efede8;
  --dot-grey-300: #c8c5bf;
  --dot-grey-600: #6b6965;

  --dot-success: #157a4a;
  --dot-warning: #a45a00;
  --dot-error: #b42318;

  --font-ui: "IBM Plex Sans", Arial, sans-serif;
  --font-mono: "IBM Plex Mono", "Courier New", monospace;
  --font-reading: "Source Serif 4", Georgia, serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  --radius-panel: 2px;
  --radius-control: 4px;
  --rule-default: 1px solid var(--dot-grey-300);
  --rule-active: 2px solid var(--dot-cyan);
  --focus-ring: 0 0 0 3px var(--dot-white), 0 0 0 6px var(--dot-fuchsia-dark);

  --motion-instant: 80ms;
  --motion-fast: 160ms;
  --motion-base: 240ms;
  --motion-slow: 480ms;
  --motion-drift: 16000ms;
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.7, 0, 0.84, 0);
}
```

## 30. Product review checklist

- Is dotai cyan visibly carrying the product field and structural language?
- Is fuchsia acting as the accent rather than the dominant colour?
- Does every fuchsia element identify an action, focus or moment of intervention?
- Do cyan and fuchsia have distinct jobs on the screen?
- Does the screen contain a recognisable dotai vector family rather than generic tech decoration?
- Is the vector language woven into chat, navigation or state rather than pasted behind the interface?
- Does the interface still read clearly in greyscale?
- Was the main journey designed mobile-first?
- Does the large-screen version use its space to support the task?
- Can users inspect sources and distinguish evidence from inference?
- Are direct edits preserved across later generations?
- Can users compare versions and undo changes?
- Are partial results and specific errors visible?
- Does every motion explain a state or relation?
- Does the motion choreography stabilise the frame before text begins?
- Does reduced motion preserve the same information?
- Are empty, loading, offline, error and permission states designed?
- Can contributors see credit, permission and routes for withdrawal?
- Is the product asking for judgement where judgement matters?
- Has the interface avoided gamified compulsion?
- Have generated claims, image regions and citations been keyboard tested?
- Can the work be exported without losing sources, attribution or comments?
- Do buttons use the shared Vector Cut, Pulse, Outline Shift, Thread Link or Shape Key families?
- Does the interface retain visual charge during repeated use?

## 31. Reference interpretation

### GenUAI

Useful for its generative workspace: prompt, library selection, live artefact preview, code inspection, history, sharing, error surfacing and iterative changes. Its unresolved task list is especially instructive: retain user edits, apply diffs, surface sandbox errors, support prompt revision and preserve generated history. These are product requirements for responsible generative tools, not optional polish.

### Magic UI

Useful as a source of copyable, locally owned React motion patterns. Bento Grid, Animated Beam, Border Beam, Shimmer Button, Marquee, Dock and Text Reveal can enter dotai only after semantic renaming, cyan-fuchsia tokenisation, accessibility work and reduced-motion design. The library's visual abundance should expand dotai's expressive range without setting the product's judgement.

### dotai-design.md

Provides the deeper position: contextual AI, visible labour, editorial structure, accessible defaults, layered depth and anti-extractive governance. This tool guide makes those commitments operational across repeated interaction.
