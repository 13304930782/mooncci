import { Link } from 'react-router-dom';
export default function AdminPage(){return <div className='max-w-4xl mx-auto pt-32'><h1 className='text-3xl mb-4'>后台管理</h1><div className='flex gap-4'><Link to='/admin/posts'>文章管理</Link><Link to='/admin/write'>写文章</Link><Link to='/admin/users'>用户管理</Link></div></div>}
