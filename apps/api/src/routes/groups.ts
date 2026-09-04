import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const createGroupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  userName: z.string().trim().min(2).max(100),
});

const memberSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(100),
});

const DEMO_USER_EMAIL = "demo@together.local";

router.post("/", async (req, res) => {
  const parsed = createGroupSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid group request",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const { name, email, userName } = parsed.data;

    const user = await prisma.user.upsert({
      where: {
        email,
      },
      update: {
        name: userName,
      },
      create: {
        name: userName,
        email,
      },
    });

    const group = await prisma.group.create({
      data: {
        name,
        createdBy: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Failed to create group:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create group",
    });
  }
});

router.get("/:id", async (req, res) => {
  const groupId = req.params.id;

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: "Group ID is required",
    });
  }

  try {
    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
      },
      include: {
        creator: true,
        members: {
          orderBy: {
            joinedAt: "asc",
          },
          include: {
            user: true,
          },
        },
        purchases: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            items: true,
            approval: true,
            payment: true,
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    return res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Failed to load group:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load group",
    });
  }
});

router.post("/:id/members", async (req, res) => {
  const groupId = req.params.id;

  if (!groupId) {
    return res.status(400).json({
      success: false,
      message: "Group ID is required",
    });
  }

  const parsed = memberSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid member request",
      errors: parsed.error.flatten(),
    });
  }

  try {
    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const user = await prisma.user.upsert({
      where: {
        email: parsed.data.email,
      },
      update: {
        name: parsed.data.name,
      },
      create: {
        name: parsed.data.name,
        email: parsed.data.email,
      },
    });

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return res.status(409).json({
        success: false,
        message: "User is already a group member",
      });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId: user.id,
        role: "MEMBER",
      },
      include: {
        user: true,
        group: true,
      },
    });

    return res.status(201).json({
      success: true,
      member,
    });
  } catch (error) {
    console.error("Failed to add group member:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add group member",
    });
  }
});

router.delete("/:id/members/:userId", async (req, res) => {
  const groupId = req.params.id;
  const userId = req.params.userId;

  if (!groupId || !userId) {
    return res.status(400).json({
      success: false,
      message: "Group ID and user ID are required",
    });
  }

  try {
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Group member not found",
      });
    }

    if (member.role === "OWNER") {
      return res.status(409).json({
        success: false,
        message: "The group owner cannot be removed",
      });
    }

    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Group member removed",
    });
  } catch (error) {
    console.error("Failed to remove group member:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove group member",
    });
  }
});

router.get("/demo/current", async (_req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: DEMO_USER_EMAIL,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Demo user not found",
      });
    }

    const memberships = await prisma.groupMember.findMany({
      where: {
        userId: user.id,
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      groups: memberships.map(
  (membership: (typeof memberships)[number]) => membership.group,
),
    });
  } catch (error) {
    console.error("Failed to load demo groups:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load groups",
    });
  }
});

export default router;