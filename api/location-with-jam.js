const locationHandler = require("./location");

const marker = 'name="jam:team"';
const jamHead = `<meta name="jam:team" content="e8e1b81a-519b-40e4-9720-4d2182dbc6da" />
<script type="module" src="https://js.jam.dev/recorder.js"></script>
<script type="module" src="https://js.jam.dev/capture.js"></script>`;

module.exports = async (req, res) => {
  const originalSend = res.send.bind(res);

  res.send = (body) => {
    const contentType = String(res.getHeader?.("Content-Type") || "");
    if (
      typeof body === "string" &&
      /text\/html/i.test(contentType) &&
      !body.includes(marker)
    ) {
      body = body.replace(/<\/head>/i, `${jamHead}</head>`);
    }
    return originalSend(body);
  };

  return locationHandler(req, res);
};
