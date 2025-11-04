const cartTableBody = document.querySelector('#cart tbody');
const totalPriceEl = document.getElementById('total-price');
const clearCartBtn = document.getElementById('clear-cart');


//LocalStorage는 무조건 '문자열'로 저장되어 있기 때문에 꺼내서 사용할려면 json 객체로 바꿔줘야함.
// || [] 는 LocalStorage가 null 값이라면 빈 배열([])로 초기화하라는 뜻
let cart = JSON.parse(localStorage.getItem('cartItems')) || [];

function renderCart() {
    cartTableBody.innerHTML = '';
    let total = 0;

    for(let i = 0; i < cart.length; i++){
        const item = cart[i];

        const tr = document.createElement('tr');
        
        const tdName = document.createElement('td');
        tdName.textContent = item.name;

        const tdQuantity = document.createElement('td');
        tdQuantity.textContent = item.quantity || 1;
        
        const tdPrice = document.createElement('td');
        const itemTotal = item.price * (item.quantity || 1);
        tdPrice.textContent = itemTotal.toLocaleString() + "원";
        
        tr.appendChild(tdName);
        tr.appendChild(tdQuantity);
        tr.appendChild(tdPrice);
        cartTableBody.appendChild(tr);

        total += itemTotal;
    }

    totalPriceEl.textContent = `총 합계 : ${total.toLocaleString()}원`;
}

// 장바구니 비우기
clearCartBtn.addEventListener('click', function() {
    cart = [];
    localStorage.removeItem('cartItems');
    renderCart();
});

// 초기 렌더링
renderCart();