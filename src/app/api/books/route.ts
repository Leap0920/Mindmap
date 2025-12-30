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
        const favorite = searchParams.get("favorite");

        const query: any = { userId };
        if (status && status !== "all") query.status = status;
        if (favorite === "true") query.isFavorite = true;

        const books = await Book.find(query).sort({ updatedAt: -1 });

        // Calculate stats
        const allBooks = await Book.find({ userId });
        const stats = {
            total: allBooks.length,
            reading: allBooks.filter((b: any) => b.status === "reading").length,
            completed: allBooks.filter((b: any) => b.status === "completed").length,
            wishlist: allBooks.filter((b: any) => b.status === "wishlist").length,
            favorites: allBooks.filter((b: any) => b.isFavorite).length,
            totalQuotes: allBooks.reduce((acc: number, b: any) => acc + (b.quotes?.length || 0), 0),
        };

        return NextResponse.json({ books, stats });
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
        const body = await request.json();

        if (!body.title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const book = await Book.create({
            userId,
            title: body.title,
            author: body.author || "",
            category: body.category || "General",
            status: body.status || "wishlist",
            totalPages: body.totalPages || 0,
            description: body.description || "",
            startDate: body.status === "reading" ? new Date() : undefined,
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
        const { id, action, ...data } = await request.json();

        let book;

        if (action === "addQuote") {
            book = await Book.findOneAndUpdate(
                { _id: id, userId },
                { $push: { quotes: data.quote } },
                { new: true }
            );
        } else if (action === "removeQuote") {
            book = await Book.findOneAndUpdate(
                { _id: id, userId },
                { $pull: { quotes: { _id: data.quoteId } } },
                { new: true }
            );
        } else if (action === "toggleFavorite") {
            const currentBook = await Book.findOne({ _id: id, userId });
            book = await Book.findOneAndUpdate(
                { _id: id, userId },
                { isFavorite: !currentBook?.isFavorite },
                { new: true }
            );
        } else {
            // Regular update
            const updates: any = {};

            if (data.status !== undefined) updates.status = data.status;
            if (data.notes !== undefined) updates.notes = data.notes;
            if (data.title !== undefined) updates.title = data.title;
            if (data.author !== undefined) updates.author = data.author;
            if (data.category !== undefined) updates.category = data.category;
            if (data.totalPages !== undefined) updates.totalPages = data.totalPages;
            if (data.description !== undefined) updates.description = data.description;

            if (updates.status === "reading") {
                updates.startDate = new Date();
            }
            if (updates.status === "completed") {
                updates.finishDate = new Date();
            }

            book = await Book.findOneAndUpdate(
                { _id: id, userId },
                updates,
                { new: true }
            );
        }

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
