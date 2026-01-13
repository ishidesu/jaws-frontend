import { Suspense } from "react"
import Login from "../../components/Login"

function LoginPageContent() {
    return <Login />;
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    );
}