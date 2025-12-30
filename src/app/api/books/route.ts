import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Book from "@/models/Book";

// GET all books
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get("status");

        const query: any = { userId };
        if (status && status !== "all") query.status = status;

        const books = await Book.find(query).sort({ updatedAt: -1 });

        return NextResponse.json({ books });
    } catch (error) {
        console.error("Error fetching books:", error);
        return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
    }
}

// POST - Create new book
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { title, author, category, progress, rating, status, notes, coverUrl } = await request.json();

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const book = await Book.create({
            userId,
            title,
            author,
            category: category || "General",
            progress: progress || 0,
            rating: rating || 0,
            status: status || "wishlist",
            notes,
            coverUrl,
            startDate: status === "reading" ? new Date() : undefined,
        });

        return NextResponse.json({ book }, { status: 201 });
    } catch (error) {
        console.error("Error creating book:", error);
        return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
    }
}

// PATCH - Update book
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id, ...updates } = await request.json();

        // Handle status changes
        if (updates.status === "reading" && !updates.startDate) {
            updates.startDate = new Date();
        }
        if (updates.status === "completed") {
            updates.finishDate = new Date();
            updates.progress = 100;
        }

        const book = await Book.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true }
        );

        if (!book) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        return NextResponse.json({ book });
    } catch (error) {
        console.error("Error updating book:", error);
        return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
    }
}

// DELETE - Remove book
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id } = await request.json();

        await Book.deleteOne({ _id: id, userId });

        return NextResponse.json({ message: "Book deleted" });
    } catch (error) {
        console.error("Error deleting book:", error);
        return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
    }
}
