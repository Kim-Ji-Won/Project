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

//임시 회원 데이터 (DB 대신 사용할 배열)
let users = [
    {id: "jiwon", pw: "1234"}, 
    {id: "test", pw: "1111"}
]; //객체 배열

//4. 회원가입 기능
app.post("/register", function (req, res) { // /resgier로 열린 문을 통해 프론트에서 백엔드로 post해주면 그 때 function을 실행함
    const id = req.body.id; //프론트에서 보낸 데이터(id, pw)가 req안에 담겨서 오므로 그걸 끄내서 id, pw 변수에 저장하겠다는 것
                            //req 안에는 많은 정보가 담겨져 오고 우리가 필요한건 body 안에 담긴 데이터이므로 req.body.id / req.body.pw로 접근함
    const pw = req.body.pw;

    //이미 존재하는 아이디인지 확인
    const exist = users.find(function (user) { //Array(users).find()는 배열 안의 요소를 하나씩 꺼내서 조건에 맞는 첫 번째 요소를 찾아주는 함수
    //여기서 핵심은 user는 우리가 직접 만든 게 아니라 find 함수가 자동으로 전달해주는 매개변수임. 즉 users 배열에 있는 요소들 하나씩 꺼내서 user에 담겠다는거임.
    //위 find 함수의 작동은 find()는 users 배열을 처음부터 끝까지 검사한 후, user에 차례대로 넣어줌. 그리고 user.id === id가 처음으로 true 되는 순간 > 멈추고 그 값을 반환
        return user.id === id;
    });
    // 이미 아이디 존재하면 에러 메시지 보내고 함수 종료
    if (exist) {
        res.json({ message: "이미 존재하는 아이디입니다." }); //프론트로 응답 보내기
        return;
    }

    //새로운 사용자 추가(아이디 존재하지 않을 경우)
    users.push({ id: id, pw: pw}); //만들어 놓은 users 배열에 새로운 객체 추가
    res.json({message: "회원가입이 완료되었습니다."}); //프론트로 응답 보내기
    //여기서 헷갈릴 수 있는점!!!!!! 지금 서버>프론트도 .json / 프론트>서버도 .json을 쓰는데 어떻게 문자열이 오갈까? 기본적으로 http 통신은 오직 "문자열"만 오고갈 수 있음.
    //그래서 서로 오갈 때 무조건 문자열로 변환해서 보내줘야됨. 근데 server에서는 express가 있으므로 json.stringify()를 굳이 해주지 않아도 오직 res.json만 써도 message를 문자열로 보낼 수 있는거임.
    //그러나 프론트에서 서버로 요청을 보낼 때는 데이터(body)를 보낼 때 json 문자열 형태로 보내줘야됨. 그래서 register.html안에 body: JSON.stringify({ id: id, pw: pw })처럼 문자열로 변환하는 단계가 있는거임
    //그리고 프론트에서는 서버에서 받은 응답을 json 객체로 바꿔서 받아야 하므로 const data = await res.json(); 처럼 json 객체로 변환함
    //따라서 서버, 프론트 둘 다 .json을 쓴다고 같은 역할을 하는게 아니라 서버>프론트에서의 .json은 json.stingfy()가 자동으로 내장되어 있어 문자열로 바뀌고 프론트에서의 .json은 알고 있는 것과 같이 단순히 json 객체로 바꿔주는 역할임
});

app.post("/login", function (req, res) {
  const id = req.body.id;
  const pw = req.body.pw;

  const user = users.find(function (user) {
    return user.id === id && user.pw === pw;
  });

  if(!user) {
    res.json({message: "아이디 또는 비밀번호를 다시 입력해주세요."}); //저장된 회원 정보와 일치하지 않을 때 프론트로 응답 보내기
    return;
  }

  req.session.user = id; //로그인 성공하면 Express가 express-session을 통해 쿠키에 세션 아이디를 저장하고, 그 세션에 user값을 기억해 둬서 이후 다른 페이지에서도 로그인 상태를 유지.
  res.json({message: "로그인 성공"}); //프론트로 응답 보내기
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

app.use(express.static(path.join(__dirname, "..")));//현재 서버 파일의 상위 폴더(=Shopping_Mall 폴더)를 웹 브라우저에서 자유롭게 접근할 수 있게 열어주는 역할.

//3000번 포트로 서버 실행
app.listen(3000, () => {
  console.log("✅ 서버 실행 중: http://localhost:3000");
});