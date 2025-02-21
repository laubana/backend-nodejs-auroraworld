import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import jsonwebtoken from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import dbConfig from "../configs/dbConfig";
import { User } from "../types/User";

const refresh = (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh failed." });

      return;
    }

    const accessTokenSecret =
      process.env.ACCESS_TOKEN_SECRET || "9aq~&_8F<Qq=>EZzwhWFE=DJ$dI+<T";
    const refreshTokenSecret =
      process.env.REFRESH_TOKEN_SECRET || "DaL0`oWAXQ.z|uLPf6rBwYS$^CRyV8";

    const result = jsonwebtoken.verify(
      refreshToken,
      refreshTokenSecret
    ) as jsonwebtoken.JwtPayload & User;

    const userId = result.id;
    const email = result.email;

    if (!userId || !email) {
      res.status(401).json({ message: "Refresh failed." });

      return;
    }

    const existingUser = dbConfig.db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(userId) as User;

    if (!existingUser) {
      res.status(401).json({ message: "Refresh failed." });

      return;
    }

    const accessToken = jsonwebtoken.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      accessTokenSecret,
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
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const signIn = async (req: Request, res: Response) => {
  try {
    const email = req.body.email.trim();
    const password = req.body.password.trim();

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

    const isMatch = await bcryptjs.compare(password, existingUser.password);

    if (!isMatch) {
      res.status(401).json({ message: "Sign-in failed." });

      return;
    }

    const accessTokenSecret =
      process.env.ACCESS_TOKEN_SECRET || "9aq~&_8F<Qq=>EZzwhWFE=DJ$dI+<T";
    const refreshTokenSecret =
      process.env.REFRESH_TOKEN_SECRET || "DaL0`oWAXQ.z|uLPf6rBwYS$^CRyV8";

    const accessToken = jsonwebtoken.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      accessTokenSecret,
      { expiresIn: "1d" }
    );

    const refreshToken = jsonwebtoken.sign(
      { id: existingUser.id, email: existingUser.email },
      refreshTokenSecret,
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
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    if (!email || !password) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    const existingUsers = dbConfig.db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .all(email) as User[];

    if (existingUsers.length !== 0) {
      res.status(409).json({
        message: "User already exists.",
      });

      return;
    }

    const salt = bcryptjs.genSaltSync(10);
    const hashedPassword = bcryptjs.hashSync(password, salt);

    const stmt = dbConfig.db.prepare(
      `INSERT INTO users (id, email, password) VALUES (?, ?, ?)`
    );

    let userId;

    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
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
          attempts++;

          continue;
        } else {
          throw error;
        }
      }
    }

    const newUser = dbConfig.db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .get(userId) as User;

    if (newUser) {
      res.status(201).json({
        message: "User created successfully.",
        data: { ...newUser, password: "" },
      });
    } else {
      res.status(400).json({ message: "No user created." });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

export default { refresh, signIn, signOut, signUp };
