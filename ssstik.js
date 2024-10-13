const Axios = require("axios");
const asyncRetry = require("async-retry");
const { load } = require("cheerio");

const _ssstikapi = "https://api.ssstik.io";
const _ssstikurl = "https://ssstik.io";
const TiktokURLregex = /https:\/\/(?:m|www|vm|vt|lite)?\.tiktok\.com\/(?:.*\b(?:(?:usr|v|embed|user|video|photo)\/|\?shareId=|\&item_id=)(\d+)|\w+)/;

const fetchTT = async () => {
  try {
    const { data } = await Axios.get(_ssstikurl);
    const regex = /s_tt\s*=\s*["']([^"']+)["']/;
    const match = data.match(regex);
    if (match) return match[1];
    return null;
  } catch (err) {
    return null;
  }
};

const SSSTik = async (url) => {
  if (!TiktokURLregex.test(url)) {
    return { status: "error", message: "Invalid TikTok URL!" };
  }

  const tt = await fetchTT();
  if (!tt) return { status: "error", message: "Failed to get TikTok token!" };

  try {
    const response = await asyncRetry(
      async () => {
        const res = await Axios.post(
          \`\${_ssstikapi}/download\`,
          new URLSearchParams({
            id: url,
            locale: "en",
            tt: tt
          })
        );
        return res.data;
      },
      { retries: 3 }
    );

    const $ = load(response);

    const video = $("a.without_watermark").attr("href");
    const music = $("a.music").attr("href");
    const images = [];

    $("ul.splide__list > li").each((i, el) => {
      images.push($(el).find("a").attr("href"));
    });

    if (video) {
      return {
        status: "success",
        result: { type: "video", video, music, author: { nickname: "Author" } }
      };
    } else if (images.length > 0) {
      return {
        status: "success",
        result: { type: "image", images, music, author: { nickname: "Author" } }
      };
    }

    return { status: "error", message: "No media found!" };
  } catch (error) {
    return { status: "error", message: "Failed to download content!" };
  }
};

module.exports = { SSSTik };
