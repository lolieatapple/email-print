import { createRequire } from "module"; // Bring in the ability to create the 'require' method
import { printFile } from "./print.js";
import path from 'path';
const require = createRequire(import.meta.url); // construct the require method
require("dotenv").config();

var Imap = require("imap");
var MailParser = require("mailparser").MailParser;
var fs = require("fs");

var imap = new Imap({
  user: process.env.email, //你的邮箱账号
  password: process.env.password, //你的邮箱密码
  host: process.env.host, //邮箱服务器的主机地址
  port: 993, //邮箱服务器的端口地址
  tls: true, //使用安全传输协议
  tlsOptions: { rejectUnauthorized: false }, //禁用对证书有效性的检查
});

function openInbox(cb) {
  imap.openBox("INBOX", false, cb);
}

imap.once("ready", function () {
  imap.id({"name": "IMAPClient", "version": "0.8.19"}, (err, box)=>{
    if (err) {
      throw err;
    }
  });

  openInbox(function (err, box) {
    console.log("打开邮箱");

    if (err) throw err;

    imap.search(["UNSEEN", ["SINCE", "May 20, 2017"]], function (err, results) {
      //搜寻2017-05-20以后未读的邮件

      if (err) throw err;

      if (!results || results.length === 0) {
        console.log('no email', results);
        imap.end();
        return;
      }

      var f = imap.fetch(results, { bodies: "", markSeen: true }); //抓取邮件（默认情况下邮件服务器的邮件是未读状态）

      f.on("message", function (msg, seqno) {
        var mailparser = new MailParser();

        msg.on("body", function (stream, info) {
          stream.pipe(mailparser); //将为解析的数据流pipe到mailparser

          //邮件头内容
          mailparser.on("headers", function (headers) {
            console.log(
              "邮件头信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            );
            console.log("邮件主题: " + headers.get("subject"));
            console.log("发件人: " + headers.get("from").text);
            console.log("收件人: " + headers.get("to").text);
          });

          //邮件内容

          mailparser.on("data", function (data) {
            if (data.type === "text") {
              //邮件正文
              // console.log(
              //   "邮件内容信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
              // );
              // console.log("邮件内容: " + data.html);
            }
            if (data.type === "attachment") {
              //附件
              console.log(
                "邮件附件信息>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
              );
              console.log("附件名称:" + data.filename); //打印附件的名称
              let fileName = 'data/' + data.filename;
              data.content.pipe(fs.createWriteStream(fileName)); //保存附件到当前目录下
              data.release();
              console.log('dir', process.cwd());
              printFile(path.join(process.cwd(),fileName)).then(console.log);
            }
          });
        });
        msg.once("end", function () {
          console.log(seqno + "完成");
        });
      });
      f.once("error", function (err) {
        console.log("抓取出现错误: " + err);
      });
      f.once("end", function () {
        console.log("所有邮件抓取完成!");
        imap.end();
      });
    });
  });
});

imap.once("error", function (err) {
  console.log(err);
});

imap.once("end", function () {
  console.log("关闭邮箱");
});

console.log((new Date()).toISOString());
imap.connect();