const grayMatter = require('gray-matter');

// a list of non-URL safe characterstaken from
// https://stackoverflow.com/a/695467
// the slash character (/) is excluded since it is used
// properly to specify the directory in the URL
const unsafeChars = ['&', '$', '+', ',', ':', ';', '=', '?', '@', '#', '<', '>', '[', ']', '{', '}', '|', '\\', '^', '%'];

module.exports = {
  // the home page (index.md) is a type 1 page
  // type 2 pages are those under a left_nav
  // type 3 pages are resource room pages
  // type 4 pages are those by themselves (e.g. privacy.md and includes misc/search.md)
  runTest(data, type, filePath, permalinks) {
    const returnObj = {
      permalinks: [],
      hasError: false,
      hasFatalError: false,
      errorMessage: '',
    };

    const errorHeader = `\n\`${filePath.substring(1)}\` `;

    // first we run this regex to split data line by line
    const lines = data.split(/(?:\r\n|\r|\n)/g);

    // make sure there are 2 sets of triple dashes before passing the file into gray-matter

    // make sure that there are 3 dashes at the start
    let hasStartDashes = true;
    if (lines[0].trimEnd() !== '---') {
      returnObj.errorMessage += `${errorHeader}needs to have exactly 3 dashes (\`---\`) at the start. Make sure this is there, and that the headers like layout and title are on a new line.`;
      returnObj.hasError = true;
      hasStartDashes = false;
    }

    let hasEndDashes = false;
    for (let lineNumber = 1; lineNumber < lines.length; lineNumber += 1) {
      if (lines[lineNumber].trimEnd() === '---') {
        hasEndDashes = true;
        break;
      }
    }

    if (hasStartDashes && hasEndDashes) {
      // if it has both sets of dashes we can now safely pump the data into gray-matter
      let frontMatter;
      try {
        frontMatter = grayMatter(data);
      } catch (e) {
        returnObj.errorMessage += errorHeader + e.message;
        returnObj.hasError = true;
        return returnObj;
      }

      // at this point:
      // 1) there are no duplicated fields
      // 2) the front matter has been loaded as an object under frontMatter.data

      // now we check for missing fields (and invalid data under these fields)

      // fields needed goes into this string to hint to the user
      let headerHint = '';
      if (type === 1) headerHint = ' This is a home page, which needs the layout, title, and permalink fields in the header to work properly.';
      if (type === 2) headerHint = ' This page needs the layout, title, permalink, breadcrumb, and collection_name fields in the header to work properly.';
      if (type === 3) headerHint = ' This page needs the layout, title, date, and permalink fields in the header to work properly.';
      if (type === 4) headerHint = ' This page needs the layout, title, permalink, and breadcrumb fields in the header to work properly.';

      // type 1, home page: needs layout, title, & permalink
      // type 2, left-nav page: needs layout, title, permalink, breadcrumb, and collection_name
      // type 3, resource room page: needs layout, title, date, and permalink
      // type 4, solo page: needs layout, title, permalink, and breadcrumb
      // however, we would not check breadcrumb for type 4 pages because they
      // could be a resource room page that hasn't been "detected" properly

      if (Object.prototype.hasOwnProperty.call(frontMatter.data, 'layout')) {
        if (frontMatter.data.layout == null || frontMatter.data.layout.length < 1) {
          // the field is empty
          returnObj.errorMessage += `${errorHeader}is missing the value for the \`layout: \` field in the header.`;
          returnObj.hasError = true;
        }
      } else {
        returnObj.errorMessage += `${errorHeader}is missing the \`layout: \` field in the header.${headerHint}`;
        returnObj.hasError = true;
      }

      if (Object.prototype.hasOwnProperty.call(frontMatter.data, 'title')) {
        if (frontMatter.data.title == null || frontMatter.data.title.length < 1) {
          // the field is empty
          returnObj.errorMessage += `${errorHeader}is missing the value for the \`title: \` field in the header.`;
          returnObj.hasError = true;
        }
      } else {
        returnObj.errorMessage += `${errorHeader}is missing the \`title: \` field in the header.${headerHint}`;
        returnObj.hasError = true;
      }

      if (Object.prototype.hasOwnProperty.call(frontMatter.data, 'permalink')) {
        if (frontMatter.data.permalink == null || frontMatter.data.permalink.length < 1) {
          // uh oh no permalink
          returnObj.errorMessage += `${errorHeader}has a \`permalink: \` field but has no permalink. Please enter one as a permalink is needed for the page to be properly accessed. An example permalink is \`/news/press-releases/test/\``;
          returnObj.hasError = true;
        } else {
          // make sure the permalink is valid, and not duplicated
          const permalink = frontMatter.data.permalink.replace(/"/g, '');
          for (let j = 0; j < permalinks.length; j += 1) {
            if (permalink === permalinks[j].link) {
              returnObj.errorMessage += `${errorHeader}has the same permalink as \`${permalinks[j].filePath}\`. Please change the permalink in either one of the files so that both pages can be properly accessed`;
              returnObj.hasError = true;
            }
          }

          for (let j = 0; j < unsafeChars.length; j += 1) {
            if (permalink.includes(unsafeChars[j])) {
              returnObj.errorMessage += `${errorHeader}has the \`${unsafeChars[j]}\` character in its \`permalink: \` field. This character is unsafe for use in URLs. Please remove this character, replace it with a dash (\`-\`), or replace it with english text (e.g. \`-and-\` instead of \`&\`)`;
              returnObj.hasError = true;
            }
          }

          returnObj.permalinks.push({
            link: permalink,
            filePath: filePath.substring(1),
          });
        }
      } else if (Object.prototype.hasOwnProperty.call(frontMatter.data, 'file_url')) {
        // it is okay if it does not have a permalink, but has file_url: see HLB's resource room
        if (frontMatter.data.file_url == null || frontMatter.data.file_url.length === 0) {
          // uh oh no file_url
          returnObj.errorMessage += `${errorHeader}has a \`file_url: \` field but it is empty. The URL of your file is required for your file to be properly accessed. An example file_url is \`/files/folder1/folder2/yourFile.pdf`;
          returnObj.hasError = true;
        }
        // Removes "https://", "http://", or "ftp://" at the front of file_url, if present
        const [, , fileUrl] = /^(https:\/\/|http:\/\/|ftp:\/\/|)(.*)/i.exec(frontMatter.data.file_url);
        for (let j = 0; j < unsafeChars.length; j += 1) {
          if (fileUrl.includes(unsafeChars[j])) {
            returnObj.errorMessage += `${errorHeader}has the \`${unsafeChars[j]}\` character in its \`file_url: \` field. This character is unsafe for use in URLs. Please remove this character, replace it with a dash (\`-\`), or replace it with english text (e.g. \`-and-\` instead of \`&\`)`;
            returnObj.hasError = true;
          }
        }
      } else {
        // no permalink
        returnObj.errorMessage += `${errorHeader}is missing the \`permalink: \` field in the header.${headerHint}`;
        returnObj.hasError = true;
      }

      // breadcrumbs are needed for left-nav and resource-room pages only
      // however, we would not presence of breadcrumb for type 4 pages because
      // it could be a resource room page that hasn't been "detected" properly
      if (Object.prototype.hasOwnProperty.call(frontMatter.data, 'breadcrumb') && (type === 2 || type === 4)) {
        if (frontMatter.data.breadcrumb == null || frontMatter.data.breadcrumb.length < 1) {
          // the field is empty
          returnObj.errorMessage += `${errorHeader}is missing the value for the \`breadcrumb: \` field in the header.`;
          returnObj.hasError = true;
        }
      } else if (type === 2) {
        returnObj.errorMessage += `${errorHeader}is missing the \`breadcrumb: \` field in the header.${headerHint}`;
        returnObj.hasError = true;
      }

      // collection_name is only needed for left-nav pages only
      if (Object.prototype.hasOwnProperty.call(frontMatter.data, 'collection_name') && type === 2) {
        if (
          frontMatter.data.collection_name == null
          || frontMatter.data.collection_name.length < 1
        ) {
          // the field is empty
          returnObj.errorMessage += `${errorHeader}is missing the value for the \`collection_name: \` field in the header.`;
          returnObj.hasError = true;
        }
      } else if (type === 2) {
        returnObj.errorMessage += `${errorHeader}is missing the \`collection_name: \` field in the header.${headerHint}`;
        returnObj.hasError = true;
      }

      // dates are needed for resource room pages only we
      // check this field a bit differently because it can
      // be done by having the date in the file name too
      if (type === 3) {
        // TODO: instead of frontMatter.data.date.length < 1, check for proper date formats
        if (!Object.prototype.hasOwnProperty.call(frontMatter.data, 'date') || frontMatter.data.date == null || frontMatter.data.date.length < 1) {
          // check whether the date is in the file name
          // if it isn't, then we spit the date not found error
          if (!/\/\d\d\d\d-\d\d-\d\d-.*\.md/.test(filePath)) {
            returnObj.errorMessage += `${errorHeader}is missing the \`date: \` field in the header.${headerHint}`;
            returnObj.hasError = true;
          }
        }
      }

      const headers = ['layout', 'title', 'permalink', 'breadcrumb', 'date', 'collection_name', 'tag', 'thumbnail_image', 'image', 'description', 'second_nav_title', 'last_updated', 'category', 'file_url', 'datagovsg-id', 'excerpt', 'recommender'];

      const fieldsPresent = Object.keys(frontMatter.data);
      for (let i = 0; i < fieldsPresent.length; i += 1) {
        if (headers.indexOf(fieldsPresent[i]) < 0) { // indexOf returns -1 when not found
          returnObj.errorMessage += `${errorHeader}has an unrecognised header \`${fieldsPresent[i]}\`. Check if it is a typo and whether you have left out other required headers. Remember that the text on your page can only start from the line after the second set of 3 dashes (\`---\`).`;
          returnObj.hasError = true;
        }
      }
    } else if (!hasEndDashes) {
      // if it does not have ending dashes we (angrily) complain to the user
      returnObj.errorMessage += `${errorHeader}needs to have exactly 3 dashes (\`---\`) after all the headers (e.g. layout and title), on a new line.`;
      returnObj.hasError = true;
    }

    return returnObj;
  },
};
