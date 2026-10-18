import Image from "next/image";

interface QuestionImageBlockProps {
  question: string;
  imageSrc: string;
  imageAlt: string;
  imageTitle: string;
  caption: string;
}

export function QuestionImageBlock({
  caption,
  imageAlt,
  imageSrc,
  imageTitle,
  question,
}: QuestionImageBlockProps) {
  return (
    <section className="question-image-block" aria-label={question}>
      <h2 className="question-image-block__question kin-editorial-title">
        {question}
      </h2>
      <figure>
        <div className="question-image-block__figure">
          <Image
            className="question-image-block__image"
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, 60vw"
          />
          <p className="question-image-block__image-title kin-editorial-title">
            {imageTitle}
          </p>
        </div>
        <figcaption className="question-image-block__caption">
          {caption}
        </figcaption>
      </figure>
    </section>
  );
}
