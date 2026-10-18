# KIN Website MVP — 整体嵌套结构
(Source: Drive doc "MVP Structure")

# Tab 1

KIN Website MVP — 整体嵌套结构

我建议把整个网站统一在一个逻辑下：一条 loop，一块白板，三层产品，以及一片支持它们生长的社区与合作网络。

Loop： Collect → Curate → Create → Give。

白板： 所有用户自己的碎片、主题框和 curation 的起点。

产品层： KIN Meals、Artist-made Meals，以及可以加入套餐的 supporting gifts。

土壤： Artists、Community、Integrations，让作品、创意、用户和合作商家持续进入 KIN。

花店也放在这套结构里：在 KIN 的礼物套餐中，鲜花是可选的 filling / supporting gift；而在花店的购物流程里，KIN 又可以作为一个数字礼物的附加服务出现。两边互相导流，但不需要让花店和 KIN 的产品变成同一个东西。

一、完整网站地图

KIN

│

├── 01. HOME / THE BOARD

│   │

│   ├── First Visit Popup

│   │   ├── See Example Board

│   │   ├── Start My Board

│   │   └── Skip

│   │

│   ├── My Board

│   │   ├── Labels — 自由输入 words / sentences / links

│   │   ├── Frames — 把 Labels 组织成主题

│   │   ├── Curation Components

│   │   └── Gift Curation Mode

│   │       ├── Step 1: Me?

│   │       ├── Step 2: Them?

│   │       ├── Step 3: The Gift?

│   │       └── Gift Brief

│   │

│   └── Continue

│       ├── Explore Gift Ideas

│       ├── Make a Zine / Publication

│       └── Keep Collecting

│

├── 02. GIFTS

│   │

│   ├── Conversation Recap — 首个重点产品

│   │

│   ├── KIN Meals — KIN 策划的套餐

│   │   ├── The Curiosity Cabinet

│   │   ├── Two Places, One Sky

│   │   ├── The Photo Archive

│   │   └── The Soft Landing Pack

│   │

│   ├── Artist-made / Rhemma Meals

│   │

│   ├── Supporting Gifts / Fillings

│   │   ├── Artist's Existing Works

│   │   ├── Poems / Sound / Digital Cards

│   │   ├── Flowers / Physical Gifts

│   │   └── Licensed Cultural Works

│   │

│   └── Gift Package Detail → Order

│

├── 03. HOW IT WORKS

│   ├── Collect

│   ├── Curate

│   ├── Create

│   └── Give

│

├── 04. ARTISTS

│   ├── Artist Catalog

│   ├── Submit Your Work / Join KIN

│   ├── Create an Artist-made Meal

│   ├── Artist Rights & Revenue

│   └── Artist Storefront Integration

│       ├── Referral

│       ├── Widget

│       └── API

│

├── 05. INTEGRATIONS

│   ├── Florists

│   ├── Bookstores / Record Stores

│   ├── Photo Printing

│   ├── Travel / Hotels / Airbnb

│   ├── Museums / Galleries

│   ├── Gift Retailers

│   └── Corporate Gifting

│

├── 06. COMMUNITY

│   ├── Inspiration Library / Labels Waterfall

│   ├── Shared Curation Examples

│   ├── Recipient-driven Curation

│   ├── Artist & Community Handbooks

│   ├── Community Rules / Governance

│   └── Onboarding Agent / How to Contribute

│

├── 07. ORDER

│   ├── Gift Brief Summary

│   ├── Package & Supporting Gifts

│   ├── Optional Physical Add-ons

│   ├── Personal Message

│   ├── Consent / Privacy

│   ├── Contact & Delivery

│   └── Confirmation

│

└── 08. FOOTER

    ├── About KIN

    ├── Privacy Policy

    ├── Terms

    ├── Artist Terms

    ├── Contact

    └── Partner With KIN

这棵树里，Home 是主要使用空间；Gifts 是可购买产品的目录；Order 是从白板或产品详情页进入的结账流程。Artists、Integrations、Community 则分别负责供给、分发和社区积累。

二、首页：白板是主产品，也是整个 loop 的入口

首页不再是传统意义上的营销 landing page。用户一进来，就进入 KIN Board。

2.1 初次进入：示范白板 Popup

背景已经是白板，但中央显示一块预先策划好的示范。

标题： A gift starts with the little things you notice.

说明：

Collect words, memories, inside jokes, and things that remind you of someone. You don't need to know what the gift will be yet.

示范内容可以包括：

Labels：collects old tickets、our midnight train、loves obscure museums。

Frames：Their little quirks、Places we've been、Things only we understand。

Curation Component：一个 Me / Them / Us 或 Comparison，演示标签之间如何产生联系。

三个按钮：

Explore example

Start my board

Skip

用户可以看完示范，也可以随时直接开始。

2.2 进入自己的 Board

白板上方显示：

Your little collection of things that matter.

Drop in a word, a memory, a link, or a sentence. Sort it later, or never.

白板有三个主要操作：

预设 Frames 包括：

Their little quirks、Places we've been、Things only we understand、Things I admire、Things that remind me of them、Our shared memories。

这些都只是提示，而不是必须填完的问卷。

2.3 Curation Components

第一版先实际实现少量最能解释产品机制的组件：

Me / Them / Us：划分个人、对方和共同世界。

Comparison：比较两个标签组。

Timeline：把记忆放入过去、现在和未来。

Bridge：连接原本不同的主题。

Echo：找出反复出现的关键词、主题或记忆。

另外，Parallel、Mirror、Contrast、Overlap、Influence、Orbit、Story Arc、Mystery 等可以先放在 Curation Tools Gallery，作为静态示意与未来组件。

2.4 从白板进入礼物策展

用户点击：

Turn your curation into a gift →

这不是页面跳转，而是在同一张白板上开启 Guided Curation Mode。

Step 1 — Me?

What do you want to express about yourself?

用户从白板中选择能表达自己视角、感受和送礼动机的标签或框框。

选中的元素高亮；没有合适内容时，可以直接添加新标签。

Step 2 — Them?

What makes this person uniquely them?

用户继续选择对方的特点、兴趣、习惯和两个人的共同记忆。

标签可以同时关联到多个步骤，不必复制。

Step 3 — The Gift?

What would you like this gift to express?

用户从几个表达意图中选择，例如：

Something I find hard to say

A memory worth keeping

What makes them special

A world only we share

再从白板里选出最重要的素材，或者补充一句新的说明。

Step 4 — Gift Brief

KIN 自动生成一份摘要：

Me: 送礼人的视角和感受。

Them: 对方的特点与两个人的关系线索。

The Gift: 想表达的意义，以及这次创作最重要的素材。

用户可以修改这份摘要，然后进入：

Explore Gift Ideas、Make a Zine / Publication 或 Keep Collecting。

在 MVP 里，第一条应当是主要的商业转化流程；其他两条可以先保留简单功能或清楚标注的预览。

三、Gifts：所有产品都采用相同的包裹逻辑

每一个 KIN Meal 都应该遵循统一的结构：

Hero Gift + Fillings + Personal Message + README Guide + Artist's Process Note

这里的 Hero Gift 是主要创作，Fillings 是让它更完整的辅助内容，可以是数字作品，也可以是实体礼物。

3.1 Conversation Recap

这是第一个要做实的产品，需要完整详情页、明确交付物和真正可用的下单入口。

Hero Gift：根据用户提交的素材，形成一份关于某个人或一段关系的数字出版物／创作成果。

Fillings：可以加入精选艺术作品、诗歌、数字卡片或其他适合的作品。

Personal Message：送礼人自己的祝福。

README Guide：如何打开、保存、分享或使用这份礼物。

Artist's Process Note：说明艺术家的创作选择与作品意义。

页面必须明确写出适用场景、包含什么、用户需要提供什么、制作流程、价格、交付时间和授权范围。

3.2 KIN Meals

四个场景都采用相同的产品页模板：

每页需要：场景介绍、示例、套餐内容、定制选项、价格或预订说明，以及 Start a Gift Brief / Preorder 按钮。

3.3 Artist-made / Rhemma Meals

Artists 可以自己提出礼物概念、定义创作范围、确定基础价格，再与 KIN 合作销售。

每个 artist-made package 仍然遵循同样的五部分结构，但由 artist 主导作品与创意，KIN 协助产品化、销售、交付和客户沟通。

四、花店 Integration：双向合作，而不只是推荐链接

这是一个独立的商业模块，但在产品逻辑上要与 Gifts 和 Order 连接。

4.1 花店的商品在 KIN 套餐中是什么？

Flowers = optional physical filling。

KIN 主打的是关系策展和创意礼物。鲜花可以作为一项额外的实体内容，让一份数字礼物更完整，但不必成为 KIN 自己开发或库存的商品。

比如用户为朋友制作了 The Curiosity Cabinet：

在 KIN 的礼物详情页和下单流程中，可以出现：

Add flowers to your gift.

用户点击后进入合作花店选择鲜花；在双方技术条件允许的情况下，也可以进一步在 KIN 内完成选择，并由花店负责实体履约。

4.2 方向 A：花店把客户带到 KIN

Customer buys flowers

在花店选择花束、填写收件人和配送信息

Make this gift more personal

花店在结账页、订单确认页或确认邮件中推荐 KIN

Customer creates a KIN gift

提交故事 → 选择艺术方向 → 购买数字礼物

花店卖花，KIN 销售数字艺术与策展服务。双方可以采用推荐佣金、销售分成或其他合作结算方式。

4.3 方向 B：KIN 把用户带到花店

Customer creates a gift on KIN

完成 Gift Brief，挑选套餐

Add a physical filling

例如花束、卡片或其他合作商家的实体礼物

Choose flowers from a partner florist

通过合作链接进入花店，或在支持集成时直接选择并下单

这是一个很重要的区别：KIN 不只是其他商家的流量入口，也能成为把数字创作与实体商品组合在一起的策展层。

第一版只需要支持合作商家链接和清楚的下单说明；不需要一开始就把所有花店的库存、配送与付款整合进 KIN。

4.4 未来扩展到其他 Fillings

花店是第一个例子，但同样的结构可以扩展到：

Bookstores：实体书、诗集、艺术书。

Record Stores：唱片、音乐相关商品。

Photo Printing：实体照片、相册和印刷 zine。

Museums / Galleries：艺术出版物、授权版画或展览相关商品。

Artist-owned Stores：艺术家的实体作品、手工艺品与自制礼物。

这些合作商品可以出现在具体的 package 中，也可以根据用户的 Gift Brief 推荐。它们不是独立于策展之外的普通加购，而是用来补充那段关系的实体或数字内容。

五、Artists：供给、创作与销售

Artists 页面负责让创作者加入 KIN，并理解他们可以怎样参与。

ARTISTS

│

├── Artist Catalog

│   ├── Artist Profile

│   ├── Existing Digital Works

│   ├── Commission Types

│   └── Reusable / Licensable Works

│

├── Create with KIN

│   ├── Collaborate on KIN Meals

│   ├── Create Artist-made Meals

│   └── Propose New Gift Ideas

│

├── Sell Through KIN

│   ├── Product Submission

│   ├── Pricing & Scope

│   ├── Rights & Licensing

│   └── Revenue Sharing

│

└── Connect Your Storefront

    ├── Level 1: Referral Link

    ├── Level 2: Embedded Widget

    └── Level 3: API

最重要的是把两种合作区分开：

Artist sells through KIN： KIN 帮艺术家销售已有作品、委托创作和 artist-made meals。

Artist integrates KIN into their own store： 艺术家在自己售卖实体礼物或作品的网站中接入 KIN，让自己的客户也能购买关系策展型数字礼物。

第二种可以与花店形成相似的模式：艺术家销售实体产品，KIN 提供可叠加的数字礼物体验。

每个 artist 产品需要明确创作范围、个性化程度、制作时间、价格、可复用权限和艺术家收入。不能因为某件作品可以重复销售，就默认取得无限制的使用权。

六、Integrations：把合作场景组织成一个清晰的页面

这个页面面向潜在商家、机构和分发合作伙伴。

每个场景只需一个简单的介绍模块：

每一项都要有一句价值说明、一个产品示例和 Partner with KIN 入口。

这里的核心不是把所有合作都做成 API。根据伙伴的需求，可以从推荐链接开始，逐渐扩展到 Widget 或 API。

七、Community：为创作网络提供土壤

Community 不应该与白板并列成为一个全新、复杂的主产品。它的作用是让个人创意、公开灵感、艺术家和未来的贡献者逐渐连接起来。

COMMUNITY

│

├── Inspiration Library

│   ├── Shared Curation Examples

│   ├── Public Gift Ideas

│   └── Artist-made Inspirations

│

├── Labels Waterfall

│   ├── Consent-based Shared Fragments

│   ├── Creative Themes

│   └── Discover Related Ideas

│

├── Recipient-driven Curation

│   ├── Recipient Contributions

│   ├── Collaborative Gift Collections

│   └── Group / Community Gifts

│

└── Community Operations

    ├── Artist & Contributor Handbooks

    ├── Community Rules

    ├── Governance

    └── Onboarding Agent

这里有三个细节值得保留

Labels Waterfall： 展示经过同意、适合公开的标签或创意片段，让用户从别人的小发现中获得灵感。不展示用户的私人白板，也不默认公开关系故事。

Recipient-driven Curation： 未来可以让多人为同一份礼物贡献碎片。例如，朋友们一起为毕业生收集回忆，再由 KIN 或 artist 将它们策展成一份集体 zine。

Governance & Handbooks： 明确说明 artist 如何加入、作品如何授权、公共创意如何分享、用户如何保护隐私，以及贡献者如何获得署名和报酬。这部分先放静态说明即可，未来再发展治理机制和 onboarding agent。

八、How It Works：解释四步 Loop

这个页面提供整个产品的解释，不与首页白板重复。

11 个或更多 Curation Components 可以在这里用静态示意图和一句话介绍。第一版只需要把少数核心组件做成真实可操作的功能。

九、Order：一个真正连回白板的下单流程

用户可以从首页白板、Gifts 详情页或合作商家的入口开始，但最终都进入同一个 Order 系统。

ENTRY POINT

│

├── From My Board

├── From Gift Page

└── From Partner / Florist

        │

        ▼

Gift Brief

        │

        ▼

Choose Package

        │

        ├── Hero Gift

        ├── Digital Fillings

        └── Optional Physical Fillings

             └── Flowers / Partner Products

        │

        ▼

Personal Message

        │

        ▼

Materials + Rights / Consent

        │

        ▼

Contact + Delivery

        │

        ▼

Order Confirmation

Gift Brief 必须复用用户已经在白板选中的标签和框，不要再让用户重复输入。只有当素材不足时，才提示用户添加新内容。

对于鲜花等实体 Fillings，第一版可以通过合作链接转去商家网站下单；对于由 KIN 直接销售并能够履约的数字礼物，则走 KIN 自己的订单流程。结账、配送和退款由谁负责，都要在页面里说清楚。

十、第一版的实现顺序

P0

真正可用的核心流程

首页白板、示范 Popup、Labels 和 Frames、Guided Gift Curation（Me → Them → The Gift）、Gift Brief、Conversation Recap 详情页和 Order Flow。

P1

静态页面与真实合作入口

KIN Meals、Artist-made Meals、How It Works、Artists、Integrations，以及花店双向导流的示意与联系入口。能实际销售的产品可以下单，尚未确认的产品用预订／意向登记。

P2

逐步发展的网络

其余 Curation Components、Labels Waterfall、Community Governance、Recipient-driven Curation、更复杂的 artist API 和商家库存集成。

Footer 从第一版就留好链接位置，包括 Privacy、Terms、Artist Terms、Contact 和 Partner with KIN；正式接受订单前，需要补齐实际适用的条款。

最终的整体逻辑是：

KIN 的首页让用户收集日常碎片；白板帮助他们从标签之间发现关系；Gift Brief 把这份关系转成创作方向；KIN Meals 与 artists 把它变成 zine、数字艺术或互动体验；Fillings 可以加入鲜花、书籍及其他合作商家的实体产品；最后通过 Artists、Integrations 和 Community，让更多创作者、商家与用户进入同一个循环。

这样，无论用户从自己的白板开始，还是从花店买花时被引导进来，最终都可以走进 KIN 的核心机制：用策展将一段关系转化成一份礼物。