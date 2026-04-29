# Product folders

Каждая позиция каталога лежит в отдельной папке:

```text
content/products/u2010/product.json
content/products/u2010/photo-1.jpg
content/products/u2010/photo-2.jpg
```

Чтобы добавить новую позицию:

1. Создайте новую папку в `content/products`.
2. Добавьте `product.json`.
3. Положите фотографии в эту же папку или укажите пути в поле `images`.
4. Обновите сайт на локальном сервере.

На локальном сервере новые папки подхватываются автоматически. Для статичной публикации без списка директорий добавьте slug новой папки в `content/products/index.json`.

Минимальный формат:

```json
{
  "slug": "u2010",
  "category": "merch",
  "code": "U2010",
  "title": "Футболка relaxed fit",
  "cardTitle": "Футболка relaxed fit",
  "cardMeta": "мерч / позиция каталога",
  "cardImage": "assets/merch/u2010.png",
  "images": ["assets/merch/u2010.png"],
  "kicker": "Производим под заказ",
  "description": "Даже базовые вещи мы делаем интересно. Это не просто футболка с принтом.",
  "specs": [
    { "label": "Состав", "value": "Материалы подбираются под задачу" },
    { "label": "Плотность", "value": "Высокая плотность" },
    { "label": "Размеры", "value": "Разные размеры и цвета" },
    { "label": "Посадка", "value": "Relaxed fit" }
  ],
  "production": [
    { "label": "Срок", "value": "от 15 дней" },
    { "label": "Тираж", "value": "от 50 шт" },
    { "label": "Кастомизация", "value": "цвет / ткань / брендирование" }
  ]
}
```
