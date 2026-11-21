const YOUTUBE_LINK = "https://youtu.be/GhwyyDUiHHw";
const ZIP_LINK = "https://mr-juwel-fca.github.io/github-zip-up/";

// ইংরেজি লেখাকে 𝐀𝐁𝐂𝐃 ফন্টে রূপান্তর করে (বাংলা লেখা অপরিবর্তিত থাকে)
function bold(text) {
  return [...text].map(ch => {
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90) return String.fromCodePoint(0x1D400 + (c - 65));   // A-Z
    if (c >= 97 && c <= 122) return String.fromCodePoint(0x1D41A + (c - 97));  // a-z
    if (c >= 48 && c <= 57) return String.fromCodePoint(0x1D7CE + (c - 48));   // 0-9
    return ch;
  }).join("");
}

module.exports = {
  config: {
    name: "zip",
    aliases: ["জিপ"],
    version: "1.1",
    author: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Zip tutorial & link" },
    longDescription: { en: "Sends tutorial video first, then the zip link" },
    category: "utility",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ message }) {
    // মেসেজ ১: ইউটিউব টিউটোরিয়াল ভিডিও
    await message.reply(
      "🎬 " + bold("Tutorial Video") + ":\n" + YOUTUBE_LINK
    );

    // মেসেজ ২: শুধু zip লিংক (কোনো টেক্সট ছাড়া)
    await message.reply(ZIP_LINK);
  }
};
