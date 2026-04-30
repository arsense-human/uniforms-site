"use client";

import { FormEvent, useState } from "react";

type ContactFormProps = {
  productName?: string;
  onSuccess?: () => void;
};

export function ContactForm({ productName, onSuccess }: ContactFormProps) {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setSent(true);
    onSuccess?.();
  }

  return (
    <form
      className="grid gap-4 bg-[#FAFAFA] text-[#111111]"
      onSubmit={handleSubmit}
      aria-label={productName ? `Заявка на ${productName}` : "Заявка на расчёт"}
    >
      {productName ? <input type="hidden" name="Модель" value={productName} /> : null}

      <label className="grid gap-2 text-[11px] uppercase leading-none text-[#595959]">
        Имя
        <input
          className="border-0 border-b border-[#111111] bg-transparent px-0 py-3 text-[15px] normal-case text-[#111111] outline-none"
          name="Имя"
          autoComplete="name"
        />
      </label>

      <label className="grid gap-2 text-[11px] uppercase leading-none text-[#595959]">
        Контакт
        <input
          className="border-0 border-b border-[#111111] bg-transparent px-0 py-3 text-[15px] normal-case text-[#111111] outline-none"
          name="Контакт"
          autoComplete="email"
        />
      </label>

      <label className="grid gap-2 text-[11px] uppercase leading-none text-[#595959]">
        Комментарий
        <textarea
          className="min-h-28 resize-y border-0 border-b border-[#111111] bg-transparent px-0 py-3 text-[15px] normal-case text-[#111111] outline-none"
          name="Комментарий"
        />
      </label>

      <button
        className="mt-2 w-max border-0 border-b border-current bg-transparent px-0 pb-1 text-[12px] uppercase text-[#111111]"
        type="submit"
      >
        Получить расчёт
      </button>

      {sent ? (
        <p className="font-serif text-[22px] leading-tight text-[#595959]">
          Мы свяжемся с вами в течение 1 рабочего дня
        </p>
      ) : null}
    </form>
  );
}
