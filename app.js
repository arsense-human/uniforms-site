const menuButton = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector(".main-nav");
const hangingPrepositions = [
  "перед",
  "через",
  "между",
  "после",
  "около",
  "ради",
  "вдоль",
  "вокруг",
  "кроме",
  "среди",
  "против",
  "вместо",
  "внутри",
  "мимо",
  "для",
  "без",
  "над",
  "под",
  "при",
  "про",
  "обо",
  "изо",
  "ото",
  "во",
  "на",
  "ко",
  "со",
  "об",
  "от",
  "до",
  "по",
  "за",
  "из",
  "о",
  "у",
  "к",
  "с",
  "в",
  "а",
  "и",
  "но",
  "или",
  "что",
  "как",
  "не",
  "ни",
  "же",
  "ли",
  "бы",
];
const hangingPrepositionPattern = new RegExp(
  `(^|[\\s([{«"„])(${hangingPrepositions.join("|")})([ \\t]+)`,
  "giu"
);

const wordStart = "(^|[^\\p{L}\\p{N}_])";
const wordEnd = "(?=$|[^\\p{L}\\p{N}_])";
const obviousYoReplacements = [
  [new RegExp(`${wordStart}расчет(а|ам|ами|ах|е|ом|у|ы|)${wordEnd}`, "giu"), "расчёт"],
  [new RegExp(`${wordStart}просчет(а|ам|ами|ах|е|ом|у|ы|)${wordEnd}`, "giu"), "просчёт"],
  [new RegExp(`${wordStart}счет(а|ам|ами|ах|е|ом|у|ы|)${wordEnd}`, "giu"), "счёт"],
  [new RegExp(`${wordStart}объем(а|ам|ами|ах|е|ом|у|ы|н|ная|ное|ной|ные|ный|ных|ными|)${wordEnd}`, "giu"), "объём"],
  [new RegExp(`${wordStart}соберем()${wordEnd}`, "giu"), "соберём"],
  [new RegExp(`${wordStart}живет()${wordEnd}`, "giu"), "живёт"],
  [new RegExp(`${wordStart}несет()${wordEnd}`, "giu"), "несёт"],
  [new RegExp(`${wordStart}ведет()${wordEnd}`, "giu"), "ведёт"],
  [new RegExp(`${wordStart}дойдет()${wordEnd}`, "giu"), "дойдёт"],
  [new RegExp(`${wordStart}съемк(а|е|и|ой|у|)${wordEnd}`, "giu"), "съёмк"],
  [new RegExp(`${wordStart}застежк(а|е|и|ой|у|)${wordEnd}`, "giu"), "застёжк"],
  [new RegExp(`${wordStart}утепленн(ая|ое|ой|ую|ые|ый|ых|ыми|)${wordEnd}`, "giu"), "утеплённ"],
  [new RegExp(`${wordStart}жестк(ая|ое|ой|ую|ие|ий|их|ими|)${wordEnd}`, "giu"), "жёстк"],
  [new RegExp(`${wordStart}шелк(а|е|ом|у|)${wordEnd}`, "giu"), "шёлк"],
  [new RegExp(`${wordStart}шелков(ая|ое|ой|ую|ые|ый|ых|ыми|)${wordEnd}`, "giu"), "шёлков"],
  [new RegExp(`${wordStart}черн(ая|ое|ой|ую|ые|ый|ых|ыми|)${wordEnd}`, "giu"), "чёрн"],
];

function preserveInitialCase(source = "", replacement = "") {
  return /^[А-ЯЁA-Z]/.test(source) ? replacement.charAt(0).toUpperCase() + replacement.slice(1) : replacement;
}

function normalizeYo(text = "") {
  return String(text).normalize("NFC").replace(/ё/g, "е").replace(/Ё/g, "Е");
}

function protectHangingPrepositions(text = "") {
  return normalizeYo(text).replace(hangingPrepositionPattern, "$1$2\u00a0");
}

function protectTextNodes(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT)$/.test(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    node.nodeValue = protectHangingPrepositions(node.nodeValue);
  });
}

function styleYoGlyphs(root = document.body) {
  return root;
}

function applyEditableStyle(node, style = {}) {
  if (!style || typeof style !== "object") return;
  const styleMap = {
    alignSelf: "alignSelf",
    color: "color",
    fontFamily: "fontFamily",
    fontSize: "fontSize",
    fontStyle: "fontStyle",
    fontWeight: "fontWeight",
    justifySelf: "justifySelf",
    lineHeight: "lineHeight",
    marginBottom: "marginBottom",
    marginTop: "marginTop",
    maxHeight: "maxHeight",
    maxWidth: "maxWidth",
    objectFit: "objectFit",
    textAlign: "textAlign",
    textTransform: "textTransform",
    width: "width",
  };

  Object.entries(styleMap).forEach(([key, cssKey]) => {
    if (style[key]) node.style[cssKey] = style[key];
    else node.style[cssKey] = "";
  });
}

function applyCaptionBoxStyle(node, style = {}) {
  const captionBox = node.closest(".look-caption-stack");
  if (!captionBox || !style || typeof style !== "object") return;
  const styleMap = {
    bottom: "bottom",
    justifyItems: "justifyItems",
    left: "left",
    maxWidth: "maxWidth",
    right: "right",
    top: "top",
  };

  Object.entries(styleMap).forEach(([key, cssKey]) => {
    if (style[key]) captionBox.style[cssKey] = style[key];
    else captionBox.style[cssKey] = "";
  });
}

function getCaptionInset() {
  return Math.min(22, Math.max(12, window.innerWidth * 0.016));
}

function syncCaptionStacksToImages() {
  document.querySelectorAll(".article-image .look-caption-stack").forEach((stack) => {
    const figure = stack.closest(".article-image");
    const image = figure?.querySelector("img");
    if (!figure || !image) return;

    const figureRect = figure.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    if (!figureRect.width || !figureRect.height || !imageRect.width || !imageRect.height) return;

    const inset = getCaptionInset();
    const imageLeft = imageRect.left - figureRect.left;
    const imageRight = imageLeft + imageRect.width;
    const minLeft = imageLeft + inset;
    const maxLeft = Math.max(minLeft, imageRight - inset - 140);
    const minBottom = figureRect.bottom - imageRect.bottom + inset;
    const computedStyle = window.getComputedStyle(stack);
    const currentLeft = parseFloat(computedStyle.left);
    const currentBottom = parseFloat(computedStyle.bottom);
    const left = Number.isFinite(currentLeft)
      ? Math.min(Math.max(currentLeft, minLeft), maxLeft)
      : minLeft;
    const bottom = Number.isFinite(currentBottom) ? Math.max(currentBottom, minBottom) : minBottom;
    const availableWidth = Math.max(140, imageRect.width - inset * 2);

    stack.style.left = `${left}px`;
    stack.style.right = "auto";
    stack.style.top = "auto";
    stack.style.bottom = `${bottom}px`;
    stack.style.width = `${Math.max(140, imageRight - inset - left)}px`;
    stack.style.maxWidth = `${Math.min(420, availableWidth)}px`;
  });
}

function initCaptionStackSync() {
  const run = () => requestAnimationFrame(syncCaptionStacksToImages);
  run();
  window.addEventListener("resize", run);
  document.querySelectorAll(".article-image .look-caption-stack").forEach((stack) => {
    const image = stack.closest(".article-image")?.querySelector("img");
    if (!image) return;
    if (image.complete) run();
    else image.addEventListener("load", run, { once: true });
  });
}

async function loadEditableContent() {
  const page = document.body.dataset.contentPage;
  if (!page) return;
  const root = document.body.dataset.contentRoot || "";

  try {
    const response = await fetch(`${root}content/${page}.json`, { cache: "no-store" });
    if (!response.ok) return;
    const content = await response.json();

    content.fields?.forEach((field) => {
      const nodes = document.querySelectorAll(field.selector);
      nodes.forEach((node) => {
        if (field.attr) {
          node.setAttribute(field.attr, field.value || "");
        } else {
          node.textContent = protectHangingPrepositions(field.value || "");
        }
        applyEditableStyle(node, field.style);
        applyCaptionBoxStyle(node, field.captionBoxStyle || field.captionStyle);
      });
    });
  } catch (error) {
    console.warn("Content file was not loaded", error);
  }
}

const contentReady = loadEditableContent();

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    nav.classList.toggle("is-open");
  });
}

const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
let products = Array.from(document.querySelectorAll(".product-card"));
const searchInput = document.querySelector("[data-search]");
const productGrids = Array.from(document.querySelectorAll("[data-category-grid]"));

let activeFilter = "all";

function updateProducts() {
  const query = (searchInput?.value || "").trim().toLowerCase();

  products.forEach((product) => {
    const categories = product.dataset.category || "";
    const name = product.dataset.name || "";
    const matchesFilter = activeFilter === "all" || categories.includes(activeFilter);
    const matchesSearch = !query || name.includes(query);
    product.classList.toggle("is-hidden", !matchesFilter || !matchesSearch);
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    updateProducts();
  });
});

searchInput?.addEventListener("input", updateProducts);

const dialog = document.querySelector("[data-dialog]");
const dialogTitle = document.querySelector("[data-dialog-title]");
const dialogDetail = document.querySelector("[data-dialog-detail]");
const dialogKicker = document.querySelector("[data-product-kicker]");
const dialogImage = document.querySelector("[data-product-image]");
const dialogCounter = document.querySelector("[data-product-counter]");
const dialogSpecs = document.querySelector("[data-product-specs]");
const dialogProduction = document.querySelector("[data-product-production]");
const productPricingSection = document.querySelector("[data-product-pricing-section]");
const productPricingToggle = document.querySelector("[data-product-pricing-toggle]");
const productPricingBody = document.querySelector("[data-product-pricing-body]");
const productPricing = document.querySelector("[data-product-pricing]");
const productPriceNote = document.querySelector("[data-product-price-note]");
const dialogPrev = document.querySelector("[data-product-prev]");
const dialogNext = document.querySelector("[data-product-next]");
const productForm = document.querySelector("[data-product-form]");
const productFormModel = document.querySelector("[data-product-form-model]");
const productFormDialog = document.querySelector("[data-product-form-dialog]");
const productFormClose = document.querySelector("[data-product-form-close]");
const measurementsDialog = document.querySelector("[data-measurements-dialog]");
const measurementsOpen = document.querySelector("[data-measurements-open]");
const measurementsClose = document.querySelector("[data-measurements-close]");
const productPage = document.querySelector("[data-product-page]");
const productPageLayout = document.querySelector("[data-product-page-layout]");
const productPageImages = document.querySelector("[data-product-page-images]");
const productPageStatus = document.querySelector("[data-product-page-status]");
const closeButton = document.querySelector("[data-close]");
const productRequestButtons = Array.from(document.querySelectorAll("[data-product-request]"));
const productMaterialSelect = document.querySelector("[data-product-material]");
const productQtyInput = document.querySelector("[data-product-qty]");
const addProductToCartButton = document.querySelector("[data-add-product-to-cart]");
const productPaletteSection = document.querySelector("[data-product-palette-section]");
const productPalette = document.querySelector("[data-product-palette]");
let catalogProducts = [];
let activeProduct = null;
let activeProductImageIndex = 0;

const productDirectory = "content/products/";
const cartStorageKey = "uniformsRequestCart";
const cookieConsentStorageKey = "uniformsCookieConsent20260501";
const contactEmail = "zakaz@uniforms.ru";
let offerData = null;

const paletteSwatches = [
  "#111111", "#f2f0e8", "#8e9a74", "#c96f3e", "#5c5878", "#d9d4bf",
  "#843a2d", "#f1f1ef", "#4d2a20", "#587078", "#d6ce51", "#5d2436",
  "#2f3422", "#b7c3a0", "#6f6a54", "#c7c1ad", "#ece7d8", "#1f2531",
  "#7f8a8c", "#a8573d", "#d4c8b1", "#3d3a36", "#9a927d", "#edecef"
];

function productAssetPath(product, value = "") {
  if (!value) return "";
  if (/^(https?:|data:|\/|assets\/|source-archives\/|content\/)/.test(value)) return value;
  return `${productDirectory}${product.slug}/${value}`;
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Cannot load ${path}`);
  return response.json();
}

async function loadOfferData() {
  if (offerData) return offerData;
  try {
    offerData = await fetchJson("content/offer.json");
  } catch (error) {
    console.warn("Offer data was not loaded", error);
    offerData = {};
  }
  return offerData;
}

function formatMoney(value = 0) {
  return `${Math.round(value).toLocaleString("ru-RU")} руб.`;
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(cartStorageKey) || "[]");
  } catch (error) {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(cartStorageKey, JSON.stringify(items));
  updateCartCount();
}

function siteRootPath() {
  if (document.body.dataset.contentRoot !== undefined) return document.body.dataset.contentRoot;
  return window.location.pathname.includes("/cases/") ? "../" : "";
}

function ensureMobileCartLink() {
  if (document.querySelector("[data-mobile-cart-link]")) return;

  const link = document.createElement("a");
  link.className = "mobile-cart-link";
  link.href = `${siteRootPath()}cart.html`;
  link.setAttribute("data-mobile-cart-link", "");
  link.innerHTML = `Калькулятор <span data-cart-count>0</span>`;
  document.body.appendChild(link);
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(count);
    node.classList.toggle("is-filled", count > 0);
    node.closest(".cart-nav-link, .mobile-cart-link")?.classList.toggle("has-items", count > 0);
  });
}

function renderSiteFooter() {
  let footer = document.querySelector(".site-footer");
  if (!footer) {
    footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.id = "contacts";
    const insertionPoint = document.querySelector("dialog, script");
    document.body.insertBefore(footer, insertionPoint || null);
  }

  const root = siteRootPath();
  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="footer-brand-block">
      <img class="footer-logo" src="${root}assets/brand/uniforms-logo-full-white.png" alt="UNIFORMS">
      <p>Если у вас есть задача — давайте соберем ее правильно.</p>
    </div>
    <nav class="footer-nav" aria-label="Разделы сайта">
      <a href="${root}terms.html">Сроки и оплата</a>
      <a href="${root}privacy.html">Политика конфиденциальности</a>
      <a href="${root}offer.html">Публичная оферта</a>
      <a href="${root}measurements.html">Как снять мерки</a>
      <a href="${root}articles.html">Архив статей</a>
      <a href="${root}vacancies.html">Вакансии</a>
      <a href="${root}cookies.html">Правила кукис</a>
    </nav>
    <address class="footer-contacts">
      <a href="mailto:${contactEmail}">${contactEmail}</a>
      <a href="tel:+79778890318">+7 977 889 03 18</a>
      <span>Кутузовский проспект 36с3, офис 527</span>
    </address>
    <p class="footer-copy">© ${year} UNIFORMS</p>
  `;
}

function initCookieNotice() {
  try {
    if (localStorage.getItem(cookieConsentStorageKey) === "accepted") return;
  } catch (error) {
    return;
  }

  if (document.querySelector("[data-cookie-notice]")) return;
  const root = siteRootPath();
  const notice = document.createElement("section");
  notice.className = "cookie-notice";
  notice.setAttribute("data-cookie-notice", "");
  notice.setAttribute("aria-label", "Уведомление о cookies");
  notice.innerHTML = `
    <p>Сайт использует кукис и локальное хранилище для работы калькулятора и сохранения выбранных настроек.</p>
    <a href="${root}cookies.html">Правила кукис</a>
    <button type="button" data-cookie-accept>Принять</button>
  `;
  document.body.appendChild(notice);
  notice.querySelector("[data-cookie-accept]")?.addEventListener("click", () => {
    localStorage.setItem(cookieConsentStorageKey, "accepted");
    notice.remove();
  });
}

function addCartItem(item) {
  const cart = getCart();
  cart.push({ ...item, cartId: `${Date.now()}-${Math.random().toString(16).slice(2)}` });
  saveCart(cart);
}

function updateCartItem(cartId, updates = {}) {
  const cart = getCart().map((item) => (item.cartId === cartId ? { ...item, ...updates } : item));
  saveCart(cart);
  renderCartPage();
}

function removeCartItem(cartId) {
  saveCart(getCart().filter((item) => item.cartId !== cartId));
  renderCartPage();
}

function optionCost(item, baseUnitPrice = 0) {
  const qty = Math.max(1, Number(item.qty || 1));
  if (item.priceType === "fixed") return Number(item.price || 0);
  if (item.priceType === "sampleMultiplier") return baseUnitPrice * Number(item.multiplier || 1);
  if (item.priceType === "unitMultiplier") return baseUnitPrice * Number(item.multiplier || 1) * qty;
  return Number(item.price || item.unitPrice || 0) * qty;
}

function parseMinRun(value, fallback = 1) {
  return Number(String(value || "").match(/\d+/)?.[0] || fallback);
}

function priceValue(item = {}) {
  return Number(item.unitPrice || Number(String(item.price || "").replace(/\D/g, "")) || 0);
}

function unitPriceForQty(item = {}, qty = 1) {
  const tiers = Array.isArray(item.tiers) ? item.tiers : [];
  const matched = tiers.find((tier) => {
    const from = Number(tier.from || 0);
    const to = Number(tier.to || Infinity);
    return qty >= from && qty <= to;
  });
  return Number(matched?.unitPrice || item.unitPrice || priceValue(item) || 0);
}

function tierLabel(item = {}) {
  const tiers = Array.isArray(item.tiers) ? item.tiers : [];
  if (!tiers.length) return item.price || formatMoney(priceValue(item));
  const first = tiers[0];
  return `${first.label || `от ${first.from} ед.`} · ${formatMoney(first.unitPrice)}`;
}

function renderPalette(root, colors = []) {
  if (!root) return;
  root.innerHTML = "";
  colors.forEach((code, index) => {
    const chip = document.createElement("span");
    chip.className = "palette-chip";
    chip.style.setProperty("--swatch", paletteSwatches[index % paletteSwatches.length]);
    chip.textContent = code;
    root.appendChild(chip);
  });
}

async function discoverProductSlugs() {
  try {
    const response = await fetch(productDirectory, { cache: "no-store" });
    if (response.ok) {
      const html = await response.text();
      const slugs = Array.from(html.matchAll(/href="([^"]+)"/g))
        .map((match) => decodeURIComponent(match[1]))
        .filter((href) => href.endsWith("/") && !href.startsWith(".") && !href.startsWith("/"))
        .map((href) => href.replace(/\/$/, ""))
        .filter((slug) => slug && slug !== "content" && slug !== "products");
      if (slugs.length) return Array.from(new Set(slugs)).sort();
    }
  } catch (error) {
    // Static hosts often hide directory listings, so index.json is the fallback.
  }

  const index = await fetchJson(`${productDirectory}index.json`);
  return index.products || [];
}

async function discoverProductImages(product) {
  const explicitImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  try {
    const response = await fetch(`${productDirectory}${product.slug}/`, { cache: "no-store" });
    if (response.ok) {
      const html = await response.text();
      const folderImages = Array.from(html.matchAll(/href="([^"]+\.(?:jpg|jpeg|png|webp|gif))"/gi))
        .map((match) => decodeURIComponent(match[1]))
        .filter((href) => !href.includes("/"))
        .map((href) => productAssetPath(product, href));
      const allImages = [...folderImages, ...explicitImages.map((image) => productAssetPath(product, image))];
      return Array.from(new Set(allImages));
    }
  } catch (error) {
    // Keep explicit images when directory listing is unavailable.
  }
  return explicitImages.map((image) => productAssetPath(product, image));
}

function productSearchText(product) {
  return [product.code, product.title, product.cardTitle, product.cardMeta, product.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function productFilterTags(product) {
  const text = [product.code, product.title, product.cardTitle, product.cardMeta, product.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const tags = new Set((product.category || "").split(/\s+/).filter(Boolean));
  const has = (words) => words.some((word) => text.includes(word));

  if (has(["костюм", "комплект"]) || text.includes(" suit")) tags.add("suit");
  if (has(["брюки", "юбка", "pants"])) tags.add("lower");
  if (
    has([
      "сорочка",
      "рубашка",
      "блузка",
      "футболка",
      "лонгслив",
      "худи",
      "свитшот",
      "олимпийка",
      "жилет",
      "пиджак",
      "жакет",
      "куртка",
      "ветровка",
    ])
  ) {
    tags.add("upper");
  }
  if (has(["мужск", "мужской"])) tags.add("mens");
  if (has(["женск", "женский"])) tags.add("womens");
  if (text.includes("merch") || (!tags.has("mens") && !tags.has("womens"))) tags.add("unisex");
  return Array.from(tags).join(" ");
}

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  article.dataset.category = productFilterTags(product);
  article.dataset.name = productSearchText(product);

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.productSlug = product.slug;

  const image = document.createElement("img");
  image.src = productAssetPath(product, product.cardImage || product.images?.[0] || "");
  image.alt = product.cardTitle || product.title || "";

  const code = document.createElement("span");
  code.className = "product-code";
  code.textContent = protectHangingPrepositions(product.code || "");

  const title = document.createElement("span");
  title.className = "product-title";
  title.textContent = protectHangingPrepositions(product.cardTitle || product.title || "");

  const meta = document.createElement("span");
  meta.className = "product-meta";
  meta.textContent = protectHangingPrepositions(product.cardMeta || "");

  const price = document.createElement("span");
  price.className = "product-card-price";
  const firstPrice = product.pricing?.find((item) => item.unitPrice || item.price);
  price.textContent = firstPrice ? `от ${formatMoney(firstPrice.unitPrice || Number(String(firstPrice.price).replace(/\D/g, "")))}` : "";

  button.append(image, code, title, meta, price);
  button.addEventListener("click", () => {
    window.location.href = `product.html?product=${encodeURIComponent(product.slug)}`;
  });
  article.appendChild(button);
  return article;
}

function renderDefinitionList(root, items = []) {
  if (!root) return;
  root.innerHTML = "";
  items.filter((item) => item?.label || item?.value).forEach((item) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const value = document.createElement("dd");
    term.textContent = protectHangingPrepositions(item.label || "");
    value.textContent = protectHangingPrepositions(item.value || "");
    row.append(term, value);
    root.appendChild(row);
  });
}

function renderProductPricing(product) {
  const items = Array.isArray(product.pricing) ? product.pricing : [];
  if (!productPricingSection || !productPricing || !productPricingBody) return;
  productPricingSection.hidden = !items.length;
  productPricingBody.hidden = true;
  productPricing.innerHTML = "";
  items.forEach((item) => {
    const row = document.createElement("tr");
    const material = document.createElement("td");
    const run = document.createElement("td");
    const price = document.createElement("td");
    material.innerHTML = `<span>${protectHangingPrepositions(item.material || "")}</span><small>${protectHangingPrepositions(item.composition || "")}</small>`;
    if (Array.isArray(item.tiers) && item.tiers.length) {
      run.innerHTML = item.tiers.map((tier) => `<span>${protectHangingPrepositions(tier.label || `от ${tier.from}`)}</span>`).join("");
      price.innerHTML = item.tiers.map((tier) => `<span>${formatMoney(tier.unitPrice)}</span>`).join("");
    } else {
      run.textContent = protectHangingPrepositions(item.minRun || "");
      price.textContent = protectHangingPrepositions(item.price || "");
    }
    row.append(material, run, price);
    productPricing.appendChild(row);
  });
  if (productPriceNote) productPriceNote.textContent = protectHangingPrepositions(product.priceNote || "");
}

function renderProductOrderControls(product) {
  const prices = Array.isArray(product.pricing) ? product.pricing : [];
  if (productMaterialSelect) {
    productMaterialSelect.innerHTML = "";
    prices.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = protectHangingPrepositions(`${item.material || "Материал"} · ${tierLabel(item)}`);
      productMaterialSelect.appendChild(option);
    });
    productMaterialSelect.disabled = !prices.length;
  }
  const syncQuantityMinimum = () => {
    const selected = prices[Number(productMaterialSelect?.value || 0)] || prices[0] || {};
    const minRun = parseMinRun(selected.minRun, 50);
    if (productQtyInput) {
      productQtyInput.min = String(minRun || 1);
      productQtyInput.value = String(Math.max(minRun || 1, Number(productQtyInput.value || 0)));
    }
  };
  syncQuantityMinimum();
  if (productMaterialSelect) {
    productMaterialSelect.onchange = syncQuantityMinimum;
  }
  if (productPaletteSection) productPaletteSection.hidden = true;
}

function selectedProductLine() {
  if (!activeProduct) return null;
  const pricing = activeProduct.pricing || [];
  const selected = pricing[Number(productMaterialSelect?.value || 0)] || pricing[0] || {};
  const minRun = parseMinRun(selected.minRun, 1);
  const qty = Math.max(minRun, Number(productQtyInput?.value || minRun || 1));
  const unitPrice = unitPriceForQty(selected, qty);
  return {
    type: "product",
    slug: activeProduct.slug,
    title: activeProduct.title,
    material: selected.material || "",
    composition: selected.composition || "",
    unitPrice,
    priceType: "perUnit",
    qty,
    minRun,
    note: tierLabel(selected),
    priceOptions: pricing.map((item) => ({
      material: item.material || "",
      composition: item.composition || "",
      minRun: item.minRun || "",
      unitPrice: unitPriceForQty(item, qty),
      price: item.price || tierLabel(item),
      tiers: Array.isArray(item.tiers) ? item.tiers : [],
    })),
    attachedOptions: [],
  };
}

function renderProductImage() {
  if (!activeProduct || !dialogImage) return;
  const images = activeProduct.resolvedImages || [];
  const image = images[activeProductImageIndex] || productAssetPath(activeProduct, activeProduct.cardImage || "");
  dialogImage.src = image;
  dialogImage.alt = activeProduct.title || "";
  if (dialogCounter) dialogCounter.textContent = images.length > 1 ? `${activeProductImageIndex + 1} / ${images.length}` : "";
  const hasManyImages = images.length > 1;
  if (dialogPrev) dialogPrev.hidden = !hasManyImages;
  if (dialogNext) dialogNext.hidden = !hasManyImages;
}

function openProductDialog(product) {
  if (!dialog || !dialogTitle || !dialogDetail) return;
  activeProduct = product;
  activeProductImageIndex = 0;
  if (productForm) productForm.hidden = true;
  productForm?.reset();
  if (productFormModel) productFormModel.value = product.title || "";
  productForm?.querySelector("[data-form-success]")?.setAttribute("hidden", "");
  if (dialogKicker) dialogKicker.textContent = protectHangingPrepositions(product.kicker || "Производим под заказ");
  dialogTitle.textContent = protectHangingPrepositions(product.title || "");
  dialogDetail.textContent = protectHangingPrepositions(product.description || "");
  renderDefinitionList(dialogSpecs, product.specs || []);
  renderDefinitionList(dialogProduction, product.production || []);
  renderProductImage();
  dialog.showModal();
}

function moveProductImage(step) {
  if (!activeProduct?.resolvedImages?.length) return;
  activeProductImageIndex =
    (activeProductImageIndex + step + activeProduct.resolvedImages.length) % activeProduct.resolvedImages.length;
  renderProductImage();
}

async function loadCatalogProducts() {
  if (!productGrids.length) return;
  try {
    const slugs = await discoverProductSlugs();
    const loaded = await Promise.all(
      slugs.map(async (slug) => {
        const product = await fetchJson(`${productDirectory}${slug}/product.json`);
        product.slug = product.slug || slug;
        product.resolvedImages = await discoverProductImages(product);
        return product;
      })
    );
    catalogProducts = loaded;
    productGrids.forEach((grid) => {
      const category = grid.dataset.categoryGrid || "";
      grid.innerHTML = "";
      loaded
        .filter((product) => (category === "classic" ? product.category?.includes("classic") : !product.category?.includes("classic")))
        .forEach((product) => grid.appendChild(createProductCard(product)));
    });
    products = Array.from(document.querySelectorAll(".product-card"));
    updateProducts();
    protectTextNodes();
  } catch (error) {
    console.warn("Catalog products were not loaded", error);
  }
}

function renderProductPageImages(product) {
  if (!productPageImages) return;
  const images = product.resolvedImages?.length
    ? product.resolvedImages
    : [productAssetPath(product, product.cardImage || product.images?.[0] || "")].filter(Boolean);
  productPageImages.innerHTML = "";
  images.forEach((src, index) => {
    const figure = document.createElement("figure");
    figure.className = "product-page-media";
    const image = document.createElement("img");
    image.src = src;
    image.alt = product.title || "";
    if (index === 0) image.loading = "eager";
    else image.loading = "lazy";
    figure.appendChild(image);
    productPageImages.appendChild(figure);
  });
}

async function loadProductPage() {
  if (!productPage) return;
  const slug = new URLSearchParams(window.location.search).get("product");
  if (!slug) {
    if (productPageStatus) productPageStatus.textContent = "Позиция каталога не выбрана.";
    return;
  }

  try {
    await loadOfferData();
    const product = await fetchJson(`${productDirectory}${slug}/product.json`);
    product.slug = product.slug || slug;
    product.resolvedImages = await discoverProductImages(product);
    activeProduct = product;
    if (productForm) productForm.hidden = true;
    productForm?.reset();
    if (productFormModel) productFormModel.value = product.title || "";
    productForm?.querySelector("[data-form-success]")?.setAttribute("hidden", "");
    if (dialogKicker) dialogKicker.textContent = protectHangingPrepositions(product.kicker || "Производим под заказ");
    if (dialogTitle) dialogTitle.textContent = protectHangingPrepositions(product.title || "");
    if (dialogDetail) dialogDetail.textContent = protectHangingPrepositions(product.description || "");
    renderDefinitionList(dialogSpecs, product.specs || []);
    renderDefinitionList(dialogProduction, product.production || []);
    renderProductPricing(product);
    renderProductOrderControls(product);
    renderProductPageImages(product);
    if (productPageStatus) productPageStatus.hidden = true;
    if (productPageLayout) productPageLayout.hidden = false;
    protectTextNodes(productPageLayout || document.body);
  } catch (error) {
    console.warn("Product page was not loaded", error);
    if (productPageStatus) productPageStatus.textContent = "Позиция каталога не найдена.";
  }
}

closeButton?.addEventListener("click", () => dialog?.close());
dialogPrev?.addEventListener("click", () => moveProductImage(-1));
dialogNext?.addEventListener("click", () => moveProductImage(1));
productRequestButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!productForm) return;
    productForm.hidden = false;
    if (productFormDialog) productFormDialog.showModal();
    requestAnimationFrame(() => productForm.querySelector("input:not([type='hidden'])")?.focus());
  });
});

addProductToCartButton?.addEventListener("click", () => {
  const line = selectedProductLine();
  if (!line) return;
  addCartItem(line);
  addProductToCartButton.textContent = "Добавлено в калькулятор";
  setTimeout(() => {
    addProductToCartButton.textContent = "Добавить в калькулятор";
  }, 1400);
});

productFormClose?.addEventListener("click", () => productFormDialog?.close());
measurementsOpen?.addEventListener("click", () => measurementsDialog?.showModal());
measurementsClose?.addEventListener("click", () => measurementsDialog?.close());
productPricingToggle?.addEventListener("click", () => {
  if (!productPricingBody) return;
  productPricingBody.hidden = !productPricingBody.hidden;
});

const feedbackDialog = document.querySelector("[data-feedback-dialog]");
const feedbackOpenButtons = Array.from(document.querySelectorAll("[data-feedback-open]"));
const feedbackClose = document.querySelector("[data-feedback-close]");

feedbackOpenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (!feedbackDialog) return;
    event.preventDefault();
    feedbackDialog.showModal();
  });
});

feedbackClose?.addEventListener("click", () => feedbackDialog?.close());

document.querySelectorAll("[data-focus-contact]").forEach((link) => {
  link.addEventListener("click", () => {
    const firstField = document.querySelector("#b2b-contact input");
    requestAnimationFrame(() => firstField?.focus());
  });
});

document.querySelectorAll("[data-contact-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.reset();
    const success = form.querySelector("[data-form-success]");
    if (success) success.hidden = false;
  });
});

function offerItemsForSection(section, offer) {
  if (section === "preproduction") return offer.services?.preproduction || [];
  if (section === "dyeing") return offer.services?.dyeing || [];
  if (section === "washing") return offer.services?.washing || [];
  return offer[section] || [];
}

function createOfferOptionCard(item, section) {
  const article = document.createElement("article");
  article.className = "offer-option-card";
  const minRun = item.minRunLabel || (item.minRun ? `от ${item.minRun} ед.` : "");
  const isRequiredStage = section === "preproduction" && ["material-map", "sample"].includes(item.id);
  article.innerHTML = `
    <div>
      <p class="kicker">${protectHangingPrepositions(minRun || section)}</p>
      <h4>${protectHangingPrepositions(item.title || "")}</h4>
      <p>${protectHangingPrepositions(item.description || item.size || "")}</p>
      ${item.size ? `<small>${protectHangingPrepositions(item.size)}</small>` : ""}
    </div>
    <div class="offer-option-card-bottom">
      <span>${protectHangingPrepositions(item.note || formatMoney(item.price || 0))}</span>
      <button type="button"${isRequiredStage ? " disabled" : ""}>${isRequiredStage ? "Учтено" : "Добавить"}</button>
    </div>
  `;
  if (isRequiredStage) return article;
  article.querySelector("button")?.addEventListener("click", () => {
    addCartItem({
      type: "option",
      section,
      id: item.id,
      title: item.title,
      description: item.description || "",
      priceType: item.priceType || "perUnit",
      price: Number(item.price || 0),
      unitPrice: Number(item.price || 0),
      multiplier: Number(item.multiplier || 0),
      qty: Number(item.minRun || 1),
      minRun: Number(item.minRun || 1),
      note: item.note || "",
      appliesTo: "",
    });
    article.querySelector("button").textContent = "Добавлено";
    setTimeout(() => {
      article.querySelector("button").textContent = "Добавить";
    }, 1200);
  });
  return article;
}

async function renderOfferSections() {
  const sectionRoots = Array.from(document.querySelectorAll("[data-offer-section]"));
  const paletteRoot = document.querySelector("[data-offer-palette]");
  const paletteCopy = document.querySelector("[data-offer-palette-copy]");
  const tableRoots = Array.from(document.querySelectorAll("[data-terms-table]"));
  if (!sectionRoots.length && !paletteRoot && !tableRoots.length) return;
  const offer = await loadOfferData();
  if (paletteRoot) renderPalette(paletteRoot, offer.palette?.colors || []);
  if (paletteCopy) paletteCopy.textContent = protectHangingPrepositions(offer.palette?.description || "");
  sectionRoots.forEach((root) => {
    const section = root.dataset.offerSection;
    root.innerHTML = "";
    offerItemsForSection(section, offer).forEach((item) => root.appendChild(createOfferOptionCard(item, section)));
  });
  tableRoots.forEach((root) => renderTermsTable(root, root.dataset.termsTable, offer));
  protectTextNodes();
}

function renderTermsTable(root, type, offer) {
  const rows = offer.terms?.[type] || [];
  root.innerHTML = "";
  rows.forEach((row) => {
    const item = document.createElement("article");
    item.className = "terms-row";
    if (type === "timeline") {
      item.innerHTML = `<h3>${protectHangingPrepositions(row.stage)}</h3><strong>${row.time}</strong><p>${protectHangingPrepositions(row.note)}</p>`;
    } else {
      item.innerHTML = `<h3>${protectHangingPrepositions(row.type)}</h3><p>${protectHangingPrepositions(row.scope)}</p><strong>${protectHangingPrepositions(row.prepay)}</strong><strong>${protectHangingPrepositions(row.postpay)}</strong>`;
    }
    root.appendChild(item);
  });
}

function optionTargetProduct(item, cart) {
  if (!item.appliesTo) return null;
  return cart.find((product) => product.type === "product" && product.cartId === item.appliesTo) || null;
}

function cartItemTotal(item, cart = getCart()) {
  if (item.type !== "option") return optionCost(item, Number(item.unitPrice || item.price || 0));
  const targetProduct = optionTargetProduct(item, cart);
  const baseUnitPrice = targetProduct ? Number(targetProduct.unitPrice || 0) : Number(item.unitPrice || item.price || 0);
  const qty = targetProduct
    ? Math.max(Number(targetProduct.qty || 1), Number(item.minRun || 1))
    : Number(item.qty || item.minRun || 1);
  return optionCost({ ...item, qty }, baseUnitPrice);
}

function normalizeProductPrice(item) {
  if (item.type !== "product") return item;
  const qty = Math.max(Number(item.minRun || 1), Number(item.qty || item.minRun || 1));
  const selected = (item.priceOptions || []).find(
    (option) => option.material === item.material && option.composition === item.composition
  ) || item.priceOptions?.[0] || item;
  return {
    ...item,
    qty,
    unitPrice: unitPriceForQty(selected, qty),
    note: tierLabel(selected),
  };
}

function labelForSection(section = "") {
  const labels = {
    branding: "Брендирование",
    accessories: "Аксессуары",
    packaging: "Упаковка",
    preproduction: "Препродакшен",
    dyeing: "Крашение",
    washing: "Варка",
  };
  return labels[section] || section || "Опция";
}

function productOptions(cartId, cart) {
  return cart.filter((item) => item.type === "option" && item.appliesTo === cartId);
}

function allOfferOptions(offer = {}) {
  const sections = [
    ["branding", offer.branding || []],
    ["packaging", offer.packaging || []],
    ["preproduction", offer.services?.preproduction || []],
    ["dyeing", offer.services?.dyeing || []],
    ["washing", offer.services?.washing || []],
    ["accessories", offer.accessories || []],
  ];
  return sections.flatMap(([section, items]) =>
    items.map((item) => ({
      ...item,
      section,
      groupTitle: labelForSection(section),
    }))
  );
}

function addOptionToProduct(productItem, option) {
  const productQty = Math.max(Number(productItem.qty || 1), Number(option.minRun || 1));
  addCartItem({
    type: "option",
    section: option.section,
    id: option.id,
    title: option.title,
    description: option.description || "",
    priceType: option.priceType || "perUnit",
    price: Number(option.price || 0),
    unitPrice: Number(option.price || 0),
    multiplier: Number(option.multiplier || 0),
    qty: productQty,
    minRun: Number(option.minRun || 1),
    note: option.note || "",
    appliesTo: productItem.cartId,
  });
}

function optionSelectMarkup(productItem, offer) {
  const options = allOfferOptions(offer).filter((item) => item.id !== "sample" && item.id !== "material-map");
  if (!options.length) return "";
  return `
    <label class="cart-inline-select">
      Добавить услугу
      <select data-add-option-select="${productItem.cartId}">
        <option value="">Выбрать</option>
        ${options
          .map(
            (item) =>
              `<option value="${item.section}:${item.id}">${protectHangingPrepositions(item.groupTitle)} · ${protectHangingPrepositions(item.title || "")} · ${protectHangingPrepositions(item.note || "")}</option>`
          )
          .join("")}
      </select>
    </label>
  `;
}

function productMaterialMarkup(item) {
  const options = Array.isArray(item.priceOptions) ? item.priceOptions : [];
  if (!options.length) return "";
  return `
    <label class="cart-inline-select">
      Материал
      <select data-cart-material="${item.cartId}">
        ${options
          .map((option, index) => {
            const selected = option.material === item.material;
            return `<option value="${index}"${selected ? " selected" : ""}>${protectHangingPrepositions(option.material || "Материал")} · ${protectHangingPrepositions(tierLabel(option))}</option>`;
          })
          .join("")}
      </select>
    </label>
  `;
}

async function renderCartPage() {
  const root = document.querySelector("[data-cart-items]");
  const summary = document.querySelector("[data-cart-summary]");
  const payload = document.querySelector("[data-cart-payload]");
  if (!root || !summary) return;
  const offer = await loadOfferData();
  const cart = getCart();
  const productLines = cart.filter((item) => item.type === "product");
  const looseOptions = cart.filter((item) => item.type === "option" && !item.appliesTo);
  root.innerHTML = "";
  if (!cart.length) {
    root.innerHTML = `<p class="cart-empty">Калькулятор пока пустой. Добавьте позиции из каталога, услуги, брендирование или упаковку.</p>`;
  }
  productLines.forEach((item) => {
    const article = document.createElement("article");
    article.className = "cart-line cart-product-line";
    const detail = [item.material, item.composition, item.note].filter(Boolean).join(" · ");
    article.innerHTML = `
      <div>
        <p class="kicker">Изделие</p>
        <h3>${protectHangingPrepositions(item.title || "")}</h3>
        <p>${protectHangingPrepositions(detail)}</p>
        <div class="cart-line-controls">
          ${productMaterialMarkup(item)}
          <label class="cart-inline-select">
            Тираж
            <input type="number" min="${item.minRun || 1}" step="1" value="${item.qty || item.minRun || 1}" data-cart-qty="${item.cartId}">
          </label>
          ${optionSelectMarkup(item, offer)}
        </div>
        <div class="cart-attached-options" data-attached-options="${item.cartId}"></div>
      </div>
      <div class="cart-line-actions">
        <span>${item.qty || 1} ед.</span>
        <strong>${formatMoney(cartItemTotal(item, cart))}</strong>
        <button type="button">Убрать</button>
      </div>
    `;
    article.querySelector("button")?.addEventListener("click", () => removeCartItem(item.cartId));
    article.querySelector("[data-cart-qty]")?.addEventListener("change", (event) => {
      const minRun = Number(item.minRun || 1);
      const qty = Math.max(minRun, Number(event.target.value || minRun));
      updateCartItem(item.cartId, normalizeProductPrice({ ...item, qty }));
    });
    article.querySelector("[data-cart-material]")?.addEventListener("change", (event) => {
      const selected = item.priceOptions?.[Number(event.target.value)] || {};
      const minRun = parseMinRun(selected.minRun, item.minRun || 1);
      const qty = Math.max(minRun, Number(item.qty || minRun));
      updateCartItem(item.cartId, {
        material: selected.material || "",
        composition: selected.composition || "",
        unitPrice: unitPriceForQty(selected, qty),
        note: tierLabel(selected),
        minRun,
        qty,
      });
    });
    article.querySelector("[data-add-option-select]")?.addEventListener("change", (event) => {
      const [section, id] = event.target.value.split(":");
      const option = allOfferOptions(offer).find((entry) => entry.section === section && entry.id === id);
      if (!option) return;
      addOptionToProduct(item, option);
      renderCartPage();
    });
    root.appendChild(article);
    const attachedRoot = article.querySelector(`[data-attached-options="${item.cartId}"]`);
    productOptions(item.cartId, cart).forEach((option) => {
      const optionRow = document.createElement("div");
      optionRow.className = "cart-attached-option";
      const targetOptions = productLines
        .map(
          (product) =>
            `<option value="${product.cartId}"${product.cartId === option.appliesTo ? " selected" : ""}>${protectHangingPrepositions(product.title || "")}</option>`
        )
        .join("");
      optionRow.innerHTML = `
        <span>${protectHangingPrepositions(labelForSection(option.section))}</span>
        <strong>${protectHangingPrepositions(option.title || "")}</strong>
        <small>${protectHangingPrepositions(option.note || "")}</small>
        <em>${formatMoney(cartItemTotal(option, cart))}</em>
        <select data-attached-option-target="${option.cartId}">
          <option value="">Отдельно</option>
          ${targetOptions}
        </select>
        <button type="button">Убрать</button>
      `;
      optionRow.querySelector("[data-attached-option-target]")?.addEventListener("change", (event) => {
        updateCartItem(option.cartId, { appliesTo: event.target.value });
      });
      optionRow.querySelector("button")?.addEventListener("click", () => removeCartItem(option.cartId));
      attachedRoot?.appendChild(optionRow);
    });
  });
  looseOptions.forEach((item) => {
    const article = document.createElement("article");
    article.className = "cart-line cart-option-line";
    const targetOptions = productLines
      .map((product) => `<option value="${product.cartId}">${protectHangingPrepositions(product.title || "")}</option>`)
      .join("");
    article.innerHTML = `
      <div>
        <p class="kicker">${protectHangingPrepositions(labelForSection(item.section))}</p>
        <h3>${protectHangingPrepositions(item.title || "")}</h3>
        <p>${protectHangingPrepositions(item.note || item.description || "")}</p>
        <label class="cart-inline-select">
          Применить к
          <select data-cart-option-target="${item.cartId}">
            <option value="">Отдельной строкой</option>
            ${targetOptions}
          </select>
        </label>
      </div>
      <div class="cart-line-actions">
        <span>${item.qty || 1} ед.</span>
        <strong>${formatMoney(cartItemTotal(item, cart))}</strong>
        <button type="button">Убрать</button>
      </div>
    `;
    article.querySelector("button")?.addEventListener("click", () => removeCartItem(item.cartId));
    article.querySelector("[data-cart-option-target]")?.addEventListener("change", (event) => {
      updateCartItem(item.cartId, { appliesTo: event.target.value });
    });
    root.appendChild(article);
  });
  const productBase = productLines.reduce((sum, item) => sum + cartItemTotal(item, cart), 0);
  const sampleTotal = productLines
    .reduce((sum, item) => sum + Number(item.unitPrice || 0) * 2, 0);
  const optionTotal = cart.filter((item) => item.type === "option").reduce((sum, item) => sum + cartItemTotal(item, cart), 0);
  const total = productBase + sampleTotal + optionTotal;
  summary.innerHTML = `
    <dl class="cart-summary-list">
      <div><dt>Изделия</dt><dd>${formatMoney(productBase)}</dd></div>
      <div><dt>Предтиражные образцы</dt><dd>${formatMoney(sampleTotal)}</dd></div>
      <div><dt>Опции и услуги</dt><dd>${formatMoney(optionTotal)}</dd></div>
      <div><dt>Предварительный итог</dt><dd>${formatMoney(total)}</dd></div>
    </dl>
    <p class="cart-stage-note">В расчёт автоматически добавлен обязательный предтиражный образец: стоимость за единицу в партии + 100%. Карта образцов материалов учитывается как бесплатный этап.</p>
    <p class="cart-disclaimer">Это предварительный расчёт для ориентира. Итоговая стоимость не является счётом на оплату и подтверждается только после просчёта проекта: цена может измениться в зависимости от модели, материалов, тиража, брендирования, упаковки, сроков и других параметров запроса.</p>
  `;
  if (payload) {
    payload.value = [
      ...productLines.map((item) => {
        const attached = productOptions(item.cartId, cart)
          .map((option) => `  + ${labelForSection(option.section)}: ${option.title} (${option.note || ""})`)
          .join("\\n");
        return `${item.title} — ${item.qty || 1} ед. — ${item.material || item.note || ""}${attached ? `\\n${attached}` : ""}`;
      }),
      ...looseOptions.map((item) => `${labelForSection(item.section)}: ${item.title} — ${item.note || ""}`),
    ].join("\\n");
  }
  protectTextNodes(root);
  protectTextNodes(summary);
  styleYoGlyphs(root);
  styleYoGlyphs(summary);
}

const heroSlides = Array.from(document.querySelectorAll("[data-hero-slide]"));
const heroCaption = document.querySelector("[data-hero-caption]");
const heroEyebrow = document.querySelector("[data-hero-eyebrow]");
const heroLinks = Array.from(document.querySelectorAll(".hero-links a"));
const heroLinksContainer = document.querySelector(".hero-links");
let heroIndex = 0;

function syncHeroLinkIndicator() {
  if (!heroLinksContainer || !heroLinks.length) return;
  const activeLink = heroLinks[heroIndex] || heroLinks[0];
  const containerRect = heroLinksContainer.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();

  heroLinksContainer.style.setProperty(
    "--hero-underline-left",
    `${linkRect.left - containerRect.left}px`
  );
  heroLinksContainer.style.setProperty(
    "--hero-underline-top",
    `${linkRect.bottom - containerRect.top}px`
  );
  heroLinksContainer.style.setProperty("--hero-underline-width", `${linkRect.width}px`);
}

function showHeroSlide(index) {
  if (!heroSlides.length) return;
  heroIndex = index % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === heroIndex;
    slide.classList.toggle("is-active", isActive);
    if (isActive) {
      if (heroCaption) heroCaption.textContent = protectHangingPrepositions(slide.dataset.caption || "");
      if (heroEyebrow) heroEyebrow.textContent = protectHangingPrepositions(slide.dataset.eyebrow || "");
    }
  });
  heroLinks.forEach((link, linkIndex) => {
    link.classList.toggle("is-active", linkIndex === heroIndex);
  });
  requestAnimationFrame(syncHeroLinkIndicator);
}

function initHero() {
  if (!heroSlides.length) return;
  showHeroSlide(0);
  window.addEventListener("resize", syncHeroLinkIndicator);
  document.fonts?.ready.then(syncHeroLinkIndicator);
  setInterval(() => showHeroSlide(heroIndex + 1), 5000);
}

function attachInterviewLookCaptions() {
  if (document.body.dataset.contentPage !== "interview") return;

  const placements = [
    ["int-look5", "int-img-2"],
    ["int-look6-1", "int-img-3"],
    ["int-look6-2", "int-img-3"],
    ["int-look6-3", "int-img-3"],
    ["int-look7", "int-img-4"],
    ["int-look8-1", "int-img-5"],
    ["int-look8-2", "int-img-6"],
    ["int-look9", "int-img-7"],
  ];

  placements.forEach(([captionId, imageId]) => {
    const caption = document.querySelector(`[data-edit="${captionId}"]`);
    const image = document.querySelector(`[data-edit="${imageId}"]`);
    const figure = image?.closest(".article-image");
    if (!caption || !figure || caption.closest(".article-image")) return;

    let stack = figure.querySelector(".look-caption-stack");
    if (!stack) {
      stack = document.createElement("figcaption");
      stack.className = "look-caption-stack";
      figure.appendChild(stack);
    }

    caption.classList.add("look-caption");
    stack.appendChild(caption);
  });
}

contentReady.finally(() => {
  renderSiteFooter();
  initCookieNotice();
  ensureMobileCartLink();
  attachInterviewLookCaptions();
  updateCartCount();
  renderOfferSections();
  loadCatalogProducts();
  loadProductPage();
  renderCartPage();
  protectTextNodes();
  styleYoGlyphs();
  initCaptionStackSync();
  initHero();
});
