# KIN Visual Design Protocol
(Source: Drive doc "MVP Design Protocol")

# Tab 1

我会把它定义为一种 Editorial Density（高密度编辑式排版）+ Darkened Image Overlay（暗图叠字）+ Experimental Magazine Layout（实验性杂志布局） 的视觉系统。

这里借鉴的是 Revue Faire 的编辑式、实验性杂志语言，而不是要求每个页面照搬它的版式。相关介绍提到它具有复杂的实验性布局、双语文本组织和严肃的编辑设计取向；一个网站设计目录记录了 Arial 与 Times New Roman 的字体组合。

下面这份 protocol 可以直接交给 AI coding agent 或前端开发者。

1. KIN Visual Design Protocol

design_system:

  name: "KIN Editorial Magazine"

  inspiration: "Revue Faire-inspired editorial design"

  version: "1.0"

  design_intent:

    keywords:

      - editorial

      - dense

      - literary

      - experimental

      - layered

      - tactile

      - intimate

      - image-led

    objective: >

      Make KIN feel like an independent literary magazine or personal

      publication rather than a conventional SaaS product or ecommerce

      landing page. Use dense typography, compact editorial grids,

      darkened photographic backgrounds, overlapping image and text,

      and deliberate typographic contrast.

    avoid:

      - generic SaaS landing page

      - excessive whitespace

      - oversized rounded cards everywhere

      - centered headline followed by three equal feature cards

      - repetitive card grids

      - excessive gradients

      - decorative elements without editorial purpose

  colors:

    paper: "#F1F0E9"

    ink: "#171717"

    secondary_ink: "#595959"

    rule: "#B9B7AE"

    dark_surface: "#111111"

    accent: "#E4523D"

    image_overlay: "rgba(10, 10, 10, 0.58)"

    selected_background: "#F8DED7"

    rules:

      - "Use paper and ink as the dominant visual foundation."

      - "Use accent color sparingly for labels, links, selections, and calls to action."

      - "Use white text over darkened images."

      - "Do not place dark body text over uncontrolled image areas."

      - "Do not assign a different accent color to every section."

      - "Dark image overlay is a component treatment, not a global page background."

  typography:

    display:

      font_family: "'Times New Roman', Georgia, serif"

      role:

        - "Editorial headlines"

        - "Literary statements"

        - "Pull quotes"

        - "Gift and zine titles"

      weight: "400"

      line_height: "0.95-1.1"

      letter_spacing: "normal"

    body:

      font_family: "Arial, Helvetica, sans-serif"

      role:

        - "Body copy"

        - "Product descriptions"

        - "Navigation"

        - "Forms and interactive controls"

      weight: "400"

      line_height: "1.3-1.5"

    metadata:

      font_family: "Arial, Helvetica, sans-serif"

      transform: "uppercase"

      letter_spacing: "0.06em-0.12em"

      role:

        - "Category labels"

        - "Issue numbers"

        - "Artist names"

        - "Dates"

        - "Section identifiers"

    hierarchy:

      hero_title: "clamp(3rem, 8vw, 8rem)"

      section_title: "clamp(2rem, 4.5vw, 4.5rem)"

      subsection_title: "1.5rem-2.5rem"

      body: "1rem-1.125rem"

      metadata: "0.6875rem-0.8125rem"

    rules:

      - "Use serif and sans-serif typography in deliberate contrast."

      - "Headlines may wrap across multiple lines and occupy unusual proportions."

      - "Keep metadata compact and visually distinct from body copy."

      - "Use paragraph blocks with relatively tight leading."

      - "Allow changes in scale, alignment, and column width between sections."

      - "Do not use large display typography for every heading."

      - "Maintain readable body text and sufficient contrast."

  layout:

    style: "compact editorial grid"

    desktop_columns: 12

    page_gutter: "16px-32px"

    column_gap: "12px-24px"

    section_spacing: "32px-64px"

    component_spacing: "12px-24px"

    whitespace: "controlled and purposeful"

    rules:

      - "Prefer compact composition over large empty sections."

      - "Use asymmetrical columns and changing image-to-text ratios."

      - "Allow text blocks and images to sit side by side."

      - "Use occasional edge-aligned metadata and overlapping elements."

      - "Avoid excessive rounded containers and floating card layouts."

      - "Whitespace should separate editorial units, not dominate the page."

      - "Keep the interactive whiteboard usable and uncluttered."

  image_treatment:

    hero:

      mode: "full-bleed or near-full-bleed background image"

      overlay:

        type: "dark translucent overlay"

        color: "#0A0A0A"

        opacity: 0.58

        optional_gradient: >

          Use a directional gradient when necessary to preserve image

          detail while ensuring text contrast in the text region.

      foreground_text:

        color: "#FFFFFF"

        position: "editorially composed; usually left-aligned or bottom-aligned"

        max_width: "55%-70%"

      rules:

        - "Text must remain readable at every responsive size."

        - "Use image crops intentionally; do not stretch images."

        - "Avoid applying the same overlay strength blindly to every image."

        - "Use the overlay only when the image acts as a background."

    editorial_image:

      mode: "image and text juxtaposition"

      layouts:

        - "40% text / 60% image"

        - "60% text / 40% image"

        - "unequal two-column layout"

        - "full-width image followed by dense text"

      rules:

        - "Keep text structurally connected to the image."

        - "Allow captions, small labels, and notes close to images."

        - "Avoid excessive padding around editorial images."

        - "Use occasional image-led sections to interrupt dense text."

  components:

    question_image_block:

      layout: "compact asymmetrical two-column composition"

      question:

        typography: "large serif"

        alignment: "left"

      image:

        ratio: "variable"

        fit: "cover"

      caption:

        typography: "small sans-serif"

      spacing: "tight"

    editorial_text_block:

      layout: "one or multiple narrow columns"

      max_line_length: "approximately 55-75 characters"

      paragraph_spacing: "0.6em-1em"

      rules:

        - "Use concise but content-rich text blocks."

        - "Avoid long uninterrupted full-width paragraphs."

        - "Use inline emphasis, numbered notes, and compact captions selectively."

    product_package:

      style: "editorial product entry, not generic ecommerce card"

      include:

        - "package title"

        - "occasion or relationship context"

        - "artist attribution"

        - "short editorial description"

        - "what is included"

        - "price or preorder status"

      rules:

        - "Allow image and copy to have unequal visual weight."

        - "Display package details as structured editorial content."

        - "Keep purchase actions clear without turning every element into a button."

    labels_and_frames:

      style: "paper-like modular elements"

      background: "#F1F0E9"

      text: "#171717"

      border: "1px solid #B9B7AE"

      selected:

        background: "#F8DED7"

        border: "1px solid #E4523D"

      rules:

        - "Labels must be readable and easy to scan."

        - "Frames must visually group labels without dominating the canvas."

        - "Curation components may use lines, arrows, and compact diagrams."

        - "Editorial density must never compromise board usability."

  interaction:

    motion:

      style: "subtle and purposeful"

      duration: "150ms-250ms"

      allowed:

        - "label selection"

        - "frame expansion"

        - "gentle image reveal"

        - "small editorial transitions"

      avoid:

        - "excessive parallax"

        - "constant animation"

        - "long page transitions"

    responsive:

      desktop: "asymmetrical multi-column editorial composition"

      tablet: "reduced columns; preserve text-image relationships"

      mobile:

        - "stack text and images when necessary"

        - "preserve title hierarchy"

        - "keep controls touch-friendly"

        - "avoid overlapping text and images that reduce readability"

        - "allow dense editorial content to become vertical"

  accessibility:

    - "Meet WCAG AA contrast requirements for text."

    - "Do not use color as the only indicator of label selection."

    - "Provide keyboard-accessible controls."

    - "Ensure foreground text remains readable over background images."

    - "Respect reduced-motion preferences."

2. 最重要的视觉规则

为了让开发者真正理解，而不是只照抄颜色和字体，可以再补充这一段：

IMPLEMENTATION DIRECTIVE

Do not design KIN as a conventional SaaS landing page.

Use an editorial magazine visual language:

- Dense typography and compact text blocks.

- Serif display headlines paired with sans-serif body text.

- Darkened photographic backgrounds with text in the foreground.

- Asymmetrical image-and-text compositions.

- Small captions, metadata, rules, and editorial annotations.

- Limited whitespace, but clear hierarchy and readable content.

- Strong contrast between image-led storytelling sections and functional sections.

Apply this visual language to the homepage introduction, gift package pages,

artist profiles, product storytelling, and editorial content.

Important: KIN's homepage is an interactive curation board, not a static

marketing hero. Keep the board visually quiet enough to support collecting,

dragging, selecting, grouping, and comparing labels. Use the more expressive

magazine treatment around the board and in the gift/publishing experience,

rather than making every working area visually dense.

3. 如何映射到 KIN 的实际页面

Home / Whiteboard

以纸张色背景、黑色文字、细线框和紧凑 metadata 为主。示范白板 popup 可以体现编辑式文字层级，但用户实际收集标签的区域应保持清楚、可操作。

Gift detail pages

使用暗化的大幅背景图、前景标题、紧凑说明文字和不对称图文组合。产品内容采用像杂志专题一样的编辑结构，而不是全页整齐排列的圆角商品卡。

Artist pages

更接近独立杂志的 contributor page：艺术家姓名、作品、创作说明、作品信息、授权和合作方式，以文字和图像共同建立层次。

Community / Inspiration Library

允许内容呈现得更密集，使用小型标签、标题、作品片段和紧凑的栏目结构，像一本持续更新的创意出版物。

这里最关键的区别是：密集不等于拥挤，留白少不等于没有层级。 你要的是内容丰富、排版有编辑判断、图片与文字互相作用的杂志感，而不是把所有元素塞在一起。

另外，我给出的颜色值是建议的 KIN 实施色板，不是声称它们是 Revue Faire 官方色值。这样更适合交给开发者作为明确的设计变量，之后可以再用你选定的实际参考截图微调。