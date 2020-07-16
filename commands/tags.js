const database = require("../utils/database.js");
const client = require("../utils/client.js");
const paginator = require("../utils/pagination/pagination.js");
const { random } = require("../utils/misc.js");

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to specify the name of the tag you want to view!`;
  const guildDB = await database.query("SELECT * FROM guilds WHERE guild_id = $1", [message.channel.guild.id]);
  const tags = guildDB.rows[0].tags;
  const blacklist = ["add", "edit", "remove", "delete", "list", "random"];
  switch (args[0].toLowerCase()) {
    case "create":
    case "add":
      if (args[1] === undefined) return `${message.author.mention}, you need to provide the name of the tag you want to add!`;
      if (blacklist.includes(args[1].toLowerCase())) return `${message.author.mention}, you can't make a tag with that name!`;
      if (tags[args[1].toLowerCase()]) return `${message.author.mention}, this tag already exists!`;
      var result = await setTag(args.slice(2).join(" "), args[1].toLowerCase(), message, guildDB);
      if (result) return result;
      return `${message.author.mention}, the tag \`${args[1].toLowerCase()}\` has been added!`;
    case "delete":
    case "remove":
      if (args[1] === undefined) return `${message.author.mention}, you need to provide the name of the tag you want to delete!`;
      if (!tags[args[1].toLowerCase()]) return `${message.author.mention}, this tag doesn't exist!`;
      if (tags[args[1].toLowerCase()].author !== message.author.id && !message.member.permission.has("administrator") && message.author.id !== process.env.OWNER) return `${message.author.mention}, you don't own this tag!`;
      delete tags[args[1].toLowerCase()];
      await database.query("UPDATE guilds SET tags = $1 WHERE guild_id = $2", [tags, message.channel.guild.id]);
      return `${message.author.mention}, the tag \`${args[1].toLowerCase()}\` has been deleted!`;
    case "edit":
      if (args[1] === undefined) return `${message.author.mention}, you need to provide the name of the tag you want to edit!`;
      if (!tags[args[1].toLowerCase()]) return `${message.author.mention}, this tag doesn't exist!`;
      if (tags[args[1].toLowerCase()].author !== message.author.id && tags[args[1].toLowerCase()].author !== process.env.OWNER) return `${message.author.mention}, you don't own this tag!`;
      await setTag(args.slice(2).join(" "), args[1].toLowerCase(), message, guildDB);
      return `${message.author.mention}, the tag \`${args[1].toLowerCase()}\` has been edited!`;
    case "own":
    case "owner":
      if (args[1] === undefined) return `${message.author.mention}, you need to provide the name of the tag you want to check the owner of!`;
      if (!tags[args[1].toLowerCase()]) return `${message.author.mention}, this tag doesn't exist!`;
      return `${message.author.mention}, this tag is owned by **${client.users.get(tags[args[1].toLowerCase()].author).username}#${client.users.get(tags[args[1].toLowerCase()].author).discriminator}** (\`${tags[args[1].toLowerCase()].author}\`).`;
    case "list":
      if (!message.channel.guild.members.get(client.user.id).permission.has("addReactions") && !message.channel.permissionsOf(client.user.id).has("addReactions")) return `${message.author.mention}, I don't have the \`Add Reactions\` permission!`;
      if (!message.channel.guild.members.get(client.user.id).permission.has("embedLinks") && !message.channel.permissionsOf(client.user.id).has("embedLinks")) return `${message.author.mention}, I don't have the \`Embed Links\` permission!`;
      var pageSize = 15;
      var embeds = [];
      var groups = Object.keys(tags).map((item, index) => {
        return index % pageSize === 0 ? Object.keys(tags).slice(index, index + pageSize) : null;
      }).filter((item) => {
        return item;
      });
      for (const [i, value] of groups.entries()) {
        embeds.push({
          "embed": {
            "title": "Tag List",
            "color": 16711680,
            "footer": {
              "text": `Page ${i + 1} of ${groups.length}`
            },
            "description": value.join("\n"),
            "fields": process.env.NODE_ENV === "development" ? [{"name": "Note", "value": "Tags created in this version of esmBot will not carry over to the final release."}] : null,
            "author": {
              "name": message.author.username,
              "icon_url": message.author.avatarURL
            }
          }
        });
      }
      if (embeds.length === 0) return `${message.author.mention}, I couldn't find any tags!`;
      return paginator(message, embeds);
    case "random":
      return random([...tags])[1].content;
    default:
      if (!tags[args[0].toLowerCase()]) return `${message.author.mention}, this tag doesn't exist!`;
      return tags[args[0].toLowerCase()].content;
  }
};

const setTag = async (content, name, message, guildDB) => {
  if ((!content || content.length === 0) && message.attachments.length === 0) return `${message.author.mention}, you need to provide the content of the tag!`;
  if (message.attachments.length !== 0 && content) {
    guildDB.rows[0].tags[name] = { content: `${content} ${message.attachments[0].url}`, author: message.author.id };
  } else if (message.attachments.length !== 0) {
    guildDB.rows[0].tags[name] = { content: message.attachments[0].url, author: message.author.id };
  } else {
    guildDB.rows[0].tags[name] = { content: content, author: message.author.id };
  }
  await database.query("UPDATE guilds SET tags = $1 WHERE guild_id = $2", [guildDB.rows[0].tags, message.channel.guild.id]);
  return;
};

exports.aliases = ["t", "tag", "ta"];
exports.category = 3;
exports.help = {
  default: "Gets a tag",
  add: "Adds a tag",
  delete: "Deletes a tag",
  edit: "Edits a tag",
  list: "Lists all tags in the server",
  random: "Gets a random tag"
};
exports.params = {
  default: "[name]",
  add: "[name] [content]",
  delete: "[name]",
  edit: "[name] [content]"
};