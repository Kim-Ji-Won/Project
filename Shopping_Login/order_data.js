if (!localStorage.getItem("user")){ // 초기 데이터가 없을 때만
    const newUser = {
        name : "김지민",
        address : "서울특별시 성북구 삼선동 삼선교로16길 116 한성대학교 우촌관 102호",
    };
    localStorage.setItem("user", JSON.stringify(newUser));
}

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const cart = JSON.parse(localStorage.getItem("cartItems")) || [];

    //사용자 정보 표시
    document.getElementById("user-name").textContent = user.name;
    document.getElementById("user-address").textContent = user.address;

    //장바구니 목록 표시
    const productList = document.getElementById("product-list");
    let subtotal = 0;
    productList.innerHTML = "";

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const productDiv = document.createElement("div");
        productDiv.classList.add("product-item");

        productDiv.innerHTML = `
            <img src="${item.img}" alt="${item.name}" width="70">
            
            <span>${item.price.toLocaleString()}원 × ${item.quantity}</span>
            <strong>${itemTotal.toLocaleString()}원</strong>
        `;
        productList.appendChild(productDiv);
    });

    //금액 표시
    const subtotalEl = document.getElementById("subtotal-price");
    const totalEl = document.getElementById("total-price");

    subtotalEl.textContent = `${subtotal.toLocaleString()}원`;
    totalEl.textContent = `${subtotal.toLocaleString()}원`;

    //콘솔로도 확인
    console.log("총 상품 금액:", subtotal);
});
