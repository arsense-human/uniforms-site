const menuButton = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector(".main-nav");
const header = document.querySelector("[data-header]");
const contentBuildVersion = "desktop-gaps-100-20260508";
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

function normalizeYo(text = "") {
  return String(text).normalize("NFC");
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
    const response = await fetch(`${root}content/${page}.json?v=${contentBuildVersion}`, { cache: "no-store" });
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
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    header?.classList.toggle("is-menu-open", isOpen);
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
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
const productColorWrap = document.querySelector("[data-product-color-wrap]");
const productColorSelect = document.querySelector("[data-product-color]");
const productRelatedSection = document.querySelector("[data-product-related-section]");
const productRelated = document.querySelector("[data-product-related]");
const productBundleSection = document.querySelector("[data-product-bundle-section]");
const productBundle = document.querySelector("[data-product-bundle]");
let catalogProducts = [];
let activeProduct = null;
let activeProductImageIndex = 0;

const productDirectory = "content/products/";
const cartStorageKey = "uniformsRequestCart";
const cookieConsentStorageKey = "uniformsCookieConsent20260501";
const contactEmail = "zakaz@uniforms.ru";
let offerData = null;

const baseIncludedOptionIds = [
  ["preproduction", "material-map"],
  ["branding", "care-label"],
  ["packaging", "zip-basic"],
];

const weightOptionPattern = /(?:dye|wash)-(\d+)$/;

const paletteSwatches = [
  "#111111", "#f2f0e8", "#8e9a74", "#c96f3e", "#5c5878", "#d9d4bf",
  "#843a2d", "#f1f1ef", "#4d2a20", "#587078", "#d6ce51", "#5d2436",
  "#2f3422", "#b7c3a0", "#6f6a54", "#c7c1ad", "#ece7d8", "#1f2531",
  "#7f8a8c", "#a8573d", "#d4c8b1", "#3d3a36", "#9a927d", "#edecef"
];

const paletteColorMap = {
  "01-01": "#111111",
  "12-01": "#f2f0e8",
  "18-17": "#8e9a74",
  "26-02": "#c96f3e",
  "15-01": "#5c5878",
  "01-02": "#d9d4bf",
  "04-01": "#843a2d",
  "50-04": "#f1f1ef",
  "29-02": "#4d2a20",
  "19-02": "#587078",
  "20-01": "#d6ce51",
  "07-01": "#5d2436",
  "08-01": "#2f3422",
  "06-01": "#b7c3a0",
  "06-03": "#6f6a54",
  "09-01": "#c7c1ad",
  "13-02": "#ece7d8",
  "05-02": "#1f2531",
  "05-03": "#7f8a8c",
  "02-01": "#a8573d",
  "03-02": "#d4c8b1",
  "14-01": "#3d3a36",
  "25-02": "#9a927d",
  "21-02": "#edecef",
  "13-01": "#f8f7f2",
  "21-01": "#c9c2b2",
  "24-02": "#7b7a70",
  "18-02": "#6f7a58",
  "15-03": "#b0adc2",
  "29-01": "#2e211d",
  "30-02": "#b85b42",
  "30-03": "#78372f",
  "04-03": "#b45f51",
  "23-03": "#c9b78c",
  "11-02": "#d8d1c0",
  "09-19": "#6f6a5f",
  "14-02": "#242424",
  "20-04": "#bfc34c",
  "40-02": "#5f6e78"
};

const clientLogoFiles = [
  ["vremena", "tg_image_3989927504.png"],
  ["coffee", "tg_image_1447869406.png"],
  ["zotov", "tg_image_1234571903.png"],
  ["m", "tg_image_4181325303.png"],
  ["redwings", "tg_image_3537173907.png"],
  ["petrovka", "tg_image_1364855271.png"],
  ["nordwind", "tg_image_563970880.png"],
  ["coca", "tg_image_3026766787.png"],
  ["udcafe", "tg_image_2838859056.png"],
  ["s7", "tg_image_3442272506.png"],
  ["ges", "tg_image_4058867904.png"],
  ["hilton", "tg_image_651713919.png"],
  ["mega", "tg_image_1442706938.png"],
  ["orbit", "tg_image_3409320370.png"],
  ["village", "tg_image_772658286.png"],
  ["k", "tg_image_2870405133.png"],
  ["gamaniya", "tg_image_1912927530.png"],
  ["four", "tg_image_865045888.png"],
  ["pushkinskiy", "tg_image_2500848194.png"],
  ["smeg", "tg_image_1780884760.png"],
  ["odjah", "tg_image_3256931867.png"],
  ["baltschug", "tg_image_3637814405.png"],
  ["yandex", "tg_image_1112066948.png"],
  ["chas", "tg_image_2490350717.png"],
  ["cosmos", "tg_image_1388588416.png"],
  ["round", "tg_image_2250273157.png"],
  ["les", "tg_image_3390093416.png"],
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
    <div class="footer-left">
      <div class="footer-brand-block">
        <img class="footer-logo" src="${root}assets/brand/uniforms-logo-full-white.png" alt="UNIFORMS">
        <p>Если у вас есть проект — обсудим формат, тираж и сроки.</p>
      </div>
      <nav class="footer-nav" aria-label="Разделы сайта">
        <a href="${root}catalog.html">Каталог</a>
        <a href="${root}services.html">Услуги</a>
        <a href="${root}cases.html">Кейсы</a>
        <a href="${root}interview.html">Интервью</a>
        <a href="${root}terms.html">Сроки и оплата</a>
        <a href="${root}privacy.html">Политика конфиденциальности</a>
        <a href="${root}offer.html">Публичная оферта</a>
      </nav>
      <address class="footer-contacts">
        <a href="mailto:${contactEmail}">${contactEmail}</a>
        <a href="tel:+79778890318">+7 977 889 03 18</a>
      </address>
    </div>
    <a class="footer-map-card" href="https://yandex.ru/maps/?text=${encodeURIComponent("Кутузовский проспект 36с3, офис 527")}" target="_blank" rel="noopener" aria-label="Открыть адрес на карте">
      <span class="footer-map-thumb" aria-hidden="true"></span>
      <span>Кутузовский проспект 36с3, офис 527</span>
    </a>
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
  notice.setAttribute("aria-label", "Уведомление о кукис");
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

function showCartToast(message = "Позиция добавлена в расчёт") {
  let toast = document.querySelector("[data-cart-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "cart-toast";
    toast.setAttribute("data-cart-toast", "");
    document.body.appendChild(toast);
  }
  toast.textContent = protectHangingPrepositions(message);
  toast.classList.add("is-visible");
  clearTimeout(showCartToast.timeout);
  showCartToast.timeout = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function updateCartItem(cartId, updates = {}) {
  const cart = getCart().map((item) => (item.cartId === cartId ? { ...item, ...updates } : item));
  saveCart(cart);
  renderCartPage();
}

function updateProductAndCleanOptions(cartId, updates = {}) {
  let nextProduct = null;
  const updatedCart = getCart()
    .map((item) => {
      if (item.cartId !== cartId) return item;
      nextProduct = { ...item, ...updates };
      return nextProduct;
    })
    .filter((item) => item.type !== "option" || item.appliesTo !== cartId || optionApplicableToProduct(item, nextProduct || {}));
  saveCart(updatedCart);
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

function productWeightCategory(item = {}) {
  if (item.weightCategory) return String(item.weightCategory);
  if (item.calculator?.weightCategory) return String(item.calculator.weightCategory);
  const title = `${item.title || ""} ${item.slug || ""}`.toLowerCase();
  if (/футболк|лонгслив|рубашк|сорочк|блузк/.test(title)) return "350";
  if (/ветровк|пиджак|жакет|костюм/.test(title)) return "1000";
  return "700";
}

function isClassicProduct(item = {}) {
  return String(item.category || item.cardMeta || item.slug || "").includes("classic") || /^(?:\d|k\d)/.test(String(item.slug || ""));
}

function productBlocksWashing(item = {}) {
  const materialText = `${item.material || ""} ${item.composition || ""}`.toLowerCase();
  if (item.washingAllowed === false || item.calculator?.washingAllowed === false) return true;
  return isClassicProduct(item) || /плащевк|нейлон/.test(materialText);
}

function optionWeightCategory(option = {}) {
  return String(option.id || "").match(weightOptionPattern)?.[1] || "";
}

function optionApplicableToProduct(option = {}, product = {}) {
  if (option.section === "washing" && productBlocksWashing(product)) return false;
  if (option.section === "dyeing" && (product.dyeingAllowed === false || product.calculator?.dyeingAllowed === false)) return false;
  const requiredWeight = optionWeightCategory(option);
  if (requiredWeight) return requiredWeight === productWeightCategory(product);
  return true;
}

function optionDefaultQty(option = {}, product = {}) {
  if (option.priceType === "unitMultiplier") return 1;
  if (option.priceType === "fixed" || option.priceType === "sampleMultiplier") return 1;
  return Math.max(Number(product.qty || 1), Number(option.minRun || 1));
}

function optionQtyLabel(option = {}) {
  if (option.id === "size-run-sample") return "Размеров";
  if (option.priceType === "unitMultiplier") return "Единиц";
  return "Количество";
}

function isOptionQtyEditable(option = {}) {
  return option.priceType === "unitMultiplier";
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
    chip.style.setProperty("--swatch", paletteColorMap[code] || paletteSwatches[index % paletteSwatches.length]);
    chip.setAttribute("title", code);
    chip.textContent = code;
    root.appendChild(chip);
  });
}

function renderClientLogoGrid() {
  const root = document.querySelector("[data-client-logo-grid]");
  if (!root) return;
  root.innerHTML = clientLogoFiles
    .map(([key, file]) => `<span class="client-logo-cell client-logo-${key}"><img src="assets/clients/${file}" alt=""></span>`)
    .join("");
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
  if (Array.isArray(product.palette) && product.palette.length) {
    const details = document.createElement("details");
    details.className = "product-card-details";
    const summary = document.createElement("summary");
    summary.textContent = "Цвета";
    const palette = document.createElement("div");
    palette.className = "product-card-palette";
    renderPalette(palette, product.palette.slice(0, 12));
    details.append(summary, palette);
    article.appendChild(details);
  }
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
  if (productPriceNote) {
    const note = product.priceNote ? `${product.priceNote} ` : "";
    productPriceNote.textContent = protectHangingPrepositions(
      `${note}Стоимость меняется от ткани, тиража и уровня кастомизации.`
    );
  }
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
  if (productColorSelect && productColorWrap) {
    const colors = Array.isArray(product.palette) ? product.palette : [];
    productColorSelect.innerHTML = colors.map((code) => `<option value="${code}">${code}</option>`).join("");
    productColorWrap.hidden = !colors.length;
  }
  if (productPaletteSection && productPalette) {
    const colors = Array.isArray(product.palette) ? product.palette : [];
    productPaletteSection.hidden = !colors.length;
    renderPalette(productPalette, colors);
  }
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
    category: activeProduct.category || "",
    title: activeProduct.title,
    image: productAssetPath(activeProduct, activeProduct.cardImage || activeProduct.images?.[0] || ""),
    material: selected.material || "",
    composition: selected.composition || "",
    color: productColorSelect?.value || "",
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
    calculator: activeProduct.calculator || {},
    weightCategory: activeProduct.calculator?.weightCategory || activeProduct.weightCategory || "",
    washingAllowed: activeProduct.calculator?.washingAllowed ?? activeProduct.washingAllowed,
    dyeingAllowed: activeProduct.calculator?.dyeingAllowed ?? activeProduct.dyeingAllowed,
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

async function loadProductSummaries() {
  const slugs = await discoverProductSlugs();
  const items = await Promise.all(
    slugs.map(async (slug) => {
      try {
        const product = await fetchJson(`${productDirectory}${slug}/product.json`);
        product.slug = product.slug || slug;
        return product;
      } catch (error) {
        return null;
      }
    })
  );
  return items.filter(Boolean);
}

function productGroup(product = {}) {
  const text = [product.slug, product.title, product.cardTitle, product.cardMeta, product.category].join(" ").toLowerCase();
  if (/футбол|лонгслив|бадлон|sleeve|shirt/.test(text)) return "tops";
  if (/худи|свитшот|олимп|hoodie|sweat/.test(text)) return "sweats";
  if (/брюк|pants|trousers/.test(text)) return "bottoms";
  if (/рубаш|shirt/.test(text)) return "shirts";
  if (/жилет|vest/.test(text)) return "vests";
  if (/куртк|анорак|ветров|jacket|outer/.test(text)) return "outer";
  if (/шап|кепк|шарф|нос|перчат|тоут|шоппер|accessor/.test(text)) return "accessories";
  return product.category?.includes("classic") ? "classic" : "merch";
}

function bundleTargetsFor(product = {}, productsList = []) {
  const group = productGroup(product);
  const targetGroups = {
    tops: ["sweats", "bottoms", "vests"],
    sweats: ["tops", "bottoms", "accessories"],
    bottoms: ["tops", "sweats", "shirts"],
    shirts: ["bottoms", "vests"],
    vests: ["tops", "shirts", "bottoms"],
    outer: ["tops", "bottoms", "accessories"],
    accessories: ["tops", "sweats", "outer"],
  }[group] || ["tops", "bottoms"];
  return productsList.filter((item) => item.slug !== product.slug && targetGroups.includes(productGroup(item))).slice(0, 4);
}

function renderProductLinkList(root, section, productsList = []) {
  if (!root || !section) return;
  root.innerHTML = "";
  productsList.forEach((item) => {
    const link = document.createElement("a");
    link.href = `product.html?product=${encodeURIComponent(item.slug)}`;
    link.innerHTML = `
      <span>${protectHangingPrepositions(item.code || item.slug || "")}</span>
      <strong>${protectHangingPrepositions(item.cardTitle || item.title || "")}</strong>
    `;
    root.appendChild(link);
  });
  section.hidden = !productsList.length;
}

async function renderProductRelated(product) {
  if (!productRelatedSection && !productBundleSection) return;
  const productsList = await loadProductSummaries();
  const explicitRelated = Array.isArray(product.related) && product.related.length
    ? productsList.filter((item) => product.related.includes(item.slug))
    : productsList.filter((item) => item.slug !== product.slug && productGroup(item) === productGroup(product)).slice(0, 4);
  renderProductLinkList(productRelated, productRelatedSection, explicitRelated);
  renderProductLinkList(productBundle, productBundleSection, bundleTargetsFor(product, productsList));
}

async function loadProductPage() {
  if (!productPage) return;
  const slug = new URLSearchParams(window.location.search).get("product");
  if (!slug) {
    if (productPageStatus) productPageStatus.textContent = "Модель не выбрана.";
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
    await renderProductRelated(product);
    if (productPageStatus) productPageStatus.hidden = true;
    if (productPageLayout) productPageLayout.hidden = false;
    protectTextNodes(productPageLayout || document.body);
  } catch (error) {
    console.warn("Product page was not loaded", error);
    if (productPageStatus) productPageStatus.textContent = "Модель не найдена.";
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
  showCartToast("Позиция добавлена в расчёт");
  addProductToCartButton.textContent = "Изделие добавлено в проект";
  setTimeout(() => {
    addProductToCartButton.textContent = "Собрать это изделие в проект";
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
  const image = item.image || item.images?.[0] || "";
  const isBaseIncluded = baseIncludedOptionIds.some(([baseSection, id]) => baseSection === section && id === item.id);
  const isRequiredStage = (section === "preproduction" && ["material-map", "sample"].includes(item.id)) || isBaseIncluded;
  article.innerHTML = `
    ${image ? `<figure class="offer-option-card-media"><img src="${image}" alt="${protectHangingPrepositions(item.title || "")}"></figure>` : ""}
    <div>
      <p class="kicker">${protectHangingPrepositions(minRun || section)}</p>
      <h4>${protectHangingPrepositions(item.title || "")}</h4>
      <p>${protectHangingPrepositions(item.description || item.size || "")}</p>
      ${item.size ? `<small>${protectHangingPrepositions(item.size)}</small>` : ""}
    </div>
    <div class="offer-option-card-bottom">
      <span>${protectHangingPrepositions(item.note || formatMoney(item.price || 0))}</span>
      <button type="button"${isRequiredStage ? " disabled" : ""}>${isRequiredStage ? "Уже в базе" : "Применить к проекту"}</button>
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
      qty: optionDefaultQty(item),
      minRun: Number(item.minRun || 1),
      note: item.note || "",
      appliesTo: "",
    });
    showCartToast("Услуга добавлена в расчёт");
    article.querySelector("button").textContent = "Применено";
    setTimeout(() => {
      article.querySelector("button").textContent = "Применить к проекту";
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
  const qty =
    targetProduct && item.priceType !== "unitMultiplier" && item.priceType !== "fixed" && item.priceType !== "sampleMultiplier"
      ? Math.max(Number(targetProduct.qty || 1), Number(item.minRun || 1))
      : Number(item.qty || 1);
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
    washingAllowed: item.calculator?.washingAllowed ?? item.washingAllowed,
    dyeingAllowed: item.calculator?.dyeingAllowed ?? item.dyeingAllowed,
    weightCategory: item.calculator?.weightCategory || item.weightCategory,
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

function productsForOption(option = {}, productsList = []) {
  return productsList.filter((product) => optionApplicableToProduct(option, product));
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

function baseIncludedOptions(offer = {}) {
  const options = allOfferOptions(offer);
  return baseIncludedOptionIds
    .map(([section, id]) => options.find((item) => item.section === section && item.id === id))
    .filter(Boolean);
}

function includedOptionsMarkup(offer = {}) {
  const items = baseIncludedOptions(offer);
  if (!items.length) return "";
  return `
    <div class="cart-included-options">
      <p>Базово включено</p>
      ${items
        .map(
          (item) => `
            <div class="cart-included-option">
              <span>${protectHangingPrepositions(labelForSection(item.section))}</span>
              <strong>${protectHangingPrepositions(item.title || "")}</strong>
              <small>${protectHangingPrepositions(item.note || "Бесплатно")}</small>
            </div>
          `
        )
        .join("")}
      <em>При замене выберите платную альтернативу в поле «Применить услугу».</em>
    </div>
  `;
}

function addOptionToProduct(productItem, option) {
  const qty = optionDefaultQty(option, productItem);
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
    qty,
    minRun: Number(option.minRun || 1),
    note: option.note || "",
    appliesTo: productItem.cartId,
  });
  showCartToast("Услуга добавлена к изделию");
}

function optionSelectMarkup(productItem, offer) {
  const options = allOfferOptions(offer)
    .filter((item) => item.id !== "sample" && item.id !== "material-map")
    .filter((item) => !(item.priceType === "perUnit" && Number(item.price || 0) === 0))
    .filter((item) => optionApplicableToProduct(item, productItem));
  if (!options.length) return "";
  const grouped = options.reduce((acc, item) => {
    (acc[item.section] ||= []).push(item);
    return acc;
  }, {});
  return `
    <div class="cart-service-groups">
      ${Object.entries(grouped)
        .map(
          ([section, items]) => `
            <label class="cart-inline-select">
              ${protectHangingPrepositions(labelForSection(section))}
              <select data-add-option-select="${productItem.cartId}">
                <option value="">Применить к изделию</option>
                ${items
                  .map((item) => `<option value="${item.section}:${item.id}">${protectHangingPrepositions(item.title || "")} · ${protectHangingPrepositions(item.note || "")}</option>`)
                  .join("")}
              </select>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function optionQuantityMarkup(option = {}) {
  if (!isOptionQtyEditable(option)) return "";
  return `
    <label class="cart-option-qty">
      ${optionQtyLabel(option)}
      <input type="number" min="1" step="1" value="${Math.max(1, Number(option.qty || 1))}" data-attached-option-qty="${option.cartId}">
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
    root.innerHTML = `<p class="cart-empty">Калькулятор пока пустой. Выберите модель, материал и услуги, чтобы собрать ориентир проекта.</p>`;
  }
  productLines.forEach((item) => {
    const article = document.createElement("article");
    article.className = "cart-line cart-product-line";
    if (item.image) article.classList.add("has-thumb");
    const detail = [item.material, item.composition, item.note].filter(Boolean).join(" · ");
    article.innerHTML = `
      ${item.image ? `<figure class="cart-line-thumb"><img src="${item.image}" alt=""></figure>` : ""}
      <div>
        <p class="kicker">Изделие</p>
        <h3>${protectHangingPrepositions(item.title || "")}</h3>
        <p>${protectHangingPrepositions([detail, item.color ? `цвет ${item.color}` : ""].filter(Boolean).join(" · "))}</p>
        <div class="cart-line-controls">
          ${productMaterialMarkup(item)}
          <label class="cart-inline-select">
            Тираж
            <input type="number" min="${item.minRun || 1}" step="1" value="${item.qty || item.minRun || 1}" data-cart-qty="${item.cartId}">
          </label>
          ${optionSelectMarkup(item, offer)}
        </div>
        ${includedOptionsMarkup(offer)}
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
      updateProductAndCleanOptions(item.cartId, normalizeProductPrice({ ...item, qty }));
    });
    article.querySelector("[data-cart-material]")?.addEventListener("change", (event) => {
      const selected = item.priceOptions?.[Number(event.target.value)] || {};
      const minRun = parseMinRun(selected.minRun, item.minRun || 1);
      const qty = Math.max(minRun, Number(item.qty || minRun));
      updateProductAndCleanOptions(item.cartId, {
        material: selected.material || "",
        composition: selected.composition || "",
        unitPrice: unitPriceForQty(selected, qty),
        note: tierLabel(selected),
        minRun,
        qty,
      });
    });
    article.querySelectorAll("[data-add-option-select]").forEach((select) => select.addEventListener("change", (event) => {
      const [section, id] = event.target.value.split(":");
      const option = allOfferOptions(offer).find((entry) => entry.section === section && entry.id === id);
      if (!option) return;
      addOptionToProduct(item, option);
      renderCartPage();
    }));
    root.appendChild(article);
    const attachedRoot = article.querySelector(`[data-attached-options="${item.cartId}"]`);
    productOptions(item.cartId, cart).forEach((option) => {
      const optionRow = document.createElement("div");
      optionRow.className = "cart-attached-option";
      const targetOptions = productsForOption(option, productLines)
        .map(
          (product) =>
            `<option value="${product.cartId}"${product.cartId === option.appliesTo ? " selected" : ""}>${protectHangingPrepositions(product.title || "")}</option>`
        )
        .join("");
      optionRow.innerHTML = `
        <span>${protectHangingPrepositions(labelForSection(option.section))}</span>
        <strong>${protectHangingPrepositions(option.title || "")}</strong>
        <small>${protectHangingPrepositions(option.note || "")}</small>
        ${optionQuantityMarkup(option)}
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
      optionRow.querySelector("[data-attached-option-qty]")?.addEventListener("change", (event) => {
        updateCartItem(option.cartId, { qty: Math.max(1, Number(event.target.value || 1)) });
      });
      optionRow.querySelector("button")?.addEventListener("click", () => removeCartItem(option.cartId));
      attachedRoot?.appendChild(optionRow);
    });
  });
  looseOptions.forEach((item) => {
    const article = document.createElement("article");
    article.className = "cart-line cart-option-line";
    const targetOptions = productsForOption(item, productLines)
      .map((product) => `<option value="${product.cartId}">${protectHangingPrepositions(product.title || "")}</option>`)
      .join("");
    article.innerHTML = `
      <div>
        <p class="kicker">${protectHangingPrepositions(labelForSection(item.section))}</p>
        <h3>${protectHangingPrepositions(item.title || "")}</h3>
        <p>${protectHangingPrepositions(item.note || item.description || "")}</p>
        ${optionQuantityMarkup(item)}
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
    article.querySelector("[data-attached-option-qty]")?.addEventListener("change", (event) => {
      updateCartItem(item.cartId, { qty: Math.max(1, Number(event.target.value || 1)) });
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
      <div><dt>Итог</dt><dd>${formatMoney(total)}</dd></div>
    </dl>
    <p class="cart-stage-note">Это предварительный ориентир. Финальный расчёт зависит от деталей проекта, сроков, материалов и производства. В расчёт автоматически добавлен обязательный предтиражный образец: стоимость за единицу в партии + 100%.</p>
  `;
  if (payload) {
    payload.value = [
      ...productLines.map((item) => {
        const attached = productOptions(item.cartId, cart)
          .map((option) => `  + ${labelForSection(option.section)}: ${option.title} (${option.note || ""}${isOptionQtyEditable(option) ? `, ${optionQtyLabel(option).toLowerCase()}: ${option.qty || 1}` : ""})`)
          .join("\\n");
        return `${item.title} — ${item.qty || 1} ед. — ${item.material || item.note || ""}${attached ? `\\n${attached}` : ""}`;
      }),
      ...looseOptions.map((item) => `${labelForSection(item.section)}: ${item.title} — ${item.note || ""}${isOptionQtyEditable(item) ? ` — ${optionQtyLabel(item).toLowerCase()}: ${item.qty || 1}` : ""}`),
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

function initHomeHeroRotator() {
  const images = Array.from(document.querySelectorAll("[data-home-hero-image]"));
  if (images.length < 2) return;
  let index = images.findIndex((image) => image.classList.contains("is-active"));
  if (index < 0) index = 0;
  setInterval(() => {
    images[index]?.classList.remove("is-active");
    index = (index + 1) % images.length;
    images[index]?.classList.add("is-active");
  }, 4200);
}

function renderCaseContactBlock() {
  const main = document.querySelector(".ssense-article-page");
  if (!main || !document.body.dataset.contentPage?.startsWith("cases/") || document.querySelector("[data-case-contact]")) return;
  const section = document.createElement("section");
  section.className = "case-contact-block";
  section.setAttribute("data-case-contact", "");
  section.innerHTML = `
    <div>
      <p class="kicker">Следующий шаг</p>
      <h2>Обсудить похожий проект</h2>
      <p>Если у вас похожий проект, разберём модель, материалы, сроки и тираж.</p>
      <div class="case-social-links">
        <a href="mailto:${contactEmail}">Email</a>
        <a href="tel:+79778890318">Телефон</a>
        <a href="https://yandex.ru/maps/?text=${encodeURIComponent("Кутузовский проспект 36с3, офис 527")}" target="_blank" rel="noopener">Карта</a>
      </div>
    </div>
    <form class="feedback-form case-contact-form" action="mailto:${contactEmail}" method="post" enctype="text/plain" data-contact-form>
      <label>Имя<input name="Имя" type="text" autocomplete="name"></label>
      <label>Контакт<input name="Контакт" type="text" autocomplete="email"></label>
      <label>Комментарий<textarea name="Комментарий" rows="5"></textarea></label>
      <button class="outline-button" type="submit">Обсудить похожий проект</button>
      <p class="form-success" data-form-success hidden>Мы свяжемся с вами в течение 1 рабочего дня.</p>
    </form>
  `;
  section.querySelector("[data-contact-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    const success = event.currentTarget.querySelector("[data-form-success]");
    if (success) success.hidden = false;
  });
  const switcher = main.querySelector(".article-switcher");
  main.insertBefore(section, switcher || null);
}

contentReady.finally(() => {
  renderSiteFooter();
  renderClientLogoGrid();
  renderCaseContactBlock();
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
  initHomeHeroRotator();
});
