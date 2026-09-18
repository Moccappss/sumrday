import React, { useState, useEffect } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff, User, AlertCircle } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  GithubAuthProvider 
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, getDocs, collection, query, where, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { storage } from '../../utils/storage';

const LoginGateway = ({ onLoginSuccess }: { onLoginSuccess?: () => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  useEffect(() => {
    // Load custom login banner from global settings if set
    storage.getItem('porto_settings', {}).then((s: any) => {
      if (s?.loginBannerImage) {
        setBannerImage(s.loginBannerImage);
      }
    });

    // Check for redirect login result
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const user = result.user;
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              name: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email,
              role: user.email === 'mochamadsaifularif33@gmail.com' ? 'Super Admin' : 'Editor',
              status: 'Active',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              avatar: user.photoURL || null
            });
          }
          if (onLoginSuccess) onLoginSuccess();
        }
      })
      .catch((err) => {
        console.error('Redirect auth error:', err);
        handleAuthErrorMessage(err, 'Google');
      });
  }, [onLoginSuccess]);

  const handleAuthErrorMessage = (err: any, providerName: string) => {
    let msg = `Gagal masuk dengan ${providerName}.`;
    if (err.code === 'auth/unauthorized-domain') {
      msg = `Domain '${window.location.hostname}' belum terdaftar di Firebase Console > Authentication > Settings > Authorized domains.`;
    } else if (err.code === 'auth/operation-not-allowed') {
      msg = `Metode login ${providerName} belum diaktifkan di Firebase Console > Authentication > Sign-in method.`;
    } else if (err.code === 'auth/popup-closed-by-user') {
      msg = 'Login dibatalkan (jendela login ditutup).';
    } else if (err.code === 'auth/account-exists-with-different-credential') {
      msg = 'Email sudah digunakan dengan metode login lain.';
    } else if (err.code === 'auth/network-request-failed') {
      msg = 'Koneksi jaringan terputus. Silakan periksa koneksi internet Anda.';
    } else if (err.message) {
      msg = `${msg} (${err.code || err.message})`;
    }
    setError(msg);
  };

  const handleAction = async (e: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password || (mode === 'register' && !name)) {
      setError('Semua field wajib diisi.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        if (onLoginSuccess) onLoginSuccess();
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        let existingRole = 'Pending';
        if (!querySnapshot.empty) {
          existingRole = querySnapshot.docs[0].data().role || 'Pending';
          if (querySnapshot.docs[0].id !== user.uid) {
            await deleteDoc(doc(db, 'users', querySnapshot.docs[0].id));
          }
        }

        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          role: existingRole,
          status: 'Active',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          avatar: null
        });
        
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'Terjadi kesalahan. Silakan coba lagi.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = 'Email atau password salah.';
      if (err.code === 'auth/email-already-in-use') msg = 'Email sudah terdaftar.';
      if (err.code === 'auth/weak-password') msg = 'Password minimal 6 karakter.';
      if (err.code === 'auth/too-many-requests') msg = 'Terlalu banyak percobaan. Coba lagi nanti.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: 'Google' | 'GitHub') => {
    setIsLoading(true);
    setError('');
    try {
      let provider: any;
      if (providerName === 'Google') {
        provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
      } else if (providerName === 'GitHub') {
        provider = new GithubAuthProvider();
      }

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          role: user.email === 'mochamadsaifularif33@gmail.com' ? 'Super Admin' : 'Editor',
          status: 'Active',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          avatar: user.photoURL || null
        });
      }

      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error('Social Auth error:', err);
      if (err.code === 'auth/popup-blocked') {
        try {
          let provider = providerName === 'Google' ? new GoogleAuthProvider() : new GithubAuthProvider();
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          handleAuthErrorMessage(redirectErr, providerName);
        }
      } else {
        handleAuthErrorMessage(err, providerName);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-gateway-container">
      {/* ── Left Panel: Clean Pure Poster Canvas (Tanpa Text Overlay) ── */}
      <div 
        className="login-banner-side"
        style={{
          backgroundImage: bannerImage ? `url(${bannerImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* ── Right Panel: Modern Clean Login Form ── */}
      <div className="login-form-side">
        <div className="login-form-wrapper">
          {/* Header */}
          <div className="login-header">
            <h2>{mode === 'login' ? 'Akses sumr.day OS' : 'Daftar Akun Baru'}</h2>
            <p>{mode === 'login' ? 'Selamat datang kembali di sumr.day OS! Siap bikin karya cerah hari ini? ☀️' : 'Lengkapi data di bawah untuk membuat akun baru.'}</p>
          </div>

          {/* Social Logins */}
          <div className="social-login-group">
            <button type="button" className="social-btn google-btn" onClick={() => handleSocialLogin('Google')} disabled={isLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>
            <button type="button" className="social-btn github-btn" onClick={() => handleSocialLogin('GitHub')} disabled={isLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor"/>
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <div className="divider-wrapper">
            <span className="divider-line"></span>
            <span className="divider-text">ATAU DENGAN EMAIL</span>
            <span className="divider-line"></span>
          </div>

          {/* Form */}
          <form onSubmit={handleAction} className="auth-form">
            {mode === 'register' && (
              <div className="input-group">
                <label>Nama Lengkap</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Alamat Email</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="input-group">
              <div className="password-header">
                <label>Kata Sandi</label>
                {mode === 'login' && (
                  <span 
                    className="forgot-password"
                    onClick={() => alert('Silakan hubungi Super Admin untuk mereset kata sandi akun Anda.')}
                  >
                    Lupa sandi?
                  </span>
                )}
              </div>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--cms-text-muted)', opacity: 0.6, padding: 4,
                    display: 'flex', alignItems: 'center', transition: 'opacity 0.2s'
                  }}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error-message">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loading-spinner">Memproses...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Masuk ke Dashboard' : 'Daftar Sekarang'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer Switcher */}
          <div className="auth-footer">
            {mode === 'login' ? (
              <p>Belum punya akun? <strong onClick={() => setMode('register')}>Daftar di sini</strong></p>
            ) : (
              <p>Sudah punya akun? <strong onClick={() => setMode('login')}>Masuk di sini</strong></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginGateway;
