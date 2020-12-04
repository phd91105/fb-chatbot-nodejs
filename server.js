/** @format */

var logger = require("morgan");
var http = require("http");
var bodyParser = require("body-parser");
var express = require("express");
var request = require("request");
var router = express();

var app = express();
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

var today = new Date();

function regexDay(string) {
  d = string.match(/((Thứ|Chủ)[^,]+)/i)[0];
  if (d == "Thứ Hai") return 1;
  else if (d == "Thứ Ba") return 2;
  else if (d == "Thứ Tư") return 3;
  else if (d == "Thứ Năm") return 4;
  else if (d == "Thứ Sáu") return 5;
  else if (d == "Thứ Bảy") return 6;
  else if (d == "Chủ Nhật") return 0;
}
function setCa(tdb) {
  if (tdb <= 3) return `Ca 1 tiết ${tdb}`;
  else if (tdb > 3 && tdb <= 6) return `Ca 2 tiết ${tdb}`;
  else if (tdb > 6 && tdb <= 9) return `Ca 3 tiết ${tdb}`;
  else if (tdb > 9 && tdb <= 12) return `Ca 4 tiết ${tdb}`;
  else if (tdb > 12 && tdb <= 15) return `Ca 5 tiết ${tdb}`;
}
// Xử lý khi có người nhắn tin cho bot
app.post("/webhook", function (req, res) {
  var entries = req.body.entry;
  for (var entry of entries) {
    var messaging = entry.messaging;
    for (var message of messaging) {
      var senderId = message.sender.id;
      if (message.message)
        try {
          // If user send text
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
          } else if (
            message.message.text.match(/tkb\sall\s\d{0,9}$/gi) ||
            message.message.text.match(/tkb\s\d{0,9}$/gi)
          )
            sendMessage(senderId, `Mã số sinh viên không hợp lệ !`);
          else if (message.message.text.match(/tkb\sall\s\d{10,}/gi)) {
            var mssv = message.message.text.match(/[0-9]*$/);
            request(
              `http://daotao.hutech.edu.vn/default.aspx?page=thoikhoabieu&sta=0&id=${mssv}`,
              async function (err, response, body) {
                function getname() {
                  return new Promise((resolve) => {
                    let name = body
                      .match(
                        /<span id="ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV".+">([\s\S]*?)<\/font>/
                      )[1]
                      .replace(/\s\-.+\s\s/g, "");
                    // resolve(console.log(`Thời khoá biểu của ${name}`));
                    resolve(
                      sendMessage(
                        senderId,
                        `Thời khoá biểu của ${name} trong tuần`
                      )
                    );
                  });
                }

                async function getTKB() {
                  return new Promise((resolve) => {
                    for (i = 0; i < 7; i++) {
                      try {
                        let ob0 = body
                          .match(
                            /<td\sonmouseover\=\"ddrivetip\(([\s\S]*?)<\/td>/g
                          )
                          [i].match(
                            /<td\sonmouseover="ddrivetip\(([\s\S]*?)\,'','420'/
                          )[1]
                          .replace(/\'/g, "");
                        let tietbd = parseInt(ob0.match(/(\d)+[,]/g)[1]);
                        let dayy = ob0.match(/((Thứ|Chủ)[^,]+)/gi)[0];
                        let subj = ob0.match(/(?<=,)[^,]+(?=,)/)[0];
                        let room = ob0.match(/[\w]+\-[\d]+\.[\d]+(?=,)/)[0];
                        let ca = setCa(tietbd);
                        if (tietbd < 7)
                          resolve(
                            sendMessage(
                              senderId,
                              `${dayy} (sáng) ${ca}: ${subj}, Phòng: ${room}`
                            )
                          );
                        else if (tietbd >= 7 && tietbd < 13)
                          resolve(
                            sendMessage(
                              senderId,
                              `${dayy} (chiều) ${ca}: ${subj}, Phòng: ${room}`
                            )
                          );
                        else
                          resolve(
                            sendMessage(
                              senderId,
                              `${dayy} (tối) ${ca}: ${subj}, Phòng: ${room}`
                            )
                          );
                      } catch {}
                    }
                  });
                }
                await getname();
                await delay(500);
                await getTKB();
              }
            );
          } else if (message.message.text.match(/tkb\s\d{10,}/gi)) {
            var mssv = message.message.text.match(/[0-9]*$/);
            request(
              `http://daotao.hutech.edu.vn/default.aspx?page=thoikhoabieu&sta=0&id=${mssv}`,
              async function (err, response, body) {
                function getname() {
                  return new Promise((resolve) => {
                    let name = body
                      .match(
                        /<span id="ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV".+">([\s\S]*?)<\/font>/
                      )[1]
                      .replace(/\s\-.+\s\s/g, "");
                    // resolve(console.log(`Thời khoá biểu của ${name}`));
                    resolve(
                      sendMessage(
                        senderId,
                        `Thời khoá biểu của ${name} hôm nay`
                      )
                    );
                  });
                }

                async function getTKB() {
                  return new Promise((resolve) => {
                    var s = 0;
                    for (i = 0; i < 7; i++) {
                      try {
                        let ob0 = body
                          .match(
                            /<td\sonmouseover\=\"ddrivetip\(([\s\S]*?)<\/td>/g
                          )
                          [i].match(
                            /<td\sonmouseover="ddrivetip\(([\s\S]*?)\,'','420'/
                          )[1]
                          .replace(/\'/g, "");
                        let tietbd = parseInt(ob0.match(/(\d)+[,]/g)[1]);
                        let dayy = ob0.match(/((Thứ|Chủ)[^,]+)/gi)[0];
                        let subj = ob0.match(/(?<=,)[^,]+(?=,)/)[0];
                        let room = ob0.match(/[\w]+\-[\d]+\.[\d]+(?=,)/)[0];
                        let ca = setCa(tietbd);
                        if (today.getDay() == regexDay(ob0)) {
                          if (tietbd < 7)
                            resolve(
                              sendMessage(
                                senderId,
                                `${dayy} (sáng) ${ca}: ${subj}, Phòng: ${room}`
                              )
                            );
                          else if (tietbd >= 7 && tietbd < 13)
                            resolve(
                              sendMessage(
                                senderId,
                                `${dayy} (chiều) ${ca}: ${subj}, Phòng: ${room}`
                              )
                            );
                          else
                            resolve(
                              sendMessage(
                                senderId,
                                `${dayy} (tối) ${ca}: ${subj}, Phòng: ${room}`
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
                await getname();
                await delay(500);
                await getTKB();
              }
            );
          } else if (
            message.message.text.match(/tkb\sall$/i) &&
            senderId == 3601822406563650
          ) {
            // var mssv = message.message.text.match(/[0-9]*$/);
            request(
              `http://daotao.hutech.edu.vn/default.aspx?page=thoikhoabieu&sta=0&id=1711061035`,
              async function (err, response, body) {
                function getname() {
                  return new Promise((resolve) => {
                    let name = body
                      .match(
                        /<span id="ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV".+">([\s\S]*?)<\/font>/
                      )[1]
                      .replace(/\s\-.+\s\s/g, "");
                    // resolve(console.log(`Thời khoá biểu của ${name}`));
                    resolve(
                      sendMessage(
                        senderId,
                        `Thời khoá biểu của ${name} trong tuần`
                      )
                    );
                  });
                }

                async function getTKB() {
                  return new Promise((resolve) => {
                    for (i = 0; i < 7; i++) {
                      try {
                        let ob0 = body
                          .match(
                            /<td\sonmouseover\=\"ddrivetip\(([\s\S]*?)<\/td>/g
                          )
                          [i].match(
                            /<td\sonmouseover="ddrivetip\(([\s\S]*?)\,'','420'/
                          )[1]
                          .replace(/\'/g, "");
                        let tietbd = parseInt(ob0.match(/(\d)+[,]/g)[1]);
                        let dayy = ob0.match(/((Thứ|Chủ)[^,]+)/gi)[0];
                        let subj = ob0.match(/(?<=,)[^,]+(?=,)/)[0];
                        let room = ob0.match(/[\w]+\-[\d]+\.[\d]+(?=,)/)[0];
                        let ca = setCa(tietbd);
                        if (tietbd < 7)
                          resolve(
                            sendMessage(
                              senderId,
                              `${dayy} (sáng) ${ca}: ${subj}, Phòng: ${room}`
                            )
                          );
                        else if (tietbd >= 7 && tietbd < 13)
                          resolve(
                            sendMessage(
                              senderId,
                              `${dayy} (chiều) ${ca}: ${subj}, Phòng: ${room}`
                            )
                          );
                        else
                          resolve(
                            sendMessage(
                              senderId,
                              `${dayy} (tối) ${ca}: ${subj}, Phòng: ${room}`
                            )
                          );
                      } catch {}
                    }
                  });
                }
                await getname();
                await delay(500);
                await getTKB();
              }
            );
          } else if (
            message.message.text.match(/tkb$/i) &&
            senderId == 3601822406563650
          ) {
            // var mssv = message.message.text.match(/[0-9]*$/);
            request(
              `http://daotao.hutech.edu.vn/default.aspx?page=thoikhoabieu&sta=0&id=1711061035`,
              async function (err, response, body) {
                function getname() {
                  return new Promise((resolve) => {
                    let name = body
                      .match(
                        /<span id="ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV".+">([\s\S]*?)<\/font>/
                      )[1]
                      .replace(/\s\-.+\s\s/g, "");
                    // resolve(console.log(`Thời khoá biểu của ${name}`));
                    resolve(
                      sendMessage(
                        senderId,
                        `Thời khoá biểu của ${name} hôm nay`
                      )
                    );
                  });
                }

                async function getTKB() {
                  return new Promise((resolve) => {
                    var s = 0;
                    for (i = 0; i < 7; i++) {
                      try {
                        let ob0 = body
                          .match(
                            /<td\sonmouseover\=\"ddrivetip\(([\s\S]*?)<\/td>/g
                          )
                          [i].match(
                            /<td\sonmouseover="ddrivetip\(([\s\S]*?)\,'','420'/
                          )[1]
                          .replace(/\'/g, "");
                        let tietbd = parseInt(ob0.match(/(\d)+[,]/g)[1]);
                        let dayy = ob0.match(/((Thứ|Chủ)[^,]+)/gi)[0];
                        let subj = ob0.match(/(?<=,)[^,]+(?=,)/)[0];
                        let room = ob0.match(/[\w]+\-[\d]+\.[\d]+(?=,)/)[0];
                        let ca = setCa(tietbd);
                        if (today.getDay() == regexDay(ob0)) {
                          if (tietbd < 7)
                            resolve(
                              sendMessage(
                                senderId,
                                `${dayy} (sáng) ${ca}: ${subj}, Phòng: ${room}`
                              )
                            );
                          else if (tietbd >= 7 && tietbd < 13)
                            resolve(
                              sendMessage(
                                senderId,
                                `${dayy} (chiều) ${ca}: ${subj}, Phòng: ${room}`
                              )
                            );
                          else
                            resolve(
                              sendMessage(
                                senderId,
                                `${dayy} (tối) ${ca}: ${subj}, Phòng: ${room}`
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
                await getname();
                await delay(500);
                await getTKB();
              }
            );
          } else
            sendMessage(
              senderId,
              `Covid-19: ncov\nThời khoá biểu: tkb MA_SO_SV hoặc tkb all MA_SO_SV`
            );
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

// Gửi thông tin tới REST API để trả lời
function sendMessage(senderId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {
      access_token:
        "EAANejKi1a1wBAMBf2ju8bSFV2pobMfz8gAjsAqWXoJoB0NzAIwmPqoti6JdkTD6p9cj4aL5QdpBP5Kvwo0Rh2wzYMHZC5FFw3hZCf8WlPN6KFlEu5wxTisS1ZA48mJb2UWtxQfRcd9fYPtFi098rrDwFkTvxSbZA8zEJRLw2ZATRZANc7ZB8x23",
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
