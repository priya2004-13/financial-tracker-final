// server/src/middleware/webhooks.ts
import express from "express";

export function webhookMiddleware(app: express.Express) {
    // Parse raw body for webhook verification
    app.use(
        "/webhooks",
        express.raw({ type: "application/json" })
    );

    // Parse JSON for regular routes
    app.use(express.json());
}