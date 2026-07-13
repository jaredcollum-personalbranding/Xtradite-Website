const locationHandler = require("./location");

const teamMarker = 'name="jam:team"';
const metadataMarker = 'src="/assets/js/jam-metadata.js"';
const jamHead = `<meta name="jam:team" content="e8e1b81a-519b-40e4-9720-4d2182dbc6da" />
<script type="module" src="https://js.jam.dev/recorder.js"></script>
<script type="module" src="https://js.jam.dev/capture.js"></script>
<script type="module" src="/assets/js/jam-metadata.js"></script>`;
const metadataScript = `<script type="module" src="/assets/js/jam-metadata.js"></script>`;

module.exports = async (req, res) => {
  const originalSend = res.send.bind(res);

  res.send = (body) => {
    const contentType = String(res.getHeader?.("Content-Type") || "");
    if (typeof body === "string" && /text\/html/i.test(contentType)) {
      if (!body.includes(teamMarker)) {
        body = body.replace(/<\/head>/i, `${jamHead}</head>`);
      } else if (!body.includes(metadataMarker)) {
        body = body.replace(/<\/head>/i, `${metadataScript}</head>`);
      }
    }
    return originalSend(body);
  };

  return locationHandler(req, res);
};
