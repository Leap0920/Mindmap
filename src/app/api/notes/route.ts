import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Note from "@/models/Note";
import bcrypt from "bcryptjs";

// GET notes
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get("type") || "notepad";
        const date = searchParams.get("date"); // For journal entries

        const query: any = { userId, type };

        if (type === "journal" && date) {
            const dateObj = new Date(date);
            const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
            const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const notes = await Note.find(query)
            .select("-passwordHash")
            .sort({ updatedAt: -1 });

        return NextResponse.json({ notes });
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
}

// POST - Create note
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { title, content, type, subject, isLocked, password, tags, mood, date } = await request.json();

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        let passwordHash;
        if (isLocked && password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        const note = await Note.create({
            userId,
            title,
            content: content || "",
            type: type || "notepad",
            subject,
            isLocked: isLocked || false,
            passwordHash,
            tags: tags || [],
            mood,
            date: date ? new Date(date) : new Date(),
        });

        return NextResponse.json({
            note: { ...note.toObject(), passwordHash: undefined }
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating note:", error);
        return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
}

// PATCH - Update note
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id, unlockPassword, ...updates } = await request.json();

        const note = await Note.findOne({ _id: id, userId });
        if (!note) {
            return NextResponse.json({ error: "Note not found" }, { status: 404 });
        }

        // If note is locked, verify password
        if (note.isLocked && note.passwordHash) {
            if (!unlockPassword) {
                return NextResponse.json({ error: "Password required" }, { status: 403 });
            }
            const isValid = await bcrypt.compare(unlockPassword, note.passwordHash);
            if (!isValid) {
                return NextResponse.json({ error: "Invalid password" }, { status: 403 });
            }
        }

        // Update password if provided
        if (updates.password) {
            updates.passwordHash = await bcrypt.hash(updates.password, 10);
            delete updates.password;
        }

        const updatedNote = await Note.findByIdAndUpdate(id, updates, { new: true })
            .select("-passwordHash");

        return NextResponse.json({ note: updatedNote });
    } catch (error) {
        console.error("Error updating note:", error);
        return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
    }
}

// DELETE - Remove note
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id } = await request.json();

        await Note.deleteOne({ _id: id, userId });

        return NextResponse.json({ message: "Note deleted" });
    } catch (error) {
        console.error("Error deleting note:", error);
        return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }
}
