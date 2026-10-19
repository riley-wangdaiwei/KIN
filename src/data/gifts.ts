import type {
  GiftPackage,
  SupportingGift,
} from "@/features/gifts/types";

export const giftImagePaths: Record<string, string> = {
  "conversation-recap": "/gift_conversation.jpg",
  "the-curiosity-cabinet": "/gift_curiosity.jpg",
  "two-places-one-sky": "/gift_cities.jpg",
  "the-photo-archive": "/gift_photos.jpg",
  "the-soft-landing-pack": "/gift_beginning.jpg",
  "artist-made-rhemma-meals": "/gift_artists.jpg",
  "supporting-gifts-fillings": "/gift_fillings.jpg",
};

export const giftPackages: GiftPackage[] = [
  {
    slug: "conversation-recap",
    title: "Conversation Recap",
    category: "hero",
    eyebrow: "THE KIN ORIGINAL / DIGITAL PUBLICATION",
    summary:
      "A personal publication made from the small things you remember about someone.",
    introduction:
      "Turn collected phrases, shared places, habits, and half-forgotten stories into a keepsake about one particular relationship. Conversation Recap is a digital-first creative commission, made from your Gift Brief and the materials you choose to share.",
    example:
      "A friend who saves every ticket stub. The train you missed together. A sentence they say whenever they are nervous. Those details become the beginning, not the footnotes.",
    heroGift:
      "A designed digital publication that gathers your selected memories into a thoughtful narrative, with an editorial cover, considered sequencing, and a personal closing page.",
    fillings: [
      "One small digital art or poem selection, matched to the brief",
      "A set of three shareable digital keepsake cards",
      "Optional flowers or another physical filling from a future partner selection",
    ],
    personalMessage:
      "Your own words appear as the dedication. Add a note during the order request; it can be polished together before the final version.",
    readmeGuide: [
      "Open the private delivery link on any modern phone, tablet, or computer.",
      "Download the keepsake PDF for offline reading and safekeeping.",
      "Share the private link with the recipient; you decide who sees it.",
      "Keep the original delivery email so the link is easy to find again.",
    ],
    artistProcessNote:
      "The maker looks for a through-line in the details you provide, then edits for pace, intimacy, and room to breathe. The process note delivered with the publication explains the visual and editorial choices behind the finished piece.",
    occasions: [
      "A birthday or milestone for someone who is hard to shop for",
      "A long-distance friendship or relationship",
      "A thank-you, an anniversary, or a just-because keepsake",
    ],
    included: [
      "One custom digital publication, delivered as a PDF and private web link",
      "One revision round after the first layout",
      "A personal dedication page",
      "A short artist's process note and README guide",
      "A private delivery link intended for personal, non-commercial sharing",
    ],
    provide: [
      "A completed KIN Gift Brief",
      "Three to ten notes, photos, or memories you have permission to share",
      "The recipient's first name or preferred name",
      "Your personal message and delivery email",
    ],
    process: [
      "Start with your curation and choose Conversation Recap.",
      "Share the materials and message you want included.",
      "Review the proposed direction and one draft.",
      "Approve the final publication and receive the private link and PDF.",
    ],
    customization: [
      "Choose a quieter, playful, archival, or lyrical visual direction",
      "Add a poem or digital card as a filling",
      "Ask about print-ready files or physical add-ons before ordering",
    ],
    deliveryTime:
      "The delivery estimate is confirmed with the commission scope; timing begins after materials and creative direction are approved.",
    usageScope:
      "Personal, non-commercial use by the purchaser and recipient. Public posting, resale, commercial use, or reproduction of included third-party works requires separate permission.",
    priceAndAvailability:
      "Order request only — no payment is collected. KIN confirms price, scope, and delivery timing before accepting the commission.",
    action: "start-brief",
    actionLabel: "Start a Gift Brief",
    heroMark: "01",
  },
  {
    slug: "the-curiosity-cabinet",
    title: "The Curiosity Cabinet",
    category: "kin-meal",
    eyebrow: "KIN MEAL / FOR THE COLLECTOR OF SMALL WONDERS",
    summary:
      "A cabinet of the odd, lovely things that make their mind feel like home.",
    introduction:
      "For the person who notices the unusual label, remembers a museum room number, or brings home a pocket-sized mystery. This meal turns their fascinations into a tiny, personal world.",
    example:
      "A field-note style collection of their niche interests, favorite discoveries, and curious details, arranged like a cabinet you can open again and again.",
    heroGift:
      "A bespoke digital cabinet: an illustrated, editorial collection of interests, observations, and little-known facts chosen around one person's particular way of seeing.",
    fillings: [
      "A short artist-made curiosity card",
      "A tiny poem or sound note inspired by a chosen fascination",
      "Optional flowers as a physical filling through a partner florist",
    ],
    personalMessage:
      "A note that says: I love how you see the world, especially the parts other people walk past.",
    readmeGuide: [
      "Open the cabinet from the private link.",
      "Browse the cards in any order or download the keepsake edition.",
      "Share the link as a personal gift; do not repost licensed artwork publicly.",
    ],
    artistProcessNote:
      "The artist treats curiosity as a form of portraiture: the details are gathered, grouped, and illustrated without sanding away their delightful specificity.",
    occasions: ["Birthdays", "Graduations", "A gift for a curious new home"],
    included: [
      "One custom digital cabinet with up to eight curated cards",
      "One digital curiosity card filling",
      "One personal message",
      "A README guide and artist process note",
    ],
    provide: [
      "A Gift Brief and three to eight interests or observations",
      "Any references or images you have permission to share",
      "The recipient's name and your dedication",
    ],
    process: [
      "Build a brief from the details you have collected.",
      "Choose a visual direction and share references.",
      "Review the proposed cabinet and request adjustments.",
      "Receive the finished digital gift and guide.",
    ],
    customization: [
      "Pick a subject area such as nature, design, maps, food, or museums",
      "Choose a field-notes, specimen-card, or illustrated index treatment",
      "Add an optional poem, sound, or physical filling",
    ],
    deliveryTime:
      "The production window will be confirmed before preorder opens and depends on the selected artist and scope.",
    usageScope:
      "Personal use under the artist's stated terms. Any included licensed filling carries its own separate license.",
    priceAndAvailability:
      "Preorder concept. Register your interest to help shape the first edition; price and production dates will be confirmed before orders open.",
    action: "preorder-intent",
    actionLabel: "Register preorder interest",
    heroMark: "02",
  },
  {
    slug: "two-places-one-sky",
    title: "Two Places, One Sky",
    category: "kin-meal",
    eyebrow: "KIN MEAL / FOR THE DISTANCE BETWEEN PLACES",
    summary:
      "A shared map for two people who keep finding their way back to each other.",
    introduction:
      "Made for distance, travel, and the places that quietly belong to two people. Two Places, One Sky connects coordinates, time zones, routes, and remembered moments without pretending the miles are not there.",
    example:
      "A two-sided map pairs the view from each person's window with the route, ritual, or sky they share.",
    heroGift:
      "A paired digital map and short visual story, bringing two locations into one composed keepsake.",
    fillings: [
      "A location-inspired digital postcard",
      "A short ambient sound piece for a remembered place",
      "Optional flowers or a printed card as a physical filling",
    ],
    personalMessage:
      "A personal note can sit between the two places: a message to open now, or on the next visit.",
    readmeGuide: [
      "Open the map from its private delivery link.",
      "Use the included key to find the places, dates, and shared markers.",
      "Download the keepsake edition or share it privately.",
    ],
    artistProcessNote:
      "The maker uses place as a quiet narrative structure. Maps are interpreted, not used for precise navigation; the work centers lived experience and shared rituals.",
    occasions: ["Long-distance birthdays", "Farewells and reunions", "Travel anniversaries"],
    included: [
      "One paired-location digital map",
      "Up to six custom memory markers",
      "One postcard filling and personal message",
      "A README guide and artist process note",
    ],
    provide: [
      "Two places, with optional dates or time zones",
      "Three to six memories or rituals tied to those places",
      "A Gift Brief and personal message",
    ],
    process: [
      "Gather place names and the stories attached to them.",
      "Choose a map and illustration direction.",
      "Review the marker layout and personal message.",
      "Receive the private link and downloadable keepsake.",
    ],
    customization: [
      "Use cities, neighborhoods, a route, or two meaningful rooms",
      "Choose a day, night, or shifting-sky palette",
      "Add a sound or physical postcard filling",
    ],
    deliveryTime:
      "The production window will be confirmed before preorder opens and depends on the locations and custom markers.",
    usageScope:
      "Personal sharing with the intended recipient. Maps are expressive artwork, not navigation tools; third-party map assets retain their stated license.",
    priceAndAvailability:
      "Preorder concept. Register your interest; final price, delivery schedule, and customization scope will be confirmed before orders open.",
    action: "preorder-intent",
    actionLabel: "Register preorder interest",
    heroMark: "03",
  },
  {
    slug: "the-photo-archive",
    title: "The Photo Archive",
    category: "kin-meal",
    eyebrow: "KIN MEAL / FOR THE LIFE BETWEEN THE PHOTOS",
    summary:
      "A gentle archive for photographs and the stories they cannot hold alone.",
    introduction:
      "The best photograph is often surrounded by the ones that did not make the frame: the waiting, the joke, the walk home. This meal makes a small, artful archive from selected images and the context around them.",
    example:
      "A sequence of familiar photos is paired with captions, fragments, and the tiny outtakes that make the memory feel whole.",
    heroGift:
      "A digital photo essay, sequenced and captioned as a short visual publication for one person or relationship.",
    fillings: [
      "A set of three caption cards for sharing",
      "An optional poem or audio memory",
      "A future print-ready edition as an optional physical filling",
    ],
    personalMessage:
      "Add a dedication or write a note to accompany the first page.",
    readmeGuide: [
      "Open the private photo essay link.",
      "Download a personal-use copy for safekeeping.",
      "Share privately with the people pictured, with their consent.",
    ],
    artistProcessNote:
      "The artist works with the sequence and edges of the archive: what repeats, what is missing, and what a caption can leave unsaid. Image rights and consent are confirmed before production.",
    occasions: ["Anniversaries", "Family milestones", "Remembering a shared trip"],
    included: [
      "One custom digital photo essay with up to twelve images",
      "Editorial sequencing and short captions",
      "A personal message and three shareable cards",
      "A README guide and artist process note",
    ],
    provide: [
      "Up to twelve images you own or have permission to use",
      "Names, dates, and short notes to orient the artist",
      "Confirmation that people pictured consent to this private gift",
    ],
    process: [
      "Choose a Gift Brief and select your images.",
      "Confirm rights, names, and any images to keep private.",
      "Review the sequence and captions.",
      "Receive the private essay link and downloadable edition.",
    ],
    customization: [
      "Choose chronological, thematic, or place-led sequencing",
      "Add handwritten captions or scanned ephemera",
      "Ask about a print-ready edition",
    ],
    deliveryTime:
      "The production window will be confirmed before preorder opens and depends on image count and any print options.",
    usageScope:
      "Private, personal viewing and sharing with the people pictured. Purchasers must own or have permission to use submitted images; commercial reuse is not included.",
    priceAndAvailability:
      "Preorder concept. Register your interest; final price depends on image count and any print options and will be confirmed before orders open.",
    action: "preorder-intent",
    actionLabel: "Register preorder interest",
    heroMark: "04",
  },
  {
    slug: "the-soft-landing-pack",
    title: "The Soft Landing Pack",
    category: "kin-meal",
    eyebrow: "KIN MEAL / FOR A CHANGE OF SEASON",
    summary:
      "A small, considered welcome for someone beginning again.",
    introduction:
      "For a new city, a new job, a difficult week, or a chapter that needs gentleness. The Soft Landing Pack gathers reminders, rituals, and small comforts into a gift that does not ask anyone to be okay on schedule.",
    example:
      "A private collection of encouragement, a playlist-sized sound piece, and small rituals for the first few days somewhere unfamiliar.",
    heroGift:
      "A customizable digital comfort pack with a short illustrated welcome, a few grounding prompts, and a personal note.",
    fillings: [
      "A short original poem or sound postcard",
      "A set of gentle digital reminder cards",
      "Optional flowers, tea, or another physical filling from a future partner",
    ],
    personalMessage:
      "Write in your own voice. The message can be direct, quiet, practical, or simply: I am here.",
    readmeGuide: [
      "Open the pack when it feels useful; there is no sequence to complete.",
      "Save the reminder cards to a phone or print them for a desk.",
      "Share the private link only with the intended recipient.",
    ],
    artistProcessNote:
      "The maker avoids forced optimism and productivity language. The work is shaped to offer company and practical tenderness, leaving room for the recipient to feel as they feel.",
    occasions: ["Moving home", "Starting a new role", "Recovery or a hard season"],
    included: [
      "One custom digital welcome pack",
      "Five reminder cards and three grounding prompts",
      "One poem or sound postcard filling",
      "A personal message, README guide, and artist process note",
    ],
    provide: [
      "A Gift Brief and a little context about this transition",
      "Any words, rituals, or comforts you want included",
      "The recipient's name and your personal message",
    ],
    process: [
      "Share what kind of support feels welcome and what does not.",
      "Choose a gentle visual and writing direction.",
      "Review the pack for tone and personal details.",
      "Receive a private link to the finished pack.",
    ],
    customization: [
      "Choose practical, poetic, or almost wordless",
      "Add accessible text-only cards or audio",
      "Include an optional physical filling when available",
    ],
    deliveryTime:
      "The production window and any physical partner fulfillment estimate will be confirmed before preorder opens.",
    usageScope:
      "Personal use by the purchaser and recipient. Any licensed creative work or partner product is subject to its own terms.",
    priceAndAvailability:
      "Preorder concept. Register your interest; price, accessibility options, and delivery timing will be confirmed before orders open.",
    action: "preorder-intent",
    actionLabel: "Register preorder interest",
    heroMark: "05",
  },
  {
    slug: "artist-made-rhemma-meals",
    title: "Artist-made / Rhemma Meals",
    category: "artist-made",
    eyebrow: "A CREATOR-LED GIFT COLLECTION",
    summary:
      "Original gift concepts led by artists, makers, and their own ways of seeing.",
    introduction:
      "Artist-made Meals begin with a creator's point of view. Each artist proposes a concept, defines the creative scope and base price, and works with KIN to make the offer clear, orderable, and deliverable.",
    example:
      "A printmaker might make a symbolic relationship map; a sound artist might turn shared voice notes into a listening piece. Each offer is authored and scoped by its artist.",
    heroGift:
      "A creator-led commissioned gift, with the final form, materials, and scope defined by the participating artist.",
    fillings: [
      "Artist-selected poems, sound, or digital cards",
      "Licensed existing works when rights permit",
      "Physical artist-made works where production and shipping are available",
    ],
    personalMessage:
      "The artist sets how a personal message fits their work and confirms the format before an order is placed.",
    readmeGuide: [
      "Read the artist's scope and usage terms before commissioning.",
      "Follow the delivery instructions supplied with the work.",
      "Contact KIN for order support; contact the artist for process questions.",
    ],
    artistProcessNote:
      "The process note is written by the artist and describes the choices, materials, and boundaries of the specific work.",
    occasions: ["A highly personal commission", "Celebrating an artist's practice", "A one-of-a-kind relationship gift"],
    included: [
      "One artist-defined hero gift",
      "Any fillings named in that artist's offer",
      "The artist's process note and use guide",
      "A personal message when supported by the format",
    ],
    provide: [
      "A Gift Brief and the materials requested by the artist",
      "Any required references, consent, or rights information",
      "Agreement to the creator's stated scope and delivery window",
    ],
    process: [
      "Explore an artist's concept and scope.",
      "Share a brief and request a fit check.",
      "Confirm the artist's price, timeline, and rights in writing.",
      "Place an order when the artist's offer is open.",
    ],
    customization: [
      "Scope, materials, and revisions are set by each artist",
      "Licensing and personal-use terms are stated per offer",
      "Artists can propose a new concept for KIN to productize",
    ],
    deliveryTime:
      "Set by the artist and agreed with the customer before an order is confirmed.",
    usageScope:
      "Defined by each artist's offer. Licensing, credit, sharing, and reproduction terms are agreed before purchase.",
    priceAndAvailability:
      "Concept collection. Artist offers, prices, and opening dates will be listed as creators join. No commission is confirmed until scope and price are agreed.",
    action: "artist-inquiry",
    actionLabel: "Propose an artist-made meal",
    heroMark: "06",
  },
  {
    slug: "supporting-gifts-fillings",
    title: "Supporting Gifts / Fillings",
    category: "supporting-gift",
    eyebrow: "SMALL WORKS THAT COMPLETE A GIFT",
    summary:
      "Optional digital and physical additions, chosen to belong with the hero gift.",
    introduction:
      "Fillings are not a separate shopping list. They are optional works and objects that add another texture to a gift: a poem to keep, a sound to return to, a licensed artwork, or flowers that arrive at the door.",
    example:
      "A Conversation Recap might arrive with a tiny poem, a digital card, and an optional bouquet selected from a partner florist.",
    heroGift:
      "A carefully chosen supporting work or physical object that complements a KIN Meal without replacing its central creative piece.",
    fillings: [
      "Poems, sound pieces, and digital cards",
      "Artist-made or licensed works, subject to stated rights",
      "Flowers and other physical gifts through external partners when available",
    ],
    personalMessage:
      "Where the filling supports it, include a short note connecting the extra piece to the main gift.",
    readmeGuide: [
      "Check the product description for digital or physical delivery.",
      "Review the license before sharing or reproducing any work.",
      "Partner merchants handle their own stock, shipping, and returns for physical goods.",
    ],
    artistProcessNote:
      "Each filling includes its maker or source, the context for pairing it, and any usage terms. Physical partners retain responsibility for their products and fulfillment.",
    occasions: ["Adding a physical gesture", "Pairing art with a digital keepsake", "Making a package feel more complete"],
    included: [
      "Optional selections from the digital and physical filling catalog",
      "Clear delivery and license notes for each item",
      "Partner fulfillment details for physical goods",
    ],
    provide: [
      "The KIN Meal or Gift Brief the filling should complement",
      "Any delivery constraints for physical partner items",
      "Confirmation that the selected work's usage fits your plans",
    ],
    process: [
      "Choose a hero gift first.",
      "Browse compatible supporting works and partner items.",
      "Review rights, delivery, and fulfillment details.",
      "Add available fillings during the package order.",
    ],
    customization: [
      "Choose digital-only, physical, or a mix",
      "Select from poems, sound, cards, licensed art, flowers, and more",
      "Physical options depend on partner location and availability",
    ],
    deliveryTime:
      "Digital delivery varies by maker; physical delivery estimates come from the partner merchant and are confirmed before ordering.",
    usageScope:
      "Each artist or merchant supplies the usage, license, fulfillment, and return terms for their specific work or product.",
    priceAndAvailability:
      "Availability and pricing vary by filling. Licensed works and physical goods show their own terms; partner merchants handle their own payment and fulfillment.",
    action: "start-brief",
    actionLabel: "Build a Gift Brief",
    heroMark: "07",
  },
];

export const supportingGifts: SupportingGift[] = [
  {
    title: "Poems",
    kind: "digital",
    description: "Short original writing or a licensed poem selected for a relationship or occasion.",
  },
  {
    title: "Sound pieces",
    kind: "digital",
    description: "A small listening work, ambient postcard, or artist-made sound note.",
  },
  {
    title: "Digital cards",
    kind: "digital",
    description: "Shareable cards with a personal dedication or visual detail from the brief.",
  },
  {
    title: "Flowers & physical gifts",
    kind: "physical",
    description: "Optional partner-supplied bouquets, printed matter, and other physical additions.",
  },
  {
    title: "Licensed works",
    kind: "licensed",
    description: "Artist works offered with clear personal-use and sharing terms.",
  },
];

export function getGiftPackage(slug: string): GiftPackage | undefined {
  return giftPackages.find((gift) => gift.slug === slug);
}
