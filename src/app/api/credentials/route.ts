import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Credential from "@/models/Credential";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, "hex");
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encryptedData: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = Buffer.from(ENCRYPTION_KEY, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

// GET all credentials
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        const credentials = await Credential.find({ userId }).sort({ site: 1 });

        // Decrypt passwords for response
        const decryptedCredentials = credentials.map(cred => ({
            ...cred.toObject(),
            password: decrypt(cred.password),
        }));

        return NextResponse.json({ credentials: decryptedCredentials });
    } catch (error) {
        console.error("Error fetching credentials:", error);
        return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 });
    }
}

// POST - Create new credential
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { site, url, username, password, notes, category } = await request.json();

        if (!site || !username || !password) {
            return NextResponse.json(
                { error: "Site, username, and password are required" },
                { status: 400 }
            );
        }

        const encryptedPassword = encrypt(password);

        const credential = await Credential.create({
            userId,
            site,
            url,
            username,
            password: encryptedPassword,
            notes,
            category: category || "General",
        });

        return NextResponse.json({
            credential: {
                ...credential.toObject(),
                password: "••••••••",
            },
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating credential:", error);
        return NextResponse.json({ error: "Failed to create credential" }, { status: 500 });
    }
}

// PATCH - Update credential
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id, password, ...updates } = await request.json();

        if (password) {
            updates.password = encrypt(password);
        }

        const credential = await Credential.findOneAndUpdate(
            { _id: id, userId },
            { ...updates, lastUsed: new Date() },
            { new: true }
        );

        if (!credential) {
            return NextResponse.json({ error: "Credential not found" }, { status: 404 });
        }

        return NextResponse.json({
            credential: {
                ...credential.toObject(),
                password: decrypt(credential.password),
            },
        });
    } catch (error) {
        console.error("Error updating credential:", error);
        return NextResponse.json({ error: "Failed to update credential" }, { status: 500 });
    }
}

// DELETE - Remove credential
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id } = await request.json();

        await Credential.deleteOne({ _id: id, userId });

        return NextResponse.json({ message: "Credential deleted" });
    } catch (error) {
        console.error("Error deleting credential:", error);
        return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 });
    }
}
