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
                  "postman-token": "ec771c9d-7c86-ac2f-9f9c-5e69eab18301",
                  "cache-control": "no-cache",
                  cookie:
                    "_ga=GA1.3.1538359677.1608260817; _fbp=fb.2.1608260816987.1325391626; ASP.NET_SessionId=zxdkeormojdqyr55unobet3n",
                  "content-type":
                    "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
                },
                formData: {
                  __EVENTTARGET: "ctl00$ContentPlaceHolder1$ctl00$ddlTuan",
                  __EVENTARGUMENT: "",
                  __LASTFOCUS: "",
                  __VIEWSTATE:
                    "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4bq/biAxMzoxNSkfAQUIVGnhur90IDcfAwKMgAQfCgoAHwsLKwQCZGQCCA9kFgICCA8PFgwfAgqkAR8HBSJUaeG6v3QgOCAodOG7qyAxMzoxNSDEkeG6v24gMTQ6MDApHwEFCFRp4bq/dCA4HwMCjIAEHwoKAB8LCysEAmRkAgkPZBYCAggPDxYMHwIKpAEfBwUiVGnhur90IDkgKHThu6sgMTQ6MDAgxJHhur9uIDE0OjQ1KR8BBQhUaeG6v3QgOR8DAoyABB8KCgAfCwsrBAJkZAIKD2QWAgIIDw8WDB8CCqQBHwcFI1Rp4bq/dCAxMCAodOG7qyAxNTowNSDEkeG6v24gMTU6NTApHwEFCVRp4bq/dCAxMB8DAoyABB8KCgAfCwsrBAJkZAILD2QWAgIIDw8WDB8CCqQBHwcFI1Rp4bq/dCAxMSAodOG7qyAxNTo1MCDEkeG6v24gMTY6MzUpHwEFCVRp4bq/dCAxMR8DAoyABB8KCgAfCwsrBAJkZAIMD2QWAgIIDw8WDB8CCqQBHwcFI1Rp4bq/dCAxMiAodOG7qyAxNjozNSDEkeG6v24gMTc6MjApHwEFCVRp4bq/dCAxMh8DAoyABB8KCgAfCwsrBAJkZAIND2QWAgIIDw8WDB8CCqQBHwcFI1Rp4bq/dCAxMyAodOG7qyAxODowMCDEkeG6v24gMTg6NDUpHwEFCVRp4bq/dCAxMx8DAoyABB8KCgAfCwsrBAJkZAIDDw8WAh8BBSlNw7RuIGjhu41jIGNo4buJIHRyw7luZyBt4buZdCB2w6BpIHRp4bq/dGRkAgUPDxYCHwEFDVR14bqnbiDEkOG6p3VkZAIHDw8WBB8BBQ9UdeG6p24gVHLGsOG7m2MeB0VuYWJsZWRoZGQCCQ8PFgIfAQULVHXhuqduIEvhur9kZAILDw8WAh8BBQ1UdeG6p24gQ3Xhu5FpZGQCDQ8PFgIfAQU2DQogICAgICBNw7RuIGjhu41jIHRyw7luZyB04bqldCBj4bqjIGPDoWMgdGnhur90DQogICAgZGQCCQ9kFggCAQ8PFgIfAQVOQ29weXJpZ2h0IMKpMjAwOSBUcsaw4budbmcgxJDhuqFpIEjhu41jIEPDtG5nIE5naOG7hyBUUC5IQ00uIFF14bqjbiBsw70gYuG7n2kgZGQCAw8PFgIfAQULVHJhbmcgQ2jhu6dkZAIFDw8WAh8BBS1UaGnhur90IGvhur8gYuG7n2kgY3R5IFBo4bqnbiBt4buBbSBBbmggUXXDom5kZAIHDw8WAh8BBQzEkOG6p3UgVHJhbmdkZBgBBR5fX0NvbnRyb2xzUmVxdWlyZVBvc3RCYWNrS2V5X18WAgU6Y3RsMDAkQ29udGVudFBsYWNlSG9sZGVyMSRjdGwwMCRNZXNzYWdlQm94MSRpbWdDbG9zZUJ1dHRvbgUxY3RsMDAkQ29udGVudFBsYWNlSG9sZGVyMSRjdGwwMCRNZXNzYWdlQm94MSRidG5Paw==",
                  ctl00$ContentPlaceHolder1$ctl00$ddlChonNHHK: "20201",
                  ctl00$ContentPlaceHolder1$ctl00$ddlLoai: "0",
                  ctl00$ContentPlaceHolder1$ctl00$ddlTuan:
                    "Tuần 14 [Từ 21/12/2020 -- Đến 27/12/2020]",
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
                    await delay(500);
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
server.listen(app.get("port"), function () {
  console.log("Chat bot server listening at port %d ", app.get("port"));
});
