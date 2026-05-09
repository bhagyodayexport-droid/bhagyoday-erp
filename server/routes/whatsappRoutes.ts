import { Router, Request, Response, NextFunction } from "express";
import axios from "axios";

const router = Router();

// POST /api/whatsapp/send
// Sends a WhatsApp message via the configured WhatsApp Business API or a proxy
router.post(
  "/send",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { to, message } = req.body as { to?: string; message?: string };

      if (!to || !message) {
        res.status(400).json({
          success: false,
          message: "Missing required fields: 'to' and 'message'",
        });
        return;
      }

      const apiUrl = process.env.WHATSAPP_API_URL;
      const apiToken = process.env.WHATSAPP_API_TOKEN;

      if (!apiUrl || !apiToken) {
        // Fallback: return a wa.me deep-link for the client to open
        const encoded = encodeURIComponent(message);
        const waLink = `https://wa.me/${to.replace(/\D/g, "")}?text=${encoded}`;
        res.json({ success: true, link: waLink });
        return;
      }

      const response = await axios.post(
        apiUrl,
        { to, message },
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      res.json({ success: true, data: response.data });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/whatsapp/status
router.get("/status", (_req: Request, res: Response): void => {
  res.json({
    success: true,
    configured: !!(
      process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN
    ),
    timestamp: new Date().toISOString(),
  });
});

export default router;
