const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const { DateTime } = require("luxon");
const jogosDoDia = require("./src/data/jogosDoDia.js");
require("dotenv").config();

module.exports = function (eleventyConfig) {
  // =========================
  // Copiar ficheiros estáticos
  // =========================
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addPassthroughCopy({ "src/scripts": "scripts" });
  eleventyConfig.addPassthroughCopy({ "src/style.css": "style.css" });

  // =========================
  // Markdown personalizado
  // =========================
  const markdownLib = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  }).use(markdownItAttrs);

  eleventyConfig.setLibrary("md", markdownLib);

  // =========================
  // Filtros
  // =========================
  eleventyConfig.addFilter("date", (dateObj, format = "dd LLL yyyy") => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(format);
  });

  // Filtro unique
  eleventyConfig.addFilter("unique", function(array, key) {
    if (!Array.isArray(array)) return array;
    const seen = new Set();
    return array.filter(item => {
      const val = key ? item[key] : item;
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  });

  // Filtro map
eleventyConfig.addFilter("map", function(array, key) {
  if (!Array.isArray(array)) return [];
  return array.map(item => item[key]);
});


  // =========================
  // Coleções
  // =========================
  eleventyConfig.addCollection("apostas", function (collectionApi) {
    return collectionApi.getFilteredByTag("apostas").sort((a, b) => b.date - a.date);
  });

  // =========================
  // Dados globais - Jogos do dia
  // =========================
  eleventyConfig.addGlobalData("jogosDoDia", async () => {
    try {
      const jogos = await jogosDoDia();
      return jogos.slice(0, 10); // limita a 10 jogos
    } catch (err) {
      console.error("❌ Erro ao carregar jogos do dia:", err);
      return [];
    }
  });

  // =========================
  // Configurações do Eleventy
  // =========================
  return {
    dir: {
      input: "src",
      includes: "includes",
      data: "data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "md", "njk"],
  };
};
