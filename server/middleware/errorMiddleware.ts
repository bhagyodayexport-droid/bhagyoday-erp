import { Request, Response, NextFunction } from "express";

// Structured request logger
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      })
    );
  });
  next();
};

// Global error handler
export const errorHandler = (
  err: Error & { status?: number; statusCode?: number },
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      method: req.method,
      url: req.originalUrl,
      statusCode,
      message,
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    })
  );

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
