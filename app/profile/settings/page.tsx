'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

export default function SettingsPage() {
    const router = useRouter();
    const { refreshUser } = useAuth(); // Add this
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    
    // Password change states
    const [changingPassword, setChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                router.push('/login');
                return;
            }

            setEmail(user.email || '');
            
            // Get username from profiles table
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error loading profile:', profileError);
                // Fallback to user_metadata if profile not found
                setUsername(user.user_metadata?.username || '');
            } else {
                setUsername(profile?.username || '');
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Error loading user data:', err);
            setError('Gagal memuat data pengguna');
            setLoading(false);
        }
    };

    const handleUpdateUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setSaving(true);

        try {
            if (!username.trim()) {
                setError('Username tidak boleh kosong');
                setSaving(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('User tidak ditemukan');
                setSaving(false);
                return;
            }

            // Check if username already exists
            const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username.trim())
                .neq('id', user.id)
                .single();

            if (existingUser) {
                setError('Username sudah digunakan');
                setSaving(false);
                return;
            }

            // Update username in profiles table only (no auth update to avoid loop)
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ username: username.trim() })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Refresh user data di AuthContext
            await refreshUser();

            setMessage('Username berhasil diperbarui!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            console.error('Error updating username:', err);
            setError(err.message || 'Gagal memperbarui username');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage('');
        setPasswordError('');
        setChangingPassword(true);

        try {
            // Validasi input
            if (!oldPassword || !newPassword || !confirmPassword) {
                setPasswordError('Semua field harus diisi');
                setChangingPassword(false);
                return;
            }

            if (newPassword !== confirmPassword) {
                setPasswordError('Password baru dan konfirmasi tidak cocok');
                setChangingPassword(false);
                return;
            }

            if (newPassword.length < 6) {
                setPasswordError('Password baru minimal 6 karakter');
                setChangingPassword(false);
                return;
            }

            // Verifikasi password lama dengan mencoba sign in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) {
                setPasswordError('User tidak ditemukan');
                setChangingPassword(false);
                return;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: oldPassword
            });

            if (signInError) {
                setPasswordError('Password lama salah');
                setChangingPassword(false);
                return;
            }

            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            setPasswordMessage('Password berhasil diubah!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordMessage(''), 3000);
        } catch (err: any) {
            console.error('Error changing password:', err);
            setPasswordError(err.message || 'Gagal mengubah password');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen text-white flex flex-col items-center justify-center" style={{backgroundColor: '#111111'}}>
                <div className="text-xl">Memuat...</div>
            </div>
        );
    }

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
                            <form onSubmit={handleUpdateUsername} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Username</label>
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Username Anda"
                                        disabled={saving}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email</label>
                                    <input 
                                        type="email" 
                                        value={email}
                                        className="w-full px-4 py-2 bg-gray-600 rounded-lg cursor-not-allowed opacity-70"
                                        placeholder="email@example.com"
                                        disabled
                                        readOnly
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
                                </div>
                                
                                {message && (
                                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg">
                                        {message}
                                    </div>
                                )}
                                
                                {error && (
                                    <div className="bg-red-600 text-white px-4 py-2 rounded-lg">
                                        {error}
                                    </div>
                                )}
                                
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </form>
                        </div>

                        {/* Password Settings */}
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h2 className="text-2xl font-semibold mb-4">Ubah Password</h2>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Password Lama</label>
                                    <input 
                                        type="password"
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={changingPassword}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Password Baru</label>
                                    <input 
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={changingPassword}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Konfirmasi Password Baru</label>
                                    <input 
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={changingPassword}
                                    />
                                </div>
                                
                                {passwordMessage && (
                                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg">
                                        {passwordMessage}
                                    </div>
                                )}
                                
                                {passwordError && (
                                    <div className="bg-red-600 text-white px-4 py-2 rounded-lg">
                                        {passwordError}
                                    </div>
                                )}
                                
                                <button 
                                    type="submit"
                                    disabled={changingPassword}
                                    className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {changingPassword ? 'Mengubah...' : 'Ubah Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}