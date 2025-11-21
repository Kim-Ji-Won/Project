// ------------------------------
// 상품 목록 불러오기 (DB 연동)
// ------------------------------
let allProducts = []; // 전역 상품 목록 저장용
let lastSearchKeyword = "";
let searchDebounceTimer = null;
const SEARCH_META_DEFAULT_MESSAGE = "상품명을 입력하면 결과가 여기에 표시됩니다.";

// 서버에서 상품 전체 불러오기
async function loadProducts() {
  try {
    const res = await fetch("http://localhost:3000/product");
    allProducts = await res.json(); // DB에서 가져온 상품 배열

    renderProducts(); // 화면에 표시
    refreshSearchResults();
  } catch (err) {
    console.error("상품 목록 불러오기 실패:", err);
  }
}

// ------------------------------
// 상품 렌더링
// ------------------------------
function renderProducts() {
  // 상품을 표시할 3개의 섹션 id
  const newArrivalsContainer = document.getElementById("new-arrivals-container");
  const weeklyBestContainer = document.getElementById("weekly-best-container");
  const bestSellerContainer = document.getElementById("best-seller-container");

  // 컨테이너 비우기
  if (newArrivalsContainer) newArrivalsContainer.innerHTML = "";
  if (weeklyBestContainer) weeklyBestContainer.innerHTML = "";
  if (bestSellerContainer) bestSellerContainer.innerHTML = "";

  // 카테고리별로 나누기 (DB에 category 필드가 있다면)
  const newArrivals = allProducts.filter(p => p.category === "new");
  const weeklyBest = allProducts.filter(p => p.category === "weekly");
  const bestSeller = allProducts.filter(p => p.category === "best");

  // category가 없다면 임시로 전체 출력
  const sectionData = [
    { list: newArrivals.length ? newArrivals : allProducts, id: "new-arrivals-container" },
    { list: weeklyBest.length ? weeklyBest : allProducts, id: "weekly-best-container" },
    { list: bestSeller.length ? bestSeller : allProducts, id: "best-seller-container" },
  ];

  // 각 섹션별로 렌더링
  sectionData.forEach(section => {
    const container = document.getElementById(section.id);
    if (!container) return;

    let htmlContent = "";
    section.list.forEach(product => {
      htmlContent += `
        <article data-product-id="${product.id}">
          <a href="detail.html?id=${product.id}">
            <img src="${product.imgUrl || './images/default.jpg'}" alt="${product.alt || product.name}">
          </a>
          <p class="price">${product.price.toLocaleString()}원</p>
          <button onclick="addToCart(${product.id})">장바구니</button>
        </article>
      `;
    });

    container.innerHTML += htmlContent;
  });
}

// ------------------------------
// 상품 검색 기능
// ------------------------------
function filterProductsByKeyword(keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return [];

  return allProducts.filter(product => {
    const targets = [
      product.name,
      product.category,
      product.alt,
      product.description,
      product.tags && Array.isArray(product.tags) ? product.tags.join(" ") : ""
    ];

    return targets.some(value => typeof value === "string" && value.toLowerCase().includes(normalized));
  });
}

function formatPrice(value) {
  if (typeof value === "number") return value.toLocaleString();
  const numeric = Number(value);
  return Number.isNaN(numeric) ? "-" : numeric.toLocaleString();
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text).replace(/[&<>"']/g, char => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function renderSearchResults(results, keyword) {
  const container = document.getElementById("search-results");
  const listEl = document.getElementById("search-results-list");
  const metaEl = document.getElementById("search-results-meta");
  if (!container || !listEl || !metaEl) return;

  container.classList.remove("hidden");
  metaEl.textContent = `“${keyword}” 검색 결과 ${results.length}건`;

  if (!results.length) {
    listEl.innerHTML = `<p class="empty-result">“${escapeHtml(keyword)}”에 대한 검색 결과가 없습니다.</p>`;
    return;
  }

  const cards = results
    .map(product => {
      const imgUrl = escapeHtml(product.imgUrl || "./images/default.jpg");
      const altText = escapeHtml(product.alt || product.name || "상품 이미지");
      const name = escapeHtml(product.name || "상품명 미상");
      const price = formatPrice(product.price);
      const id = product.id ?? "";

      return `
        <article class="search-result-card" data-product-id="${id}">
          <a href="detail.html?id=${id}">
            <img src="${imgUrl}" alt="${altText}">
          </a>
          <p>${name}</p>
          <p class="price">${price}원</p>
          <button type="button" onclick="addToCart(${id})">장바구니</button>
        </article>
      `;
    })
    .join("");

  listEl.innerHTML = cards;
}

function clearSearchResults() {
  const container = document.getElementById("search-results");
  const listEl = document.getElementById("search-results-list");
  const metaEl = document.getElementById("search-results-meta");
  if (!container || !listEl || !metaEl) return;

  container.classList.add("hidden");
  listEl.innerHTML = "";
  metaEl.textContent = SEARCH_META_DEFAULT_MESSAGE;
  lastSearchKeyword = "";
}

function performSearch(keyword) {
  const trimmed = keyword.trim();
  if (!trimmed) {
    clearSearchResults();
    return;
  }

  lastSearchKeyword = trimmed;
  const results = filterProductsByKeyword(trimmed);
  renderSearchResults(results, trimmed);
}

function handleSearchInput(event) {
  const { value } = event.target;
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

  if (!value.trim()) {
    clearSearchResults();
    return;
  }

  searchDebounceTimer = setTimeout(() => performSearch(value), 250);
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const input = document.getElementById("product-search-input");
  if (!input) return;
  performSearch(input.value);
}

function resetSearch() {
  const input = document.getElementById("product-search-input");
  if (input) input.value = "";
  clearSearchResults();
}

function refreshSearchResults() {
  if (!lastSearchKeyword) return;
  performSearch(lastSearchKeyword);
}

// ------------------------------
// 장바구니 담기 기능
// ------------------------------
let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

async function addToCart(productID) {
  const productToAdd = allProducts.find(p => p.id === productID);
  if (!productToAdd) return;

  try {
    await fetch("http://localhost:3000/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: productToAdd.id,
        name: productToAdd.name,
        price: productToAdd.price,
        quantity: 1,
      }),
    });

    alert(`${productToAdd.name} 장바구니 담기 성공! (서버 저장)`);
  } catch (err) {
    console.error("장바구니 추가 실패:", err);
  }
}

// ------------------------------
// 상품 상세 페이지
// ------------------------------
async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const idStr = params.get("id");
  if (!idStr) return;

  const productId = parseInt(idStr, 10);

  // DB에서 상품 데이터 불러오기
  try {
    const res = await fetch("http://localhost:3000/product");
    const products = await res.json();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const info = document.getElementById("product-info");
    if (info) {
      info.innerHTML = `<h1>${product.name}</h1><p>가격: ${product.price.toLocaleString()}원</p><button id="add-to-cart-detail">장바구니 담기</button>`;
      const addBtn = document.getElementById("add-to-cart-detail");
      if (addBtn) addBtn.addEventListener("click", () => addToCart(product.id));
    }

    const gallery = document.getElementById("product-gallery");
    if (gallery) {
      gallery.innerHTML = "";
      const img = document.createElement("img");
      img.src = product.imgUrl || "./images/default.jpg";
      img.alt = product.alt || product.name;
      img.style.width = "300px";
      img.style.height = "auto";
      img.style.borderRadius = "8px";
      gallery.appendChild(img);
    }
  } catch (err) {
    console.error("상품 상세 불러오기 실패:", err);
  }
}

// ------------------------------
// 로그아웃 기능
// ------------------------------
async function logout() {
  try {
    const response = await fetch("http://localhost:3000/logout", { method: "POST" });
    const data = await response.json();
    alert(data.message);

    if (data.message.includes("성공")) {
      window.location.href = "/Shopping_Login/Fronted/login.html";
    }
  } catch (err) {
    console.error("로그아웃 실패:", err);
  }
}

// ------------------------------
// 페이지 로드시 실행
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // 메인 페이지면 상품 목록 로드
  if (document.getElementById("new-arrivals-container")) {
    loadProducts();
  }

  // detail.html 페이지면 상세정보 로드
  if (window.location.pathname.includes("detail.html")) {
    loadProductDetail();
  }

  const searchForm = document.getElementById("product-search-form");
  const searchInput = document.getElementById("product-search-input");
  const resetBtn = document.getElementById("search-reset-btn");
  const metaEl = document.getElementById("search-results-meta");

  if (metaEl) {
    metaEl.textContent = SEARCH_META_DEFAULT_MESSAGE;
  }

  if (searchForm) {
    searchForm.addEventListener("submit", handleSearchSubmit);
  }

  if (searchInput) {
    searchInput.addEventListener("input", handleSearchInput);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetSearch);
  }
});
