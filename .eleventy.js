const markdownIt = require("markdown-it");
const markdownItAttrs = require("markdown-it-attrs");
const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // Copiar ficheiros estáticos
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addPassthroughCopy({ "src/scripts": "scripts" });
  eleventyConfig.addPassthroughCopy({ "src/style.css": "style.css" });

module.exports = function(eleventyConfig) {
  // Copiar imagens e assets para o output
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/css");

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
};


  // Markdown personalizado
  const markdownLib = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  }).use(markdownItAttrs);

  eleventyConfig.setLibrary("md", markdownLib);

  // Filtro para datas (corrige o erro do base.njk)
  eleventyConfig.addFilter("date", (dateObj, format = "dd LLL yyyy") => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(format);
  });

eleventyConfig.addCollection("apostas", function (collectionApi) {
  return collectionApi.getFilteredByTag("apostas").sort((a, b) => {
    return b.date - a.date; // ordem decrescente (mais recente primeiro)
  });
});


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
