import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as Blob | null;

        if (!file) {
            return NextResponse.json(
                { error: "File blob is required." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = (file as any).name || "upload-" + Date.now();

        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), "public", "uploads");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);

        const url = `/uploads/${filename}`;

        return NextResponse.json({
            url,
            name: filename,
            fileType: file.type
        });
    } catch (error) {
        console.error("Error occurred during file upload:", error);
        return NextResponse.json(
            { error: "Something went wrong during the upload." },
            { status: 500 }
        );
    }
}
