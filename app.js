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

function protectHangingPrepositions(text = "") {
  return text.replace(hangingPrepositionPattern, "$1$2\u00a0");
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
let catalogProducts = [];
let activeProduct = null;
let activeProductImageIndex = 0;

const productDirectory = "content/products/";

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

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "product-card";
  article.dataset.category = product.category || "";
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

  button.append(image, code, title, meta);
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
    run.textContent = protectHangingPrepositions(item.minRun || "");
    price.textContent = protectHangingPrepositions(item.price || "");
    row.append(material, run, price);
    productPricing.appendChild(row);
  });
  if (productPriceNote) productPriceNote.textContent = protectHangingPrepositions(product.priceNote || "");
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
  attachInterviewLookCaptions();
  loadCatalogProducts();
  loadProductPage();
  protectTextNodes();
  initCaptionStackSync();
  initHero();
});
