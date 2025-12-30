import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email }).select('-password');
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                backgroundImage: user.backgroundImage,
                createdAt: user.createdAt,
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, profileImage, backgroundImage, currentPassword, newPassword } = body;

        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Handle password change
        if (currentPassword && newPassword) {
            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }

        // Update other fields if provided
        if (name !== undefined) user.name = name;
        if (profileImage !== undefined) user.profileImage = profileImage;
        if (backgroundImage !== undefined) user.backgroundImage = backgroundImage;

        await user.save();

        return NextResponse.json({ 
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                backgroundImage: user.backgroundImage,
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        
        // Delete all user data
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userId = user._id;

        // Import models dynamically to avoid circular dependencies
        const mongoose = await import('mongoose');
        
        // Delete user's data from all collections
        const collections = ['habits', 'habitentries', 'todos', 'schedules', 'notes', 'books', 'routines', 'routinelogs', 'credentials'];
        
        for (const collection of collections) {
            if (mongoose.connection.collections[collection]) {
                await mongoose.connection.collections[collection].deleteMany({ userId });
            }
        }

        // Delete the user
        await User.deleteOne({ _id: userId });

        return NextResponse.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
