document.addEventListener("DOMContentLoaded", async () => {

    //1) 서버에서 장바구니 받아오기
    const res = await fetch("http://localhost:3456/cart");
    const cart = await res.json(); //cartDB 데이터

    //사용자 정보 표시(일단 Localsotrage)
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        document.getElementById("user-name").textContent = "로그인 필요";
        document.getElementById("user-address").textContent = "";
    } else {
        document.getElementById("user-name").textContent = user.name;
        document.getElementById("user-address").textContent = user.address;
    }


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
            <img src="${item.imgUrl}" alt="${item.name}" width="70">
            
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
});
