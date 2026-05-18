import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BlogCard } from './components/BlogCard';
import { Sidebar } from './components/Sidebar';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from './lib/api';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import { AuthProvider, useAuth } from './context/AuthContext';

function Home() { const [blogPosts,setPosts]=useState<any[]>([]); useEffect(()=>{api('/posts').then(setPosts).catch(()=>{});},[]);
return <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"><Header /><main><Hero /><div className="max-w-7xl mx-auto px-6 py-12"><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="lg:col-span-2"><div className="mb-8"><h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">最新文章</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{blogPosts.map((post, index) => <BlogCard key={post.id} title={post.title} excerpt={post.summary} date={post.created_at?.slice(0,10)} readTime='-' tags={JSON.parse(post.tags||'[]')} image={post.cover_image} index={index} />)}</div></div><div className="lg:col-span-1"><div className="sticky top-24"><Sidebar /></div></div></div></div></main><footer className='mt-8 text-center pb-8'><Link to='/login'>登录</Link> / <Link to='/register'>注册</Link></footer></div>
}
function Guard({children}:{children:any}){const {user}=useAuth();return user?children:<Navigate to='/login'/>}
export default function App(){return <AuthProvider><BrowserRouter><Routes><Route path='/' element={<Home/>}/><Route path='/login' element={<LoginPage/>}/><Route path='/register' element={<RegisterPage/>}/><Route path='/admin' element={<Guard><AdminPage/></Guard>}/><Route path='*' element={<Navigate to='/'/>}/></Routes></BrowserRouter></AuthProvider>}
