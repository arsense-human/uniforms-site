import { ProductCard } from "../../components/ProductCard";

export default function ProductExamplePage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#111111]">
      <ProductCard
        title="Футболка relaxed fit"
        description="Даже базовые вещи мы делаем интересно. Это не просто футболка с принтом."
        imageSrc="/assets/standalone/editorial-look.jpg"
        detailImageSrc="/assets/merch/u2010.png"
        specs={[
          { label: "Состав", value: "Материалы подбираются под задачу" },
          { label: "Плотность", value: "Высокая плотность" },
          { label: "Доступные размеры", value: "Разные размеры и цвета" },
          { label: "Посадка", value: "Relaxed fit" },
        ]}
        related={[
          { title: "Лонгслив", href: "/catalog#merch" },
          { title: "Худи relaxed fit", href: "/catalog#merch" },
          { title: "Свитшот relaxed fit", href: "/catalog#merch" },
        ]}
      />
    </main>
  );
}
