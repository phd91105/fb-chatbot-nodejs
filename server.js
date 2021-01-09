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
            function mainTask() {
              var val = true;
              var options = {
                url: "http://daotao.hutech.edu.vn/default.aspx",
                qs: { page: "thoikhoabieu", sta: "0", id: `${mssv}` },
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
                    await delay(300);
                    await getTKB();
                  })
                );
              });
            }
            mainTask();
            run();
          } else if (message.message.text == `?`)
            sendMessage(
              senderId,
              `Covid-19: ncov\nThời khoá biểu: tkb <mã sinh viên>`
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
server.listen(app.get("port"), function () {
  console.log("Chat bot server listening at port %d ", app.get("port"));
});
