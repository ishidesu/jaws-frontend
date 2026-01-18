import { Suspense } from "react"
import ResetPassword from "../../components/ResetPassword"

function ResetPasswordPageContent() {
    return <ResetPassword />;
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        }>
            <ResetPasswordPageContent />
        </Suspense>
    );
}
