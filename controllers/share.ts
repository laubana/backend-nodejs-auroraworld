import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import dbConfig from "../configs/dbConfig";
import { Link } from "../types/Link";
import { Share } from "../types/Share";

const addShare = async (req: Request, res: Response) => {
  try {
    const { linkId, userId, isWritable } = req.body;
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!linkId || !userId) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `INSERT INTO shares (id, link_id, user_id, user_email, is_writable)
      SELECT ?, ?, ?, (SELECT email FROM users WHERE id = ?), ? FROM links WHERE id = ? AND user_id = ?`
    );

    let shareId;

    while (true) {
      try {
        shareId = uuidv4().replace(/-/g, "");

        stmt.run(
          shareId,
          linkId,
          userId,
          userId,
          isWritable ? 1 : 0,
          linkId,
          sessionUserId
        );

        break;
      } catch (error) {
        console.error(error);

        if (
          (error as Error).message.includes(
            "UNIQUE constraint failed: shares.link_id, shares.user_id"
          )
        ) {
          res.status(409).json({
            message: "Share already exists.",
          });

          return;
        } else if (
          (error as Error).message.includes(
            "UNIQUE constraint failed: shares.id"
          )
        ) {
          continue;
        } else {
          throw error;
        }
      }
    }

    const newShare = dbConfig.db
      .prepare(`SELECT * FROM shares WHERE id = ?`)
      .get(shareId) as Link;

    if (newShare) {
      res
        .status(201)
        .json({ message: "Share created successfully.", data: newShare });
    } else {
      res.status(400).json({ message: "No share created." });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const addShares = async (req: Request, res: Response) => {
  try {
    const { linkIds, userIds, isWritable } = req.body;
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!linkIds || linkIds.length <= 0 || !userIds || userIds.length <= 0) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `INSERT INTO shares (id, link_id, user_id, user_email, is_writable)
      SELECT ?, ?, ?, (SELECT email FROM users WHERE id = ?), ? FROM links WHERE id = ? AND user_id = ?`
    );

    const shareIds: string[] = [];

    const insertMany = dbConfig.db.transaction((linkIds, userIds) => {
      for (const linkId of linkIds) {
        for (const userId of userIds) {
          let attempts = 0;
          const maxAttempts = 5;

          while (attempts < maxAttempts) {
            const shareId = uuidv4().replace(/-/g, "");

            try {
              stmt.run(
                shareId,
                linkId,
                userId,
                userId,
                isWritable ? 1 : 0,
                linkId,
                sessionUserId
              );

              shareIds.push(shareId);
            } catch (error) {
              console.error(error);

              if (
                (error as Error).message.includes(
                  "UNIQUE constraint failed: shares.link_id, shares.user_id"
                )
              ) {
                break;
              } else if (
                (error as Error).message.includes(
                  "UNIQUE constraint failed: shares.id"
                )
              ) {
                attempts++;

                continue;
              } else {
                throw error;
              }
            }
          }
        }
      }
    });

    insertMany(linkIds, userIds);

    const newShares = dbConfig.db
      .prepare(
        `SELECT * FROM shares WHERE id IN (${shareIds
          .map(() => "?")
          .join(", ")})`
      )
      .all(...shareIds) as Link[];

    if (0 < newShares.length) {
      res
        .status(201)
        .json({ message: "Shares created successfully.", data: newShares });
    } else {
      res.status(400).json({ message: "No share created." });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const getShares = async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const existingShares = dbConfig.db
      .prepare(
        `SELECT * FROM shares
        WHERE link_id = ? AND EXISTS (SELECT * FROM links WHERE id = ? AND user_id = ?)`
      )
      .all(linkId, linkId, sessionUserId) as Share[];

    res.status(200).json({ message: "", data: existingShares });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const removeShare = async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!shareId) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `DELETE FROM shares WHERE id = ? AND EXISTS (SELECT * FROM links WHERE id = shares.link_id AND user_id = ?)`
    );

    const result = stmt.run(shareId, sessionUserId);

    if (result.changes === 1) {
      res.status(200).json({ message: "Share removed successfully." });
    } else {
      res.status(400).json({ message: "No share removed." });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const updateShare = async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;
    const { isWritable } = req.body;
    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!shareId || isWritable === undefined) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `UPDATE shares SET is_writable = ?
      WHERE id = ? AND EXISTS (SELECT * FROM links WHERE id = shares.link_id AND user_id = ?)`
    );

    stmt.run(isWritable ? 1 : 0, shareId, sessionUserId);

    const updatedShare = dbConfig.db
      .prepare(`SELECT * FROM shares WHERE id = ?`)
      .get(shareId) as Link;

    if (updatedShare) {
      res
        .status(200)
        .json({ message: "Share updated successfully.", data: updatedShare });
    } else {
      res.status(400).json({ message: "No share updated." });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

export default { addShare, addShares, getShares, removeShare, updateShare };
