import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import ClipLoader from 'react-spinners/ClipLoader';
import { Mail, Lock, User, Phone, ArrowLeft, KeyRound, ShieldCheck, Eye, EyeOff, Camera, Zap, Users, Shield, MessageSquare, Smartphone } from 'lucide-react';
import logo from '../assets/beatchatlogo.png';

/* ─── Password Strength Helper ─── */
const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: '', color: '' },
    { label: 'Weak', color: '#ef4444' },
    { label: 'Fair', color: '#f59e0b' },
    { label: 'Good', color: '#22d3ee' },
    { label: 'Strong', color: '#10b981' },
  ];
  return { score, ...map[score] };
};

/* ─── Input Field Component ─── */
const Field = ({ icon: Icon, type = 'text', placeholder, value, onChange, error, rightEl, autoFocus, autoComplete }) => (
  <div>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10"
        style={{ color: 'rgba(167,139,250,0.8)' }}>
        <Icon size={15} />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className={`w-full pl-10 ${rightEl ? 'pr-12' : 'pr-4'} py-3 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none`}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: error ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(139,92,246,0.25)',
          boxShadow: error
            ? 'inset 0 2px 8px rgba(0,0,0,0.3)'
            : 'inset 0 2px 8px rgba(0,0,0,0.25)',
          color: '#e2e8f0',
          caretColor: '#a78bfa',
          WebkitTextFillColor: '#e2e8f0',
        }}
        onFocus={e => {
          e.currentTarget.style.border = error ? '1px solid rgba(239,68,68,0.8)' : '1px solid rgba(139,92,246,0.7)';
          e.currentTarget.style.boxShadow = error
            ? 'inset 0 2px 8px rgba(0,0,0,0.3), 0 0 0 3px rgba(239,68,68,0.15)'
            : 'inset 0 2px 8px rgba(0,0,0,0.3), 0 0 0 3px rgba(139,92,246,0.2)';
        }}
        onBlur={e => {
          e.currentTarget.style.border = error ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(139,92,246,0.25)';
          e.currentTarget.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.25)';
        }}
      />
      {rightEl && (
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center z-10">{rightEl}</div>
      )}
    </div>
    {error && <p style={{ color: '#f87171', fontSize: '11px', marginTop: '5px', marginLeft: '4px' }}>⚠ {error}</p>}
  </div>
);

/* ─── Feature Card ─── */
const Feature = ({ icon: Icon, color, title, desc }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
      <Icon size={15} style={{ color }} />
    </div>
    <div>
      <p style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>{title}</p>
      <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: '1.5' }}>{desc}</p>
    </div>
  </div>
);

/* ─── Main Component ─── */
const Login = () => {
  const [view, setView] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuthStore();
  const pwdStrength = getPasswordStrength(password);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    try {
      setLoading(true);
      const res = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/resend-otp', { email });
      toast.success(res.data.message);
      setResendCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to resend OTP';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'login' && window.location.pathname.startsWith('/reset-password/')) {
    const token = window.location.pathname.split('/').pop();
    if (token) { setResetToken(token); setView('reset'); }
  }

  const resetFields = () => {
    setIdentifier('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setPhone('');
    setOtp('');
    setFieldErrors({});
    setAvatar(null);
    setAvatarPreview(null);
  };

  const switchView = (newView) => {
    resetFields();
    setView(newView);
  };

  const goBack = () => {
    resetFields();
    if (view === 'register' || view === 'forgot') setView('login');
    else if (view === 'verify') setView('register');
    else if (view === 'verify-reset') setView('forgot');
    else setView('login');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (view === 'register') {
      if (!name.trim()) errors.name = 'Name is required';
      if (!username.trim() || username.length < 3) errors.username = 'Min 3 characters';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email';
      if (!password || password.length < 6) errors.password = 'Min 6 characters';
      if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    if (view === 'register' && !validateForm()) return;
    setLoading(true);
    try {
      if (view === 'login') {
        const res = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/login', { identifier, password });
        login(res.data.user, res.data.token, rememberMe);
        toast.success('Welcome back! ✨');
      } else if (view === 'register') {
        const formData = new FormData();
        formData.append('email', email); formData.append('username', username);
        formData.append('password', password); formData.append('name', name);
        formData.append('phone', phone);
        if (avatar) formData.append('avatar', avatar);
        const res = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(res.data.message); setView('verify');
        if (res.data.preview) window.open(res.data.preview, '_blank');
      } else if (view === 'verify') {
        const res = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/verify-email', { email, otp });
        login(res.data.user, res.data.token, rememberMe);
        toast.success('Account verified! 🎊');
      } else if (view === 'forgot') {
        const res = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/forgot-password', { email: identifier });
        toast.success(res.data.message); setEmail(identifier); setView('verify-reset');
        if (res.data.preview) window.open(res.data.preview, '_blank');
      } else if (view === 'verify-reset') {
        const res = await axios.post(import.meta.env.VITE_API_URL + '/api/auth/verify-otp', { email, otp });
        toast.success(res.data.message); setResetToken(res.data.resetToken); 
        setPassword(''); setConfirmPassword(''); setView('reset');
      } else if (view === 'reset') {
        if (password !== confirmPassword) { toast.error('Passwords do not match'); setLoading(false); return; }
        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, { resetToken, newPassword: password });
        toast.success('Password reset! Please log in.'); 
        setPassword(''); setConfirmPassword(''); setView('login');
        window.history.pushState({}, null, '/');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Something went wrong';
      if (err.response?.data?.errors?.length) {
        const bErrs = {};
        err.response.data.errors.forEach(e => { if (e.path) bErrs[e.path] = e.msg; else if (e.param) bErrs[e.param] = e.msg; });
        setFieldErrors(Object.keys(bErrs).length ? bErrs : {});
        if (!Object.keys(bErrs).length) toast.error(err.response.data.errors.map(e => e.msg).join(', '));
      } else { 
        if (err.response?.data?.needsVerification) {
          toast(msg, { icon: '📧', style: { borderRadius: '12px', background: '#1e1b4b', border: '1px solid rgba(139,92,246,0.3)', color: '#fff', fontSize: '13px', fontWeight: 600 } });
        } else {
          toast.error(msg); 
        }
      }
      if (err.response?.data?.needsVerification) { if (err.response.data.email) setEmail(err.response.data.email); setView('verify'); }
    } finally { setLoading(false); }
  };

  const eyeToggle = (
    <button type="button" onClick={() => setShowPassword(!showPassword)}
      style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  const features = [
    { icon: Zap, color: '#f59e0b', title: 'Real-time Messaging', desc: 'Instant delivery with live read receipts' },
    { icon: Shield, color: '#8b5cf6', title: 'End-to-End Secure', desc: 'Your conversations stay private' },
    { icon: Users, color: '#06b6d4', title: 'Group Chats', desc: 'Create rooms for teams & friends' },
    { icon: MessageSquare, color: '#d946ef', title: 'Rich Media', desc: 'Images, files, GIFs & reactions' },
  ];

  /* ── Shared placeholder style injected once ── */
  const inputPlaceholderCSS = `
    input::placeholder { color: #475569 !important; opacity: 1 !important; }
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active {
      -webkit-text-fill-color: #e2e8f0 !important;
      -webkit-box-shadow: 0 0 0 1000px #0e0a1f inset !important;
      box-shadow: 0 0 0 1000px #0e0a1f inset !important;
      caret-color: #a78bfa !important;
      transition: background-color 9999s ease-in-out 0s;
    }
  `;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'stretch',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #030014 0%, #0a0118 50%, #0d1a33 100%)',
    }}>
      <style>{inputPlaceholderCSS}</style>

      {/* ── Aurora orbs ── */}
      <div style={{
        position: 'absolute', top: '-20%', left: '-15%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)',
        filter: 'blur(70px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '-10%', right: '-15%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
        filter: 'blur(70px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', left: '20%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217,70,239,0.15) 0%, transparent 70%)',
        filter: 'blur(70px)', pointerEvents: 'none',
      }} />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* ═══════════════════════════════════════
          LEFT PANEL — Marketing (lg+)
          ═══════════════════════════════════════ */}
      <div className="hidden lg:flex" style={{
        flexDirection: 'column', justifyContent: 'center',
        flex: 1, maxWidth: '52%', padding: '48px 64px',
        position: 'relative', zIndex: 10,
      }}>
        {/* Logo + name */}
        <div onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', marginTop: '12px', cursor: 'pointer' }}>
          <img src={logo} alt="BeatChat" style={{
            height: '40px', width: 'auto', objectFit: 'contain',
            filter: 'drop-shadow(0 0 16px rgba(139,92,246,0.8))',
          }} />
          <span style={{
            fontSize: '22px', fontWeight: 800,
            background: 'linear-gradient(135deg,#c4b5fd,#8b5cf6,#22d3ee)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>BeatChat</span>
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: '52px', fontWeight: 800, lineHeight: 1.1, marginBottom: '12px', color: '#f1f5f9' }}>
          Connect.<br />
          <span style={{ background: 'linear-gradient(135deg,#8b5cf6,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Chat.
          </span>{' '}
          <span style={{ background: 'linear-gradient(135deg,#d946ef,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Beat.
          </span>
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: 1.6, marginBottom: '24px', maxWidth: '380px' }}>
          The premium messaging platform built for real connections. Fast, beautiful, and always in sync.
        </p>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', maxWidth: '360px' }}>
          {features.map(f => <Feature key={f.title} {...f} />)}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px', marginTop: '24px' }}>
          {[{ n: '10K+', l: 'Users' }, { n: '99.9%', l: 'Uptime' }, { n: '0ms', l: 'Latency' }].map(s => (
            <div key={s.l}>
              <p style={{ fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.n}</p>
              <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Auth Form
          ═══════════════════════════════════════ */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', position: 'relative', zIndex: 10,
      }}>
        <div style={{ width: '100%', maxWidth: '420px', animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)' }}>

          {/* Card */}
          <div style={{
            borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}>

            {/* Rainbow top bar */}
            <div style={{ height: '3px', background: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #d946ef, #f59e0b)' }} />

            <div style={{ padding: '28px 28px 24px', maxHeight: '92vh', overflowY: 'auto' }}
              className="custom-scrollbar"
            >

              {/* Back button */}
              {view !== 'login' && (
                <button onClick={goBack} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, marginBottom: '20px', padding: 0,
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                  <ArrowLeft size={14} /> Back
                </button>
              )}

              {/* ── Compact Brand header ── */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                {/* Small glowing logo badge */}
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
                  border: '1px solid rgba(139,92,246,0.35)',
                  boxShadow: '0 0 24px rgba(139,92,246,0.35), 0 0 48px rgba(6,182,212,0.15)',
                  marginBottom: '12px',
                }}>
                  <img src={logo} alt="BeatChat" style={{ height: '42px', width: '42px', objectFit: 'contain' }} />
                </div>

                <h1 style={{
                  fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px',
                  background: 'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 40%, #22d3ee 80%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  marginBottom: '4px',
                }}>
                  {view === 'login' && 'Welcome Back'}
                  {view === 'register' && 'Create Account'}
                  {view === 'verify' && 'Verify Email'}
                  {view === 'forgot' && 'Reset Password'}
                  {view === 'verify-reset' && 'Check Your Email'}
                  {view === 'reset' && 'New Password'}
                </h1>
                {view === 'login' && (
                  <p style={{ fontSize: '10px', color: '#475569', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                    Connect · Chat · Beat
                  </p>
                )}
                {view === 'register' && (
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Join thousands of users on BeatChat</p>
                )}
                {(view === 'verify' || view === 'verify-reset') && (
                  <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>Check your inbox for the verification code</p>
                )}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} noValidate>

                {/* ── Register fields ── */}
                {view === 'register' && <>
                  {/* Avatar picker */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <label htmlFor="av-upload" style={{ position: 'relative', cursor: 'pointer', display: 'block' }}>
                      <div style={{
                        width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: avatarPreview ? 'transparent' : 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(6,182,212,0.15))',
                        border: avatarPreview ? '2px solid rgba(139,92,246,0.8)' : '2px dashed rgba(139,92,246,0.5)',
                        boxShadow: avatarPreview ? '0 0 20px rgba(139,92,246,0.4)' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        {avatarPreview
                          ? <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <User size={28} style={{ color: '#8b5cf6' }} />}
                      </div>
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0, padding: '5px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
                        boxShadow: '0 0 10px rgba(139,92,246,0.5)',
                      }}>
                        <Camera size={11} style={{ color: 'white' }} />
                      </div>
                      <input id="av-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <Field icon={User} placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} error={fieldErrors.name} />
                    <Field icon={User} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} error={fieldErrors.username} />
                  </div>
                  <Field icon={Mail} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} error={fieldErrors.email} />
                  <Field icon={Phone} placeholder="Phone (optional)" value={phone} onChange={e => setPhone(e.target.value)} />
                </>}

                {/* ── Login / Forgot field ── */}
                {(view === 'login' || view === 'forgot') && (
                  <Field icon={view === 'forgot' ? Mail : User}
                    type={view === 'forgot' ? 'email' : 'text'}
                    placeholder={view === 'forgot' ? 'Your email address' : 'Email or username'}
                    value={identifier} onChange={e => setIdentifier(e.target.value)}
                    error={fieldErrors.identifier} autoFocus />
                )}

                {/* ── OTP ── */}
                {(view === 'verify' || view === 'verify-reset') && (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                      background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(6,182,212,0.2))',
                      border: '1px solid rgba(139,92,246,0.35)',
                      boxShadow: '0 0 28px rgba(139,92,246,0.2)',
                    }}>
                      <ShieldCheck size={26} style={{ color: '#8b5cf6' }} />
                    </div>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
                      Code sent to{' '}
                      <span style={{ color: '#a78bfa', fontWeight: 600 }}>{email}</span>
                    </p>
                    <input
                      type="text" maxLength={6} placeholder="000000" value={otp}
                      onChange={e => setOtp(e.target.value)}
                      style={{
                        width: '100%', padding: '16px',
                        textAlign: 'center', fontSize: '28px', fontFamily: 'monospace',
                        letterSpacing: '0.6em', borderRadius: '18px',
                        background: 'rgba(139,92,246,0.08)',
                        border: '1px solid rgba(139,92,246,0.35)',
                        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
                        outline: 'none', color: '#e2e8f0', caretColor: '#a78bfa',
                        WebkitTextFillColor: '#e2e8f0', boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.target.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.3), 0 0 0 3px rgba(139,92,246,0.3)'; e.target.style.border = '1px solid rgba(139,92,246,0.7)'; }}
                      onBlur={e => { e.target.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.3)'; e.target.style.border = '1px solid rgba(139,92,246,0.35)'; }}
                      required autoFocus />

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
                      Didn't receive the code?{' '}
                      <button 
                        type="button" 
                        disabled={resendCooldown > 0 || loading}
                        onClick={handleResendOtp}
                        style={{
                          background: 'none', border: 'none', padding: '0 0 0 4px',
                          color: resendCooldown > 0 ? '#64748b' : '#a78bfa',
                          fontWeight: 700, cursor: resendCooldown > 0 || loading ? 'not-allowed' : 'pointer',
                          transition: 'color 0.2s',
                        }}
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Password ── */}
                {(view === 'login' || view === 'register' || view === 'reset') && (
                  <Field icon={Lock} type={showPassword ? 'text' : 'password'}
                    placeholder={view === 'reset' ? 'New password' : 'Password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    error={fieldErrors.password} rightEl={eyeToggle} 
                    autoComplete={view === 'login' ? 'current-password' : 'new-password'} />
                )}

                {/* ── Password strength bar (register only) ── */}
                {view === 'register' && password.length > 0 && (
                  <div style={{ padding: '0 4px' }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: '3px', borderRadius: '9999px',
                          background: i <= pwdStrength.score ? pwdStrength.color : 'rgba(255,255,255,0.08)',
                          transition: 'all 0.3s',
                        }} />
                      ))}
                    </div>
                    {pwdStrength.label && (
                      <p style={{ fontSize: '11px', fontWeight: 600, color: pwdStrength.color }}>
                        {pwdStrength.label} password {pwdStrength.score === 4 ? '✓' : ''}
                      </p>
                    )}
                  </div>
                )}

                {/* ── Confirm password ── */}
                {(view === 'register' || view === 'reset') && (
                  <Field icon={KeyRound} type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    error={fieldErrors.confirmPassword} autoComplete="new-password" />
                )}

                {/* Additional Login Options */}
                {view === 'login' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-2px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ accentColor: '#8b5cf6', cursor: 'pointer', width: '13px', height: '13px' }}
                      />
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, userSelect: 'none' }}>Remember me</span>
                    </label>
                    <button type="button" onClick={() => switchView('forgot')} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '12px', color: '#64748b', fontWeight: 500,
                      transition: 'color 0.2s', padding: 0,
                    }}
                      onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* ── Submit button ── */}
                <button type="submit" disabled={loading}
                  style={{
                    width: '100%', marginTop: '6px', padding: '13px',
                    borderRadius: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #6d28d9 100%)',
                    boxShadow: loading ? 'none' : '0 0 28px rgba(139,92,246,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                    color: '#ffffff', fontSize: '14px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 0 40px rgba(139,92,246,0.7), 0 4px 24px rgba(0,0,0,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = loading ? 'none' : '0 0 28px rgba(139,92,246,0.5), 0 4px 20px rgba(0,0,0,0.4)'; }}>
                  {loading ? <ClipLoader size={18} color="white" /> :
                    view === 'login' ? '✦ Sign In' :
                      view === 'register' ? '✦ Create Account' :
                        view === 'verify' || view === 'verify-reset' ? '✦ Verify Code' :
                          view === 'forgot' ? '✦ Send Reset Code' : '✦ Reset Password'}
                </button>

                {/* Social login divider */}
                {view === 'login' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                      <span style={{ fontSize: '11px', color: '#334155' }}>or continue with</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Google', icon: 'G', color: '#ea4335' },
                        { label: 'GitHub', icon: '⌥', color: '#8b5cf6' },
                      ].map(s => (
                        <button key={s.label} type="button" disabled title="Coming soon" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          padding: '10px', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 600,
                          cursor: 'not-allowed',
                        }}>
                          <span style={{ fontSize: '15px' }}>{s.icon}</span>
                          {s.label}
                          <span style={{ fontSize: '9px', color: '#334155' }}>Soon</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </form>

              {/* Footer switch */}
              <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                {view === 'login' && <>Don't have an account?{' '}
                  <button onClick={() => switchView('register')} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: '#a78bfa', fontWeight: 700, fontSize: '13px',
                    transition: 'color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#22d3ee'}
                    onMouseLeave={e => e.currentTarget.style.color = '#a78bfa'}>
                    Sign Up
                  </button>
                </>}
                {(view === 'register' || view === 'verify') && <>Have an account?{' '}
                  <button onClick={() => switchView('login')} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: '#a78bfa', fontWeight: 700, fontSize: '13px',
                    transition: 'color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#22d3ee'}
                    onMouseLeave={e => e.currentTarget.style.color = '#a78bfa'}>
                    Log In
                  </button>
                </>}
                {(view === 'forgot' || view === 'reset' || view === 'verify-reset') && (
                  <button onClick={() => switchView('login')} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    color: '#a78bfa', fontWeight: 700, fontSize: '13px',
                  }}>← Back to Login</button>
                )}
              </div>

              {/* Install App Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '28px', marginBottom: '-8px' }}>
                <button 
                  type="button" 
                  onClick={() => toast("Coming soon", { icon: '✨', style: { borderRadius: '12px', background: '#1e1b4b', border: '1px solid rgba(139,92,246,0.3)', color: '#fff', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' } })}
                  style={{
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(99,102,241,0.18)',
                    padding: '8px 16px', borderRadius: '999px',
                    color: '#a5b4fc', fontSize: '12px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '8px',
                    cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                    e.currentTarget.style.color = '#c4b5fd';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.18)';
                    e.currentTarget.style.color = '#a5b4fc';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Smartphone size={15} /> Install BeatChat App
                </button>
              </div>

              {/* Bottom brand line */}
              <p style={{
                textAlign: 'center', marginTop: '16px', fontSize: '10px',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                background: 'linear-gradient(90deg,#8b5cf6,#06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                BeatChat · Premium Messaging
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
