const productGrid = document.querySelector("#productGrid");
const categoryGrid = document.querySelector("#categoryGrid");
const productsView = document.querySelector("#productsView");
const backToCategories = document.querySelector("#backToCategories");
const newArrivalsCarousel = document.querySelector(".new-arrivals-carousel");
const newArrivalsGrid = document.querySelector("#newArrivalsGrid");
const newArrivalsEmpty = document.querySelector("#newArrivalsEmpty");
const newArrivalsPrev = document.querySelector("#newArrivalsPrev");
const newArrivalsNext = document.querySelector("#newArrivalsNext");
const promotionGrid = document.querySelector("#promotionGrid");
const promotionEmpty = document.querySelector("#promotionEmpty");
const promotionCarousel = document.querySelector(".promotion-carousel");
const promotionPrev = document.querySelector("#promotionPrev");
const promotionNext = document.querySelector("#promotionNext");
const productCount = document.querySelector("#productCount");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const stockFilter = document.querySelector("#stockFilter");
const imagePreview = document.querySelector("#imagePreview");
const previewMedia = document.querySelector(".preview-media");
const previewImage = document.querySelector("#previewImage");
const previewTitle = document.querySelector("#previewTitle");
const previewCategory = document.querySelector("#previewCategory");
const previewReference = document.querySelector("#previewReference");
const previewPrice = document.querySelector("#previewPrice");
const previewPackaging = document.querySelector("#previewPackaging");
const previewStock = document.querySelector("#previewStock");
const previewDescription = document.querySelector("#previewDescription");
const previewClose = document.querySelector("#previewClose");
const previewPrev = document.querySelector("#previewPrev");
const previewNext = document.querySelector("#previewNext");
const themeToggle = document.querySelector("#themeToggle");
const openCart = document.querySelector("#openCart");
const closeCart = document.querySelector("#closeCart");
const cartDrawer = document.querySelector("#cartDrawer");
const cartItems = document.querySelector("#cartItems");
const cartEmpty = document.querySelector("#cartEmpty");
const cartCount = document.querySelector("#cartCount");
const cartTotalItems = document.querySelector("#cartTotalItems");
const cartTotalValue = document.querySelector("#cartTotalValue");
const cartHeaderSummary = document.querySelector("#cartHeaderSummary");
const cartMobileSummary = document.querySelector("#cartMobileSummary");
const customerNameInput = document.querySelector("#customerName");
const customerNameError = document.querySelector("#customerNameError");
const exportCartXls = document.querySelector("#exportCartXls");
const exportCartPdf = document.querySelector("#exportCartPdf");
const clearCartButton = document.querySelector("#clearCart");
const clearCartConfirmPopup = document.querySelector("#clearCartConfirmPopup");
const confirmManualClearCart = document.querySelector("#confirmManualClearCart");
const cancelManualClearCart = document.querySelector("#cancelManualClearCart");
const undoToast = document.querySelector("#undoToast");
const undoRemoveItem = document.querySelector("#undoRemoveItem");
const mobileMenuToggle = document.querySelector("#mobileMenuToggle");
const navActions = document.querySelector("#navActions");
const includePicturesToggle = document.querySelector("#includePicturesToggle");
const loginScreen = document.querySelector("#loginScreen");
const loginForm = document.querySelector("#loginForm");
const adminSelect = document.querySelector("#adminSelect");
const activeAdminLabel = document.querySelector("#activeAdminLabel");
const logoutAdmin = document.querySelector("#logoutAdmin");

let products = [];
let productGroups = [];
let visibleProducts = [];
let currentPreviewIndex = -1;
let selectedCategory = "all";
let newArrivals = [];
let promotionProducts = [];
let newArrivalStartIndex = 0;
let promotionStartIndex = 0;
let previewDragStartX = 0;
let previewDragStartY = 0;
let previewDragPointerId = null;
const newArrivalsPerPage = 3;
const previewSwipeThreshold = 60;
const carouselTransitionMs = 420;
const cartStorageKey = "hatchCart";
const themeStorageKey = "hatchTheme";
const adminStorageKey = "hatchAdmin";
const admins = ["admin1", "admin2"];
let cart = loadCart();
let removedCartItem = null;
let undoToastTimer = null;
let activeAdmin = loadActiveAdmin();

function applyTheme(theme) {
  document.body.classList.toggle("dark-mode", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  localStorage.setItem(themeStorageKey, theme);
}

function closeMobileMenu() {
  navActions.classList.remove("is-open");
  mobileMenuToggle.setAttribute("aria-expanded", "false");
  mobileMenuToggle.setAttribute("aria-label", "Open menu");
}

function toggleMobileMenu() {
  const isOpen = navActions.classList.toggle("is-open");
  mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
  mobileMenuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

function loadTheme() {
  return localStorage.getItem(themeStorageKey) || "light";
}

function loadActiveAdmin() {
  const storedAdmin = localStorage.getItem(adminStorageKey);
  return admins.includes(storedAdmin) ? storedAdmin : "";
}

function setActiveAdmin(admin) {
  activeAdmin = admins.includes(admin) ? admin : "";

  if (activeAdmin) {
    localStorage.setItem(adminStorageKey, activeAdmin);
  } else {
    localStorage.removeItem(adminStorageKey);
  }

  document.body.classList.toggle("is-logged-out", !activeAdmin);
  loginScreen.hidden = Boolean(activeAdmin);
  activeAdminLabel.textContent = activeAdmin ? activeAdmin : "Not signed in";
}

function getProductVisibilityList(product) {
  return String(product.visibleTo || "all")
    .split(/[|,;\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isProductVisibleForAdmin(product, admin = activeAdmin) {
  if (admin === "admin1") return true;

  const visibility = getProductVisibilityList(product);
  if (visibility.length === 0 || visibility.includes("all")) return true;
  return visibility.includes(admin);
}

function getNewArrivalsVisibleCount() {
  if (window.matchMedia("(max-width: 620px)").matches) return 1;
  if (window.matchMedia("(max-width: 880px)").matches) return 2;
  return newArrivalsPerPage;
}

function parseCsv(csvText) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"' && nextCharacter === '"') {
      currentValue += '"';
      index += 1;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === "," && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentValue);
      if (currentRow.some((value) => value.trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = "";
    } else {
      currentValue += character;
    }
  }

  currentRow.push(currentValue);
  if (currentRow.some((value) => value.trim() !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

function normalizeHeader(header) {
  return header.trim().replace(/^\uFEFF/, "").toLowerCase();
}

function csvToProducts(csvText) {
  const [headerRow, ...dataRows] = parseCsv(csvText);
  const headers = headerRow.map(normalizeHeader);

  return dataRows.map((row, index) => {
    const product = headers.reduce((item, header, headerIndex) => {
      item[header] = row[headerIndex]?.trim() || "";
      return item;
    }, {});

    return {
      id: Number(product.id) || index + 1,
      group: product.group || product.id || String(index + 1),
      name: product.name || "Untitled product",
      reference: product.reference || product.ref || "",
      category: product.category || "Uncategorized",
      size: product.size || "",
      price: Number(product.price) || 0,
      oldPrice: Number(product.old_price || product.oldprice || product.compare_at_price || product.compare_at) || 0,
      packaging: product.packaging || product.pcs || product.pieces || "",
      description: product.description || "",
      image: product.image || "",
      stock: product.stock || product.status || "in stock",
      newArrival: product.new_arrival || product.new || product.newly_added || "no",
      promotion: product.promotion || product.promo || product.promoted || "no",
      visibleTo: product.visible_to || product.visibleto || product.visibility || product.admins || "all"
    };
  });
}

function isOutOfStock(product) {
  const stockValue = String(product.stock).trim().toLowerCase();
  return ["0", "no", "out", "out of stock", "sold out", "unavailable"].includes(stockValue);
}

function isNewArrival(product) {
  const value = String(product.newArrival).trim().toLowerCase();
  return ["1", "true", "yes", "y", "new"].includes(value);
}

function isPromotion(product) {
  const value = String(product.promotion).trim().toLowerCase();
  return ["1", "true", "yes", "y", "promo", "promotion"].includes(value);
}

function groupProducts(productRows) {
  const groups = new Map();

  productRows.filter((product) => isProductVisibleForAdmin(product)).forEach((product) => {
    const groupId = product.group || String(product.id);

    if (!groups.has(groupId)) {
      groups.set(groupId, {
        ...product,
        id: groupId,
        variants: []
      });
    }

    groups.get(groupId).variants.push(product);
  });

  return [...groups.values()].map((product) => {
    const prices = product.variants.map((variant) => variant.price);
    const oldPrices = product.variants.map((variant) => variant.oldPrice).filter((price) => price > 0);
    const references = product.variants.map((variant) => variant.reference).filter(Boolean);
    const packagingValues = [...new Set(product.variants.map((variant) => variant.packaging).filter(Boolean))];
    const hasAvailableVariant = product.variants.some((variant) => !isOutOfStock(variant));
    const hasNewVariant = product.variants.some(isNewArrival);
    const hasPromotionVariant = product.variants.some(isPromotion);

    return {
      ...product,
      reference: references.length > 1 ? `${references.length} refs` : references[0] || product.reference,
      price: Math.min(...prices),
      maxPrice: Math.max(...prices),
      oldPrice: oldPrices.length > 0 ? Math.min(...oldPrices) : 0,
      packaging: packagingValues.length === 1 ? packagingValues[0] : "",
      stock: hasAvailableVariant ? "in stock" : "out of stock",
      newArrival: hasNewVariant ? "yes" : "no",
      promotion: hasPromotionVariant ? "yes" : "no"
    };
  });
}

function formatPrice(price) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(price)} Dh`;
}

function formatPiecePrice(price) {
  return `${formatPrice(price)} / pc`;
}

function getPromotionOldPrice(product) {
  if (product.oldPrice > product.price) return product.oldPrice;
  return Math.ceil(product.price * 1.25);
}

function getProductPriceHtml(product, isPromotionCard = false) {
  const currentPrice = product.maxPrice > product.price ? `From ${formatPiecePrice(product.price)}` : formatPiecePrice(product.price);

  if (!isPromotionCard) {
    return `<span class="price">${currentPrice}</span>`;
  }

  const oldPrice = getPromotionOldPrice(product);
  const oldPricePrefix = product.maxPrice > product.price ? "Was from" : "Was";

  return `
    <span class="price promotion-price">
      <span class="old-price">${oldPricePrefix} ${formatPiecePrice(oldPrice)}</span>
      <span class="new-price">${currentPrice}</span>
    </span>
  `;
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(cartStorageKey)) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(cartStorageKey, JSON.stringify(cart));
}

function findVariantById(variantId) {
  return products.find((product) => String(product.id) === String(variantId));
}

function getPiecesPerBox(item) {
  return Math.max(Number(item.packaging) || 1, 1);
}

function getCartLineTotal(item) {
  return getPiecesPerBox(item) * item.quantity * item.price;
}

function getCartCalculationText(item) {
  const piecesPerBox = getPiecesPerBox(item);
  const boxesLabel = item.quantity === 1 ? "box" : "boxes";
  return `${piecesPerBox} pcs/box × ${item.quantity} ${boxesLabel} × ${formatPrice(item.price)}`;
}

function getCartSummaryText(totals = getCartTotals()) {
  const boxLabel = totals.quantity === 1 ? "box" : "boxes";
  return `${totals.quantity} ${boxLabel} · ${formatPrice(totals.value)}`;
}

function getCartItemFromVariant(variant) {
  return {
    id: String(variant.id),
    reference: variant.reference,
    name: variant.name,
    category: variant.category,
    size: variant.size,
    price: variant.price,
    packaging: variant.packaging,
    description: variant.description,
    image: variant.image,
    stock: variant.stock,
    visibleTo: variant.visibleTo,
    quantity: 1
  };
}

function getCartItemByVariantId(variantId) {
  return cart.find((item) => item.id === String(variantId));
}

function setVariantCartQuantity(variantId, boxes = 1) {
  const variant = findVariantById(variantId);
  if (!variant || !isProductVisibleForAdmin(variant)) return;

  const boxQuantity = Math.max(Number(boxes) || 1, 1);
  const existingItem = getCartItemByVariantId(variant.id);
  if (existingItem) {
    existingItem.quantity = boxQuantity;
  } else {
    const cartItem = getCartItemFromVariant(variant);
    cartItem.quantity = boxQuantity;
    cart.push(cartItem);
  }

  saveCart();
  renderCart();
}

function syncAddButtonsWithCart() {
  document.querySelectorAll(".cart-add-button[data-variant-id]").forEach((button) => {
    if (button.dataset.action === "choose") return;

    const cartItem = getCartItemByVariantId(button.dataset.variantId);
    const isInCart = Boolean(cartItem);
    button.classList.toggle("is-in-cart", isInCart);
    button.setAttribute("aria-pressed", String(isInCart));

    if (!button.dataset.defaultLabel) {
      button.dataset.defaultLabel = button.textContent.trim();
    }

    button.textContent = isInCart ? "Added" : button.dataset.defaultLabel;

    const quantityInput =
      button.closest(".product-purchase")?.querySelector(".inline-quantity") ||
      button.closest("tr")?.querySelector(".inline-quantity") ||
      button.closest(".preview-description")?.querySelector(".inline-quantity");

    if (quantityInput && cartItem && document.activeElement !== quantityInput) {
      quantityInput.value = cartItem.quantity;
    }
  });
}

function getInlineQuantity(addButton) {
  const quantityInput =
    addButton.closest(".product-purchase")?.querySelector(".inline-quantity") ||
    addButton.closest("tr")?.querySelector(".inline-quantity") ||
    addButton.closest(".preview-description")?.querySelector(".inline-quantity");

  return Math.max(Number(quantityInput?.value) || 1, 1);
}

function getCartTotals() {
  return cart.reduce(
    (totals, item) => {
      totals.quantity += item.quantity;
      totals.value += getCartLineTotal(item);
      return totals;
    },
    { quantity: 0, value: 0 }
  );
}

function updateCartTotalsDisplay() {
  const totals = getCartTotals();

  cartCount.textContent = `${totals.quantity} ${totals.quantity === 1 ? "box" : "boxes"}`;
  cartTotalItems.textContent = `${totals.quantity} boxes`;
  cartTotalValue.textContent = formatPrice(totals.value);
  cartHeaderSummary.textContent = getCartSummaryText(totals);
  cartMobileSummary.textContent = getCartSummaryText(totals);
}

function getCartItemDisplayDescription(item) {
  return item.description?.trim() || item.name;
}

function renderCartItem(item) {
  const displayDescription = getCartItemDisplayDescription(item);
  const detailParts = [
    item.reference,
    item.size ? `Size ${item.size}` : "",
    `${getPiecesPerBox(item)} pcs / box`
  ].filter(Boolean);
  const thumbnail = item.image
    ? `<img class="cart-item-thumbnail" src="${escapeHtml(item.image)}" alt="${escapeHtml(displayDescription)}" loading="lazy">`
    : "";

  return `
    <article class="cart-item" data-id="${escapeHtml(item.id)}">
      <div class="cart-item-main">
        ${thumbnail}
        <div class="cart-item-details">
          <span class="cart-category-badge">${escapeHtml(item.category)}</span>
          <h3>${escapeHtml(displayDescription)}</h3>
          <p>${escapeHtml(detailParts.join(" · "))}</p>
          ${isOutOfStock(item) ? '<span class="cart-stock-status">Out of stock</span>' : ""}
        </div>
      </div>
      <div class="cart-item-tools">
        <p class="cart-calculation" data-id="${escapeHtml(item.id)}">${getCartCalculationText(item)}</p>
        <label class="cart-price-field">
          <span>Unit price</span>
          <input class="cart-price" type="number" min="0" step="0.01" value="${item.price}" data-id="${escapeHtml(item.id)}">
        </label>
        <label>
          <span>Qty boxes</span>
          <input class="cart-quantity" type="number" min="1" value="${item.quantity}" data-id="${escapeHtml(item.id)}">
        </label>
        <strong class="cart-line-total" data-id="${escapeHtml(item.id)}">${formatPrice(getCartLineTotal(item))}</strong>
        <button class="cart-remove" type="button" data-id="${escapeHtml(item.id)}">Remove</button>
      </div>
    </article>
  `;
}

function renderCart() {
  cart = cart.filter((item) => isProductVisibleForAdmin(findVariantById(item.id) || item));
  saveCart();
  updateCartTotalsDisplay();
  cartEmpty.hidden = cart.length > 0;
  cartItems.hidden = cart.length === 0;

  cartItems.innerHTML = cart
    .map(renderCartItem)
    .join("");

  [exportCartXls, exportCartPdf, clearCartButton].forEach((button) => {
    button.disabled = cart.length === 0;
  });

  syncAddButtonsWithCart();
}

function updateCartItemDisplay(item) {
  const escapedId = CSS.escape(item.id);
  const lineTotal = cartItems.querySelector(`.cart-line-total[data-id="${escapedId}"]`);
  const calculation = cartItems.querySelector(`.cart-calculation[data-id="${escapedId}"]`);

  if (lineTotal) {
    lineTotal.textContent = formatPrice(getCartLineTotal(item));
  }

  if (calculation) {
    calculation.textContent = getCartCalculationText(item);
  }
}

function clearCart() {
  cart = [];
  removedCartItem = null;
  hideUndoToast();
  saveCart();
  renderCart();
}

function hideUndoToast() {
  if (undoToastTimer) {
    window.clearTimeout(undoToastTimer);
    undoToastTimer = null;
  }

  undoToast.hidden = true;
}

function showUndoToast(item, index) {
  removedCartItem = { item, index };
  hideUndoToast();
  undoToast.hidden = false;

  undoToastTimer = window.setTimeout(() => {
    hideUndoToast();
    removedCartItem = null;
  }, 5000);
}

function undoRemovedCartItem() {
  if (!removedCartItem) return;

  const restoreIndex = Math.min(removedCartItem.index, cart.length);
  cart.splice(restoreIndex, 0, removedCartItem.item);
  removedCartItem = null;
  hideUndoToast();
  saveCart();
  renderCart();
}

function openCartDrawer() {
  renderCart();
  cartDrawer.hidden = false;
}

function closeCartDrawer() {
  cartDrawer.hidden = true;
}

function openClearCartConfirmPopup() {
  if (cart.length === 0) return;
  clearCartConfirmPopup.hidden = false;
}

function closeClearCartConfirmPopup() {
  clearCartConfirmPopup.hidden = true;
}

function getPurchaseOrderRows() {
  return cart.map((item) => {
    const variant = findVariantById(item.id);
    const piecesPerBox = getPiecesPerBox(item);
    const totalPieces = piecesPerBox * item.quantity;
    const lineTotal = getCartLineTotal(item);
    return {
      reference: item.reference,
      name: item.name,
      description: item.description || variant?.description || item.name,
      category: item.category,
      size: item.size || "",
      packaging: item.packaging || "",
      image: item.image || variant?.image || "",
      boxes: item.quantity,
      piecesPerBox,
      totalPieces,
      unitPrice: item.price,
      stockStatus: isOutOfStock(item) ? "Out of stock" : "In stock",
      lineTotal
    };
  });
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getOrderFilename(extension) {
  const date = new Date().toISOString().slice(0, 10);
  return `hatch-purchase-order-${date}.${extension}`;
}

function getPurchaseOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const customerCode = getCustomerName()
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 4)
    .toUpperCase() || "CUST";

  return `PO-${date}-${customerCode}`;
}

function getCustomerName() {
  return customerNameInput.value.trim();
}

function clearCustomerNameError() {
  customerNameInput.classList.remove("input-error");
  customerNameInput.removeAttribute("aria-invalid");
  customerNameError.hidden = true;
}

function validateCustomerName() {
  if (getCustomerName()) {
    clearCustomerNameError();
    return true;
  }

  customerNameInput.focus();
  customerNameInput.classList.add("input-error");
  customerNameInput.setAttribute("aria-invalid", "true");
  customerNameError.hidden = false;
  return false;
}

function getIncludePicturesInPdf() {
  return includePicturesToggle.checked;
}

function getPrintImageUrl(imagePath) {
  if (!imagePath) return "";

  try {
    return new URL(imagePath, window.location.href).href;
  } catch {
    return imagePath;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getPurchaseOrderTableHtml() {
  const rows = getPurchaseOrderRows();
  const totals = getCartTotals();

  return `
    <h1>Hatch Purchase Order</h1>
    <p>Germany Design</p>
    <p>Customer: ${escapeHtml(getCustomerName())}</p>
    <p>Date: ${new Date().toLocaleDateString()}</p>
    <table>
      <thead>
        <tr>
          <th>Reference</th>
          <th>Product</th>
          <th>Category</th>
          <th>Size</th>
          <th>Boxes</th>
          <th>Pcs / Box</th>
          <th>Total Pcs</th>
          <th>Unit Price / Piece</th>
          <th>Stock Status</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map((row) => {
            return `
              <tr class="${row.stockStatus === "Out of stock" ? "po-out-of-stock" : ""}">
                <td>${escapeHtml(row.reference)}</td>
                <td>${escapeHtml(row.name)}</td>
                <td>${escapeHtml(row.category)}</td>
                <td>${escapeHtml(row.size)}</td>
                <td>${row.boxes}</td>
                <td>${row.piecesPerBox}</td>
                <td>${row.totalPieces}</td>
                <td>${formatPrice(row.unitPrice)}</td>
                <td>${row.stockStatus}</td>
                <td>${formatPrice(row.lineTotal)}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
    <h2>Total boxes: ${totals.quantity}</h2>
    <h2>Total value: ${formatPrice(totals.value)}</h2>
  `;
}

function getPurchaseOrderPdfHtml() {
  const rows = getPurchaseOrderRows();
  const totals = getCartTotals();
  const hasSizes = rows.some((row) => row.size);
  const includePictures = getIncludePicturesInPdf();
  const orderNumber = getPurchaseOrderNumber();
  const customerName = getCustomerName();
  const orderDate = new Date().toLocaleDateString();

  return `
    <section class="po-page">
      <header class="po-header">
        <div>
          <p class="po-kicker">Purchase Order</p>
          <h1>Hatch</h1>
          <p class="po-subtitle">Germany Design</p>
        </div>
        <div class="po-number-card">
          <span>PO Number</span>
          <strong>${escapeHtml(orderNumber)}</strong>
        </div>
      </header>

      <section class="po-meta-grid">
        <div class="po-meta-card">
          <span>Bill To</span>
          <strong>${escapeHtml(customerName)}</strong>
        </div>
        <div class="po-meta-card">
          <span>Order Date</span>
          <strong>${escapeHtml(orderDate)}</strong>
        </div>
        <div class="po-meta-card">
          <span>Total Boxes</span>
          <strong>${totals.quantity}</strong>
        </div>
        <div class="po-meta-card">
          <span>Total Value</span>
          <strong>${formatPrice(totals.value)}</strong>
        </div>
      </section>

      <table class="po-table">
        <thead>
          <tr>
            <th class="po-col-number">#</th>
            ${includePictures ? '<th class="po-col-picture">Picture</th>' : ""}
            <th>Reference</th>
            <th class="po-col-item">Item</th>
            ${hasSizes ? "<th>Size</th>" : ""}
            <th class="po-num">Boxes</th>
            <th class="po-num">Pcs / Box</th>
            <th class="po-num">Total Pcs</th>
            <th class="po-num">Unit Price</th>
            <th class="po-num">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((row, index) => {
              return `
                <tr class="${row.stockStatus === "Out of stock" ? "po-out-of-stock" : ""}">
                  <td class="po-col-number">${index + 1}</td>
                  ${
                    includePictures
                      ? `<td class="po-col-picture">${
                          row.image
                            ? `<img class="po-product-image" src="${escapeHtml(getPrintImageUrl(row.image))}" alt="${escapeHtml(row.description)}">`
                            : ""
                        }</td>`
                      : ""
                  }
                  <td>${escapeHtml(row.reference)}</td>
                  <td>
                    <strong>${escapeHtml(row.description)}</strong>
                    ${row.stockStatus === "Out of stock" ? '<small>Out of stock</small>' : ""}
                  </td>
                  ${hasSizes ? `<td>${row.size ? escapeHtml(row.size) : ""}</td>` : ""}
                  <td class="po-num">${row.boxes}</td>
                  <td class="po-num">${row.piecesPerBox}</td>
                  <td class="po-num">${row.totalPieces}</td>
                  <td class="po-num">${formatPrice(row.unitPrice)}</td>
                  <td class="po-num po-line-total">${formatPrice(row.lineTotal)}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>

      <section class="po-bottom">
        <div class="po-notes">
          <strong>Notes</strong>
          <p>Please review quantities, sizes, references, and stock status before confirming the order.</p>
        </div>
        <div class="po-totals">
          <div>
            <span>Boxes</span>
            <strong>${totals.quantity}</strong>
          </div>
          <div>
            <span>Grand Total</span>
            <strong>${formatPrice(totals.value)}</strong>
          </div>
        </div>
      </section>
    </section>
  `;
}

function exportCartAsXls() {
  if (cart.length === 0) return;
  if (!validateCustomerName()) return;

  const workbook = `
    <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body>${getPurchaseOrderTableHtml()}</body>
    </html>
  `;

  downloadFile(getOrderFilename("xls"), workbook, "application/vnd.ms-excel;charset=utf-8");
}

function exportCartAsPdf() {
  if (cart.length === 0) return;
  if (!validateCustomerName()) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hatch Purchase Order</title>
        <style>
          @page {
            margin: 0;
            size: A4;
          }

          * {
            box-sizing: border-box;
          }

          body {
            background: #f5f6f2;
            color: #1d2521;
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
          }

          .po-page {
            background: #ffffff;
            min-height: 100vh;
            padding: 7mm;
          }

          .po-header {
            align-items: start;
            border-bottom: 3px solid #1d2521;
            display: flex;
            justify-content: space-between;
            padding-bottom: 18px;
          }

          .po-kicker,
          .po-meta-card span,
          .po-number-card span,
          .po-totals span {
            color: #64706a;
            display: block;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.08em;
            margin-bottom: 5px;
            text-transform: uppercase;
          }

          h1 {
            font-size: 28px;
            line-height: 1;
            margin: 0;
          }

          .po-subtitle {
            color: #64706a;
            font-size: 11px;
            margin: 6px 0 0;
          }

          .po-number-card {
            background: #1d2521;
            color: #ffffff;
            min-width: 170px;
            padding: 14px 16px;
            text-align: right;
          }

          .po-number-card span {
            color: #c8d0c5;
          }

          .po-number-card strong {
            font-size: 13px;
          }

          .po-meta-grid {
            display: grid;
            gap: 10px;
            grid-template-columns: 1.5fr 1fr 1fr 1fr;
            margin-top: 18px;
          }

          .po-meta-card,
          .po-notes,
          .po-totals {
            border: 1px solid #dce1d8;
            padding: 12px;
          }

          .po-meta-card strong {
            font-size: 12px;
          }

          .po-table {
            border-collapse: collapse;
            margin-top: 20px;
            width: 100%;
          }

          .po-table th {
            background: #eef1e9;
            border-bottom: 1px solid #c8d0c5;
            color: #64706a;
            font-size: 7.5px;
            letter-spacing: 0.05em;
            padding: 4px 3px;
            text-align: left;
            text-transform: uppercase;
          }

          .po-table td {
            border-bottom: 1px solid #dce1d8;
            padding: 4px 3px;
            text-align: left;
            vertical-align: top;
          }

          .po-table small {
            color: #891b25;
            display: block;
            font-size: 8px;
            font-weight: 700;
            margin-top: 3px;
          }

          .po-num {
            text-align: right !important;
            white-space: nowrap;
          }

          .po-col-number {
            color: #64706a;
            width: 24px;
          }

          .po-col-picture {
            width: 52px;
          }

          .po-col-item {
            width: 38%;
          }

          .po-product-image {
            border: 1px solid #dce1d8;
            display: block;
            height: 46px;
            object-fit: contain;
            width: 46px;
          }

          .po-line-total {
            font-weight: 700;
          }

          .po-out-of-stock,
          .po-out-of-stock td {
            background-color: #f7e4e6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .po-out-of-stock td {
            border-bottom-color: #e3b8bd;
          }

          .po-bottom {
            align-items: start;
            display: grid;
            gap: 16px;
            grid-template-columns: 1fr 230px;
            margin-top: 20px;
          }

          .po-notes p {
            color: #64706a;
            margin: 6px 0 0;
          }

          .po-totals {
            display: grid;
            gap: 10px;
          }

          .po-totals div {
            align-items: center;
            display: flex;
            justify-content: space-between;
          }

          .po-totals strong {
            font-size: 14px;
          }

          @media print {
            body {
              background: #ffffff;
            }

            .po-page {
              min-height: auto;
              padding: 7mm;
            }
          }
        </style>
      </head>
      <body>${getPurchaseOrderPdfHtml()}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();

  const printPdf = () => printWindow.print();
  const images = [...printWindow.document.images];

  if (images.length === 0) {
    printPdf();
    return;
  }

  let pendingImages = images.length;
  const markImageDone = () => {
    pendingImages -= 1;
    if (pendingImages === 0) {
      printPdf();
    }
  };

  images.forEach((image) => {
    if (image.complete) {
      markImageDone();
      return;
    }

    image.addEventListener("load", markImageDone, { once: true });
    image.addEventListener("error", markImageDone, { once: true });
  });

  window.setTimeout(() => {
    if (pendingImages > 0) {
      printPdf();
    }
  }, 1500);
}

function getFilteredProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const sort = sortSelect.value;
  const hideOutOfStock = stockFilter.value === "hide";

  return productGroups
    .filter((product) => {
      const variantText = product.variants
        .map((variant) => `${variant.reference} ${variant.size} ${variant.price} ${variant.stock}`)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.reference.toLowerCase().includes(query) ||
        variantText.includes(query);
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesStock = !hideOutOfStock || !isOutOfStock(product);
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "packaging") return Number(b.packaging) - Number(a.packaging);
      return a.id - b.id;
    });
}

function getCategories() {
  return [...new Set(productGroups.map((product) => product.category))].sort();
}

function getCategoryIcon(category) {
  const categoryName = category.toLowerCase();

  if (categoryName.includes("beach")) return "☼";
  if (categoryName.includes("ceramic")) return "◈";
  if (categoryName.includes("flask")) return "⚗";
  if (categoryName.includes("table")) return "▤";
  if (categoryName.includes("chair")) return "▱";

  return category.slice(0, 1).toUpperCase();
}

function renderCategories() {
  const categories = getCategories();
  const totalVariants = products.length;
  const totalProducts = productGroups.length;
  selectedCategory = "all";
  visibleProducts = [];

  categoryGrid.innerHTML = `
    <button class="category-card show-all-category" type="button" data-category="all">
      <span class="category-icon" aria-hidden="true">All</span>
      <span>
        <strong>Show all items</strong>
        <span>${totalProducts} ${totalProducts === 1 ? "product" : "products"} · ${totalVariants} variants</span>
      </span>
    </button>
    ${categories
      .map((category) => {
        const count = products.filter((product) => product.category === category).length;
        const groupedCount = productGroups.filter((product) => product.category === category).length;
        return `
        <button class="category-card" type="button" data-category="${category}">
          <span class="category-icon" aria-hidden="true">${getCategoryIcon(category)}</span>
          <span>
            <strong>${category}</strong>
            <span>${groupedCount} ${groupedCount === 1 ? "product" : "products"} · ${count} variants</span>
          </span>
        </button>
      `;
      })
      .join("")}
  `;

  categoryGrid.hidden = false;
  productsView.hidden = true;
  backToCategories.hidden = true;
  productCount.textContent = `Choose from ${categories.length} categories`;
}

function showProductsForCategory(category) {
  selectedCategory = category;
  searchInput.value = "";
  sortSelect.value = "featured";
  stockFilter.value = "show";
  categoryGrid.hidden = true;
  productsView.hidden = false;
  backToCategories.hidden = false;
  renderProducts();
}

function renderProductCard(product, options = {}) {
  const outOfStock = isOutOfStock(product);
  const firstAvailableVariant = product.variants.find((variant) => !isOutOfStock(variant));
  const defaultVariant = firstAvailableVariant || product.variants[0];
  const isPromotionCard = options.isPromotionCard || false;

  return `
    <article class="product-card${outOfStock ? " is-out-of-stock" : ""}${isPromotion(product) ? " is-promotion" : ""}">
      <button class="product-media" type="button" data-id="${product.id}" aria-label="Preview ${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="product-image-category">${product.category}</span>
        ${outOfStock ? '<span class="stock-badge">Out of stock</span>' : ""}
        ${isNewArrival(product) ? '<span class="new-badge">New</span>' : ""}
        ${isPromotion(product) ? '<span class="promo-badge">Promo</span>' : ""}
        ${product.variants.length > 1 ? `<span class="variant-badge">${product.variants.length} sizes</span>` : ""}
      </button>
      <div class="product-info">
        <div class="product-topline">
          <span class="product-reference">${product.reference}</span>
        </div>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-bottom">
          <div>
            ${getProductPriceHtml(product, isPromotionCard)}
            <span class="packaging">${product.variants.length > 1 ? `${product.variants.length} variants` : `${product.packaging} pcs / box`}</span>
          </div>
          <div class="product-purchase${product.variants.length > 1 ? " is-choice" : ""}">
            ${
              product.variants.length === 1
                ? '<input class="inline-quantity" type="number" min="1" value="1" aria-label="Boxes">'
                : ""
            }
            <button
              class="cart-add-button"
              type="button"
              data-action="${product.variants.length > 1 ? "choose" : "add"}"
              data-product-id="${product.id}"
              ${defaultVariant ? `data-variant-id="${defaultVariant.id}"` : ""}
            >
              ${product.variants.length > 1 ? "Choose size" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();
  visibleProducts = filteredProducts;

  productGrid.innerHTML = filteredProducts
    .map(renderProductCard)
    .join("");

  productCount.textContent = `Showing ${filteredProducts.length} of ${productGroups.length} products`;
  emptyState.hidden = filteredProducts.length > 0;
  syncAddButtonsWithCart();
}

function getLoopedCarouselItems(items) {
  const needsCarousel = items.length > getNewArrivalsVisibleCount();
  return needsCarousel ? items.concat(items.slice(0, newArrivalsPerPage)) : items;
}

function renderNewArrivals() {
  const loopedNewArrivals = getLoopedCarouselItems(newArrivals);

  newArrivalsGrid.innerHTML = `
    <div class="new-arrivals-track">
      ${loopedNewArrivals.map(renderProductCard).join("")}
    </div>
  `;
  updateNewArrivalsCarousel();
  syncAddButtonsWithCart();
}

function renderPromotions() {
  const loopedPromotionProducts = getLoopedCarouselItems(promotionProducts);

  promotionGrid.innerHTML = `
    <div class="promotion-track">
      ${loopedPromotionProducts.map((product) => renderProductCard(product, { isPromotionCard: true })).join("")}
    </div>
  `;

  updatePromotionCarousel();
  syncAddButtonsWithCart();
}

function getCarouselTrack(viewport) {
  return viewport.querySelector(".new-arrivals-track, .promotion-track");
}

function setCarouselTransition(viewport, enabled) {
  const track = getCarouselTrack(viewport);
  if (!track) return;

  track.style.transition = enabled ? "" : "none";
}

function updateProductCarousel({ items, startIndex, viewport, carousel, previousButton, nextButton, emptyState }) {
  const visibleCount = getNewArrivalsVisibleCount();
  const maxStartIndex = items.length;
  const track = getCarouselTrack(viewport);
  const needsCarousel = items.length > visibleCount;
  const boundedStartIndex = maxStartIndex > 0 ? Math.min(startIndex, maxStartIndex) : 0;

  carousel.classList.toggle("is-short", !needsCarousel);

  if (track) {
    const firstCard = track.querySelector(".product-card");
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 0;
    const offset = needsCarousel ? boundedStartIndex * (cardWidth + gap) : 0;
    track.style.transform = `translateX(-${offset}px)`;
  }

  emptyState.hidden = items.length > 0;
  previousButton.hidden = !needsCarousel;
  nextButton.hidden = !needsCarousel;
  previousButton.disabled = false;
  nextButton.disabled = false;

  return boundedStartIndex;
}

function moveCarouselNext({ items, getStartIndex, setStartIndex, updateCarousel, viewport }) {
  if (items.length === 0) return;

  const lastRealStartIndex = items.length - 1;
  const currentStartIndex = getStartIndex();

  if (currentStartIndex >= lastRealStartIndex) {
    setStartIndex(items.length);
    updateCarousel();

    window.setTimeout(() => {
      setCarouselTransition(viewport, false);
      setStartIndex(0);
      updateCarousel();
      getCarouselTrack(viewport)?.offsetHeight;
      setCarouselTransition(viewport, true);
    }, carouselTransitionMs);
    return;
  }

  setStartIndex(currentStartIndex + 1);
  updateCarousel();
}

function moveCarouselPrevious({ items, getStartIndex, setStartIndex, updateCarousel, viewport }) {
  if (items.length === 0) return;

  if (getStartIndex() <= 0) {
    setCarouselTransition(viewport, false);
    setStartIndex(items.length);
    updateCarousel();
    getCarouselTrack(viewport)?.offsetHeight;
    setCarouselTransition(viewport, true);
    setStartIndex(items.length - 1);
    updateCarousel();
    return;
  }

  setStartIndex(getStartIndex() - 1);
  updateCarousel();
}

function updateNewArrivalsCarousel() {
  newArrivalStartIndex = updateProductCarousel({
    items: newArrivals,
    startIndex: newArrivalStartIndex,
    viewport: newArrivalsGrid,
    carousel: newArrivalsCarousel,
    previousButton: newArrivalsPrev,
    nextButton: newArrivalsNext,
    emptyState: newArrivalsEmpty
  });
}

function updatePromotionCarousel() {
  promotionStartIndex = updateProductCarousel({
    items: promotionProducts,
    startIndex: promotionStartIndex,
    viewport: promotionGrid,
    carousel: promotionCarousel,
    previousButton: promotionPrev,
    nextButton: promotionNext,
    emptyState: promotionEmpty
  });
}

function updatePreviewButtons() {
  previewPrev.hidden = currentPreviewIndex <= 0;
  previewNext.hidden = currentPreviewIndex >= visibleProducts.length - 1;
}

function showPreviewProduct(index) {
  const product = visibleProducts[index];
  if (!product) return;
  const previewVariants =
    stockFilter.value === "hide"
      ? product.variants.filter((variant) => !isOutOfStock(variant))
      : product.variants;
  const previewPrices = previewVariants.map((variant) => variant.price);
  const previewMinPrice = Math.min(...previewPrices);
  const previewMaxPrice = Math.max(...previewPrices);
  const previewPackagingValues = [...new Set(previewVariants.map((variant) => variant.packaging).filter(Boolean))];

  currentPreviewIndex = index;
  previewImage.src = product.image;
  previewImage.alt = product.name;
  previewCategory.textContent = product.category;
  previewTitle.textContent = product.name;
  previewReference.textContent = product.reference || "Not specified";
  previewPrice.textContent = previewMaxPrice > previewMinPrice ? `${formatPrice(previewMinPrice)} - ${formatPiecePrice(previewMaxPrice)}` : formatPiecePrice(previewMinPrice);
  previewPackaging.textContent = previewPackagingValues.length === 1 ? `${previewPackagingValues[0]} pcs / box` : "See variants";
  previewStock.textContent = previewVariants.some((variant) => !isOutOfStock(variant)) ? "In stock" : "Out of stock";
  previewDescription.innerHTML = `
    <span>${product.description}</span>
    ${renderVariantTable(product)}
    ${
      product.variants.length === 1
        ? `
          <div class="product-purchase preview-purchase">
            <input class="inline-quantity" type="number" min="1" value="1" aria-label="Boxes">
            <button class="cart-add-button preview-cart-button" type="button" data-variant-id="${product.variants[0].id}">Add to cart</button>
          </div>
        `
        : ""
    }
  `;
  updatePreviewButtons();
  syncAddButtonsWithCart();
}

function renderVariantTable(product) {
  if (product.variants.length <= 1) return "";
  const visibleVariants =
    stockFilter.value === "hide"
      ? product.variants.filter((variant) => !isOutOfStock(variant))
      : product.variants;

  if (visibleVariants.length === 0) {
    return '<p class="empty-state">No in-stock variants match this filter.</p>';
  }

  return `
    <div class="variant-table-wrap">
      <table class="variant-table">
        <thead>
          <tr>
            <th>Size</th>
            <th>Reference</th>
            <th>Price</th>
            <th>Packaging</th>
            <th>Status</th>
            <th>Cart</th>
          </tr>
        </thead>
        <tbody>
          ${visibleVariants
            .map((variant) => {
              const outOfStock = isOutOfStock(variant);
              return `
                <tr>
                  <td data-label="Size">${variant.size || "-"}</td>
                  <td data-label="Reference">${variant.reference || "-"}</td>
                  <td data-label="Price">${formatPiecePrice(variant.price)}</td>
                  <td data-label="Packaging">${variant.packaging ? `${variant.packaging} pcs / box` : "-"}</td>
                  <td data-label="Status"><span class="variant-status${outOfStock ? " is-unavailable" : ""}">${outOfStock ? "Out of stock" : "In stock"}</span></td>
                  <td data-label="Cart">
                    <div class="product-purchase variant-purchase">
                      <input class="inline-quantity" type="number" min="1" value="1" aria-label="Boxes">
                      <button class="cart-add-button variant-cart-button" type="button" data-variant-id="${variant.id}">
                        Add
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function openImagePreview(productId, productList = visibleProducts) {
  visibleProducts = productList;
  const productIndex = visibleProducts.findIndex((product) => product.id === productId);
  if (productIndex === -1) return;

  showPreviewProduct(productIndex);
  imagePreview.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeImagePreview() {
  imagePreview.hidden = true;
  document.body.style.overflow = "";
  previewImage.src = "";
  currentPreviewIndex = -1;
}

function showPreviousPreviewProduct() {
  if (currentPreviewIndex > 0) {
    showPreviewProduct(currentPreviewIndex - 1);
  }
}

function showNextPreviewProduct() {
  if (currentPreviewIndex < visibleProducts.length - 1) {
    showPreviewProduct(currentPreviewIndex + 1);
  }
}

function startPreviewDrag(event) {
  if (imagePreview.hidden || visibleProducts.length <= 1) return;

  event.preventDefault();
  previewDragPointerId = event.pointerId;
  previewDragStartX = event.clientX;
  previewDragStartY = event.clientY;
  previewMedia.classList.add("is-dragging");
  previewMedia.setPointerCapture(event.pointerId);
}

function finishPreviewDrag(event) {
  if (previewDragPointerId !== event.pointerId) return;

  const dragX = event.clientX - previewDragStartX;
  const dragY = event.clientY - previewDragStartY;
  const isHorizontalSwipe = Math.abs(dragX) > previewSwipeThreshold && Math.abs(dragX) > Math.abs(dragY) * 1.4;

  previewMedia.classList.remove("is-dragging");
  if (previewMedia.hasPointerCapture(event.pointerId)) {
    previewMedia.releasePointerCapture(event.pointerId);
  }
  previewDragPointerId = null;

  if (!isHorizontalSwipe) return;

  if (dragX < 0) {
    showNextPreviewProduct();
  } else {
    showPreviousPreviewProduct();
  }
}

function cancelPreviewDrag(event) {
  if (previewDragPointerId !== event.pointerId) return;

  previewMedia.classList.remove("is-dragging");
  if (previewMedia.hasPointerCapture(event.pointerId)) {
    previewMedia.releasePointerCapture(event.pointerId);
  }
  previewDragPointerId = null;
}

categoryGrid.addEventListener("click", (event) => {
  const categoryButton = event.target.closest(".category-card");
  if (!categoryButton) return;

  showProductsForCategory(categoryButton.dataset.category);
});

backToCategories.addEventListener("click", renderCategories);

productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest(".cart-add-button");
  if (addButton) {
    if (addButton.dataset.action === "add" && addButton.dataset.variantId) {
      setVariantCartQuantity(addButton.dataset.variantId, getInlineQuantity(addButton));
    } else {
      openImagePreview(addButton.dataset.productId);
    }
    return;
  }

  const previewButton = event.target.closest(".product-media");
  if (!previewButton) return;

  openImagePreview(previewButton.dataset.id);
});

newArrivalsGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest(".cart-add-button");
  if (addButton) {
    if (addButton.dataset.action === "add" && addButton.dataset.variantId) {
      setVariantCartQuantity(addButton.dataset.variantId, getInlineQuantity(addButton));
    } else {
      openImagePreview(addButton.dataset.productId, newArrivals);
    }
    return;
  }

  const previewButton = event.target.closest(".product-media");
  if (!previewButton) return;

  openImagePreview(previewButton.dataset.id, newArrivals);
});

promotionGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest(".cart-add-button");
  if (addButton) {
    if (addButton.dataset.action === "add" && addButton.dataset.variantId) {
      setVariantCartQuantity(addButton.dataset.variantId, getInlineQuantity(addButton));
    } else {
      openImagePreview(addButton.dataset.productId, promotionProducts);
    }
    return;
  }

  const previewButton = event.target.closest(".product-media");
  if (!previewButton) return;

  openImagePreview(previewButton.dataset.id, promotionProducts);
});

newArrivalsPrev.addEventListener("click", () => {
  moveCarouselPrevious({
    items: newArrivals,
    getStartIndex: () => newArrivalStartIndex,
    setStartIndex: (index) => {
      newArrivalStartIndex = index;
    },
    updateCarousel: updateNewArrivalsCarousel,
    viewport: newArrivalsGrid
  });
});

newArrivalsNext.addEventListener("click", () => {
  moveCarouselNext({
    items: newArrivals,
    getStartIndex: () => newArrivalStartIndex,
    setStartIndex: (index) => {
      newArrivalStartIndex = index;
    },
    updateCarousel: updateNewArrivalsCarousel,
    viewport: newArrivalsGrid
  });
});

promotionPrev.addEventListener("click", () => {
  moveCarouselPrevious({
    items: promotionProducts,
    getStartIndex: () => promotionStartIndex,
    setStartIndex: (index) => {
      promotionStartIndex = index;
    },
    updateCarousel: updatePromotionCarousel,
    viewport: promotionGrid
  });
});

promotionNext.addEventListener("click", () => {
  moveCarouselNext({
    items: promotionProducts,
    getStartIndex: () => promotionStartIndex,
    setStartIndex: (index) => {
      promotionStartIndex = index;
    },
    updateCarousel: updatePromotionCarousel,
    viewport: promotionGrid
  });
});

window.addEventListener("resize", () => {
  renderNewArrivals();
  renderPromotions();
});

previewClose.addEventListener("click", closeImagePreview);
previewPrev.addEventListener("click", showPreviousPreviewProduct);
previewNext.addEventListener("click", showNextPreviewProduct);
previewMedia.addEventListener("pointerdown", startPreviewDrag);
previewMedia.addEventListener("pointerup", finishPreviewDrag);
previewMedia.addEventListener("pointercancel", cancelPreviewDrag);
previewMedia.addEventListener("lostpointercapture", () => {
  previewMedia.classList.remove("is-dragging");
  previewDragPointerId = null;
});

previewDescription.addEventListener("click", (event) => {
  const addButton = event.target.closest(".cart-add-button");
  if (!addButton || !addButton.dataset.variantId) return;

  setVariantCartQuantity(addButton.dataset.variantId, getInlineQuantity(addButton));
});

mobileMenuToggle.addEventListener("click", toggleMobileMenu);

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setActiveAdmin(adminSelect.value);
  loadProducts();
  renderCart();
});

logoutAdmin.addEventListener("click", () => {
  setActiveAdmin("");
  products = [];
  productGroups = [];
  newArrivals = [];
  promotionProducts = [];
  productGrid.innerHTML = "";
  categoryGrid.innerHTML = "";
  newArrivalsGrid.innerHTML = "";
  promotionGrid.innerHTML = "";
  productCount.textContent = "Choose a category";
  closeMobileMenu();
  closeCartDrawer();
});

navActions.addEventListener("click", (event) => {
  if (event.target.closest("a, button")) {
    closeMobileMenu();
  }
});

openCart.addEventListener("click", openCartDrawer);
closeCart.addEventListener("click", closeCartDrawer);

cartDrawer.addEventListener("click", (event) => {
  if (event.target === cartDrawer) {
    closeCartDrawer();
  }
});

cartItems.addEventListener("input", (event) => {
  const quantityInput = event.target.closest(".cart-quantity");
  const priceInput = event.target.closest(".cart-price");
  if (!quantityInput && !priceInput) return;

  const itemId = quantityInput?.dataset.id || priceInput.dataset.id;
  const item = cart.find((cartItem) => cartItem.id === itemId);
  if (!item) return;

  if (quantityInput) {
    item.quantity = Math.max(Number(quantityInput.value) || 1, 1);
  }

  if (priceInput) {
    item.price = Math.max(Number(priceInput.value) || 0, 0);
  }

  saveCart();
  updateCartItemDisplay(item);
  updateCartTotalsDisplay();
  syncAddButtonsWithCart();
});

cartItems.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".cart-remove");
  if (!removeButton) return;

  const itemIndex = cart.findIndex((item) => item.id === removeButton.dataset.id);
  if (itemIndex === -1) return;

  const [item] = cart.splice(itemIndex, 1);
  saveCart();
  renderCart();
  showUndoToast(item, itemIndex);
});

clearCartConfirmPopup.addEventListener("click", (event) => {
  if (event.target === clearCartConfirmPopup) {
    closeClearCartConfirmPopup();
  }
});

confirmManualClearCart.addEventListener("click", () => {
  clearCart();
  closeClearCartConfirmPopup();
});

cancelManualClearCart.addEventListener("click", closeClearCartConfirmPopup);

clearCartButton.addEventListener("click", openClearCartConfirmPopup);
exportCartXls.addEventListener("click", exportCartAsXls);
exportCartPdf.addEventListener("click", exportCartAsPdf);
undoRemoveItem.addEventListener("click", undoRemovedCartItem);

customerNameInput.addEventListener("input", () => {
  clearCustomerNameError();
});

themeToggle.addEventListener("click", () => {
  applyTheme(document.body.classList.contains("dark-mode") ? "light" : "dark");
});

document.addEventListener("click", (event) => {
  if (!navActions.classList.contains("is-open")) return;
  if (event.target.closest(".nav")) return;

  closeMobileMenu();
});

imagePreview.addEventListener("click", (event) => {
  if (event.target === imagePreview) {
    closeImagePreview();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navActions.classList.contains("is-open")) {
    closeMobileMenu();
  }

  if (event.key === "Escape" && !clearCartConfirmPopup.hidden) {
    closeClearCartConfirmPopup();
    return;
  }

  if (imagePreview.hidden) {
    return;
  }

  if (event.key === "Escape") {
    closeImagePreview();
  } else if (event.key === "ArrowLeft") {
    showPreviousPreviewProduct();
  } else if (event.key === "ArrowRight") {
    showNextPreviewProduct();
  }
});

[searchInput, sortSelect, stockFilter].forEach((control) => {
  control.addEventListener("input", renderProducts);
});

async function loadProducts() {
  if (!activeAdmin) return;

  try {
    const response = await fetch("products.csv");
    if (!response.ok) {
      throw new Error("Could not load products.csv");
    }

    const csvText = await response.text();
    products = csvToProducts(csvText);
    productGroups = groupProducts(products);
    newArrivals = productGroups.filter(isNewArrival);
    promotionProducts = productGroups.filter(isPromotion);
    newArrivalStartIndex = 0;
    promotionStartIndex = 0;
    renderNewArrivals();
    renderPromotions();
    renderCategories();
    renderCart();
  } catch (error) {
    productGrid.innerHTML = "";
    productCount.textContent = "Products could not be loaded";
    emptyState.textContent = "Open this website with a local server so it can read products.csv.";
    emptyState.hidden = false;
    console.error(error);
  }
}

applyTheme(loadTheme());
setActiveAdmin(activeAdmin);
if (activeAdmin) {
  renderCart();
  loadProducts();
}
