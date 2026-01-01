export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                {/* Vòng tròn xoay */}
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
                <p className="text-gray-500">Werewolf...</p>
            </div>
        </div>
    );
}