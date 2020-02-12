const markdownlint = require('markdownlint');

const defaultConfig = {
  default: false,
  MD004: true,
  MD005: true,
  MD007: true,
  MD011: true,
  MD028: true,
  MD029: true,
  MD034: true,
  MD037: true,
  MD039: true,
  MD042: true,
  MD045: true,
  MD033: true,
};

const userFriendlyErrorMessages = {
  MD001: ' should have its heading levels increase only by one level at a time, e.g. H1 (`#`) to H2 (`##`)',
  MD002: ' should have a level 1 heading (i.e. H1) as the first heading. We suggest you place the title of the page in a H1 heading using only 1 hash (`#`)',
  MD003: ' should have a consistent heading style. We suggest you place the hashes only at the front, separated by a space (e.g. `## This is an H2 heading`)',
  MD004: ' should use the same character for lists. We suggest you use only asterisks (`*`) and avoid other characters such as `+` and `-`',
  MD005: ' has inconsistent list indentation levels. We suggest you add 4 spaces before the asterisk (`*`) for each level of sublist',
  MD006: ' should start its list at the beginning of each line, without any spaces. If you were trying to create a sublist, we suggest you add 4 spaces before each asterisk (`*`) in the sublist',
  MD007: ' should have its nested list begin with 2 spaces before the asterisk (`*`)',
  MD009: ' has one or more unneeded space character. We suggest you delete these extra characters',
  MD010: ' has a \'tab\' character. We suggest you use 4 spaces instead of a tab',
  MD011: ' has the () and [] brackets for links reversed. The correct usage is `[Link Text Here](https://www.example.com)`',
  MD012: ' has multiple consecutive blank lines. We suggest you leave only 1 blank line between paragraphs and headers',
  MD013: ' has lines that are too long. This rule should not appear. If you are seeing this, you may ignore it if you wish',
  MD014: ' has terminal/cmd commands but does not have output. We suggest showing the output together with the command',
  MD018: ' does not have a space after the hash (`#`) in its heading. We suggest leaving a space, e.g. `### H3 Heading Here`',
  MD019: ' has multiple spaces after the hash (`#`) in its heading. We suggest leaving only one space, `e.g. ## H2 Heading Here`',
  MD020: ' does not have a space after the hash (`#`) in its heading. We suggest leaving a space, e.g. `### H3 Heading Here`',
  MD021: ' has multiple spaces after the hash (`#`) in its heading. We suggest leaving only one space, e.g. `## H2 Heading Here`',
  MD022: ' does not have blank lines surrounding its headings. We suggest leaving a blank line both before and after a heading',
  MD023: ' has spaces before its headings. We suggest removing these extra spaces',
  MD024: ' has multiple headings with the same title',
  MD025: ' has multiple H1 headings. Each file should only have one H1 heading located at the top, with subsequent headings at the H2, H3, H4, etc levels only',
  MD026: ' has a punctuation mark at the end of the heading. We advise against using punctuation marks at the end of headings, except for question marks',
  MD027: ' has multiple spaces after a blockquote symbol (`>`). We suggest leaving only 1 space between the blockquote symbol and the quote',
  MD028: ' has a blank line between 2 blockquotes. We suggest adding some text to transition between the 2 quotes, or if they are the same quote, adding a blockquote symbol (`>`) at the start of the blank line',
  MD029: ' has list prefixes that are not increasing in order (e.g. 1. 2. 3. 1. 2.) on the page. If you were trying to insert some text between 2 items, add 3 to 4 spaces to the front of that chunk of text so that it is in line with the preceding paragraph',
  MD030: ' has the wrong number of spaces after the list marker (e.g. `1.This is wrong`). We suggest leaving exactly 1 space between the list marker and your text (e.g. `1. This is correct`)',
  MD031: ' has a code block that are not surrounded by blank lines. We suggest leaving 1 blank line both before and after a code block',
  MD032: ' has a list that are not surrounded by blank lines. We suggest leaving 1 blank line both before and after a list',
  MD033: ' has a `<script>` tag. For security reasons, we do not allow custom JavaScript. *This is a fatal error! Merging to master will be blocked until this is rectified.*',
  MD034: ' has a \'bare\' URL in the text directly. URLs should be placed between 2 angled brackets, e.g. `<https://www.example.com/>` so that it will turn into a clickable link. We suggest placing URLs in a text link such as `[Link Text Here](https://www.example.com)` whenever possible',
  MD035: ' has multiple styles of horizontal rules used. We suggest sticking to 3 dashes (`---`), for all horizontal rules',
  MD036: ' seems to be using bolds or italics to separate sections. We suggest using headings (e.g. H2 headings by adding 2 hashes `##` at the front) as this will create a more consistent look on the resulting page',
  MD037: ' has spaces inside emphasis markers (e.g. `** bad bold text **`). We suggest removing these spaces (e.g. `**good bold text**`)',
  MD038: ' has spaces in code span elements. We suggest removing these spaces',
  MD039: ' has spaces inside link texts (e.g. `[ There is a space before and after me ](https://www.example.com)`) We suggest removing these spaces.',
  MD040: ' has a fenced code block without a language specified. We suggest specifying a language after the first set of 3 backticks (e.g. ```bash) so that the resulting code block will have the appropriate syntax highlighting',
  MD041: ' does not have a H1 heading in its first line. We suggest placing the title in an H1 header (`# Title Here`) on the first line after the second set of 3 dashes `---` used in the header',
  MD042: ' has an empty link (a link without an URL). A URL should be placed (e.g. `[Link Text Here](https://www.example.com)`), or the link should be removed altogether',
  MD043: ' does not seem to abide by the specified heading structure. This rule should not appear. You may ignore this message safely',
  MD044: ' does not seem to abide by required name capitalization rules. This rule should not appear. You may ignore this message safely',
  MD045: ' has an image without an \'alternate\' text, which is a brief description of the image that helps the visually impaired to know what the image is about. You can add it as follows: `![Alternate text](/link/to/your/image.jpg)`',
};


module.exports = {
  runTest: (data, filePath) => {
    const returnObj = {
      hasError: false,
      hasFatalError: false,
      errorMessage: '',
    };

    const config = defaultConfig;

    const options = {
      strings: {
        content: data,
      },
      config,
    };
    const results = markdownlint.sync(options);
    if (results.content.length > 0) {
      // meaning there are more than 0 errors
      // start processing it and present it in a more user friendly format

      for (let i = 0; i < results.content.length; i += 1) {
        const hasScriptTag = (results.content[i].ruleNames[0] === 'MD033' && results.content[i].errorDetail.toLowerCase() === 'element: script');

        if (results.content[i].ruleNames[0] !== 'MD033' || hasScriptTag) {
          returnObj.hasError = true;
          returnObj.errorMessage += `\n\`${filePath.substring(1)}\` (*Line ${results.content[i].lineNumber}*)${userFriendlyErrorMessages[results.content[i].ruleNames[0]]}`;
          if (hasScriptTag) returnObj.hasFatalError = true;
        }
      }
    }
    return returnObj;
  },
};
