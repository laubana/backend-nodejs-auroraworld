import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import dbConfig from "../configs/dbConfig";
import { Category } from "../types/Category";
import { Link } from "../types/Link";

const addLink = async (req: Request, res: Response) => {
  try {
    const categoryId = req.body.categoryId.trim();
    const name = req.body.name.trim();
    const url = req.body.url.trim();

    if (!categoryId || !name || !url) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const existingCategory = dbConfig.db
      .prepare(`SELECT * FROM categories WHERE id = ?`)
      .get(categoryId) as Category;

    if (!existingCategory) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `INSERT INTO links (id, user_id, created_by, category_id, category_name, name, url)
      SELECT ?, ?, ?, ?, (SELECT name FROM categories WHERE id = ?), ?, ?`
    );

    let linkId;

    let attempts = 0;
    const maxAttempts = 5;
    while (attempts < maxAttempts) {
      try {
        linkId = uuidv4().replace(/-/g, "");

        stmt.run(
          linkId,
          sessionUserId,
          sessionUserEmail,
          categoryId,
          categoryId,
          name,
          url
        );

        break;
      } catch (error) {
        console.error(error);

        if (
          (error as Error).message.includes(
            "UNIQUE constraint failed: links.id"
          )
        ) {
          attempts++;

          continue;
        } else {
          throw error;
        }
      }
    }

    const newLink = dbConfig.db
      .prepare(`SELECT * FROM links WHERE id = ?`)
      .get(linkId) as Link;

    if (newLink) {
      res
        .status(201)
        .json({ message: "Link created successfully.", data: newLink });
    } else {
      res.status(400).json({ message: "No link created." });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const getLinks = async (req: Request, res: Response) => {
  try {
    const mode =
      typeof req.query.mode === "string" ? req.query.mode.trim() : "";
    const categoryId =
      typeof req.query.categoryId === "string"
        ? req.query.categoryId.trim()
        : "";
    const name =
      typeof req.query.name === "string" ? req.query.name.trim() : "";

    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const existingLinks = dbConfig.db
      .prepare(
        mode === "own"
          ? `SELECT * FROM links
          WHERE user_id = ? AND (category_id = ? OR 1 = ?) AND name LIKE ?`
          : mode === "shared-unwritable"
          ? `SELECT links.* FROM links
          WHERE id IN (SELECT link_id FROM shares WHERE user_id = ? AND is_writable = 0) AND (category_id = ? OR 1 = ?) AND name LIKE ?`
          : `SELECT links.* FROM links
          WHERE id IN (SELECT link_id FROM shares WHERE user_id = ? AND is_writable = 1) AND (category_id = ? OR 1 = ?) AND name LIKE ?`
      )
      .all(
        sessionUserId,
        categoryId,
        categoryId === "all" ? 1 : 0,
        `%${name}%`
      ) as Link[];

    res.status(200).json({ message: "", data: existingLinks });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const removeLink = async (req: Request, res: Response) => {
  try {
    const linkId =
      typeof req.params.linkId === "string" ? req.params.linkId.trim() : "";

    if (!linkId) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `DELETE FROM links WHERE id = ? AND user_id = ?`
    );

    const result = stmt.run(linkId, sessionUserId);

    if (result.changes === 1) {
      res.status(200).json({ message: "Link removed successfully." });
    } else {
      res.status(400).json({ message: "No link removed." });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

const updateLink = async (req: Request, res: Response) => {
  try {
    const linkId =
      typeof req.params.linkId === "string" ? req.params.linkId.trim() : "";
    const categoryId = req.body.categoryId.trim();
    const name = req.body.name.trim();
    const url = req.body.url.trim();

    if (!linkId || !categoryId || !name || !url) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    const sessionUserId = req.id;
    const sessionUserEmail = req.email;

    if (!sessionUserId || !sessionUserEmail) {
      res.status(401).json({ message: "Unauthorized" });

      return;
    }

    const existingCategory = dbConfig.db
      .prepare(`SELECT * FROM categories WHERE id = ?`)
      .get(categoryId) as Category;

    if (!existingCategory) {
      res.status(400).json({ message: "Invalid Input" });

      return;
    }

    const stmt = dbConfig.db.prepare(
      `UPDATE links SET category_id = ?, category_name = (SELECT name FROM categories WHERE id = ?), name = ?, url = ?
      WHERE id = ? AND (user_id = ? OR EXISTS (SELECT * FROM shares WHERE link_id = links.id AND user_id = ? AND is_writable = 1))`
    );

    stmt.run(
      categoryId,
      categoryId,
      name,
      url,
      linkId,
      sessionUserId,
      sessionUserId
    );

    const updatedLink = dbConfig.db
      .prepare(`SELECT * FROM links WHERE id = ?`)
      .get(linkId) as Link;

    if (updatedLink) {
      res
        .status(200)
        .json({ message: "Link updated successfully.", data: updatedLink });
    } else {
      res.status(400).json({ message: "No link updated." });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server Error" });
  }
};

export default {
  addLink,
  getLinks,
  removeLink,
  updateLink,
};
