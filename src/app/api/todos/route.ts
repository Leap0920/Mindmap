import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Todo from "@/models/Todo";

// GET all todos for user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get("category");
        const completed = searchParams.get("completed");

        const query: any = { userId };
        if (category && category !== "all") query.category = category;
        if (completed !== null) query.completed = completed === "true";

        const todos = await Todo.find(query).sort({ order: 1, createdAt: -1 });

        return NextResponse.json({ todos });
    } catch (error) {
        console.error("Error fetching todos:", error);
        return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
    }
}

// POST - Create new todo
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { task, category, priority, dueDate } = await request.json();

        if (!task) {
            return NextResponse.json({ error: "Task is required" }, { status: 400 });
        }

        const todo = await Todo.create({
            userId,
            task,
            category: category || "General",
            priority: priority || "Medium",
            dueDate: dueDate ? new Date(dueDate) : undefined,
        });

        return NextResponse.json({ todo }, { status: 201 });
    } catch (error) {
        console.error("Error creating todo:", error);
        return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
    }
}

// PATCH - Update todo
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const body = await request.json();
        const { id, action, oldName, newName } = body;

        if (action === "renameCategory") {
            await Todo.updateMany({ userId, category: oldName }, { category: newName });
            return NextResponse.json({ message: "Category renamed" });
        }

        if (action === "deleteCategory") {
            await Todo.updateMany({ userId, category: oldName }, { category: "General" });
            return NextResponse.json({ message: "Category deleted" });
        }

        const todo = await Todo.findOneAndUpdate(
            { _id: id, userId },
            { ...body },
            { new: true }
        );

        if (!todo) {
            return NextResponse.json({ error: "Todo not found" }, { status: 404 });
        }

        return NextResponse.json({ todo });
    } catch (error) {
        console.error("Error updating todo:", error);
        return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
    }
}

// DELETE - Remove todo
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id } = await request.json();

        await Todo.deleteOne({ _id: id, userId });

        return NextResponse.json({ message: "Todo deleted" });
    } catch (error) {
        console.error("Error deleting todo:", error);
        return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
    }
}
