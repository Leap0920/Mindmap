import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Todo from "@/models/Todo";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const userId = (session.user as any).id;
        const categories = await Category.find({ userId, type: "todo" });
        return NextResponse.json({ categories });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const userId = (session.user as any).id;
        const { name, type = "todo" } = await request.json();

        const category = await Category.create({ userId, name, type });
        return NextResponse.json({ category }, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) return NextResponse.json({ error: "Category already exists" }, { status: 400 });
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const userId = (session.user as any).id;
        const { id, name, oldName } = await request.json();

        // If we have an id, we update by id. If we have oldName, we update todos too (legacy support)
        if (id) {
            const category = await Category.findOneAndUpdate({ _id: id, userId }, { name }, { new: true });
            if (category && oldName) {
                await Todo.updateMany({ userId, category: oldName }, { category: name });
            }
            return NextResponse.json({ category });
        } else if (oldName && name) {
            // Bulk update by name
            const category = await Category.findOneAndUpdate({ userId, name: oldName }, { name }, { new: true });
            await Todo.updateMany({ userId, category: oldName }, { category: name });
            return NextResponse.json({ category });
        }

        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();
        const userId = (session.user as any).id;
        const { id, name } = await request.json();

        if (id) {
            const cat = await Category.findOne({ _id: id, userId });
            if (cat) {
                await Todo.updateMany({ userId, category: cat.name }, { category: "General" });
                await Category.deleteOne({ _id: id });
            }
        } else if (name) {
            await Category.deleteOne({ userId, name, type: "todo" });
            await Todo.updateMany({ userId, category: name }, { category: "General" });
        }

        return NextResponse.json({ message: "Category deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
