import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { RoutineItem, RoutineLog } from "@/models/Routine";

// GET routines with today's completion status
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);

        // Get routine items
        const routineItems = await RoutineItem.find({ userId, isActive: true }).sort({ order: 1 });

        // Get today's logs
        const logs = await RoutineLog.find({
            userId,
            date: dateObj,
        });

        // Combine routine items with their completion status
        const routines = routineItems.map(item => {
            const log = logs.find(l => l.routineItemId.toString() === item._id.toString());
            return {
                ...item.toObject(),
                completed: log?.completed || false,
                completedAt: log?.completedAt,
            };
        });

        return NextResponse.json({ routines });
    } catch (error) {
        console.error("Error fetching routines:", error);
        return NextResponse.json({ error: "Failed to fetch routines" }, { status: 500 });
    }
}

// POST - Create routine item or toggle completion
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { action, ...data } = await request.json();

        if (action === "create") {
            const { name, time } = data;
            if (!name || !time) {
                return NextResponse.json({ error: "Name and time are required" }, { status: 400 });
            }

            const lastItem = await RoutineItem.findOne({ userId }).sort({ order: -1 });
            const order = lastItem ? lastItem.order + 1 : 0;

            const routineItem = await RoutineItem.create({
                userId,
                name,
                time,
                order,
            });

            return NextResponse.json({ routineItem }, { status: 201 });
        }

        if (action === "toggle") {
            const { routineItemId, date, completed } = data;
            const dateObj = new Date(date);
            dateObj.setHours(0, 0, 0, 0);

            let log = await RoutineLog.findOne({
                userId,
                routineItemId,
                date: dateObj,
            });

            if (log) {
                log.completed = completed;
                log.completedAt = completed ? new Date() : undefined;
                await log.save();
            } else {
                log = await RoutineLog.create({
                    userId,
                    routineItemId,
                    date: dateObj,
                    completed,
                    completedAt: completed ? new Date() : undefined,
                });
            }

            return NextResponse.json({ log });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Error with routine:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}

// PATCH - Update routine item
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id, ...updates } = await request.json();

        const routineItem = await RoutineItem.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true }
        );

        if (!routineItem) {
            return NextResponse.json({ error: "Routine item not found" }, { status: 404 });
        }

        return NextResponse.json({ routineItem });
    } catch (error) {
        console.error("Error updating routine:", error);
        return NextResponse.json({ error: "Failed to update routine" }, { status: 500 });
    }
}

// DELETE - Remove routine item
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id } = await request.json();

        await RoutineItem.deleteOne({ _id: id, userId });
        await RoutineLog.deleteMany({ routineItemId: id });

        return NextResponse.json({ message: "Routine item deleted" });
    } catch (error) {
        console.error("Error deleting routine:", error);
        return NextResponse.json({ error: "Failed to delete routine" }, { status: 500 });
    }
}
