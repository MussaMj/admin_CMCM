import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { Lock, Mail, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (isRegistering) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccessMessage('Registro realizado com sucesso! Verifique seu e-mail (se aplicável) ou faça o login.');
                setIsRegistering(false);
                setPassword('');
            }
            setLoading(false);
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            }
        }
    };

    const toggleMode = () => {
        setIsRegistering(!isRegistering);
        setError(null);
        setSuccessMessage(null);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo-icon">OP</div>
                    <h2>Portal de Operações</h2>
                    <p>{isRegistering ? 'Crie uma nova conta de administrador' : 'Acesso restrito para administradores'}</p>
                </div>

                {successMessage && (
                    <div className="login-success">
                        <CheckCircle2 size={18} />
                        <span>{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="login-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@safedrive.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Senha</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? (
                            <Loader2 className="spinner" size={20} />
                        ) : (
                            isRegistering ? 'Cadastrar' : 'Entrar'
                        )}
                    </button>
                    
                    <div className="login-toggle">
                        <button 
                            type="button" 
                            className="toggle-mode-btn" 
                            onClick={toggleMode}
                            disabled={loading}
                        >
                            {isRegistering 
                                ? 'Já tem uma conta? Entre aqui.' 
                                : 'Não tem uma conta? Cadastre-se.'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
