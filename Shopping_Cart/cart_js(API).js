const cartTableBody = document.querySelector('#cart tbody');
const totalPriceEl = document.getElementById('total-price');
const clearCartBtn = document.getElementById('clear-cart');

let cart = [];

async function loadCartFromServer() {
    const res = await fetch("http://localhost:3000/cart");
    cart = await res.json();
    renderCart();
}

function renderCart() {
    cartTableBody.innerHTML = '';
    let total = 0;

    for(let i = 0; i < cart.length; i++) {
        const item = cart[i];

        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = item.name;

        const tdQuantity = document.createElement('td');
        tdQuantity.textContent = item.quantity;

        const itemTotal = item.price * item.quantity;
        const tdPrice = document.createElement('td');
        tdPrice.textContent = itemTotal.toLocaleString() + "원";

        tr.appendChild(tdName);
        tr.appendChild(tdQuantity);
        tr.appendChild(tdPrice);
        cartTableBody.appendChild(tr);

        total += itemTotal;
    }

    totalPriceEl.textContent = `총 합계 : ${total.toLocaleString()}원`;
}

clearCartBtn.addEventListener('click', async function() {
    await fetch("http://localhost:3000/cart", {method: "DELETE"});
    cart = [];
    renderCartp();
});

loadCartFromServer();