module.exports = async (req, res) => {
  const key = process.env.INDEXNOW_KEY;
  if (!key || !/^[A-Za-z0-9-]{8,128}$/.test(key)) {
    res.status(404).send("Not found");
    return;
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).send(key);
};
