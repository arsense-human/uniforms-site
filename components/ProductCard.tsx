"use client";

import { useState } from "react";
import { ContactForm } from "./ContactForm";

type ProductSpec = {
  label: string;
  value: string;
};

type RelatedProduct = {
  title: string;
  href: string;
};

type ProductCardProps = {
  title: string;
  description: string;
  imageSrc: string;
  detailImageSrc?: string;
  imageAlt?: string;
  specs: ProductSpec[];
  production?: {
    term?: string;
    minimumRun?: string;
    customization?: string;
  };
  related?: RelatedProduct[];
};

export function ProductCard({
  title,
  description,
  imageSrc,
  detailImageSrc,
  imageAlt,
  specs,
  production = {
    term: "от 15 дней",
    minimumRun: "от 50 шт",
    customization: "цвет, ткань, брендирование",
  },
  related = [],
}: ProductCardProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const currentImage = isHovered && detailImageSrc ? detailImageSrc : imageSrc;

  return (
    <section className="bg-[#FAFAFA] px-5 py-10 text-[#111111] md:px-10 md:py-16">
      <article className="mx-auto grid max-w-[1480px] gap-10 md:grid-cols-[minmax(280px,0.48fr)_minmax(0,0.52fr)] md:gap-16">
        <figure
          className="m-0 bg-[#FAFAFA]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            className="aspect-[4/5] h-auto w-full object-contain"
            src={currentImage}
            alt={imageAlt || title}
          />
        </figure>

        <div className="grid content-start gap-7">
          <header>
            <h2 className="max-w-3xl font-serif text-[42px] font-medium uppercase leading-[0.94] tracking-normal md:text-[72px]">
              {title}
            </h2>
            <p className="mt-5 max-w-2xl font-serif text-[24px] leading-tight md:text-[32px]">
              {description}
            </p>
          </header>

          <dl className="grid border-t border-[#111111]">
            {specs.map((spec) => (
              <div
                className="grid grid-cols-[120px_1fr] gap-5 border-b border-[#111111] py-3 text-sm"
                key={spec.label}
              >
                <dt className="text-[11px] uppercase leading-tight text-[#595959]">
                  {spec.label}
                </dt>
                <dd className="m-0 font-serif text-[20px] leading-tight">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>

          <dl className="grid border-t border-[#111111] pt-2">
            <div className="grid grid-cols-[120px_1fr] gap-5 border-b border-[#111111] py-3">
              <dt className="text-[11px] uppercase leading-tight text-[#595959]">
                Срок производства
              </dt>
              <dd className="m-0 font-serif text-[20px] leading-tight">
                {production.term}
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-5 border-b border-[#111111] py-3">
              <dt className="text-[11px] uppercase leading-tight text-[#595959]">
                Минимальный тираж
              </dt>
              <dd className="m-0 font-serif text-[20px] leading-tight">
                {production.minimumRun}
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-5 border-b border-[#111111] py-3">
              <dt className="text-[11px] uppercase leading-tight text-[#595959]">
                Кастомизация
              </dt>
              <dd className="m-0 font-serif text-[20px] leading-tight">
                {production.customization}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-5 text-[12px] uppercase">
            <button
              className="border-0 border-b border-current bg-transparent px-0 pb-1"
              type="button"
              onClick={() => setIsFormOpen(true)}
            >
              Получить расчёт
            </button>
            <button
              className="border-0 border-b border-current bg-transparent px-0 pb-1"
              type="button"
              onClick={() => setIsFormOpen(true)}
            >
              Обсудить проект
            </button>
          </div>

          {related.length ? (
            <nav className="grid gap-3 border-t border-[#111111] pt-5">
              <p className="m-0 text-[11px] uppercase text-[#595959]">
                С этим заказывают
              </p>
              <div className="flex gap-5 overflow-x-auto text-[12px] uppercase">
                {related.map((item) => (
                  <a
                    className="shrink-0 border-b border-current pb-1"
                    href={item.href}
                    key={item.href}
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            </nav>
          ) : null}
        </div>
      </article>

      {isFormOpen ? (
        <dialog
          className="fixed inset-0 m-auto w-[min(560px,calc(100vw-32px))] border border-[#111111] bg-[#FAFAFA] p-6 text-[#111111] backdrop:bg-[rgba(250,250,250,0.72)]"
          open
        >
          <button
            className="float-right border-0 bg-transparent p-0 text-[12px] uppercase"
            type="button"
            onClick={() => setIsFormOpen(false)}
          >
            Закрыть
          </button>
          <p className="m-0 mb-3 text-[11px] uppercase text-[#595959]">
            Обратная связь
          </p>
          <h3 className="mb-6 font-serif text-[42px] font-medium uppercase leading-none">
            Получить расчёт
          </h3>
          <ContactForm productName={title} />
        </dialog>
      ) : null}
    </section>
  );
}
