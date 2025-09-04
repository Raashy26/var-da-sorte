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

  eleventyConfig.addFilter("map", function(array, key) {
    if (!Array.isArray(array)) return [];
    return array.map(item => item[key]);
  });

  // =========================
  // Coleções
  // =========================

  // Apostas diárias
  eleventyConfig.addCollection("apostas", function (collectionApi) {
    return collectionApi.getFilteredByTag("apostas").sort((a, b) => b.date - a.date);
  });

  // Desafios por tipo
  const desafioTipos = ["comeback", "draw", "over25"];
  desafioTipos.forEach(tipo => {
    eleventyConfig.addCollection(`desafios_${tipo}`, collection =>
      collection.getFilteredByGlob(`src/desafios/${tipo}/*.md`).sort((a, b) => b.date - a.date)
    );
  });

  // Todos os desafios juntos
  eleventyConfig.addCollection("desafios", collection =>
    collection.getFilteredByGlob("src/desafios/*/*.md").sort((a, b) => b.date - a.date)
  );

  // =========================
  // Dados globais - Jogos do dia
  // =========================
  eleventyConfig.addGlobalData("jogosDoDia", async () => {
    try {
      const jogos = await jogosDoDia();
      const jogosComData = jogos.map(jogo => ({
        ...jogo,
        date: new Date(jogo.utcDate)
      }));
      return jogosComData.slice(0, 10);
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
