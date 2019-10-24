// really don't like this file

const gm = require("gm").subClass({
  imageMagick: true
});
const tempy = require("tempy");
const fetch = require("node-fetch");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  message.channel.sendTyping();
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  const data = tempy.file({
    extension: image.type
  });
  const data2 = tempy.file({
    extension: image.type
  });
  gm(imageBuffer).gravity("East").crop("50%", 0).strip().write(data2, (error) => {
    if (error) console.error;
    gm(data2).flop().strip().write(data, async (error) => {
      if (error) console.error;
      gm(data).append(data2, true).toBuffer(image.type, (error, resultBuffer) => {
        if (error) console.error;
        return message.channel.createMessage("", {
          file: resultBuffer,
          name: `waaw.${image.type}`
        });
      });
    });
  });
};

exports.aliases = ["magik3", "mirror"];
