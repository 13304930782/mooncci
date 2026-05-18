import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
const Ctx = createContext<any>(null);
export function AuthProvider({ children }: {children: React.ReactNode}) {
  const [user, setUser] = useState<any>(null);
  useEffect(() => { if (localStorage.getItem('token')) api('/auth/me').then(setUser).catch(()=>localStorage.removeItem('token')); }, []);
  const login = async (email:string,password:string) => { const d = await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})}); localStorage.setItem('token', d.token); setUser(d.user); };
  const register = async (username:string,email:string,password:string) => api('/auth/register',{method:'POST',body:JSON.stringify({username,email,password})});
  const logout = ()=>{localStorage.removeItem('token'); setUser(null);};
  return <Ctx.Provider value={{user,login,register,logout}}>{children}</Ctx.Provider>;
}
export const useAuth = ()=>useContext(Ctx);
