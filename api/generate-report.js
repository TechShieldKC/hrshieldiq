const Anthropic = require("@anthropic-ai/sdk").default;

const client = new Anthropic();

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const report =
      message.content[0].type === "text" ? message.content[0].text : "";

    return res.status(200).json({ report });
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({
      error: "Failed to generate report",
      details: error.message,
    });
  }
};
