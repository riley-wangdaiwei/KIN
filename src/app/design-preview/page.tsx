import Image from "next/image";
import type { CSSProperties } from "react";
import { EditorialButton } from "@/components/editorial/EditorialButton";
import { EditorialTextBlock } from "@/components/editorial/EditorialTextBlock";
import { MetadataLabel } from "@/components/editorial/MetadataLabel";
import { QuestionImageBlock } from "@/components/editorial/QuestionImageBlock";
import { SectionRule } from "@/components/editorial/SectionRule";

const colorTokens = [
  { name: "Black", value: "#050505", variable: "--kin-black" },
  { name: "Near black", value: "#111111", variable: "--kin-near-black" },
  { name: "Charcoal", value: "#242424", variable: "--kin-charcoal" },
  { name: "Mid gray", value: "#777777", variable: "--kin-mid-gray" },
  { name: "Light gray", value: "#C8C8C8", variable: "--kin-light-gray" },
  { name: "Paper white", value: "#F4F3EF", variable: "--kin-paper" },
  { name: "White", value: "#FFFFFF", variable: "--kin-white" },
  { name: "Photo overlay", value: "rgba(0, 0, 0, 0.42)", variable: "--kin-overlay" },
  {
    name: "Heavy overlay",
    value: "rgba(0, 0, 0, 0.68)",
    variable: "--kin-overlay-heavy",
  },
  {
    name: "Black panel",
    value: "rgba(0, 0, 0, 0.94)",
    variable: "--kin-black-panel",
  },
  {
    name: "White wash",
    value: "rgba(255, 255, 255, 0.12)",
    variable: "--kin-white-wash",
  },
];

const barcodeBars = Array.from({ length: 35 }, (_, index) => index);
const gridColumns = Array.from({ length: 12 }, (_, index) => index + 1);

function Barcode({ className = "" }: { className?: string }) {
  return (
    <div className={`barcode ${className}`} aria-hidden="true">
      {barcodeBars.map((bar) => (
        <span key={bar} />
      ))}
    </div>
  );
}

export default function DesignPreviewPage() {
  return (
    <main className="design-preview">
      <section className="design-preview__cover" aria-label="KIN publication cover">
        <Image
          className="design-preview__cover-image"
          src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=2000&q=90"
          alt="A collection of books and printed matter on a studio desk"
          fill
          priority
          sizes="100vw"
        />
        <div className="design-preview__cover-wash" aria-hidden="true" />
        <header className="design-preview__masthead">
          <p className="design-preview__brand">KIN</p>
          <div className="design-preview__cover-meta kin-metadata">
            <span>COLLECTIVE / ISSUE 01</span>
            <span>OBJECTS · MEMORY · GIVING</span>
            <span>2026 — VOL. 01</span>
          </div>
        </header>
        <h1 className="design-preview__cover-title">
          A gift starts
          <br />
          <em>with the little</em>
          <br />
          things.
        </h1>
        <div
          className="design-preview__black-bar design-preview__black-bar--horizontal"
          aria-hidden="true"
        />
        <div
          className="design-preview__black-bar design-preview__black-bar--vertical"
          aria-hidden="true"
        />
        <Barcode className="barcode--cover" />
        <span className="marginal-label marginal-label--cover" aria-hidden="true">
          KIN / FIELD NOTES / 001
        </span>
        <span className="paperclip paperclip--cover" aria-hidden="true" />
        <div className="design-preview__cover-bottom">
          <p className="design-preview__cover-subtitle">
            Collected fragments.
            <br />
            A story made for you.
          </p>
          <MetadataLabel className="design-preview__cover-credit">
            A publication about the small details that become a way of knowing
            someone.
          </MetadataLabel>
        </div>
      </section>

      <section className="design-preview__spread" aria-labelledby="spread-title">
        <div className="design-preview__spread-copy">
          <MetadataLabel>02 — The collection / EN</MetadataLabel>
          <p>
            We keep things without always knowing why. A folded note. The shape
            of a room in winter. A book passed from hand to hand. Each fragment
            carries a little evidence of a life, and each one makes a different
            kind of map.
          </p>
          <p>
            KIN begins with looking closely. What colors return? Which objects
            have gathered a story? What would make someone feel understood,
            rather than simply remembered? These are not clues to solve. They
            are invitations to notice.
          </p>
          <p>
            The things we gather become a language between people. A gift can
            hold that language for a moment: a thought made tangible, assembled
            with attention and offered without hurry.
          </p>
          <p>
            Start with what is already there. Keep the detail that feels
            unmistakably theirs. Let the collection find its own shape; the
            meaning does not have to be explained all at once.
          </p>
          <h2 className="design-preview__spread-quote" id="spread-title">
            “The little things know where to find us.”
          </h2>
          <MetadataLabel>NOTES ON COLLECTING / KIN EDITORIAL</MetadataLabel>
        </div>

        <div className="design-preview__spread-art" aria-label="Layered image and graphic composition">
          <Image
            className="design-preview__spread-image"
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1100&q=85"
            alt="Rows of books in a quiet library"
            fill
            sizes="(max-width: 640px) 100vw, 40vw"
          />
          <div
            className="design-preview__spread-shape design-preview__spread-shape--one"
            aria-hidden="true"
          />
          <div
            className="design-preview__spread-shape design-preview__spread-shape--two"
            aria-hidden="true"
          />
          <h2 className="design-preview__spread-title">
            THE
            <br />
            THINGS
            <br />
            WE KEEP
          </h2>
          <Barcode className="barcode--spread" />
          <MetadataLabel className="design-preview__spread-credit">
            FIG. 01 / A PERSONAL ARCHIVE / KIN, 2026
          </MetadataLabel>
        </div>
      </section>

      <section className="design-preview__system" aria-labelledby="system-title">
        <header className="design-preview__section-heading">
          <h2 className="design-preview__section-title" id="system-title">
            System notes
          </h2>
          <MetadataLabel>03 — Tokens / type / working parts</MetadataLabel>
        </header>

        <div className="design-preview__system-group">
          <MetadataLabel>Color / monochrome as structure</MetadataLabel>
          <div className="design-preview__tokens">
            {colorTokens.map((token) => (
              <div className="token-swatch" key={token.variable}>
                <div
                  className="token-swatch__color"
                  style={
                    { "--swatch": `var(${token.variable})` } as CSSProperties
                  }
                  aria-hidden="true"
                />
                <span className="token-swatch__name">{token.name}</span>
                <span className="token-swatch__value">{token.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="design-preview__system-group">
          <MetadataLabel>Typography / three distinct voices</MetadataLabel>
          <div className="design-preview__type">
            <span className="design-preview__type-name">DISPLAY SERIF / COVER</span>
            <p className="design-preview__type-sample design-preview__type-sample--cover">
              Fragments
            </p>
          </div>
          <div className="design-preview__type">
            <span className="design-preview__type-name">DISPLAY SERIF / FEATURE</span>
            <p className="design-preview__type-sample design-preview__type-sample--feature">
              Things worth keeping
            </p>
          </div>
          <div className="design-preview__type">
            <span className="design-preview__type-name">READING SERIF / BODY</span>
            <p className="design-preview__type-sample design-preview__type-sample--copy">
              Short passages in narrow measures; dense enough to feel printed,
              open enough to remain easy to read.
            </p>
          </div>
          <div className="design-preview__type">
            <span className="design-preview__type-name">MICRO MONO / CAPTION</span>
            <p className="design-preview__type-sample design-preview__type-sample--mono">
              KIN / ISSUE 01 / FIG. 04 / EN — 2026
            </p>
          </div>
        </div>

        <div className="design-preview__system-group">
          <MetadataLabel>Grid / twelve columns, deliberately interrupted</MetadataLabel>
          <div className="design-preview__grid" aria-label="Twelve-column editorial grid">
            {gridColumns.map((column) => (
              <div className="design-preview__grid-column" key={column}>
                {String(column).padStart(2, "0")}
              </div>
            ))}
          </div>
        </div>

        <div className="design-preview__system-group">
          <MetadataLabel>Components / publication meets working interface</MetadataLabel>
          <div className="design-preview__components">
            <div className="design-preview__component">
              <MetadataLabel className="design-preview__component-label">
                Metadata / marginalia
              </MetadataLabel>
              <MetadataLabel>EN / 01 — Collected by KIN</MetadataLabel>
              <MetadataLabel accent>FIG. 04 / THE PERSONAL ARCHIVE</MetadataLabel>
            </div>

            <div className="design-preview__component">
              <EditorialTextBlock
                label="A note from the editor"
                title="Notice what stays."
              >
                <p>
                  A note, a color, the corner of a familiar room. <strong>Small
                  details make a portrait</strong> long before we have the
                  words for it.
                </p>
                <p>
                  Gather them slowly. Let the story arrive in its own time.
                </p>
              </EditorialTextBlock>
            </div>

            <div className="design-preview__component design-preview__rule-dark">
              <MetadataLabel className="design-preview__component-label">
                Rules / print scaffolding
              </MetadataLabel>
              <SectionRule label="A quiet division" />
              <SectionRule />
              <div className="paperclip" aria-hidden="true" />
            </div>

            <div className="design-preview__component design-preview__component--wide">
              <MetadataLabel className="design-preview__component-label">
                Controls / compact utility
              </MetadataLabel>
              <div className="design-preview__buttons">
                <EditorialButton variant="primary">Begin a collection</EditorialButton>
                <EditorialButton variant="secondary">Read the note</EditorialButton>
                <EditorialButton variant="text">Meet the maker</EditorialButton>
                <EditorialButton disabled>Unavailable</EditorialButton>
              </div>
            </div>

            <div className="design-preview__image-demo">
              <MetadataLabel>Image + question / asymmetry + documentary crop</MetadataLabel>
              <QuestionImageBlock
                question="What do you notice first?"
                imageSrc="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1600&q=85"
                imageAlt="A quiet collection of books on library shelves"
                imageTitle="A detail becomes a story."
                caption="IMAGE 03 / NOTES FROM A PERSONAL ARCHIVE / KIN, ISSUE 01"
              />
            </div>
          </div>
        </div>

        <footer className="design-preview__footer">
          <MetadataLabel>KIN / DENSE EDITORIAL PUBLICATION</MetadataLabel>
          <MetadataLabel>BLACK · PAPER · IMAGE · WORD</MetadataLabel>
        </footer>
      </section>
    </main>
  );
}
