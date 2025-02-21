import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";

import { User } from "../types/User";

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

    if (!accessTokenSecret) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const token = authHeader.split(" ")[1];
    const result = jsonwebtoken.verify(
      token,
      accessTokenSecret
    ) as jsonwebtoken.JwtPayload & User;

    const userId = result.id.trim();
    const email = result.email.trim();

    if (!userId || !email) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    req.id = userId;
    req.email = email;

    next();
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Server Error" });

    return;
  }
};

export default verifyToken;
