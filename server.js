var logger = require("morgan");
var http = require("http");
var bodyParser = require("body-parser");
var express = require("express");
var request = require("request");
// const request = require("request");
const uniqid = require("uniqid");
const axios = require("axios");
const path = require("path");
const os = require("os");
const fs = require("fs");
// var router = express();
var app = express();
const periodBoard = require("./modules/periodBoard");
const dayNum = require("./modules/dayNum");

const API_SIG =
  "b92dd121d84c5597d770896c7a93e60f03247b50828bdf1012b5da052951c74c22f9db6072ec5b942546114dbd3a773d79d675f9e668cf1e9a31af37c9aa2efa";
const API_KEY = "38e8643fb0dc04e8d65b99994d3dafff";

const {
  parseValue, parseArg, deleteFile, getFileSize 
} = require("./utils/COMMON");

const {
  getDownloadUrl,
  addMusicInfo,
  getMusicInfo,
} = require("./utils/zingmp3");

const musicPath = path.join("./musics");

const store = [];

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

function regexDay(string) {
  d = string.match(/((Thứ|Chủ)[^,]+)/i)[0];
  return dayNum[d];
}

function regExString(ob0) {
  return (
    (tietbd = parseInt(ob0.match(/\s(\d)+[,]/g)[1])),
    (tietkt = parseInt(ob0.match(/\s(\d)+[,]/g)[2])),
    (dayy = ob0.match(/((Thứ|Chủ)[^,]+)/gi)[0]),
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
          } else if (message.message.text.match(/tkb\sall\s\d{1,}/gi)) {
            var val = true;
            var mssv = message.message.text.match(/[0-9]*$/);
            request(
              `http://daotao.hutech.edu.vn/default.aspx?page=thoikhoabieu&sta=0&id=${mssv}`,
              async function (err, response, body) {
                function getname() {
                  return new Promise((resolve) => {
                    try {
                      let name = body
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
                    var i = 0;
                    if (val == true) {
                      function myLoop() {
                        setTimeout(function () {
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
                            resolve(
                              sendMessage(
                                senderId,
                                `${dayy} ${timestart}-${timeend}:${subj}, Phòng: ${room}`
                              )
                            );
                          } catch {}
                          i++;
                          if (i < 7) {
                            myLoop();
                          }
                        }, 1000);
                      }
                      myLoop();
                    }
                  });
                }
                await getname();
                await delay(500);
                await getTKB();
              }
            );
          } else if (message.message.text == 'zz') {
            // async (message) => {
            // const args = parseArg(message.body, "א");
            // const play = parseValue(args, ["play", "p"]);
            // if (play) {
            async function start() {
              const start = Date.now();
              const id = "ZOI6BFA9";
              sendMessage(
                senderId,
                `Đang thu thập dữ liệu, vui lòng đợi . . . (${id})`
                // message.threadID
              );
              try {
                const url = await getDownloadUrl(id);
                const filename = `${uniqid()}.mp3`;
                request(url)
                  .pipe(fs.createWriteStream(path.join(musicPath, filename)))
                  .on("finish", () => {
                    let fileSize = getFileSize(path.join(musicPath, filename));
                    if (fileSize > 50) {
                      const replyMsg = `Không thể gửi: dung lượng file id(${id}) quá lớn (${fileSize}MB>25MB)`;
                      sendMessage(senderId, replyMsg);
                    } else {
                      let replyMsg = "";
                      const songInfo = getMusicInfo(id, store);
                      const timeGet = (Date.now() - start) / 1000;

                      if (!songInfo) replyMsg = `${id} (${timeGet}s)`;
                      else
                        replyMsg = `Bài hát: ${songInfo.title}${os.EOL}Tác giả: ${songInfo.artists_names}${os.EOL}Get nhạc trong ${timeGet}s`;

                      sendMessage(
                        senderId,
                        {
                          body: replyMsg,
                          attachment: fs.createReadStream(
                            path.join(musicPath, filename)
                          ),
                        }
                        // message.threadID,
                        // () => {
                        //   deleteFile(path.join(musicPath, filename));
                        // }
                      );
                    }
                  });
              } catch (e) {
                setTimeout(() => {
                  const replyMsg = `Đã gặp lỗi: Không tìm thấy id bài hát! (${id})${os.EOL}`;
                  sendMessage(senderId, replyMsg);
                }, 100);
              }
              // }
            }
            start();
          } else if (message.message.text.match(/tkb\s\d{1,}/gi)) {
            var mssv = message.message.text.match(/[0-9]*$/);
            request(
              `http://daotao.hutech.edu.vn/default.aspx?page=thoikhoabieu&sta=0&id=${mssv}`,
              async function (err, response, body) {
                var val = true;

                function getname() {
                  return new Promise((resolve) => {
                    try {
                      let name = body
                        .match(
                          /<span\sid\=\"ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV\".+\">([\s\S]*?)<\/font>/
                        )[1]
                        .replace(/\s\-.+\s\s/g, "");
                      resolve(
                        sendMessage(
                          senderId,
                          `Thời khoá biểu của ${name} hôm nay`
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
                    var s = 0;
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
                          if (today.getDay() == regexDay(ob0)) {
                            resolve(
                              sendMessage(
                                senderId,
                                `${dayy} ${timestart}-${timeend}:${subj}, Phòng: ${room}`
                              )
                            );
                            s++;
                          }
                        } catch {}
                      }
                      if (s == 0)
                        resolve(sendMessage(senderId, `Hôm nay được nghỉ !`));
                    }
                  });
                }
                await getname();
                await delay(500);
                await getTKB();
              }
            );
          } else if (
            message.message.text.match(/tkb\sall$/i) &&
            senderId == 3601822406563650
          ) {
            request(
              `http://daotao.hutech.edu.vn/default.aspx?page=thoikhoabieu&sta=0&id=1711061035`,
              async function (err, response, body) {
                function getTKB() {
                  return new Promise((resolve) => {
                    var i = 0;

                    function myLoop() {
                      setTimeout(function () {
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
                          resolve(
                            sendMessage(
                              senderId,
                              `${dayy} ${timestart}-${timeend}:${subj}, Phòng: ${room}`
                            )
                          );
                        } catch {}
                        i++;
                        if (i < 7) {
                          myLoop();
                        }
                      }, 1000);
                    }
                    myLoop();
                  });
                }
                await getTKB();
              }
            );
          } else if (
            message.message.text.match(/tkb$/i) &&
            senderId == 3601822406563650
          ) {
            request(
              `http://daotao.hutech.edu.vn/default.aspx?page=thoikhoabieu&sta=0&id=1711061035`,
              async function (err, response, body) {
                function getTKB() {
                  return new Promise((resolve) => {
                    var s = 0;
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
                        if (today.getDay() == regexDay(ob0)) {
                          resolve(
                            sendMessage(
                              senderId,
                              `${dayy} ${timestart}-${timeend}:${subj}, Phòng: ${room}`
                            )
                          );
                          s++;
                        }
                      } catch {}
                    }
                    if (s == 0)
                      resolve(sendMessage(senderId, `Hôm nay được nghỉ !`));
                  });
                }
                await getTKB();
              }
            );
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
