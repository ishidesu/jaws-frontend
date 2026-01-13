import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function SettingsPage() {
    return (
        <div className="min-h-screen text-white flex flex-col" style={{backgroundColor: '#111111'}}>
            <Navbar />
            
            <main className="flex-1 px-6 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-8">Pengaturan</h1>
                    
                    <div className="space-y-6">
                        {/* Profile Settings */}
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h2 className="text-2xl font-semibold mb-4">Profil</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Username</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Username Anda"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <input 
                                        type="email" 
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition">
                                    Simpan Perubahan
                                </button>
                            </div>
                        </div>

                        {/* Password Settings */}
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h2 className="text-2xl font-semibold mb-4">Ubah Password</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Password Lama</label>
                                    <input 
                                        type="password" 
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Password Baru</label>
                                    <input 
                                        type="password" 
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Konfirmasi Password Baru</label>
                                    <input 
                                        type="password" 
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition">
                                    Ubah Password
                                </button>
                            </div>
                        </div>

                        {/* Notification Settings */}
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h2 className="text-2xl font-semibold mb-4">Notifikasi</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span>Email Notifications</span>
                                    <input type="checkbox" className="w-5 h-5" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Order Updates</span>
                                    <input type="checkbox" className="w-5 h-5" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Promotional Emails</span>
                                    <input type="checkbox" className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}