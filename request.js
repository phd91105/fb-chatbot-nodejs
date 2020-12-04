/** @format */
var request = require("request");
// var today = new Date();
// // console.log(today.getDay())

// // var string = `17DTHD3, Khởi nghiệp, SKL101 nhóm 142 , Thứ Sáu, 3, E1-03.11, 2, 5, H.T.á.Nguyệt, 21/09/2020, 19/01/2021`;

// function regexDay(string) {
//   d = string.match(/Thứ[^,]+/i)[0];
//   if (d == "Thứ Hai") return 1;
//   else if (d == "Thứ Ba") return 2;
//   else if (d == "Thứ Tư") return 3;
//   else if (d == "Thứ Năm") return 4;
//   else if (d == "Thứ Sáu") return 5;
//   else if (d == "Thứ Bảy") return 6;
//   else if (d == "Chủ Nhật") return 0;
// }
// // a = regex(string);
// // console.log(a);
// request(
//   `http://daotao.hutech.edu.vn/default.aspx?page=thoikhoabieu&sta=0&id=2011740215`,
//   async function (err, response, body) {
//     function getname() {
//       return new Promise((resolve) => {
//         let name = body
//           .match(
//             /<span id="ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV".+">([\s\S]*?)<\/font>/
//           )[1]
//           .replace(/\s\-.+\s\s/g, "");
//         resolve(console.log(`Thời khoá biểu của *${name}*`));
//         //   resolve(
//         //     sendMessage(
//         //       senderId,
//         //       `Thời khoá biểu của *${name}* hôm nay`
//         //     )
//         //   );
//       });
//     }

//     async function getTKB() {
//       return new Promise((resolve) => {
//           var s =0;
//         for (i = 0; i < 7; i++) {
//           try {
//             let ob0 = body
//               .match(/<td\sonmouseover\=\"ddrivetip\(([\s\S]*?)<\/td>/g)
//               [i].match(/<td\sonmouseover="ddrivetip\(([\s\S]*?)\,'','420'/)[1]
//               .replace(/\'/g, "")
//               .replace(/\,/g, ", ");
//             if (today.getDay() == regexDay(ob0)) {
//               resolve(console.log(`${ob0}`));
//               s++;
//               // resolve(sendMessage(senderId, `${ob0}`));
//             }
//             // break;
//           } catch {}
//         }
//         if(s == 0) resolve(console.log(`Hom nay dc nghi`));
//       });
//     }
//     await getname();
//     await delay(1000);
//     await getTKB();
//   }
// );

function delay(delayInms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}
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
        resolve(console.log(`Thời khoá biểu của *${name}*`));
        // resolve(
        //   sendMessage(
        //     senderId,
        //     `Thời khoá biểu của *${name}* trong tuần`
        //   )
        // );
      });
    }

    async function getTKB() {
      return new Promise((resolve) => {
        for (i = 0; i < 7; i++) {
          try {
            let ob0 = body
              .match(/<td\sonmouseover\=\"ddrivetip\(([\s\S]*?)<\/td>/g)
              [i].match(/<td\sonmouseover="ddrivetip\(([\s\S]*?)\,'','420'/)[1]
              .replace(/\'/g, "")
              .replace(/\,/g, ", ");
            let tietbd = parseInt(ob0.match(/\s(\d)[,]/g)[1]);
            let dayy = ob0.match(/Thứ[^,]+/i)[0];
            let subj = ob0.match(/(?<=,)[^,]+(?=,)/)[0];
            let room = ob0.match(/[\w][\d]\-[\d]+\.[\d]+(?=,)/)[0];
            if (tietbd < 7)
              resolve(console.log(`*${dayy}* - Sáng:${subj}, Phòng: ${room}`));
            else
              resolve(console.log(`*${dayy}* - Chiều:${subj}, Phòng: ${room}`));
            // resolve(sendMessage(senderId, `${ob0}`));
          } catch {}
          await delay(500);
        }
      });
    }
    await getname();
    await delay(500);
    await getTKB();
  }
);
