import { Suspense } from "react"
import ForgotPassword from "../../components/ForgotPassword"

function ForgotPasswordPageContent() {
    return <ForgotPassword />;
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        }>
            <ForgotPasswordPageContent />
        </Suspense>
    );
}
