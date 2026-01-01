import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-4xl font-bold text-red-500">404 - Not Found</h2>
            <p className="text-gray-600">Oops! Something went wrong</p>

            <Link
                href="/"
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition"
            >
                Home
            </Link>
        </div>
    );
}