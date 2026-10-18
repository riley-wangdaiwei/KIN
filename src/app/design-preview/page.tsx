import type { CSSProperties } from "react";
import { EditorialButton } from "@/components/editorial/EditorialButton";
import { EditorialTextBlock } from "@/components/editorial/EditorialTextBlock";
import { MetadataLabel } from "@/components/editorial/MetadataLabel";
import { QuestionImageBlock } from "@/components/editorial/QuestionImageBlock";
import { SectionRule } from "@/components/editorial/SectionRule";

const colorTokens = [
  { name: "Paper", value: "#F1F0E9", variable: "--color-paper" },
  { name: "Ink", value: "#171717", variable: "--color-ink" },
  { name: "Secondary ink", value: "#595959", variable: "--color-secondary-ink" },
  { name: "Rule", value: "#B9B7AE", variable: "--color-rule" },
  { name: "Dark surface", value: "#111111", variable: "--color-dark-surface" },
  { name: "Accent", value: "#E4523D", variable: "--color-accent" },
  {
    name: "Accessible accent text",
    value: "#A62F20",
    variable: "--color-accent-ink",
  },
  {
    name: "Image overlay · 58%",
    value: "rgba(10, 10, 10, 0.58)",
    variable: "--color-image-overlay",
  },
  {
    name: "Selected background",
    value: "#F8DED7",
    variable: "--color-selected-background",
  },
];

const typographySamples = [
  { label: "Hero · display serif", className: "hero", sample: "A magazine for the things we keep." },
  { label: "Section · display serif", className: "section", sample: "The things we love" },
  { label: "Subsection · display serif", className: "subsection", sample: "Gathered with care" },
  { label: "Body · Arial / Helvetica", className: "body", sample: "Short, considered copy with a readable measure and close leading." },
  { label: "Metadata · uppercase sans", className: "metadata", sample: "Issue no. 01 · Made by hand · Autumn 2026" },
];

const gridColumns = Array.from({ length: 12 }, (_, index) => index + 1);

export default function DesignPreviewPage() {
  return (
    <main className="editorial-page">
      <header className="preview-header">
        <p className="preview-header__wordmark">KIN</p>
        <MetadataLabel>Design system / Version 01</MetadataLabel>
      </header>

      <section className="preview-intro editorial-grid">
        <div className="grid-span-8">
          <MetadataLabel accent>KIN Editorial Magazine</MetadataLabel>
          <h1 className="preview-intro__title">A language for what matters.</h1>
        </div>
        <p className="preview-intro__aside grid-span-4">
          Literary, image-led and tactile. An editorial system for gathering
          inspiration and making thoughtful things.
        </p>
      </section>

      <div className="preview-footer">
        <MetadataLabel>01 / Color</MetadataLabel>
      </div>
      <section className="preview-section" aria-labelledby="colors-heading">
        <div className="preview-section__heading">
          <h2 className="preview-section__title" id="colors-heading">The palette</h2>
          <MetadataLabel>Paper &amp; ink, with one deliberate accent</MetadataLabel>
        </div>
        <div className="token-strip">
          {colorTokens.map((token) => (
            <div className="color-token" key={token.variable}>
              <div
                className="color-token__swatch"
                style={
                  { "--swatch-color": `var(${token.variable})` } as CSSProperties
                }
                aria-hidden="true"
              />
              <span className="color-token__name">{token.name}</span>
              <span className="color-token__value">{token.value}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="preview-footer">
        <MetadataLabel>02 / Typography</MetadataLabel>
      </div>
      <section className="preview-section" aria-labelledby="type-heading">
        <div className="preview-section__heading">
          <h2 className="preview-section__title" id="type-heading">Type in contrast</h2>
          <MetadataLabel>Times New Roman / Georgia · Arial / Helvetica</MetadataLabel>
        </div>
        <div>
          {typographySamples.map((sample) => (
            <div className="type-sample" key={sample.label}>
              <span className="type-sample__label">{sample.label}</span>
              <p className={`type-sample__example type-sample__example--${sample.className}`}>
                {sample.sample}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="preview-footer">
        <MetadataLabel>03 / The grid</MetadataLabel>
      </div>
      <section className="preview-section" aria-labelledby="grid-heading">
        <div className="preview-section__heading">
          <h2 className="preview-section__title" id="grid-heading">Twelve compact columns</h2>
          <MetadataLabel>16–32 px page gutter · 12–24 px gap</MetadataLabel>
        </div>
        <div className="grid-demo" aria-label="Twelve-column editorial grid">
          {gridColumns.map((column) => (
            <div className="grid-demo__column" key={column}>
              {String(column).padStart(2, "0")}
            </div>
          ))}
        </div>
      </section>

      <div className="preview-footer">
        <MetadataLabel>04 / Components</MetadataLabel>
      </div>
      <section className="preview-section" aria-labelledby="components-heading">
        <div className="preview-section__heading">
          <h2 className="preview-section__title" id="components-heading">Editorial building blocks</h2>
          <MetadataLabel>Compact, purposeful, readable</MetadataLabel>
        </div>

        <div className="editorial-grid">
          <div className="component-demo grid-span-4">
            <MetadataLabel>Metadata label</MetadataLabel>
            <MetadataLabel accent>Selected / Category / Issue 01</MetadataLabel>
            <p className="component-demo__annotation">
              Uppercase sans, tightly set and easy to scan.
            </p>
          </div>
          <div className="component-demo grid-span-4">
            <EditorialTextBlock
              label="A note from KIN"
              title="Keep what moves you."
            >
              <p>
                The small things we save become a language of their own.
                <strong> Collect, curate, create, give.</strong>
              </p>
            </EditorialTextBlock>
          </div>
          <div className="component-demo grid-span-4">
            <MetadataLabel>Section rule</MetadataLabel>
            <SectionRule label="A considered pause" />
            <SectionRule />
            <p className="component-demo__annotation">
              Fine paper-toned rules separate editorial units.
            </p>
          </div>

          <div className="component-demo grid-span-12">
            <MetadataLabel>Buttons · square corners, clear action</MetadataLabel>
            <div className="component-demo__buttons">
              <EditorialButton variant="primary">Start a board</EditorialButton>
              <EditorialButton variant="secondary">Read the story</EditorialButton>
              <EditorialButton variant="text">Meet the artist</EditorialButton>
              <EditorialButton disabled>Unavailable</EditorialButton>
            </div>
          </div>

          <div className="component-demo grid-span-12">
            <MetadataLabel>Question / image · asymmetrical, darkened, overlaid</MetadataLabel>
            <QuestionImageBlock
              question="What stays with you?"
              imageSrc="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1600&q=85"
              imageAlt="Friends sharing a moment together outdoors"
              imageTitle="The moments we keep."
              caption="A small collection of things worth remembering · KIN, Issue 01"
            />
          </div>
        </div>
      </section>
      <footer className="preview-footer">
        <MetadataLabel>Paper / ink / image / intention</MetadataLabel>
      </footer>
    </main>
  );
}
