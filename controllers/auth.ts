import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import dbConfig from "../configs/dbConfig";
import { User } from "../types/User";

const refresh = (req: Request, res: Response) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.refreshToken) {
      res.status(401).json({ message: "Refresh failed." });

      return;
    }

    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh failed." });

      return;
    }

    if (process.env.REFRESH_TOKEN_SECRET && process.env.ACCESS_TOKEN_SECRET) {
      const result = jsonwebtoken.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      ) as jsonwebtoken.JwtPayload & User;

      const existingUser = dbConfig.db
        .prepare(`SELECT * FROM users WHERE id = ?`)
        .get(result.id) as User;

      if (!existingUser) {
        res.status(401).json({ message: "Refresh failed." });

        return;
      }

      const accessToken = jsonwebtoken.sign(
        {
          id: existingUser.id,
          email: existingUser.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      res.status(200).json({
        message: "Refreshed successfully.",
        data: {
          accessToken,
          id: existingUser.id,
          email: existingUser.email,
        },
      });
    } else {
      res.status(401).json({ message: "Refresh failed." });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const signIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    const existingUser = dbConfig.db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .get(email) as User;

    if (!existingUser) {
      res.status(401).json({ message: "Sign-in failed." });

      return;
    }

    const isMatch = bcryptjs.compare(password, existingUser.password);

    if (!isMatch) {
      res.status(401).json({ message: "Sign-in failed." });

      return;
    }

    if (process.env.REFRESH_TOKEN_SECRET && process.env.ACCESS_TOKEN_SECRET) {
      const accessToken = jsonwebtoken.sign(
        {
          id: existingUser.id,
          email: existingUser.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      const refreshToken = jsonwebtoken.sign(
        { id: existingUser.id, email: existingUser.email },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      });

      res.status(200).json({
        message: "Signed in successfully.",
        data: {
          accessToken,
          id: existingUser.id,
          email: existingUser.email,
        },
      });
    } else {
      res.status(401).json({ message: "Sign-in failed." });
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const signOut = async (req: Request, res: Response) => {
  try {
    res.clearCookie("refreshToken");

    res.status(200).json({ message: "Signed out successfully." });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const signUp = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    const salt = bcryptjs.genSaltSync(10);
    const hashedPassword = bcryptjs.hashSync(password, salt);

    const stmt = dbConfig.db.prepare(
      `INSERT INTO users (id, email, password) VALUES (?, ?, ?)`
    );

    let userId;

    while (true) {
      try {
        userId = uuidv4().replace(/-/g, "");

        stmt.run(userId, email, hashedPassword);

        break;
      } catch (error) {
        console.error(error);

        if (
          (error as Error).message.includes(
            "UNIQUE constraint failed: users.email"
          )
        ) {
          res.status(409).json({
            message: "User already exists.",
          });

          return;
        } else if (
          (error as Error).message.includes(
            "UNIQUE constraint failed: users.id"
          )
        ) {
          continue;
        } else {
          throw error;
        }
      }
    }

    const newUser = dbConfig.db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(userId) as User;

    res
      .status(201)
      .json({ message: "User created successfully.", data: newUser });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

export default { refresh, signIn, signOut, signUp };
