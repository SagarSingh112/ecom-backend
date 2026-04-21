// Backend/routes/supportRoute.js

const express = require("express");
const router  = express.Router();

// ── YOUR ANTHROPIC API KEY ────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "sk-ant-YOUR_KEY_HERE";
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a helpful ShopZone customer support assistant.
ShopZone is an e-commerce platform. Help users with:
- Order tracking and delivery issues
- Returns and refund processing (5-7 business days)
- Account and billing problems
- Product complaints and exchanges
Be concise, friendly, and professional. For order-specific issues, ask for an Order ID.
If you cannot resolve something, say you will escalate to a human agent.`;

router.post("/chat", async (req, res) => {
  console.log("Support chat hit");

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    const filtered = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: String(m.content) }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system:     SYSTEM_PROMPT,
        messages:   filtered,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", data);
      return res.json({ reply: getFallback(messages) });
    }

    const reply = data.content?.[0]?.text || "Sorry, I could not process that. Please try again.";
    res.json({ reply });

  } catch (error) {
    console.error("Route error:", error.message);
    res.json({ reply: getFallback(req.body?.messages) });
  }
});

function getFallback(messages) {
  const last = (messages?.[messages.length - 1]?.content || "").toLowerCase();
  if (last.includes("order") || last.includes("track"))
    return "Please share your Order ID and I will check the status for you!";
  if (last.includes("return") || last.includes("refund"))
    return "Returns are accepted within 7 days. Go to Orders and select Return. Refunds take 5-7 business days.";
  if (last.includes("cancel"))
    return "Orders can be cancelled within 1 hour of placing. After that, please initiate a return.";
  if (last.includes("password") || last.includes("login"))
    return "Use Forgot Password on the login page. A reset link will be sent to your email.";
  return "I am here to help! Could you provide more details or your Order ID?";
}

module.exports = router;