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
        const body = await request.json();
        const { id, action, ...data } = body;

        if (!id) {
            console.error("PATCH request missing book ID");
            return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
        }

        console.log(`[PATCH] Action: ${action || 'default'} | Book: ${id} | User: ${userId}`);

        // Find existing book and verify ownership
        const book = await Book.findOne({ _id: id, userId });

        if (!book) {
            console.error(`[PATCH] Book NOT found for id: ${id} and userId: ${userId}`);
            // Security check: does it exist at all?
            const exists = await Book.findById(id);
            if (!exists) {
                return NextResponse.json({ error: "Book does not exist in our records" }, { status: 404 });
            } else {
                return NextResponse.json({ error: "Security check: Ownership mismatch" }, { status: 403 });
            }
        }

        if (action === "addQuote") {
            const quoteData = data.quote;
            if (!quoteData || !quoteData.text) {
                return NextResponse.json({ error: "Passage text cannot be empty" }, { status: 400 });
            }

            console.log(`[PATCH] Adding quote to book ${id}`);
            book.quotes.push({
                text: quoteData.text,
                page: quoteData.page,
                chapter: quoteData.chapter,
                createdAt: new Date()
            });
            await book.save();
            console.log("[PATCH] Successfully saved book with new quote");
        } else if (action === "removeQuote") {
            console.log(`[PATCH] Removing quote ${data.quoteId} from book ${id}`);
            book.quotes = book.quotes.filter((q: any) => q._id.toString() !== data.quoteId);
            await book.save();
        } else if (action === "toggleFavorite") {
            book.isFavorite = !book.isFavorite;
            await book.save();
        } else {
            // Regular updates
            console.log(`[PATCH] Performing standard update for book ${id}`);
            if (data.status !== undefined) book.status = data.status;
            if (data.notes !== undefined) book.notes = data.notes;
            if (data.title !== undefined) book.title = data.title;
            if (data.author !== undefined) book.author = data.author;
            if (data.category !== undefined) book.category = data.category;
            if (data.totalPages !== undefined) book.totalPages = data.totalPages;
            if (data.description !== undefined) book.description = data.description;
            if (data.tags !== undefined) book.tags = data.tags;
            if (data.startDate !== undefined) book.startDate = data.startDate;
            if (data.finishDate !== undefined) book.finishDate = data.finishDate;

            if (book.status === "reading" && !book.startDate) {
                book.startDate = new Date();
            }
            if (book.status === "completed" && !book.finishDate) {
                book.finishDate = new Date();
            }

            await book.save();
        }

        return NextResponse.json({ book });
    } catch (error: any) {
        console.error("[PATCH ERROR]", error);
        return NextResponse.json({
            error: error.message || "An unexpected error occurred while saving",
            details: error.stack
        }, { status: 500 });
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
