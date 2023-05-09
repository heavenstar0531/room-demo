const REPLICATE_API_HOST = "https://api.replicate.com";

import packageData from "../../../package.json";

export default async function handler(req, res) {
  if (!"5b7b9d0a6c981f112451e74b496445a7ea7701b6") {
    throw new Error("The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it.");
  }

  const body = JSON.stringify({
    // https://replicate.com/jagilley/controlnet-scribble/versions
    version: "435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117",
    input: req.body,
  });

  console.log(body)

  const headers = {
    Authorization: `Token 5b7b9d0a6c981f112451e74b496445a7ea7701b6`,
    "Content-Type": "application/json",
    "User-Agent": `${packageData.name}/${packageData.version}`
  }

  const response = await fetch(`https://api.replicate.com/v1/predictions`, {
    method: "POST",
    headers,
    body,
  });

  if (response.status !== 201) {
    let error = await response.json();
    res.statusCode = 500;
    res.end(JSON.stringify({ detail: error.detail }));
    return;
  }
  console.log(response)

  const prediction = await response.json();
  console.log("123123123", prediction)
  res.statusCode = 201;
  res.end(JSON.stringify(prediction));
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
