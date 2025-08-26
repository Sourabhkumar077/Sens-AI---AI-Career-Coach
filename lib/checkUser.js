import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  try {
    const user = await currentUser();

    if (!user) {
      return null;
    }

    // Validate required user data
    if (!user.id || !user.emailAddresses?.length) {
      console.error("Invalid user data from Clerk:", { userId: user.id, hasEmail: !!user.emailAddresses?.length });
      return null;
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error("No email address found for user:", user.id);
      return null;
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new user with safe fallbacks
    const firstName = user.firstName || "User";
    const lastName = user.lastName || "";
    const name = `${firstName} ${lastName}`.trim() || "Anonymous User";
    const imageUrl = user.imageUrl || null;

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl,
        email,
      },
    });

    console.log("Created new user:", { id: newUser.id, email });
    return newUser;

  } catch (error) {
    console.error("Error in checkUser:", error);
    
    // Don't throw - return null to prevent app crashes
    // The app can handle missing user gracefully
    return null;
  }
};

// Safe user check that won't crash the app
export const safeCheckUser = async () => {
  try {
    return await checkUser();
  } catch (error) {
    console.error("Safe user check failed:", error);
    return null;
  }
};
