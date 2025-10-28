const express = require("express");
const session = require("express-session"); //세션을 관리하는 도구(로그인 상태를 쿠키에 저장하고 추적)
const bodyParser = require("body-parser"); //프론트에서 보낸 데이터를 읽는 도구
//1. 서버 만들기
const app = express(); //웹 서버 실행 필수 단계
//2. JSON 데이터 읽을 수 있도록 설정
//미들웨어 설정(서버에서 요청이 들어올 떄마다 실행할 함수를 등록하는 명령어: app.use() 무조건 이것부터 거침)
app.use(bodyParser.json()); //프론트가 보낸 JSON 데이터를 읽어서 JS 객체로 변환 > req.body안에 담아줌
const path = require("path");
app.use(express.static(path.join(__dirname, "..")));//Shopping_Mall 폴더 안에 있는 파일을 웹에서 보여주는 창구를 열어주는 역할
//3. 세션 설정하기(로그인 상태를 유지하기 위해)(app,use() 안에 넣은 이유 > 웹 전체에서 seesion() 설정을 적용하기 위해)
app.use(
    session({
        secret: "mySecretKey", //세션을 암호화하는 키(보안용 서명 키)
        resave: false, //변경할 값이 없을 때 다시 저장 안 함
        saveUninitialized: true, //처음 생성된 세션도 저장(새로운 사용자가 처음 사이트 들어왔을 때 아직 로그인은 안 했지만, 나중에 로그인할 수도 있으니까 세션 껍데기를 미리 만들어 놓는 과정)
    })
);

//4. 임시 회원 데이터 (DB 대신 사용할 배열)
let users = [
    {id: "jiwon", pw: "1234"}, 
    {id: "test", pw: "1111"}
]; //객체 배열

//5. 회원가입 기능
app.post("/register", function (req, res) { // /resgier로 열린 문을 통해 프론트에서 백엔드로 post해주면 그 때 function을 실행함
    const id = req.body.id; //프론트에서 보낸 데이터(id, pw)가 req안에 담겨서 오므로 그걸 끄내서 id, pw 변수에 저장하겠다는 것
                            //req 안에는 많은 정보가 담겨져 오고 우리가 필요한건 body 안에 담긴 데이터이므로 req.body.id / req.body.pw로 접근함
    const pw = req.body.pw; //프론트에서 보낸 데이터(id, pw)가 req안에 담겨서 오므로 그걸 끄내서 id, pw 변수에 저장하겠다는 것

    //이미 존재하는 아이디인지 확인
    const exist = users.find(function (user) { //Array(users).find()는 배열 안의 요소를 하나씩 꺼내서 조건에 맞는 첫 번째 요소를 찾아주는 함수
    //여기서 핵심은 user는 우리가 직접 만든 게 아니라 find 함수가 자동으로 전달해주는 매개변수임. 즉 users 배열에 있는 요소들 하나씩 꺼내서 user에 담겠다는거임.
    //위 find 함수의 작동은 find()는 users 배열을 처음부터 끝까지 검사한 후, user에 차례대로 넣어줌. 그리고 user.id === id가 처음으로 true 되는 순간 > 멈추고 그 값을 반환
        return user.id === id;
    });
    // 이미 아이디 존재하면 에러 메시지 보내고 함수 종료
    if (exist) {
        res.json({ message: "이미 존재하는 아이디입니다."});
        return;
    }

    //새로운 사용자 추가
    users.push({ id: id, pw: pw});
    res.json({message: "회원가입이 완료되었습니다."});
});

app.post("/login", function (req, res) {
  const id = req.body.id;
  const pw = req.body.pw;

  const user = users.find(function (user) {
    return user.id === id && user.pw === pw;
  });

  if(!user) {
    res.json({message: "아이디 또는 비밀번호를 다시 입력해주세요."});
    return;
  }

  req.session.user = id;

  res.json({message: "로그인 성공"});
});

app.listen(3000, () => {
  console.log("✅ 서버 실행 중: http://localhost:3000");
});
