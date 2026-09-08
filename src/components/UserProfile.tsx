import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { User, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import './UserProfile.css';

interface UserProfileProps {
    session: Session;
}

const UserProfile: React.FC<UserProfileProps> = ({ session }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loadingName, setLoadingName] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (session.user.user_metadata?.full_name) {
            setName(session.user.user_metadata.full_name);
        }
    }, [session]);

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingName(true);
        setMessage(null);

        const { error } = await supabase.auth.updateUser({
            data: { full_name: name }
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Nome atualizado com sucesso!' });
        }
        setLoadingName(false);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'As senhas não coincidem.' });
            return;
        }

        setLoadingPassword(true);
        setMessage(null);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
            setPassword('');
            setConfirmPassword('');
        }
        setLoadingPassword(false);
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-avatar-large">
                    <User size={40} color="var(--accent-primary)" />
                </div>
                <div>
                    <h2>Meu Perfil</h2>
                    <p className="profile-email"><Mail size={16} /> {session.user.email}</p>
                </div>
            </div>

            {message && (
                <div className={`profile-alert ${message.type}`}>
                    {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="profile-grid">
                <div className="profile-card">
                    <h3>Informações Pessoais</h3>
                    <p className="card-desc">Atualize seu nome de exibição no sistema.</p>
                    
                    <form onSubmit={handleUpdateName} className="profile-form">
                        <div className="input-group">
                            <label htmlFor="name">Nome de Exibição</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome completo"
                                required
                            />
                        </div>
                        
                        <button type="submit" className="btn-save" disabled={loadingName}>
                            {loadingName ? <Loader2 className="spinner" size={18} /> : 'Salvar Nome'}
                        </button>
                    </form>
                </div>

                <div className="profile-card">
                    <h3>Segurança</h3>
                    <p className="card-desc">Altere sua senha de acesso ao portal.</p>
                    
                    <form onSubmit={handleUpdatePassword} className="profile-form">
                        <div className="input-group">
                            <label htmlFor="new-password">Nova Senha</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="icon-left" />
                                <input
                                    id="new-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirm-password">Confirmar Nova Senha</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="icon-left" />
                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                        
                        <button type="submit" className="btn-save danger" disabled={loadingPassword || !password}>
                            {loadingPassword ? <Loader2 className="spinner" size={18} /> : 'Atualizar Senha'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
