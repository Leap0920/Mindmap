import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Schedule from "@/models/Schedule";

// GET all schedule items
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        const schedules = await Schedule.find({ userId }).sort({ time: 1 });

        return NextResponse.json({ schedules });
    } catch (error) {
        console.error("Error fetching schedules:", error);
        return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
    }
}

// POST - Create new schedule item
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { subject, teacher, room, time, days, color, notes } = await request.json();

        if (!subject || !time) {
            return NextResponse.json(
                { error: "Subject and time are required" },
                { status: 400 }
            );
        }

        const schedule = await Schedule.create({
            userId,
            subject,
            teacher,
            room,
            time,
            days: days || [],
            color,
            notes,
        });

        return NextResponse.json({ schedule }, { status: 201 });
    } catch (error) {
        console.error("Error creating schedule:", error);
        return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
    }
}

// PATCH - Update schedule item
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id, ...updates } = await request.json();

        const schedule = await Schedule.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true }
        );

        if (!schedule) {
            return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
        }

        return NextResponse.json({ schedule });
    } catch (error) {
        console.error("Error updating schedule:", error);
        return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
    }
}

// DELETE - Remove schedule item
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { id } = await request.json();

        await Schedule.deleteOne({ _id: id, userId });

        return NextResponse.json({ message: "Schedule deleted" });
    } catch (error) {
        console.error("Error deleting schedule:", error);
        return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
    }
}
