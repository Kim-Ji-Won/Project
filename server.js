const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

const mysql = require("mysql2");

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",   // 방금 설정한 새 비번
  database: "shoppingmall"
});

conn.connect((err)=>{
  if(err) throw err;
  console.log("MySQL 연결 성공");
});

const express = require("express");
const session = require("express-session"); //세션을 관리하는 도구(로그인 상태를 쿠키에 저장하고 추적)
const bodyParser = require("body-parser"); //프론트에서 보낸 데이터를 읽는 도구
const path = require("path"); //파일 경로나 폴더 경로를 OS에 맞게 안전하게 연결해주는 도구.

//1. 서버 만들기
const app = express(); //웹 서버 실행 필수 단계

//2. JSON 데이터 읽을 수 있도록 설정
//미들웨어 설정(서버에서 요청이 들어올 떄마다 실행할 함수를 등록하는 명령어: app.use() 무조건 이것부터 거침)
app.use(bodyParser.json()); //프론트가 보낸 JSON 데이터를 읽어서 JS 객체로 변환 > req.body안에 담아줌

//3. 세션 설정하기(로그인 상태를 유지하기 위해)(app,use() 안에 넣은 이유 > 웹 전체에서 seesion() 설정을 적용하기 위해)
app.use(
    session({
        secret: "mySecretKey", //세션을 암호화하는 키(보안용 서명 키)
        resave: false, //변경할 값이 없을 때 다시 저장 안 함
        saveUninitialized: true, //처음 생성된 세션도 저장(새로운 사용자가 처음 사이트 들어왔을 때 아직 로그인은 안 했지만, 나중에 로그인할 수도 있으니까 세션 껍데기를 미리 만들어 놓는 과정)
    })
);


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Shopping_Main/main.html"));
});

// 메인 페이지 파일들
app.use("/", express.static(path.join(__dirname, "Shopping_Main")));

// 로그인/회원가입 페이지
app.use("/login", express.static(path.join(__dirname, "Shopping_Login/Fronted")));
app.use("/register", express.static(path.join(__dirname, "Shopping_Login/Fronted")));

// 장바구니 페이지
app.use("/cart", express.static(path.join(__dirname, "Shopping_Cart")));

// 주문 페이지
app.use("/order", express.static(path.join(__dirname, "Shopping_Order")));


//4. 회원가입 기능
//POST /register 엔드포인트 등록
//app은 express 인스턴스이고, req(요청), res(응답) 객체를 받는다
//이 경로로 프론트에서 POST 방식으로 보냄
app.post("/register", (req, res) => { 
    const {id, pw} = req.body; //사용자가 작성한 아이디/비번 꺼내오는 것

    //?는 값이 들어가는 칸임(이 방식을 쓰는 이뉴는 SQL Injection 방지하기 위해)
    conn.query("SELECT * FROM users WHERE id=?", [id], (err, rows) => {
        if(err) throw err; //err은 에러 정보가 담겨있는 상자다(에러 없으면 err=null) 즉, 에러가 생겼으먼 알려주고 여기서 더 진행하지 마라

        //rows.length > 0 이라는건 "똑같은 id가 이미 있다"
        if(rows.length > 0) { 
            return res.json({message: "이미 존재하는 아이디입니다."});
        }

        // pw를 해시로 변경
        bcrypt.hash(pw, SALT_ROUNDS, (hashErr, hash) => {
          if(hashErr) throw hashErr;

          conn.query("INSERT INTO users (id, pw) VALUES (?, ?)", [id, hash], (err2) => {
            if(err2) throw err2;
            res.json({message: "회원가입이 완료되었습니다."}); //DB에 저장 끝냈으니까 프론트로 메시지 보냄
          });
        });
    });
});

app.post("/login", (req, res) => {
    const {id, pw} = req.body;

    console.log("id:", id, "pw: ", pw);

    conn.query("SELECT * FROM users WHERE id=?", [id], (err, rows) => {
        if(err) throw err;

        if(rows.length === 0) {
            return res.json({message: "아이디 또는 비밀번호 오류"});
        }

        const user = rows[0];

        //현재 user.pw가 이미 해시인지 확인
        const stored = user.pw;

        //bcrypt 해시는 $2b$로 시작한다
        const isHashed = stored.startsWith("$2b$");

        //평문 비번 비교 or 해시 비교
        if(!isHashed) {
          if(stored != pw) {
            return res.json({message: "아이디 또는 비밀번호 오류"});
          }

          bcrypt.hash(pw, SALT_ROUNDS, (hErr, newHash) => {
            if(hErr) throw hErr;

            conn.query("UPDATE users SET pw=? WHERE id=?", [newHash, id], (uErr) => {
              if(uErr) throw uErr;
            });
          });

          req.session.user = id; //세션 메모장에 user라는 칸을 하나 만들고 거기에 id를 적어놓는다
          return res.json({message: "로그인 성공"});
         }

          bcrypt.compare(pw, stored, (cmpErr, isMatch) => {
            if(cmpErr) throw cmpErr;

            if(!isMatch) {
              return res.json({message: "아이디 또는 비밀번호 오류"});
            }

            req.session.user = id;
            return res.json({message: "로그인 성공"});
          });
    });
});

app.post("/logout", function (req, res) {
  if (req.session.user) {
    req.session.destroy(function () {
      res.json({message: "로그아웃이 성공적으로 되었습니다."});
    });
  } else {
    res.json({message: "로그인 해주세요"});
  }
});

let cartDB = [];

app.get("/cart", (req, res) => {
  res.json(cartDB);
});

app.post("/cart", (req, res) => {
  const newItem = req.body; // {id, name, price, quantity}

  const existing = cartDB.find(i => i.id === newItem.id);
  if(existing) {
    existing.quantity += newItem.quantity;
  } else {
    cartDB.push(newItem);
  }

  res.json({message: "서버 장바구니 저장 완료"});
});

app.delete("/cart", (req, res) => {
  cartDB = [];
  res.json({message: "장바구니 초기화 완료"});
});

// -------------------- 상품 CRUD --------------------

// 상품 등록 Create
app.post("/product", (req, res) => {
  const { name, price, stock } = req.body;

  const sql = "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)";
  conn.query(sql, [name, price, stock], (err, result) => {
    if(err) throw err;
    res.json({ id: result.insertId, name, price, stock });
  });
});

// 상품 목록 조회 Read
app.get("/product", (req, res) => {
  conn.query("SELECT * FROM products", (err, rows) => {
    if(err) throw err;
    res.json(rows);
  });
});

// 상품 수정 Update
app.put("/product/:id", (req, res) => {
  const { name, price, stock } = req.body;

  const sql = "UPDATE products SET name=?, price=?, stock=? WHERE id=?";
  conn.query(sql, [name, price, stock, req.params.id], (err) => {
    if(err) throw err;
    res.json({ message: "상품 수정 완료" });
  });
});

// 상품 삭제 Delete
app.delete("/product/:id", (req, res) => {
  conn.query("DELETE FROM products WHERE id=?", [req.params.id], (err) => {
    if(err) throw err;
    res.json({ message: "상품 삭제 완료" });
  });
});

// ----------------------------------------------------

//5000번 포트로 서버 실행
app.listen(3456, "0.0.0.0", () => {
  console.log("✅ 서버 실행 중: http://localhost:3456");
});