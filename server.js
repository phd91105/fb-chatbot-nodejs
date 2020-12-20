var logger = require("morgan");
var http = require("http");
var bodyParser = require("body-parser");
var express = require("express");
var request = require("request");

var app = express();
const periodBoard = require("./modules/periodBoard");

var today = new Date();
var offset = 14;
today.setHours(today.getHours() + offset);

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
var server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Server chạy ngon lành");
});

app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === "phamhuuduy051199") {
    res.send(req.query["hub.challenge"]);
  }
  res.send("Error, wrong validation token");
});

function regExString(ob0) {
  return (
    (tietbd = parseInt(ob0.match(/\s(\d)+[,]/g)[1])),
    (tietkt = parseInt(ob0.match(/\s(\d)+[,]/g)[2])),
    (day = ob0.match(/((Thứ|Chủ)[^,]+)/gi)[0]),
    (subj = ob0.match(/(?<=,)[^,]+(?=,)/)[0]),
    (room = ob0.match(/[\w]+\-[\d]+\.[\d]+(?=,)/)[0]),
    settime(tietbd, tietkt)
  );
}

function settime(tbd, tkt) {
  return (
    (timestart = `${periodBoard[tbd].start.hour}h${periodBoard[tbd].start.minute}`),
    (timeend = `${periodBoard[tbd + tkt - 1].end.hour}h${
      periodBoard[tbd + tkt - 1].end.minute
    }`)
  );
}

app.post("/webhook", function (req, res) {
  var entries = req.body.entry;
  for (var entry of entries) {
    var messaging = entry.messaging;
    for (var message of messaging) {
      var senderId = message.sender.id;
      if (message.message)
        try {
          if (message.message.text.match(/(ncov|covid)/gi)) {
            var options = {
              method: "GET",
              url: `https://coronavirus-19-api.herokuapp.com/countries/vietnam`,
            };
            request(options, function (error, response) {
              var stringbody = JSON.parse(response.body);
              sendMessage(
                senderId,
                `Quốc gia: ${stringbody.country}\nTổng: ${stringbody.cases}\nHôm nay: ${stringbody.todayCases}\nHồi phục: ${stringbody.recovered}\nĐang điều trị: ${stringbody.active}\nTử vong: ${stringbody.deaths}`
              );
            });
          } else if (message.message.text.match(/tkb\s\d{1,}/gi)) {
            var mssv = message.message.text.match(/[0-9]*$/);
            function bypassCaptcha() {
              var options = {
                method: "POST",
                url:
                  "http://daotao.hutech.edu.vn/Default.aspx?page=xacthuctrangchu",
                headers: {
                  Cookie: "ASP.NET_SessionId=hen5hx45sdymbxzufifr5f45",
                },
                formData: {
                  __VIEWSTATE:
                    "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",
                  ctl00$ContentPlaceHolder1$ctl00$txtCaptcha: "P6ICX",
                  ctl00$ContentPlaceHolder1$ctl00$btnXacNhan: "Vào website",
                },
              };
              return new Promise((resolve) => {
                resolve(request(options));
              });
            }
            function postReq() {
              var options = {
                method: "POST",
                url: "http://daotao.hutech.edu.vn/default.aspx",
                qs: { page: "thoikhoabieu", sta: "0", id: "1711061035" },
                headers: {
                  "postman-token": "e039bf8e-9417-fff6-4987-4d8ed143ae31",
                  "cache-control": "no-cache",
                  cookie: "ASP.NET_SessionId=hen5hx45sdymbxzufifr5f45",
                  "content-type":
                    "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
                },
                formData: {
                  __EVENTTARGET: "ctl00$ContentPlaceHolder1$ctl00$ddlChonNHHK",
                  __EVENTARGUMENT: "",
                  __LASTFOCUS: "",
                  __VIEWSTATE:
                    "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",
                  ctl00$ContentPlaceHolder1$ctl00$ddlChonNHHK: "20202",
                  ctl00$ContentPlaceHolder1$ctl00$ddlLoai: "0",
                  ctl00$ContentPlaceHolder1$ctl00$ddlTuan:
                    "Tuần 24 [Từ 01/03/2021 -- Đến 07/03/2021]",
                },
              };
              return new Promise((resolve) => {
                resolve(request(options));
              });
            }
            function mainTask() {
              var val = true;
              var options = {
                method: "GET",
                url: `http://daotao.hutech.edu.vn/default.aspx?page=thoikhoabieu&sta=0&id=${mssv}`,
                headers: {
                  Cookie: "ASP.NET_SessionId=hen5hx45sdymbxzufifr5f45",
                },
              };
              return new Promise((resolve) => {
                resolve(
                  request(options, async function (err, response, body) {
                    function getname() {
                      return new Promise((resolve) => {
                        try {
                          var name = body
                            .match(
                              /<span\sid\=\"ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV\".+\">([\s\S]*?)<\/font>/
                            )[1]
                            .replace(/\s\-.+\s\s/g, "");
                          resolve(
                            sendMessage(
                              senderId,
                              `Thời khoá biểu của ${name} trong tuần`
                            )
                          );
                        } catch {
                          resolve(
                            sendMessage(
                              senderId,
                              `Không tìm thấy thông tin sinh viên !`
                            )
                          );
                          val = false;
                        }
                      });
                    }

                    function getTKB() {
                      return new Promise((resolve) => {
                        var arr = [];
                        if (val == true) {
                          for (i = 0; i < 7; i++) {
                            try {
                              let ob0 = body
                                .match(
                                  /<td\sonmouseover\=\"ddrivetip\(([\s\S]*?)<\/td>/g
                                )
                                [i].match(
                                  /<td\sonmouseover\=\"ddrivetip\(([\s\S]*?)\,'','420'/
                                )[1]
                                .replace(/\'/g, "")
                                .replace(/\,/g, ", ");
                              regExString(ob0);
                              let msg = `\n\n${day} (${timestart}-${timeend}):${subj}, Phòng: ${room}`;
                              arr.push(msg);
                            } catch {}
                          }
                        }
                        resolve(
                          sendMessage(
                            senderId,
                            arr.toString().replace(/\,\n/g, "\n")
                          )
                        );
                      });
                    }
                    await getname();
                    await delay(200);
                    await getTKB();
                  })
                );
              });
            }
            async function run() {
              await bypassCaptcha();
              await delay(500);
              await postReq();
              await delay(500);
              await mainTask();
            }
            run();
          } else if (message.message.text == `?`)
            sendMessage(
              senderId,
              `Covid-19: ncov\nThời khoá biểu: tkb MA_SO_SV\n\thoặc tkb all MA_SO_SV`
            );
          else {
            let text = message.message.text;
            let enc = encodeURI(text);
            request(
              `https://secureapp.simsimi.com/v1/simsimi/talkset?ak=no_auth&av=7.4.7.2&cc=VN&isFilter=1&lc=vn&message_sentence=${enc}&normalProb=2&os=i&reqFilter=0&session=N7DNJixfNV9HhF1rzqhyPbpPiTtCFAy6CTHNLj2hKBX7xvUC6neGmc6NkHCJZdVjksZZbAkSr9dDtNPUMDWvKsS3&talkCnt=4&talkCntTotal=4&traceSentenceLinkId=91303111&tz=Asia/Ho_Chi_Minh&uid=297041663`,
              function (error, response, body) {
                let trl = JSON.parse(response.body).simsimi_talk_set.answers[0]
                  .sentence;
                sendMessage(senderId, `${trl}`);
              }
            );
          }
        } catch {}
    }
  }
  res.status(200).send("OK");
});

function delay(delayInms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}

function sendMessage(senderId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {
      access_token:
        "EAACs9fWEf0YBAPyFMVo8SHegijWZAKTziy9P6zOhNr78stVDrlPxP8ZCrdrpLCFc399Y4urrZBXEsZAPgWLfnuFqBnZCQ9KsC22DmPbm1XQQGZBnfXDVdWXRNWcofqyoyW3GZAE7c36x7mTN66dlHZCCFrs5w2uvUSlEftMx30ZC1ZC63fOLk8o7oK",
    },
    method: "POST",
    json: {
      recipient: {
        id: senderId,
      },
      message: {
        text: message,
      },
    },
  });
}

app.set("port", process.env.PORT);
app.set("ip", process.env.IP);
server.listen(app.get("port"), app.get("ip"), function () {
  console.log(
    "Chat bot server listening at %s:%d ",
    app.get("ip"),
    app.get("port")
  );
});
