import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  hashPassword,
  verifyPassword,
  createSession,
  authenticateUser,
  requireAuth,
} from "../lib/auth.js";

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signinSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid signup data",
    });
    return;
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
      return;
    }

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
      },
    });

    const session = await createSession(user.id);

    res.status(201).json({
      success: true,
      token: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
});

// POST /api/auth/signin
router.post("/signin", async (req, res) => {
  const parsed = signinSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid signin data",
    });
    return;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const session = await createSession(user.id);

    res.json({
      success: true,
      token: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signin failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to sign in",
    });
  }
});

// POST /api/auth/signout
router.post("/signout", authenticateUser, async (req, res) => {
  try {
    if (req.session) {
      await prisma.session.delete({
        where: { id: req.session.id },
      });
    }

    res.json({
      success: true,
      message: "Signed out successfully",
    });
  } catch (error) {
    console.error("Signout failed:", error);
    res.status(500).json({
      success: false,
      message: "Unable to sign out",
    });
  }
});

// GET /api/auth/me
router.get("/me", authenticateUser, requireAuth, (req, res) => {
  const user = req.user!;
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

export default router;
