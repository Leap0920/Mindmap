import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { HabitDay, HabitDefinition } from "@/models/Habit";

// GET habits for a user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;

        const searchParams = request.nextUrl.searchParams;
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        // Get habit definitions
        const definitions = await HabitDefinition.find({ userId }).sort({ createdAt: 1 });

        // Get habit days for the month if specified
        let habitDays = [];
        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0);

            habitDays = await HabitDay.find({
                userId,
                date: { $gte: startDate, $lte: endDate }
            }).sort({ date: 1 });
        }

        return NextResponse.json({ definitions, habitDays });
    } catch (error) {
        console.error("Error fetching habits:", error);
        return NextResponse.json({ error: "Failed to fetch habits" }, { status: 500 });
    }
}

// POST - Create or update habit entry
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const body = await request.json();
        const { action } = body;

        if (action === "createDefinition") {
            const { name, icon, color } = body;
            const definition = await HabitDefinition.create({
                userId,
                name,
                icon,
                color: color || "#ffffff"
            });
            return NextResponse.json({ definition }, { status: 201 });
        }

        if (action === "updateDefinition") {
            const { habitId, name, icon, color } = body;
            const definition = await HabitDefinition.findOneAndUpdate(
                { _id: habitId, userId },
                { name, icon, color },
                { new: true }
            );
            return NextResponse.json({ definition });
        }

        if (action === "toggleHabit") {
            const { date, habitId, completed } = body;
            const dateObj = new Date(date);
            dateObj.setHours(0, 0, 0, 0);

            let habitDay = await HabitDay.findOne({ userId, date: dateObj });

            if (!habitDay) {
                // Get all habit definitions to create entries
                const definitions = await HabitDefinition.find({ userId });
                habitDay = await HabitDay.create({
                    userId,
                    date: dateObj,
                    entries: definitions.map(def => ({
                        habitId: def._id.toString(),
                        name: def.name,
                        completed: def._id.toString() === habitId ? completed : false
                    }))
                });
            } else {
                // Update existing entry or add new one
                const entryIndex = habitDay.entries.findIndex(
                    (e: any) => e.habitId === habitId
                );
                if (entryIndex >= 0) {
                    habitDay.entries[entryIndex].completed = completed;
                } else {
                    const def = await HabitDefinition.findById(habitId);
                    if (def) {
                        habitDay.entries.push({
                            habitId,
                            name: def.name,
                            completed
                        });
                    }
                }
                await habitDay.save();
            }

            return NextResponse.json({ habitDay });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Error with habits:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}

// DELETE - Remove habit definition
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const userId = (session.user as any).id;
        const { habitId } = await request.json();

        await HabitDefinition.deleteOne({ _id: habitId, userId });

        return NextResponse.json({ message: "Habit deleted" });
    } catch (error) {
        console.error("Error deleting habit:", error);
        return NextResponse.json({ error: "Failed to delete habit" }, { status: 500 });
    }
}
