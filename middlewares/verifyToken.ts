import { NextFunction, Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";

import { User } from "../types/User";

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const token = authHeader.split(" ")[1];
    if (process.env.ACCESS_TOKEN_SECRET) {
      const result = jsonwebtoken.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
      ) as jsonwebtoken.JwtPayload & User;

      req.id = result.id;
      req.email = result.email;

      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });

    return;
  }
};

export default verifyToken;
